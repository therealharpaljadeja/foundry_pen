const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://foundry-pen-86c9c65f23b0.herokuapp.com',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const sessions = {};

const scriptPath = path.resolve(__dirname, 'install_foundry.sh');
console.log(`Foundry installation script path: ${scriptPath}`);

const isFoundryInstalled = () => {
  return new Promise((resolve) => {
    exec('forge --version', (error, stdout, stderr) => {
      if (error) {
        console.log('Foundry is not installed');
        resolve(false);
      } else {
        console.log(`Foundry is already installed: ${stdout.trim()}`);
        resolve(true);
      }
    });
  });
};

const installFoundry = async (userDir, sessionToken) => {
  const alreadyInstalled = await isFoundryInstalled();
  
  if (alreadyInstalled) {
    console.log(`Foundry is already installed for session ${sessionToken}`);
    sessions[sessionToken].foundryInstalled = true;
    return;
  }

  return new Promise((resolve, reject) => {
    const child = exec(`bash ${scriptPath}`, { cwd: userDir });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data;
      console.log(`Foundry installation output for session ${sessionToken}: ${data.trim()}`);
    });

    child.stderr.on('data', (data) => {
      if (data.includes('%') || data.includes('#')) {
        console.log(`Foundry installation progress for session ${sessionToken}: ${data.trim()}`);
      } else {
        errorOutput += data;
        console.error(`Foundry installation error for session ${sessionToken}: ${data.trim()}`);
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`Foundry installation failed for session ${sessionToken} with code ${code}`);
        sessions[sessionToken].foundryInstalled = false;
        reject(new Error(`Installation failed with code ${code}: ${errorOutput}`));
      } else {
        console.log(`Foundry installation completed successfully for session ${sessionToken}`);
        sessions[sessionToken].foundryInstalled = true;
        resolve();
      }
    });
  });
};

app.use((req, res, next) => {
  let sessionToken = req.cookies.sessionToken;

  if (sessionToken && sessions[sessionToken]) {
    req.sessionToken = sessionToken;
    req.userDir = sessions[sessionToken].userDir;
  } else {
    sessionToken = crypto.randomBytes(16).toString('hex');
    const userDir = path.join(os.tmpdir(), sessionToken);
    
    try {
      fs.mkdirSync(userDir, { recursive: true });
      sessions[sessionToken] = { userDir, foundryInstalled: false };
      console.log(`New session created: ${sessionToken} at ${userDir}`);

      installFoundry(userDir, sessionToken).catch(console.error);
    } catch (error) {
      console.error(`Error creating directory: ${userDir}`, error);
      return next(new Error('Internal Server Error'));
    }

    req.sessionToken = sessionToken;
    req.userDir = userDir;
  }

  res.cookie('sessionToken', req.sessionToken, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
  next();
});

// API routes
app.get('/api/session', (req, res) => {
  const sessionToken = req.sessionToken;
  if (!sessionToken || !sessions[sessionToken]) {
    return res.status(400).json({ error: 'Invalid session' });
  }
  res.json({ 
    sessionToken: sessionToken,
    foundryInstalled: sessions[sessionToken].foundryInstalled
  });
});

app.post('/api/execute', (req, res) => {
  const { command } = req.body;
  const session = sessions[req.sessionToken];

  if (!session) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  if (!session.foundryInstalled) {
    return res.status(400).json({ error: 'Foundry is still being installed. Please wait.' });
  }

  const env = {
    ...process.env,
    PATH: `${process.env.PATH}:${path.join(process.env.HOME, '.foundry/bin')}`,
    BASE_SEPOLIA_RPC: process.env.BASE_SEPOLIA_RPC,
    PRIVATE_KEY: process.env.PRIVATE_KEY
  };

  const child = spawn(command, { shell: true, cwd: session.userDir, env });

  let output = '';
  let errorOutput = '';

  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  child.on('close', (code) => {
    res.json({
      output,
      error: errorOutput,
      exitCode: code
    });
  });
});

// New route to get file content
app.get('/api/file/:filename', async (req, res) => {
    const { filename } = req.params;
    const sessionToken = req.cookies.sessionToken;
  
    if (!sessionToken || !sessions[sessionToken]) {
      return res.status(401).json({ error: 'Invalid session' });
    }
  
    const userDir = sessions[sessionToken].userDir;
    const filePath = path.join(userDir, filename);
  
    try {
      // Check if the file exists and is within the user's directory
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      res.json({ content });
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      res.status(404).json({ error: 'File not found or cannot be read' });
    }
  });
  
  // New route to save file content
  app.post('/api/file/:filename', async (req, res) => {
    const { filename } = req.params;
    const { content } = req.body;
    const sessionToken = req.cookies.sessionToken;
  
    if (!sessionToken || !sessions[sessionToken]) {
      return res.status(401).json({ error: 'Invalid session' });
    }
  
    const userDir = sessions[sessionToken].userDir;
    const filePath = path.join(userDir, filename);
  
    try {
      // Ensure the file path is within the user's directory
      if (!filePath.startsWith(userDir)) {
        throw new Error('Invalid file path');
      }
      await fs.writeFile(filePath, content, 'utf8');
      res.json({ message: 'File saved successfully' });
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      res.status(500).json({ error: 'Failed to save file' });
    }
  });

// New route to get the first file in the user's directory
app.get('/api/first-file', async (req, res) => {
    const sessionToken = req.cookies.sessionToken;
  
    if (!sessionToken || !sessions[sessionToken]) {
      return res.status(401).json({ error: 'Invalid session' });
    }
  
    const userDir = sessions[sessionToken].userDir;
  
    try {
      console.log(`Attempting to read directory: ${userDir}`);
      const files = await fs.readdir(userDir);
      console.log(`Files in directory: ${files.join(', ')}`);
  
      const jsFiles = files.filter(file => !file.startsWith('.') && file.endsWith('.sol'));
      console.log(`Solidity files found: ${jsFiles.join(', ')}`);
  
      if (jsFiles.length > 0) {
        const firstFile = jsFiles[0];
        console.log(`Returning first file: ${firstFile}`);
        res.json({ filename: firstFile });
      } else {
        console.log('No suitable files found');
        res.status(404).json({ error: 'No suitable files found' });
      }
    } catch (error) {
      console.error(`Error reading directory ${userDir}:`, error);
      res.status(500).json({ error: 'Failed to read directory', details: error.message });
    }
  });

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// The "catch-all" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});