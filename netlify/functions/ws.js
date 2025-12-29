const WebSocket = require('ws');
const { spawn } = require('child_process');
const sessions = new Map();

exports.handler = async (event) => {
    if (event.httpMethod === 'GET') {
        const wss = new WebSocket.Server({ noServer: true });
        
        wss.on('connection', (ws, req) => {
            const params = new URLSearchParams(req.url.split('?')[1]);
            const targetId = params.get('targetId');
            
            if (!sessions.has(targetId)) {
                sessions.set(targetId, { controllers: [], targets: [] });
            }
            
            const session = sessions.get(targetId);
            
            ws.on('message', (data) => {
                const msg = JSON.parse(data);
                
                if (msg.type === 'control') {
                    if (msg.data === 'register_controller') {
                        session.controllers.push(ws);
                    } else if (msg.data === 'register_target') {
                        session.targets.push(ws);
                    }
                    
                    // Реле сообщений между контроллером и целью
                    if (session.targets.length > 0 && session.controllers.length > 0) {
                        if (msg.type === 'mouse' || msg.type === 'keyboard' || msg.type === 'control') {
                            session.targets.forEach(target => target.send(JSON.stringify(msg)));
                        }
                    }
                }
            });
            
            ws.on('close', () => {
                session.controllers = session.controllers.filter(c => c !== ws);
                session.targets = session.targets.filter(t => t !== ws);
            });
        });
        
        return { statusCode: 200 };
    }
    
    return { statusCode: 400 };
};