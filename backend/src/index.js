const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set trust proxy to trust Heroku's reverse proxy
app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://foundry-pen-86c9c65f23b0.herokuapp.com',
    credentials: true
  }));
app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const sessions = {};

const scriptPath = path.resolve(__dirname, 'install_foundry.sh');
console.log(`Foundry installation script path: ${scriptPath}`);

// Function to check if Foundry is already installed
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

const notifyClientFoundryInstalled = (sessionToken) => {
    wss.clients.forEach((client) => {
      if (client.sessionToken === sessionToken && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'foundryInstalled' }));
      }
    });
  };

// Function to install Foundry asynchronously
const installFoundry = async (userDir, sessionToken) => {
    const alreadyInstalled = await isFoundryInstalled();
    
    if (alreadyInstalled) {
      console.log(`Foundry is already installed for session ${sessionToken}`);
      sessions[sessionToken].foundryInstalled = true;
      notifyClientFoundryInstalled(sessionToken);
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
          // Check if the data is just progress information
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
            notifyClientFoundryInstalled(sessionToken);
            resolve();
          }
        });
      });
  };

// Middleware to handle session tokens
app.use((req, res, next) => {
  let sessionToken = req.headers['x-session-token'] || req.cookies.sessionToken;

  if (sessionToken && sessions[sessionToken]) {
    // Existing session
    console.log(`Existing session: ${sessionToken} at ${sessions[sessionToken].userDir}`);
    req.sessionToken = sessionToken;
    req.userDir = sessions[sessionToken].userDir;
  } else {
    // New session
    sessionToken = crypto.randomBytes(16).toString('hex');
    const userDir = path.join(os.tmpdir(), sessionToken);
    
    try {
      fs.mkdirSync(userDir, { recursive: true });
      sessions[sessionToken] = { userDir, foundryInstalled: false };
      console.log(`New session created: ${sessionToken} at ${userDir}`);

      // Start Foundry installation asynchronously
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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API route to get session token and Foundry installation status
app.get('/api/session', (req, res) => {
  res.json({ 
    sessionToken: req.sessionToken,
    foundryInstalled: sessions[req.sessionToken].foundryInstalled
  });
});

// API routes
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// WebSocket server setup
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  ws.on('message', (message) => {
    let parsedMessage;

    // Ensure the message is a valid JSON string
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.error('Invalid JSON message received:', message);
      return ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
    }

    const { type, command, sessionToken } = parsedMessage;

    if (type === 'init') {
        console.log(`WebSocket connection initialized with sessionToken: ${sessionToken}`);
        ws.sessionToken = sessionToken;  // Store the sessionToken on the WebSocket object
        if (sessions[sessionToken] && sessions[sessionToken].foundryInstalled) {
            ws.send(JSON.stringify({ type: 'foundryInstalled' }));
        }
        return;
    }
    // Validate the command input
    if (!command || typeof command !== 'string') {
      return ws.send(JSON.stringify({ error: 'Invalid command input' }));
    }

    // Validate the session token
    const session = sessions[sessionToken];
    if (!session) {
      console.log(`Invalid session token: ${sessionToken}`);
      return ws.send(JSON.stringify({ error: 'Invalid session token' }));
    }

    // Check if Foundry is installed
    if (!session.foundryInstalled) {
      return ws.send(JSON.stringify({ error: 'Foundry is still being installed. Please wait.' }));
    }

    // Ensure PATH includes Foundry installation path
    const env = Object.create(process.env);
    env.PATH = `${env.PATH}:${path.join(process.env.HOME, '.foundry/bin')}`;
    console.log(`Executing command in directory: ${session.userDir}`);
    console.log(`Environment PATH: ${env.PATH}`);

    // Execute the command in the user's directory
    const child = spawn(command, { shell: true, cwd: session.userDir, env });

    child.stdout.on('data', (data) => {
      ws.send(JSON.stringify({ output: data.toString() }));
    });

    child.stderr.on('data', (data) => {
      ws.send(JSON.stringify({ error: data.toString() }));
    });

    child.on('close', (code) => {
      ws.send(JSON.stringify({ output: `Command finished with code ${code}` }));
    });
  });
});

// Cleanup mechanism to remove old session directories (e.g., run this periodically)
const cleanupOldSessions = () => {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();

  for (const sessionToken in sessions) {
    const sessionDir = sessions[sessionToken].userDir;
    const stats = fs.statSync(sessionDir);
    if (now - stats.ctimeMs > maxAge) {
      fs.rmdirSync(sessionDir, { recursive: true });
      delete sessions[sessionToken];
    }
  }
};

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);