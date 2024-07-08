import React, { useState, useEffect, useCallback } from 'react';
import FoundryTerminal from './components/FoundryTerminal';
import TableOfContents from './components/TableOfContents';

const CodeBlock = ({ children }) => (
  <pre className="bg-[#1C1E24] text-white p-4 rounded-lg overflow-x-auto">
    <code>{children}</code>
  </pre>
);

const CodeSnippet = ({ children }) => (
  <code className="bg-[#1C1E24] text-[#FF6B6B] px-1.5 py-0.5 rounded text-sm font-mono">
    {children}
  </code>
);

const App = () => {
  const [isFoundryInstalled, setIsFoundryInstalled] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTOC, setShowTOC] = useState(false);

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

  useEffect(() => {
    fetchSessionInfo();
  }, [fetchSessionInfo]);

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
    <div className="min-h-screen bg-[#23272F] text-white">
      <div className="max-w-full sm:max-w-6xl mx-auto p-2  sm:p-4 md:p-8">
        <div className="flex flex-col md:flex-row">
          <div className="flex-grow max-w-full md:max-w-4xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 break-words">Evaluating Contract Storage with Foundry</h1>
          
            {isLoading ? (
              <p className="text-[#61DAFB] text-sm mb-4">Loading session information...</p>
            ) : !isFoundryInstalled ? (
              <p className="text-yellow-500 text-sm mb-4">Foundry is being installed. Please wait...</p>
            ) : null}

            <button 
              className="md:hidden bg-[#1C1E24] text-white py-2 px-4 rounded mb-4"
              onClick={() => setShowTOC(!showTOC)}
            >
              {showTOC ? 'Hide' : 'Show'} Table of Contents
            </button>

            {showTOC && (
              <div className="md:hidden mb-4">
                <TableOfContents />
              </div>
            )}

            <section id="overview">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 text-[#6c72e0]">Overview</h2>
              <p className="mb-4 text-gray-300 font-light">
                In this tutorial, we'll guide you through evaluating the storage layout and values of a Solidity contract using Foundry's <CodeSnippet> forge </CodeSnippet> and <CodeSnippet> cast </CodeSnippet> tools. You'll be able to follow along and execute each step using our built-in command line interface, with Foundry pre-installed.
              </p>
            </section>

            <div className="space-y-8">
              <section id="init-project">
                <h2 className="text-xl font-semibold mb-2 text-[#6c72e0]">1. Initialize Your Foundry Project</h2>
                <p className="mb-4 text-gray-300 font-light">To start, we'll create the default folder structure with template contracts using the `forge init` command. This command sets up a new Foundry project with a sample contract in the `src` folder.</p>
                <CodeBlock>forge init</CodeBlock>
                <div className="bg-[#1C1E24] rounded-lg overflow-hidden mt-2">
                  <FoundryTerminal 
                    isFoundryInstalled={isFoundryInstalled} 
                    sessionToken={sessionToken} 
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400 font-light">
                  <em>Explanation:</em> The forge init command initializes a new Foundry project in the current folder. It creates a directory structure with a `src` folder containing a sample Solidity contract.
                </p>
              </section>

              <section id="evaluate-storage">
                <h2 className="text-xl font-semibold mb-2 text-[#6c72e0]">2. Evaluate the Storage of the Contract</h2>
                <p className="mb-4 text-gray-300 font-light">Next, we'll use `forge` to evaluate the storage layout of the default contract found in the `src` folder. This step provides insights into how the contract's storage is structured. Use the following command to inspect its storage:</p>
                <CodeBlock>forge inspect Counter storage</CodeBlock>
                <div className="bg-[#1C1E24] rounded-lg overflow-hidden mt-2">
                  <FoundryTerminal 
                    isFoundryInstalled={isFoundryInstalled} 
                    sessionToken={sessionToken} 
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400 font-light">
                  <em>Explanation:</em> The `forge inspect Counter storage` command examines the storage layout of the `Counter` contract. It details the storage slots and variable types used in the contract.
                </p>
              </section>

              <section id="deploy-contract">
                <h2 className="text-xl font-semibold mb-2 text-[#6c72e0]">3. Deploy the Counter Contract to Base Sepolia Testnet</h2>
                <p className="mb-4 text-gray-300 font-light">We'll deploy the `Counter` contract to the Base Sepolia testnet. Deploying to a testnet allows us to interact with the contract without using real ETH.</p>
                <p className="mb-4 text-gray-300 font-light">First, ensure you have a Base Sepolia testnet RPC URL and a private key for deployment. This document comes with `$BASE_SEPOLIA_RPC` and `$PRIVATE_KEY` already defined. The private key account is funded with testnet eth so you can execute transactions!</p>
                <p className="mb-4 text-gray-300 font-light">Now to deploy the contract, use the following:</p>
                <CodeBlock>forge create --rpc-url $BASE_SEPOLIA_RPC --private-key $PRIVATE_KEY src/Counter.sol:Counter</CodeBlock>
                <div className="bg-[#1C1E24] rounded-lg overflow-hidden mt-2">
                  <FoundryTerminal 
                    isFoundryInstalled={isFoundryInstalled} 
                    sessionToken={sessionToken} 
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400 font-light">
                  <em>Explanation:</em> The `forge create` command deploys the `Counter` contract to the Sepolia testnet using the specified RPC URL and private key.
                </p>
              </section>

              <section id="evaluate-deployed">
                <h2 className="text-xl font-semibold mb-2 text-[#6c72e0]">4. Evaluate the Storage of the Deployed Contract</h2>
                <p className="mb-4 text-gray-300 font-light">Once the contract is deployed, we can evaluate its storage on the blockchain. Use the contract address returned from the deployment step above and place that where it says `CONTRACT_ADDRESS` below:</p>
                <CodeBlock>cast storage --rpc-url $BASE_SEPOLIA_RPC CONTRACT_ADDRESS 0</CodeBlock>
                <div className="bg-[#1C1E24] rounded-lg overflow-hidden mt-2">
                  <FoundryTerminal 
                    isFoundryInstalled={isFoundryInstalled} 
                    sessionToken={sessionToken} 
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400 font-light">
                  <em>Explanation:</em> The `cast storage` command queries the storage of the deployed contract at the specified address. The `0` at the end specifies the storage slot to inspect. In the Counter contract, the `number` variable is stored in the first storage slot, which is the 0 slot.
                </p>
              </section>

              <section id="increment-counter">
                <h2 className="text-xl font-semibold mb-2 text-[#6c72e0]">5. Call the Counter Contract to Increment the Number</h2>
                <p className="mb-4 text-gray-300 font-light">Next, we will call the `increment` function of the `Counter` contract to change its storage state. This will allow us to confirm that the storage slot we previously evaluated was in fact where number was stored:</p>
                <CodeBlock>cast send --rpc-url $BASE_SEPOLIA_RPC --private-key $PRIVATE_KEY CONTRACT_ADDRESS "increment()"</CodeBlock>
                <div className="bg-[#1C1E24] rounded-lg overflow-hidden mt-2">
                  <FoundryTerminal 
                    isFoundryInstalled={isFoundryInstalled} 
                    sessionToken={sessionToken} 
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400 font-light">
                  <em>Explanation:</em> The `cast send` command sends a transaction to the `Counter` contract to call the `increment` function, which modifies the contract's storage.
                </p>
              </section>

              <section id="evaluate-again">
                <h2 className="text-xl font-semibold mb-2 text-[#6c72e0]">6. Evaluate the Remote Contract's Storage Again</h2>
                <p className="mb-4 text-gray-300 font-light">Finally, we'll re-evaluate the storage of the deployed contract to see how it has changed after the `increment` function call.</p>
                <CodeBlock>cast storage --rpc-url $BASE_SEPOLIA_RPC CONTRACT_ADDRESS 0</CodeBlock>
                <div className="bg-[#1C1E24] rounded-lg overflow-hidden mt-2">
                  <FoundryTerminal 
                    isFoundryInstalled={isFoundryInstalled} 
                    sessionToken={sessionToken} 
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400 font-light">
                  <em>Explanation:</em> This step repeats the storage evaluation to show the updated value in the contract's storage after the state change.
                </p>
              </section>
            </div>

            <section id="further-resources" className="mt-8">
              <h2 className="text-xl md:text-2xl font-semibold mb-2 text-[#6c72e0]">Further Resources</h2>
              <p className="text-gray-300 font-light">For more detailed information, check out the following resources:</p>
              <ul className="list-disc list-inside mt-2 text-[#61DAFB]">
                <li><a href="https://book.getfoundry.sh/" className="hover:underline">Foundry Book</a></li>
                <li><a href="https://github.com/foundry-rs/foundry" className="hover:underline">Foundry GitHub Repository</a></li>
              </ul>
            </section>
          </div>
          <div className="hidden md:block ml-8 w-64">
            <TableOfContents />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;