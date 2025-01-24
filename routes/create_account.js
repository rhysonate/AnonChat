const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
require('../customLogger');

const usersPath = path.join(__dirname, '../db/users.json');

router.post('/', (req, res) => {
  const { uid, name, passkey, agent_username } = req.body;

  fs.readFile(path.join(__dirname, '../db/agents.json'), 'utf8', (err, agentData) => {
    if (err) {
      console.error('Failed to read agents file:', err);
      return res.json({ success: false, message: 'Failed to create AnonChat account' });
    }

    try {
      const agents = JSON.parse(agentData);
      const agent = agents.find((a) => a.username === agent_username);

      if (!agent) {
        return res.json({ success: false, message: `Bot agent ${agent_username} not found` });
      }

      fs.readFile(usersPath, 'utf8', (err, userData) => {
        if (err) {
          console.error('Failed to read users file:', err);
          return res.json({ success: false, message: 'Failed to create AnonChat account' });
        }

        try {
          const users = JSON.parse(userData);

          // Check if the UID already exists
          const existingUser = users.find((user) => user.uid === uid);
          if (existingUser) {
            return res.json({ success: false, message: `User with UID ${uid} already exists` });
          }

          const anonchat_username = `${name.toLowerCase().replace(/[^a-z]/g, '')}_${Math.floor(Math.random() * 1000)}`;
          const user = { uid, name, anonchat_username, passkey, linked_agent: agent_username };

          users.push(user);

          fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
              console.error('Failed to write to users file:', err);
              return res.json({ success: false, message: 'Failed to create AnonChat account' });
            }

            console.log('AnonChat account created:', name);
            res.json({ success: true, message: `AnonChat account created for ${name}`, anonchat_username });
          });
        } catch (error) {
          console.error('Failed to parse users file:', error);
          res.json({ success: false, message: 'Failed to create AnonChat account' });
        }
      });
    } catch (error) {
      console.error('Failed to parse agents file:', error);
      res.json({ success: false, message: 'Failed to create AnonChat account' });
    }
  });
});

router.post('/delete', (req, res) => {
  const { uid } = req.body;
  
  fs.readFile(usersPath, 'utf8', (err, userData) => {
    if (err) {
      console.error('Failed to read users file:', err);
      return res.json({ success: false, message: 'Failed to delete AnonChat account' });
    }

    try {
      const users = JSON.parse(userData);

      // Check if the UID exists
      const userIndex = users.findIndex((user) => user.uid === uid);
      if (userIndex === -1) {
        return res.json({ success: false, message: `User with UID ${uid} not found` });
      }

      // Remove the user from the array
      users.splice(userIndex, 1);

      fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
        if (err) {
          console.error('Failed to write to users file:', err);
          return res.json({ success: false, message: 'Failed to delete AnonChat account' });
        }

        console.log('AnonChat account deleted:', uid);
        res.json({ success: true, message: `AnonChat account with UID ${uid} deleted` });
      });
    } catch (error) {
      console.error('Failed to parse users file:', error);
      res.json({ success: false, message: 'Failed to delete AnonChat account' });
    }
  });
});


module.exports = router;