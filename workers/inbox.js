export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Route: POST /inbox
    if (url.pathname === '/inbox' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        // Validate required fields
        if (!body.from || !body.message) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: from, message'
          }), { status: 400, headers });
        }

        // Create message
        const message = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          from: body.from.substring(0, 100), // Limit length
          subject: body.subject?.substring(0, 200) || 'No subject',
          message: body.message.substring(0, 2000), // Limit length
          priority: body.priority || 'normal'
        };

        // Store in KV
        const key = `inbox:${message.timestamp}:${message.id}`;
        await env.HAPI_KV.put(key, JSON.stringify(message), {
          expirationTtl: 2592000 // 30 days
        });

        return new Response(JSON.stringify({
          success: true,
          id: message.id,
          message: 'Message queued for delivery'
        }), { status: 201, headers });

      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Invalid request'
        }), { status: 400, headers });
      }
    }

    // Route: GET /inbox/{secret}
    if (url.pathname.startsWith('/inbox/') && request.method === 'GET') {
      const secret = url.pathname.split('/')[2];
      
      // Check secret (you'll set this in Cloudflare dashboard)
      if (secret !== env.INBOX_SECRET) {
        return new Response(JSON.stringify({
          error: 'Unauthorized'
        }), { status: 401, headers });
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
      }), { headers });
    }

    // Route not found
    return new Response(JSON.stringify({
      error: 'Not found'
    }), { status: 404, headers });
  }
};
