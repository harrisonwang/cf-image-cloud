// Cloudflare Snippet for Image Hotlink Protection and Security
// Deploy this in Cloudflare Dashboard -> Rules -> Snippets

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ===== 1. Geographic Restriction (API endpoints only) =====
    if (url.pathname.startsWith('/api/upload') ||
        url.pathname.startsWith('/api/images')) {
      const country = request.cf?.country;
      const allowedCountries = ['CN', 'US'];

      if (country && !allowedCountries.includes(country)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Access denied from your region'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Blocked-Reason': 'Geographic-Restriction',
          },
        });
      }
    }

    // ===== 2. File Upload Pre-check (Content-Length) =====
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      const contentLength = request.headers.get('Content-Length');
      const maxSize = 10485760; // 10MB

      if (contentLength && parseInt(contentLength) > maxSize) {
        return new Response(JSON.stringify({
          success: false,
          error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`
        }), {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            'X-Blocked-Reason': 'File-Too-Large',
          },
        });
      }
    }

    // ===== 3. Image Hotlink Protection =====
    if (url.pathname.startsWith('/i/')) {
      // Referer Check
      const referer = request.headers.get('Referer');
      const allowedDomains = [
        'localhost:5173',     // Local development (Vite)
        'localhost:8787',     // Local development (Wrangler)
        'localhost',          // Local development (generic)
        'img.510006.xyz',         // Allowed domain
        'nodeseek.com',       // Allowed domain
      ];

      // Allow empty referer (direct access in browser)
      if (referer) {
        const refererUrl = new URL(referer);
        const isAllowed = allowedDomains.some(domain =>
          refererUrl.hostname.includes(domain) || refererUrl.host.includes(domain)
        );

        if (!isAllowed) {
          return new Response('Hotlinking is not allowed', {
            status: 403,
            headers: {
              'Content-Type': 'text/plain',
              'X-Blocked-Reason': 'Invalid-Referer',
            },
          });
        }
      }

      // User-Agent Check (Block known bots)
      const userAgent = (request.headers.get('User-Agent') || '').toLowerCase();
      const blockedAgents = [
        'scrapy',
        'python-requests',
        'bot',
        'crawler',
        'spider',
      ];

      const isBlocked = blockedAgents.some(agent => userAgent.includes(agent));
      if (isBlocked) {
        return new Response('Access denied', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
            'X-Blocked-Reason': 'Blocked-User-Agent',
          },
        });
      }

      // Method Check (Only allow GET and HEAD)
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', {
          status: 405,
          headers: {
            'Allow': 'GET, HEAD',
          },
        });
      }
    }

    // All checks passed, forward to Worker
    return fetch(request);
  },
};
