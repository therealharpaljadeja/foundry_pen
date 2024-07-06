import React, { useState, useEffect } from 'react';
import FoundryTerminal from './components/FoundryTerminal';

const App = () => {
  const [isFoundryInstalled, setIsFoundryInstalled] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessionInfo = async () => {
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
        console.log('Session initialized, Foundry installed:', data.foundryInstalled);
        return data.foundryInstalled;
      } catch (error) {
        console.error('Error fetching session:', error);
        setIsLoading(false);
        return false;
        // Handle the error appropriately in the UI
      }
    };

    fetchSessionInfo();
  }, []);

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
  }, [isFoundryInstalled, isLoading]);

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Foundry CLI Tutorial</h1>
            
            {isLoading ? (
              <p className="text-blue-500 text-sm mb-4">Loading session information...</p>
            ) : !isFoundryInstalled ? (
              <p className="text-yellow-500 text-sm mb-4">Foundry is being installed. Please wait...</p>
            ) : null}

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 1: Check Foundry Version</h2>
              <p className="mb-4">Let's start by checking the installed version of Foundry. Type the following command:</p>
              <FoundryTerminal 
                isFoundryInstalled={isFoundryInstalled} 
                sessionToken={sessionToken} 
              />
              <p className="mt-2 text-sm text-gray-600">Expected output: The version number of your Foundry installation.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 2: Initialize a New Foundry Project</h2>
              <p className="mb-4">Now, let's create a new Foundry project. Run the following command:</p>
              <FoundryTerminal 
                isFoundryInstalled={isFoundryInstalled} 
                sessionToken={sessionToken} 
              />
              <p className="mt-2 text-sm text-gray-600">This will create a new Foundry project in the current directory.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 3: Explore the Project Structure</h2>
              <p className="mb-4">Let's see what files and directories were created. Use the ls command:</p>
              <FoundryTerminal 
                isFoundryInstalled={isFoundryInstalled} 
                sessionToken={sessionToken} 
              />
              <p className="mt-2 text-sm text-gray-600">You should see the typical Foundry project structure, including directories like 'src' and 'test'.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 4: Compile the Project</h2>
              <p className="mb-4">Now, let's compile the Solidity contracts in our project:</p>
              <FoundryTerminal 
                isFoundryInstalled={isFoundryInstalled} 
                sessionToken={sessionToken} 
              />
              <p className="mt-2 text-sm text-gray-600">This will compile all contracts in the 'src' directory.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 5: Run Tests</h2>
              <p className="mb-4">Let's run the tests for our project:</p>
              <FoundryTerminal 
                isFoundryInstalled={isFoundryInstalled} 
                sessionToken={sessionToken} 
              />
              <p className="mt-2 text-sm text-gray-600">This will run all tests in the 'test' directory.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Additional Commands</h2>
              <p className="mb-4">Feel free to try out other Foundry commands here:</p>
              <FoundryTerminal 
                isFoundryInstalled={isFoundryInstalled} 
                sessionToken={sessionToken} 
              />
              <p className="mt-2 text-sm text-gray-600">Experiment with different Foundry commands to learn more about its capabilities.</p>
            </section>

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Further Resources</h2>
              <p>For more detailed information, check out the following resources:</p>
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