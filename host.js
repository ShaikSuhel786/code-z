const localtunnel = require('localtunnel');
const http = require('http');
const fs = require('fs');

const PORT = 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    try {
        res.end(fs.readFileSync('./index.html', 'utf-8'));
    } catch(e) {
        res.end('File not found');
    }
}).listen(PORT, async () => {
    try {
        const tunnel = await localtunnel({ port: PORT, subdomain: 'concept-drift-mvp-' + Math.floor(Math.random() * 10000) });
        console.log('Public URL:', tunnel.url);
        fs.writeFileSync('url.txt', tunnel.url);
        
        tunnel.on('close', () => {
            console.log('Tunnel closed');
        });
    } catch (err) {
        console.error('Tunnel error:', err);
        fs.writeFileSync('url.txt', 'Error: ' + err.message);
    }
});
