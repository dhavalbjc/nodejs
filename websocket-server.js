const WebSocket = require('ws');

// This function initializes the WebSocket server logic
// It can be used independently or attached to an existing server
function initializeWebSocketServer(wss) {
  // Store rooms and their participants
  const rooms = new Map();

  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('Client connected');
    
    const ip = req.socket.remoteAddress;
    console.log(`New connection from ${ip}`);

    let currentRoomId = null;
    let username = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received message:', data);
        
        // Handle join room request
        if (data.join || data.type === 'join') {
          const roomId = data.join || data.roomId;
          username = data.username || 'Anonymous';
          
          handleJoinRoom(ws, roomId, username);
          currentRoomId = roomId;
          return;
        }
        
        // Handle leave room request
        if (data.type === 'leave') {
          const roomId = data.roomId;
          handleLeaveRoom(ws, roomId, username);
          currentRoomId = null;
          return;
        }
        
        // Handle get-rooms request
        if (data.type === 'get-rooms') {
          sendRoomsList(ws);
          return;
        }
        
        // Handle WebRTC signaling messages
        if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
          const roomId = data.roomId;
          forwardSignalingMessage(ws, roomId, data);
          return;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
      
      if (currentRoomId) {
        handleLeaveRoom(ws, currentRoomId, username);
      }
    });
    
    // Send initial rooms list
    sendRoomsList(ws);
  });

  // Helper function to handle joining a room
  function handleJoinRoom(ws, roomId, username) {
    if (!roomId) return;
    
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
      console.log(`Created new room: ${roomId}`);
    }
    
    const room = rooms.get(roomId);
    
    // Check if room is full (max 2 users)
    if (room.size >= 2) {
      ws.send(JSON.stringify({
        type: 'room-full',
        roomId
      }));
      return;
    }
    
    // Add user to room
    room.set(ws, { username });
    
    // Notify user they've joined
    ws.send(JSON.stringify({
      type: 'room-joined',
      roomId,
      count: room.size
    }));
    
    // Notify other users in the room
    const isInitiator = room.size === 2;
    for (const [client, { username: clientUsername }] of room.entries()) {
      if (client !== ws) {
        client.send(JSON.stringify({
          type: 'user-joined',
          roomId,
          username,
          count: room.size,
          initiator: isInitiator
        }));
      }
    }
    
    // Send room info to all clients
    broadcastRoomInfo(roomId);
    broadcastRoomsList();
  }

  // Helper function to handle leaving a room
  function handleLeaveRoom(ws, roomId, username) {
    if (!roomId || !rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    
    // Remove user from room
    room.delete(ws);
    
    // Notify other users in the room
    for (const [client, { username: clientUsername }] of room.entries()) {
      client.send(JSON.stringify({
        type: 'user-left',
        roomId,
        username: username || 'Anonymous',
        count: room.size
      }));
    }
    
    // Remove room if empty
    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`Removed empty room: ${roomId}`);
    }
    
    // Broadcast updated room info and rooms list
    broadcastRoomInfo(roomId);
    broadcastRoomsList();
  }

  // Helper function to forward WebRTC signaling messages
  function forwardSignalingMessage(sender, roomId, data) {
    if (!roomId || !rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    
    // Forward message to all other users in the room
    for (const [client] of room.entries()) {
      if (client !== sender) {
        client.send(JSON.stringify(data));
      }
    }
  }

  // Helper function to broadcast room info to all clients
  function broadcastRoomInfo(roomId) {
    if (!roomId || !rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    
    // Broadcast room info to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'room-info',
          roomId,
          count: room.size
        }));
      }
    });
  }

  // Helper function to send rooms list to a specific client
  function sendRoomsList(ws) {
    const roomsList = [];
    
    // Build rooms list
    for (const [roomId, room] of rooms.entries()) {
      roomsList.push({
        id: roomId,
        name: roomId,
        userCount: room.size,
        maxUsers: 2
      });
    }
    
    // Add default room if no rooms exist
    if (roomsList.length === 0) {
      roomsList.push({
        id: 'default',
        name: 'Default Room',
        userCount: 0,
        maxUsers: 2
      });
    }
    
    // Send rooms list to client
    ws.send(JSON.stringify({
      type: 'rooms-list',
      rooms: roomsList
    }));
  }

  // Helper function to broadcast rooms list to all clients
  function broadcastRoomsList() {
    const roomsList = [];
    
    // Build rooms list
    for (const [roomId, room] of rooms.entries()) {
      roomsList.push({
        id: roomId,
        name: roomId,
        userCount: room.size,
        maxUsers: 2
      });
    }
    
    // Add default room if no rooms exist
    if (roomsList.length === 0) {
      roomsList.push({
        id: 'default',
        name: 'Default Room',
        userCount: 0,
        maxUsers: 2
      });
    }
    
    // Broadcast rooms list to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'rooms-list',
          rooms: roomsList
        }));
      }
    });
  }

  return { rooms };
}

// If this file is run directly, create a standalone server
if (require.main === module) {
  const http = require('http');
  
  // Create HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server for WebRTC signaling');
  });

  // Create WebSocket server instance
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  // Initialize the WebSocket server logic
  initializeWebSocketServer(wss);

  // Start server
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
  });
  
  // Log when server is stopped
  process.on('SIGTERM', () => {
    console.log('Server shutting down');
    server.close(() => {
      console.log('Server closed');
    });
  });
} else {
  // If imported as a module, export the initialization function
  module.exports = initializeWebSocketServer;
}
