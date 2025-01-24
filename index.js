const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
require('./customLogger');

const registerRoute = require('./routes/register');
const createAccountRoute = require('./routes/create_account');
const pairRequestRoute = require('./routes/pair_request');
const dismissPairRoute = require('./routes/dismiss_pair');
const sendMessageRoute = require('./routes/send_message');
const testAgentURLRoute = require('./routes/test_agenturl');
const menuRoute = require('./routes/menu');

const app = express();
app.use(bodyParser.json());

// Define routes
app.use('/register-endpoint', registerRoute);
app.use('/create_account', createAccountRoute);
app.use('/pair_request', pairRequestRoute);
app.use('/dismiss_pair', dismissPairRoute);
app.use('/send_message', sendMessageRoute);
app.use('/test_agenturl-endpoint', testAgentURLRoute);
app.use('/menu', menuRoute);

// Restart the server
const restartServer = () => {
  return new Promise((resolve, reject) => {
    const server = app.listen(app.get('port'), () => {
      console.log(`AnonChat Server restarting...`);
      resolve(server);
    });
  });
};

let server;

app.post('/restart-endpoint', async (req, res) => {
  res.send('Server restart initiated');
  try {
    if (server) {
      server.close();
    }
    server = await restartServer();
    console.log('Server restarted successfully');
  } catch (error) {
    console.error('Server restart failed:', error);
  }
});

// Main route
app.get('/', (req, res) => {
  res.send('Hello from AnonChat!');
});

// Start the server
app.set('port', process.env.PORT || 3000);
server = app.listen(app.get('port'), () => {
  console.log(`AnonChat Server started on port ${app.get('port')}`);
});
