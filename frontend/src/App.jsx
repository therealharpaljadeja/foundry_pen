import React, { useState, useEffect, useCallback } from 'react';
import FoundryTerminal from './components/FoundryTerminal';
import FileEditor from './components/FileEditor';

const App = () => {
  const [isFoundryInstalled, setIsFoundryInstalled] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFile, setCurrentFile] = useState(null);

  const fetchSessionInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/session', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      const data = await response.json();
      
      setIsFoundryInstalled(data.foundryInstalled);
      setSessionToken(data.sessionToken);
      setIsLoading(false);
      console.log('Session info updated, Foundry installed:', data.foundryInstalled);
      return data.foundryInstalled;
    } catch (error) {
      console.error('Error fetching session:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const fetchFirstFile = useCallback(async () => {
    try {
      const response = await fetch('/api/first-file', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch first file');
      }
      const data = await response.json();
      setCurrentFile(data.filename);
    } catch (error) {
      console.error('Error fetching first file:', error);
      setCurrentFile(null);
    }
  }, []);

  useEffect(() => {
    fetchSessionInfo();
    fetchFirstFile();
  }, [fetchSessionInfo, fetchFirstFile]);

  useEffect(() => {
    let intervalId;

    if (!isFoundryInstalled && !isLoading) {
      intervalId = setInterval(async () => {
        const installed = await fetchSessionInfo();
        if (installed) {
          clearInterval(intervalId);
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isFoundryInstalled, isLoading, fetchSessionInfo]);

  return (
    <div className="min-h-screen bg-[#23272F] text-white font-sans">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Foundry CLI Tutorial</h1>
        
        {isLoading ? (
          <p className="text-[#61DAFB] text-sm mb-4">Loading session information...</p>
        ) : !isFoundryInstalled ? (
          <p className="text-yellow-500 text-sm mb-4">Foundry is being installed. Please wait...</p>
        ) : null}

        <div className="space-y-8">
          {/* <section>
            <h2 className="text-xl font-semibold mb-2 text-[#E06C75]">File Editor</h2>
            <p className="mb-4 text-gray-300">Edit your Foundry script here:</p>
            {currentFile ? (
              <FileEditor filename={currentFile} />
            ) : (
              <p className="text-yellow-500">No file found in the temporary folder.</p>
            )}
          </section> */}

          <section>
            <h2 className="text-xl font-semibold mb-2 text-[#E06C75]">Foundry Terminal</h2>
            <p className="mb-4 text-gray-300">Run Foundry commands here:</p>
            <div className="bg-[#1C1E24] rounded-lg overflow-hidden">
              <FoundryTerminal 
                isFoundryInstalled={isFoundryInstalled} 
                sessionToken={sessionToken} 
              />
            </div>
          </section>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2 text-[#E06C75]">Further Resources</h2>
          <p className="text-gray-300">For more detailed information, check out the following resources:</p>
          <ul className="list-disc list-inside mt-2 text-[#61DAFB]">
            <li><a href="https://book.getfoundry.sh/" className="hover:underline">Foundry Book</a></li>
            <li><a href="https://github.com/foundry-rs/foundry" className="hover:underline">Foundry GitHub Repository</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;