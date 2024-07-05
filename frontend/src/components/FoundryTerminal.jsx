import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';

const FoundryTerminal = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFoundryInstalled, setIsFoundryInstalled] = useState(false);
  const [isREPLMode, setIsREPLMode] = useState(false);
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
        Cookies.set('sessionToken', token, { expires: 1 });
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
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sessionToken]);

  const addToHistory = (type, content) => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const executeCommand = async () => {
    if (command.trim() === '') return;

    if (!isFoundryInstalled) {
      addToHistory('error', 'Foundry is still being installed. Please wait.');
      return;
    }

    setIsExecuting(true);
    console.log('Executing command, sessionToken:', sessionToken);
    
    if (ws.current.readyState === WebSocket.OPEN) {
      addToHistory('command', command);

      if (command.trim().toLowerCase() === 'chisel' && !isREPLMode) {
        setIsREPLMode(true);
        addToHistory('system', 'Entering Chisel REPL mode. Type "exit" to leave.');
      }

      ws.current.send(JSON.stringify({ command, sessionToken, isREPL: isREPLMode }));
      
      if (isREPLMode && command.trim().toLowerCase() === 'exit') {
        setIsREPLMode(false);
        addToHistory('system', 'Exited Chisel REPL mode.');
      }

      setCommand('');
    } else {
      addToHistory('error', 'WebSocket connection is not open');
      setIsExecuting(false);
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
    <div className={`bg-gray-900 text-gray-100 p-4 rounded-lg shadow-lg ${isREPLMode ? 'border-2 border-green-500' : ''}`}>
      <h2 className="text-xl font-semibold text-blue-400 mb-2">
        Foundry Command Line {isREPLMode && <span className="text-green-500">(Chisel REPL Mode)</span>}
      </h2>
      {!isFoundryInstalled && (
        <p className="text-yellow-500 text-sm mb-2">Foundry is being installed. Please wait...</p>
      )}
      <div 
        ref={terminalRef}
        className="bg-gray-800 rounded-lg p-3 h-48 overflow-auto mb-2 font-mono text-sm"
      >
        {history.map((item, index) => (
          <div key={index} className={`mb-1 ${
            item.type === 'command' ? 'text-green-400' : 
            item.type === 'error' ? 'text-red-400' : 
            item.type === 'system' ? 'text-yellow-300' :
            'text-gray-300'
          }`}>
            {item.type === 'command' ? '> ' : ''}{item.content}
          </div>
        ))}
      </div>
      <div className="flex items-center bg-gray-800 rounded-lg p-2">
        <span className="text-green-400 mr-2">{isREPLMode ? 'chisel>' : '>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isREPLMode ? "Enter Chisel command (type 'exit' to leave)" : "Enter Foundry command"}
          disabled={isExecuting || !isFoundryInstalled}
          className="bg-transparent flex-grow outline-none text-gray-100 placeholder-gray-500 text-sm"
        />
      </div>
    </div>
  );
};

export default FoundryTerminal;