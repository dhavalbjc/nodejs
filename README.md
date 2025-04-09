
# WebRTC Signaling Server

This is a WebSocket server implementation for handling WebRTC signaling. It's designed to be easily deployed to Railway, Render, or any other Node.js hosting platform.

## Features

- Room creation and management
- User join/leave handling
- WebRTC signaling message forwarding
- Room status updates
- Automatic room cleanup
- HTTP status page

## Deployment on Railway

1. Create a new project on Railway
2. Connect to your GitHub repository
3. Railway will automatically detect the Node.js project and deploy it
4. The server will be available at your Railway domain with the WebSocket endpoint at `/ws`

## Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start
```

## Environment Variables

- `PORT`: The port to run the server on (default: 8080)

## WebSocket URL

When deploying this server, ensure it's accessible at:

- Local development: `ws://localhost:8080/ws`
- Production: `wss://yourdomain.com/ws`

## Testing the Connection

You can test if your server is running properly by opening your browser to:
`https://yourdomain.com/` - This will display a status page

The WebSocket connection will be available at:
`wss://yourdomain.com/ws`
