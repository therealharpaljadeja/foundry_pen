// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.host;
    ws.current = new WebSocket(`${wsProtocol}://${wsHost}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message from server:', data);
      if (data.error) {
        setOutput((prev) => prev + '\n' + data.error);
      } else {
        setOutput((prev) => prev + '\n' + data.output);
      }
      setIsExecuting(false);
    };

    ws.current.onopen = async () => {
      let sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) {
        // Fetch session token from the backend
        const response = await fetch('/api/session');
        const data = await response.json();
        sessionToken = data.sessionToken;
        localStorage.setItem('sessionToken', sessionToken);
        console.log('New session token received:', sessionToken);
      }
      console.log('WebSocket connection opened, sessionToken:', sessionToken);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const executeCommand = () => {
    if (command.trim() === '') {
      setOutput((prev) => prev + '\n' + 'Command cannot be empty');
      return;
    }

    const sessionToken = localStorage.getItem('sessionToken');
    console.log('Executing command, sessionToken:', sessionToken);
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command, sessionToken }));
      setCommand('');
      setIsExecuting(true);
    } else {
      setOutput((prev) => prev + '\n' + 'WebSocket connection is not open');
    }
  };

  return (
    <div>
      <h1>Command Executor</h1>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Enter command"
        disabled={isExecuting}
      />
      <button onClick={executeCommand} disabled={isExecuting}>
        {isExecuting ? 'Executing...' : 'Execute'}
      </button>
      <pre>{output}</pre>
    </div>
  );
};

export default App;
