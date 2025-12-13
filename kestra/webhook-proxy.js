#!/usr/bin/env node
/**
 * Simple webhook proxy service for Kestra
 * Kestra can call this local service, which then makes HTTP calls
 */
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { target, payload, headers } = data;
                
                const targetUrl = url.parse(target);
                const options = {
                    hostname: targetUrl.hostname,
                    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
                    path: targetUrl.path,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    }
                };
                
                const protocol = targetUrl.protocol === 'https:' ? https : http;
                const proxyReq = protocol.request(options, (proxyRes) => {
                    let responseBody = '';
                    proxyRes.on('data', chunk => responseBody += chunk);
                    proxyRes.on('end', () => {
                        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: proxyRes.statusCode < 400,
                            status: proxyRes.statusCode,
                            response: responseBody
                        }));
                    });
                });
                
                proxyReq.on('error', (error) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                });
                
                proxyReq.write(JSON.stringify(payload));
                proxyReq.end();
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Webhook proxy running on http://localhost:${PORT}`);
});

