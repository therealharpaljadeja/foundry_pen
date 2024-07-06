import React, { useState, useEffect, useRef } from 'react';
import Convert from 'ansi-to-html';

const convert = new Convert({ newline: true });

const FoundryTerminal = ({ isFoundryInstalled, sessionToken }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

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
        credentials: 'include',
        body: JSON.stringify({ command, sessionToken })
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
    <div className="text-white p-4 font-mono text-sm">
      <div 
        ref={terminalRef}
        className="h-48 overflow-auto mb-2"
      >
        {history.map((item, index) => (
          <div 
            key={index} 
            className={`mb-1 ${
              item.type === 'command' ? 'text-[#5A8BFF]' : 
              item.type === 'error' ? 'text-red-400' : 
              item.type === 'system' ? 'text-yellow-300' :
              'text-gray-300'
            }`}
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        ))}
      </div>
      <div className="flex items-center bg-[#282C34] rounded p-2">
        <span className="text-green-400 mr-2">$</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Foundry command"
          disabled={isExecuting || !isFoundryInstalled}
          className="bg-transparent flex-grow outline-none text-white placeholder-gray-500"
        />
      </div>
    </div>
  );
};

export default FoundryTerminal;