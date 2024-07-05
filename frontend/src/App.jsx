import React from 'react';
import FoundryTerminal from './components/FoundryTerminal';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Foundry CLI Tutorial</h1>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 1: Check Foundry Version</h2>
              <p className="mb-4">Let's start by checking the installed version of Foundry. Type the following command:</p>
              <FoundryTerminal />
              <p className="mt-2 text-sm text-gray-600">Expected output: The version number of your Foundry installation.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 2: Initialize a New Foundry Project</h2>
              <p className="mb-4">Now, let's create a new Foundry project. Run the following command:</p>
              {/* <FoundryTerminal /> */}
              <p className="mt-2 text-sm text-gray-600">This will create a new Foundry project in the current directory.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 3: Explore the Project Structure</h2>
              <p className="mb-4">Let's see what files and directories were created. Use the ls command:</p>
              {/* <FoundryTerminal /> */}
              <p className="mt-2 text-sm text-gray-600">You should see the typical Foundry project structure, including directories like 'src' and 'test'.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Step 4: Compile the Project</h2>
              <p className="mb-4">Now, let's compile the Solidity contracts in our project:</p>
              {/* <FoundryTerminal /> */}
              <p className="mt-2 text-sm text-gray-600">This will compile all contracts in the 'src' directory.</p>
            </section>

            {/* Add more sections as needed */}

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