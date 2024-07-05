import React, { useState, useEffect, useRef } from 'react';
import Convert from 'ansi-to-html';

const convert = new Convert({ newline: true });

const FoundryTerminal = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFoundryInstalled, setIsFoundryInstalled] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const response = await fetch('/api/session', {
          credentials: 'include'  // This ensures cookies are sent with the request
        });
        if (!response.ok) {
          throw new Error('Failed to fetch session');
        }
        const data = await response.json();
        
        setIsFoundryInstalled(data.foundryInstalled);
        console.log('Session initialized, Foundry installed:', data.foundryInstalled);
      } catch (error) {
        console.error('Error fetching session:', error);
        addToHistory('error', 'Failed to initialize session. Please refresh the page.');
      }
    };

    fetchSessionInfo();
  }, []);

  const addToHistory = (type, content) => {
    const htmlContent = convert.toHtml(content);
    setHistory(prev => [...prev, { type, content: htmlContent }]);
  };

  const executeCommand = async () => {
    if (command.trim() === '') return;

    if (!isFoundryInstalled) {
      addToHistory('error', 'Foundry is still being installed. Please wait.');
      return;
    }

    setIsExecuting(true);
    addToHistory('command', command);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // This ensures cookies are sent with the request
        body: JSON.stringify({ command })
      });

      if (!response.ok) {
        throw new Error('Failed to execute command');
      }

      const data = await response.json();

      if (data.error) {
        addToHistory('error', data.error);
      }
      if (data.output) {
        addToHistory('output', data.output);
      }
      addToHistory('system', `Command finished with exit code ${data.exitCode}`);
    } catch (error) {
      addToHistory('error', `Failed to execute command: ${error.message}`);
    }

    setCommand('');
    setIsExecuting(false);
    if (inputRef.current) {
      inputRef.current.focus();
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
    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-blue-400 mb-2">
        Foundry Command Line
      </h2>
      {!isFoundryInstalled && (
        <p className="text-yellow-500 text-sm mb-2">Foundry is being installed. Please wait...</p>
      )}
      <div 
        ref={terminalRef}
        className="bg-gray-800 rounded-lg p-3 h-48 overflow-auto mb-2 font-mono text-sm"
      >
        {history.map((item, index) => (
          <div 
            key={index} 
            className={`mb-1 ${
              item.type === 'command' ? 'text-green-400' : 
              item.type === 'error' ? 'text-red-400' : 
              item.type === 'system' ? 'text-yellow-300' :
              'text-gray-300'
            }`}
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        ))}
      </div>
      <div className="flex items-center bg-gray-800 rounded-lg p-2">
        <span className="text-green-400 mr-2"></span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Foundry command"
          disabled={isExecuting || !isFoundryInstalled}
          className="bg-transparent flex-grow outline-none text-gray-100 placeholder-gray-500 text-sm"
        />
      </div>
    </div>
  );
};

export default FoundryTerminal;