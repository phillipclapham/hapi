import fs from 'fs';
import path from 'path';

// Read all the JSON and markdown files
const files = {
  gateway: fs.readFileSync('public/index.md', 'utf8'),
  discovery: JSON.parse(fs.readFileSync('.well-known/hapi.json', 'utf8')),
  status: JSON.parse(fs.readFileSync('public/status.json', 'utf8')),
  professional: JSON.parse(fs.readFileSync('public/professional.json', 'utf8')),
  availability: JSON.parse(fs.readFileSync('public/availability.json', 'utf8')),
  comms: JSON.parse(fs.readFileSync('public/comms.json', 'utf8')),
  policy: JSON.parse(fs.readFileSync('public/policy.json', 'utf8')),
};

// Generate the worker code with embedded content
const workerCode = `
// Auto-generated Worker - do not edit directly
// Edit source files and run: npm run build-worker

const CONTENT = ${JSON.stringify(files, null, 2)};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Standard headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Route definitions
    const routes = {
      '/': { content: CONTENT.gateway, type: 'text/markdown' },
      '/.well-known/hapi.json': { content: CONTENT.discovery, type: 'application/json' },
      '/public/status.json': { content: CONTENT.status, type: 'application/json' },
      '/public/professional.json': { content: CONTENT.professional, type: 'application/json' },
      '/public/availability.json': { content: CONTENT.availability, type: 'application/json' },
      '/public/comms.json': { content: CONTENT.comms, type: 'application/json' },
      '/public/policy.json': { content: CONTENT.policy, type: 'application/json' },
    };

    // Serve static content
    if (routes[url.pathname]) {
      const route = routes[url.pathname];
      return new Response(
        typeof route.content === 'string' ? route.content : JSON.stringify(route.content, null, 2),
        { 
          headers: {
            ...headers,
            'Content-Type': route.type,
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
    }

    // Handle inbox POST
    if (url.pathname === '/inbox' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        if (!body.from || !body.message) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: from, message'
          }), { 
            status: 400, 
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }

        const message = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          from: body.from.substring(0, 100),
          subject: body.subject?.substring(0, 200) || 'No subject',
          message: body.message.substring(0, 2000),
          priority: body.priority || 'normal'
        };

        // Store in KV
        if (env.HAPI_KV) {
          const key = \`inbox:\${message.timestamp}:\${message.id}\`;
          await env.HAPI_KV.put(key, JSON.stringify(message), {
            expirationTtl: 2592000 // 30 days
          });
        } else {
          // Fallback if KV not configured yet
          console.log('KV not configured, message would be:', message);
        }

        return new Response(JSON.stringify({
          success: true,
          id: message.id,
          message: 'Message queued for delivery'
        }), { 
          status: 201, 
          headers: { ...headers, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Invalid request'
        }), { 
          status: 400, 
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle inbox GET
    if (url.pathname.startsWith('/inbox/') && request.method === 'GET') {
      const secret = url.pathname.split('/')[2];
      
      if (!env.INBOX_SECRET || secret !== env.INBOX_SECRET) {
        return new Response(JSON.stringify({
          error: 'Unauthorized'
        }), { 
          status: 401, 
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      if (!env.HAPI_KV) {
        return new Response(JSON.stringify({
          messages: [],
          count: 0,
          note: 'KV storage not configured yet'
        }), { 
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      const list = await env.HAPI_KV.list({ prefix: 'inbox:' });
      const messages = [];
      
      for (const key of list.keys) {
        const message = await env.HAPI_KV.get(key.name);
        if (message) {
          messages.push(JSON.parse(message));
        }
      }

      messages.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      return new Response(JSON.stringify({
        messages,
        count: messages.length
      }), { 
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // 404 for everything else
    return new Response(JSON.stringify({
      error: 'Not found',
      available_endpoints: Object.keys(routes).concat(['/inbox'])
    }), { 
      status: 404, 
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
};
`;

// Write the generated worker
fs.writeFileSync('workers/hapi-generated.js', workerCode);
console.log('✓ Generated worker with embedded content');
