// netlify/functions/websocket.js
const WebSocket = require('ws');
const clients = new Map();

exports.handler = async (event, context) => {
  if (event.httpMethod === 'GET') {
    const wss = new WebSocket.Server({ noServer: true });
    wss.on('connection', (ws, request) => {
      const id = request.headers['client-id'] || 'controller';
      clients.set(id, ws);
      
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'screen') {
          broadcastToControllers(data);
        } else if (message.type === 'control') {
          forwardToTarget(message);
        }
      });
    });
  }
};