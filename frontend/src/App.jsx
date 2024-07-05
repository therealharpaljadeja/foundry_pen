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
  const inputRef = useRef(null); 

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

      if (inputRef.current) {
        inputRef.current.focus();
      }
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
      
      // Focus the input field after executing the command
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      addToHistory('error', 'WebSocket connection is not open');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isExecuting && isFoundryInstalled) {
      e.preventDefault();
      executeCommand();
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [history]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400">Foundry Command Line</h1>
          {!isFoundryInstalled && (
            <p className="text-yellow-500 mt-2">Foundry is being installed. Please wait...</p>
          )}
        </header>
        <main>
          <div 
            ref={terminalRef}
            className="bg-gray-800 rounded-lg p-4 h-[calc(100vh-200px)] overflow-auto mb-4 font-mono"
          >
            {history.map((item, index) => (
              <div key={index} className={`mb-2 ${item.type === 'command' ? 'text-green-400' : item.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                {item.type === 'command' ? '> ' : ''}{item.content}
              </div>
            ))}
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-2">
            <span className="text-green-400 mr-2">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command"
              disabled={isExecuting || !isFoundryInstalled}
              className="bg-transparent flex-grow outline-none text-gray-100 placeholder-gray-500"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;