import React from 'react';
import FoundryTerminal from './components/FoundryTerminal';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Foundry CLI Documentation</h1>
            
            <p className="mb-6">
              Welcome to the Foundry Command Line Interface (CLI) documentation. 
              Foundry is a powerful toolkit for Ethereum application development. 
              Below, you'll find an interactive terminal where you can try out Foundry commands.
            </p>

            <FoundryTerminal />
            <FoundryTerminal />
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
              <p>
                Try these commands to get started with Foundry:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li><code className="bg-gray-200 rounded p-1">forge --version</code> - Check the installed Forge version</li>
                <li><code className="bg-gray-200 rounded p-1">anvil --help</code> - See available Anvil options</li>
                <li><code className="bg-gray-200 rounded p-1">cast --help</code> - Explore Cast functionalities</li>
              </ul>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Further Resources</h2>
              <p>
                For more detailed information, check out the following resources:
              </p>
              <ul className="list-disc list-inside mt-2">
                <li><a href="https://book.getfoundry.sh/" className="text-blue-500 hover:underline">Foundry Book</a></li>
                <li><a href="https://github.com/foundry-rs/foundry" className="text-blue-500 hover:underline">Foundry GitHub Repository</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;