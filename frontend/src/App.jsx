import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFoundryInstalled, setIsFoundryInstalled] = useState(false);
  const ws = useRef(null);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    const fetchSessionToken = async () => {
      let token = localStorage.getItem('sessionToken');
      let response;
      if (!token) {
        response = await fetch('/api/session');
        const data = await response.json();
        token = data.sessionToken;
        localStorage.setItem('sessionToken', token);
        console.log('New session token received:', token);
      } else {
        // Verify the existing token and get Foundry status
        response = await fetch('/api/session', {
          headers: { 'x-session-token': token }
        });
        const data = await response.json();
        if (data.sessionToken !== token) {
          // If the server returns a different token, update it
          token = data.sessionToken;
          localStorage.setItem('sessionToken', token);
          console.log('Updated session token:', token);
        }
      }
      setSessionToken(token);
      setIsFoundryInstalled(response.foundryInstalled);
    };

    fetchSessionToken();
  }, []);

  useEffect(() => {
    if (!sessionToken) return;

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

    ws.current.onopen = () => {
      console.log('WebSocket connection opened, sessionToken:', sessionToken);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, [sessionToken]);

  useEffect(() => {
    if (!isFoundryInstalled && sessionToken) {
      const checkFoundryStatus = setInterval(async () => {
        const response = await fetch('/api/session', {
          headers: { 'x-session-token': sessionToken }
        });
        const data = await response.json();
        if (data.foundryInstalled) {
          setIsFoundryInstalled(true);
          clearInterval(checkFoundryStatus);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(checkFoundryStatus);
    }
  }, [isFoundryInstalled, sessionToken]);

  const executeCommand = () => {
    if (command.trim() === '') {
      setOutput((prev) => prev + '\n' + 'Command cannot be empty');
      return;
    }

    if (!isFoundryInstalled) {
      setOutput((prev) => prev + '\n' + 'Foundry is still being installed. Please wait.');
      return;
    }

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
      {!isFoundryInstalled && (
        <p>Foundry is being installed. Please wait...</p>
      )}
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Enter command"
        disabled={isExecuting || !isFoundryInstalled}
      />
      <button onClick={executeCommand} disabled={isExecuting || !isFoundryInstalled}>
        {isExecuting ? 'Executing...' : 'Execute'}
      </button>
      <pre>{output}</pre>
    </div>
  );
};

export default App;