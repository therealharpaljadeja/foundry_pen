import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';

const App = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFoundryInstalled, setIsFoundryInstalled] = useState(false);
  const ws = useRef(null);
  const [sessionToken, setSessionToken] = useState(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    const fetchSessionToken = async () => {
      let token = Cookies.get('sessionToken');
      let response;
      
      response = await fetch('/api/session');
      const data = await response.json();
      
      if (data.sessionToken !== token) {
        token = data.sessionToken;
        Cookies.set('sessionToken', token, { expires: 1 }); // expires in 1 day
        console.log('New or updated session token:', token);
      }
      
      setSessionToken(token);
      setIsFoundryInstalled(data.foundryInstalled);
    };

    fetchSessionToken();
  }, []);

  useEffect(() => {
    if (!sessionToken) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.host;
    ws.current = new WebSocket(`${wsProtocol}://${wsHost}`);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened, sessionToken:', sessionToken);
      ws.current.send(JSON.stringify({ type: 'init', sessionToken }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message from server:', data);
      if (data.type === 'foundryInstalled') {
        setIsFoundryInstalled(true);
      } else if (data.error) {
        addToHistory('error', data.error);
      } else if (data.output) {
        addToHistory('output', data.output);
      }
      setIsExecuting(false);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (ws.current){
        ws.current.close();
      }
    };
  }, [sessionToken]);

  const addToHistory = (type, content) => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const executeCommand = () => {
    if (command.trim() === '') return;

    if (!isFoundryInstalled) {
      addToHistory('error', 'Foundry is still being installed. Please wait.');
      return;
    }

    console.log('Executing command, sessionToken:', sessionToken);
    if (ws.current.readyState === WebSocket.OPEN) {
      addToHistory('command', command);
      ws.current.send(JSON.stringify({ command, sessionToken }));
      setCommand('');
      setIsExecuting(true);
    } else {
      addToHistory('error', 'WebSocket connection is not open');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isExecuting && isFoundryInstalled) {
      executeCommand();
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Foundry Command Line</h1>
      {!isFoundryInstalled && (
        <p className="text-yellow-500 mb-4">Foundry is being installed. Please wait...</p>
      )}
      <div 
        ref={terminalRef}
        className="bg-gray-900 text-white p-4 rounded-lg h-96 overflow-auto mb-4"
      >
        {history.map((item, index) => (
          <div key={index} className={`mb-2 ${item.type === 'command' ? 'text-green-400' : item.type === 'error' ? 'text-red-400' : ''}`}>
            {item.type === 'command' ? '> ' : ''}{item.content}
          </div>
        ))}
        <div className="flex items-center">
          <span className="text-green-400 mr-2">&gt;</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter command"
            disabled={isExecuting || !isFoundryInstalled}
            className="bg-transparent flex-grow outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default App;