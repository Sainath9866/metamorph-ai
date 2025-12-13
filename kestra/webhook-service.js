#!/usr/bin/env node
/**
 * Webhook Service for Kestra
 * Makes HTTP calls that Kestra standalone can't make directly
 * Run: node webhook-service.js
 */
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

function makeRequest(targetUrl, payload, headers = {}) {
    return new Promise((resolve, reject) => {
        const parsed = url.parse(targetUrl);
        const protocol = parsed.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data });
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { type, ...data } = JSON.parse(body);
                
                if (type === 'vercel') {
                    const result = await makeRequest(
                        'https://metamorph-ai-three.vercel.app/api/webhooks',
                        {
                            status: 'ANALYZING',
                            message: data.message,
                            type: 'warning',
                            timestamp: data.timestamp
                        }
                    );
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, result }));
                } else if (type === 'github') {
                    const result = await makeRequest(
                        'https://api.github.com/repos/Sainath9866/metamorph-ai/dispatches',
                        {
                            event_type: 'deploy-agent',
                            client_payload: {
                                mission: data.mission,
                                original_error: data.error,
                                timestamp: data.timestamp
                            }
                        },
                        {
                            'Authorization': `Bearer ${data.github_pat}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    );
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true, result }));
                } else {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Invalid type' }));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Webhook service running on http://localhost:${PORT}`);
    console.log(`   POST /webhook with { type: 'vercel'|'github', ...data }`);
});

