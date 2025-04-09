
const http = require('http');
const WebSocket = require('ws');
const websocketServer = require('./websocket-server');

// Create a simple HTTP server that responds to all requests
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebRTC Signaling Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        .status { padding: 10px; border-radius: 5px; margin: 20px 0; }
        .online { background: #d4edda; color: #155724; }
      </style>
    </head>
    <body>
      <h1>WebRTC Signaling Server</h1>
      <div class="status online">
        <strong>Status:</strong> Online and running
      </div>
      <p>This server is providing WebSocket connections for WebRTC signaling at the path <code>/ws</code>.</p>
      <h2>Server Information:</h2>
      <pre>
Node.js Version: ${process.version}
WebSocket: Active on /ws
      </pre>
      <p>For more information, check the <a href="https://github.com/yourusername/webrtc-signaling-server">documentation</a>.</p>
    </body>
    </html>
  `);
});

// Update the Procfile to use this file instead
<lov-write file_path="src/server/Procfile">
web: node server.js
