const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set trust proxy to trust Heroku's reverse proxy
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const sessions = {};

// Middleware to generate or validate session tokens
app.use((req, res, next) => {
  let sessionToken = req.headers['x-session-token'];

  if (!sessionToken || !sessions[sessionToken]) {
    sessionToken = crypto.randomBytes(16).toString('hex');
    const userDir = path.join(os.tmpdir(), sessionToken);
    try {
      fs.mkdirSync(userDir, { recursive: true });
      sessions[sessionToken] = userDir;
      console.log(`New session created: ${sessionToken} at ${userDir}`);
    } catch (error) {
      console.error(`Error creating directory: ${userDir}`, error);
    }
  } else {
    console.log(`Existing session: ${sessionToken} at ${sessions[sessionToken]}`);
  }

  req.sessionToken = sessionToken;
  req.userDir = sessions[sessionToken];
  res.setHeader('x-session-token', sessionToken);

  next();
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API route to get session token
app.get('/api/session', (req, res) => {
  res.json({ sessionToken: req.sessionToken });
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

    const { command, sessionToken } = parsedMessage;
    console.log(`Received command: ${command}, sessionToken: ${sessionToken}`);

    // Validate the command input
    if (!command || typeof command !== 'string') {
      return ws.send(JSON.stringify({ error: 'Invalid command input' }));
    }

    // Validate the session token
    const userDir = sessions[sessionToken];
    if (!userDir) {
      console.log(`Invalid session token: ${sessionToken}`);
      return ws.send(JSON.stringify({ error: 'Invalid session token' }));
    }

    // Ensure PATH includes Foundry installation path
    const env = Object.create(process.env);
    env.PATH = `${env.PATH}:${path.join(process.env.HOME, '.foundry/bin')}`;
    console.log(`Executing command in directory: ${userDir}`);
    console.log(`Environment PATH: ${env.PATH}`);

    // Execute the command in the user's directory
    const child = spawn(command, { shell: true, cwd: userDir, env });

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
    const sessionDir = sessions[sessionToken];
    const stats = fs.statSync(sessionDir);
    if (now - stats.ctimeMs > maxAge) {
      fs.rmdirSync(sessionDir, { recursive: true });
      delete sessions[sessionToken];
    }
  }
};

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);
