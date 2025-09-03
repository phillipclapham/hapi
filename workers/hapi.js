// Import all static content
import discoveryDoc from '../.well-known/hapi.json';
import statusDoc from '../public/status.json';
import professionalDoc from '../public/professional.json';
import availabilityDoc from '../public/availability.json';
import commsDoc from '../public/comms.json';
import policyDoc from '../public/policy.json';
import gatewayDoc from '../public/index.md';

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

    // Route static content
    const staticRoutes = {
      '/': { content: gatewayDoc, type: 'text/markdown' },
      '/.well-known/hapi.json': { content: discoveryDoc, type: 'application/json' },
      '/public/status.json': { content: statusDoc, type: 'application/json' },
      '/public/professional.json': { content: professionalDoc, type: 'application/json' },
      '/public/availability.json': { content: availabilityDoc, type: 'application/json' },
      '/public/comms.json': { content: commsDoc, type: 'application/json' },
      '/public/policy.json': { content: policyDoc, type: 'application/json' },
    };

    // Serve static content
    if (staticRoutes[url.pathname]) {
      const route = staticRoutes[url.pathname];
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
        
        // Validate required fields
        if (!body.from || !body.message) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: from, message'
          }), { 
            status: 400, 
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        }

        // Create message
        const message = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          from: body.from.substring(0, 100),
          subject: body.subject?.substring(0, 200) || 'No subject',
          message: body.message.substring(0, 2000),
          priority: body.priority || 'normal'
        };

        // Store in KV (we'll create this in dashboard)
        const key = `inbox:${message.timestamp}:${message.id}`;
        await env.HAPI_KV.put(key, JSON.stringify(message), {
          expirationTtl: 2592000 // 30 days
        });

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
      
      // Check secret
      if (secret !== env.INBOX_SECRET) {
        return new Response(JSON.stringify({
          error: 'Unauthorized'
        }), { 
          status: 401, 
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }

      // List all messages
      const list = await env.HAPI_KV.list({ prefix: 'inbox:' });
      const messages = [];
      
      for (const key of list.keys) {
        const message = await env.HAPI_KV.get(key.name);
        if (message) {
          messages.push(JSON.parse(message));
        }
      }

      // Sort newest first
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
      available_endpoints: Object.keys(staticRoutes)
    }), { 
      status: 404, 
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
};
