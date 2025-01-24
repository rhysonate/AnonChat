const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
require('../customLogger');


const agentsPath = path.join(__dirname, '../db/agents.json');

// Load the existing agents from the JSON file
let agents = require(agentsPath);

router.post('/', (req, res) => {
  const { name, url } = req.body;
  const lowercaseName = name.toLowerCase(); // Convert name to lowercase
  const baseUsername = `@${lowercaseName.replace(/[^a-z]/g, '')}`;

  // Check if the URL already exists
  const existingAgent = agents.find((agent) => agent.url === url);
  if (existingAgent) {
    return res.json({ success: false, message: `Bot agent with URL ${url} already exists` });
  }

  let index = 1;
  let username = baseUsername;
  
  // Generate a unique username by appending a number to the base username
  while (agents.some((agent) => agent.username === username)) {
    index++;
    username = `${baseUsername}${index}`;
  }

  agents.push({ name: lowercaseName, url, username });

  fs.writeFile(agentsPath, JSON.stringify(agents, null, 2), (err) => {
    if (err) {
      console.error('Failed to register bot agent:', err);
      return res.json({ success: false, message: 'Failed to register bot agent' });
    }

    console.log(`Bot agent ${lowercaseName} registered successfully with username ${username}`);
    res.json({ success: true, message: `Bot agent ${lowercaseName} registered successfully`, username });
  });
});

// Retrieve list of all agents
router.get('/agents', (req, res) => {
  fs.readFile(agentsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read bot agents:', err);
      return res.json({ success: false, message: 'Failed to read bot agents' });
    }

    let agents = [];
    try {
      agents = JSON.parse(data);
    } catch (parseError) {
      console.error('Failed to parse bot agents JSON:', parseError);
      return res.json({ success: false, message: 'Failed to parse bot agents JSON' });
    }

    res.json({ success: true, agents });
  });
});

// Search for an agent by username
router.get('/agents/:username', (req, res) => {
  const { username } = req.params;

  fs.readFile(agentsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read bot agents:', err);
      return res.json({ success: false, message: 'Failed to read bot agents' });
    }

    let agents = [];
    try {
      agents = JSON.parse(data);
    } catch (parseError) {
      console.error('Failed to parse bot agents JSON:', parseError);
      return res.json({ success: false, message: 'Failed to parse bot agents JSON' });
    }

    const agent = agents.find((agent) => agent.username === username);
    if (agent) {
      res.json({ success: true, agent });
    } else {
      res.json({ success: false, message: `Agent with username ${username} not found` });
    }
  });
});

// Update URL or name of an agent by username
router.patch('/agents/:username', (req, res) => {
  const { username } = req.params;
  const { name, url } = req.body;

  fs.readFile(agentsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read bot agents:', err);
      return res.json({ success: false, message: 'Failed to read bot agents' });
    }

    let agents = [];
    try {
      agents = JSON.parse(data);
    } catch (parseError) {
      console.error('Failed to parse bot agents JSON:', parseError);
      return res.json({ success: false, message: 'Failed to parse bot agents JSON' });
    }

    const agent = agents.find((agent) => agent.username === username);
    if (agent) {
      if (name) {
        agent.name = name;
      }
      if (url) {
        agent.url = url;
      }

      fs.writeFile(agentsPath, JSON.stringify(agents, null, 2), (writeError) => {
        if (writeError) {
          console.error('Failed to update agent:', writeError);
          return res.json({ success: false, message: 'Failed to update agent' });
        }

        res.json({ success: true, message: 'Agent updated successfully', agent });
      });
    } else {
      res.json({ success: false, message: `Agent with username ${username} not found` });
    }
  });
});

module.exports = router;
