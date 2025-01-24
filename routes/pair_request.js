const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('../customLogger');


const usersPath = path.join(__dirname, '../db/users.json');
const agents = require('../db/agents.json');
const pairsPath = path.join(__dirname, '../db/pairs.json');

router.post('/send', async (req, res) => {
  const { uid, agent_username, message } = req.body;
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8')); 
let pairs = JSON.parse(fs.readFileSync(pairsPath, 'utf8')); 
  const defaultMessage = 'Hi! Can we pair on AnonChat?'; // Set your default message here
  const pairMessage = message || defaultMessage;

  const user = users.find((u) => u.uid === uid);

  if (!user) {
    return res.json({ success: false, message: `UID ${uid} not found.` });
  }

  // Check if the user has sent a pair request in the last 24 hours
  const lastPairRequestSent = user.last_pair_request_sent;
  if (lastPairRequestSent) {
    const lastRequestTime = new Date(lastPairRequestSent);
    const currentTime = new Date();
    const timeDiff = currentTime - lastRequestTime;
    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
    if (hoursDiff < 24) {
      return res.json({ success: false, message: 'You can only send one pair request every 24 hours.' });
    }
  }

  const agent = agents.find((a) => a.username === agent_username);

  if (!agent) {
    return res.json({ success: false, message: `Bot agent ${agent_username} not found.` });
  }

  const pairedUser = pairs.find((p) => p.user1 === user.anonchat_username || p.user2 === user.anonchat_username);

  if (pairedUser) {
    return res.json({ success: false, message: `${user.anonchat_username} is already paired with ${pairedUser.user1 === user.anonchat_username ? pairedUser.user2 : pairedUser.user1} ❤️` });
  }

const usersToContact = users.filter((u) => {
    // Check if the property exists, if not create it and set it to true
    if (u.pairingAllowed === undefined) {
      u.pairingAllowed = true;
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    }

    // Only include users who have pairingAllowed property set to true
    return u.anonchat_username !== user.anonchat_username && u.pairingAllowed;
});

  let pairRequestsSent = 0; // Counter for successful pair requests
  const axiosRequests = []; // Array to store all the asynchronous requests

usersToContact.forEach((u) => {
    const agentUrl = agents.find((a) => a.username === u.linked_agent)?.url;

    if (agentUrl) {
      const userToContact = users.find((user) => user.anonchat_username === u.anonchat_username);
      const messagePayload = {
        uid: userToContact.uid, // Using the actual UID of User C from users.json
        message: `🔔 **ANONCHAT PAIRING REQUEST** 🔔\n\n👋 Hello ${u.anonchat_username},\n\n🔍 User **${user.anonchat_username}** is on the lookout for a pairing partner.\n\n💬 They've sent a message for you:\n\n---\n📝 "${pairMessage}"\n---\n\nExplore, connect and have a great conversation! 🚀`,
      };

      const request = axios.post(`${agentUrl}/sendToUser`, messagePayload)
  .then((response) => {
    console.log(`Message sent to agent ${u.linked_agent}`);
    // Handle successful message delivery and update pairs data
    // ...
          })
  .catch((error) => {
    console.log(`Failed to send message to agent ${u.linked_agent}:`, error);
    // Handle error case quietly
  });

      axiosRequests.push(request);
    }
  });

  try {
    await Promise.all(axiosRequests); // Wait for all the asynchronous requests to complete
    // Update the last pair request sent property for the user
    user.last_pair_request_sent = new Date();
    fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
      if (err) {
        console.error('Failed to update last pair request sent:', err);
        return res.json({ success: false, message: 'Failed to update pair request information' });
      }
    });

    res.json({ success: true, message: `Pairing request sent for user ${user.anonchat_username}` }); // Removed pairRequestsSent
  } catch (error) {
    console.error('Failed to send pair requests:', error);
    res.json({ success: false, message: 'Failed to send pair requests' });
  }
});

router.post('/reset-last-request', (req, res) => {
  const { uid } = req.body;
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8')); 
  const user = users.find((u) => u.uid === uid);

  if (!user) {
    return res.json({ success: false, message: `User with UID ${uid} not found` });
  }

  user.last_pair_request_sent = null; // Reset the last pair request sent time

  fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
    if (err) {
      console.error('Failed to reset last pair request sent:', err);
      return res.json({ success: false, message: 'Failed to reset last pair request sent' });
    }

    res.json({ success: true, message: `Last pair request sent time reset for user ${user.anonchat_username}` });
  });
});

router.post('/accept', (req, res) => {
  const { uid, username } = req.body;
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8')); 
  let pairs = JSON.parse(fs.readFileSync(pairsPath, 'utf8')); 

  const user = users.find((u) => u.anonchat_username === username);
  const pairedUser = users.find((u) => u.uid === uid);

  if (!user) {
    return res.json({ success: false, message: `User with AnonChat username ${username} not found` });
  }

  if (!pairedUser) {
    return res.json({ success: false, message: `User with UID ${uid} not found` });
  }

  const existingPairUser = pairs.find((p) => p.user1 === user.anonchat_username || p.user2 === user.anonchat_username);
  const existingPairPairedUser = pairs.find((p) => p.user1 === pairedUser.anonchat_username || p.user2 === pairedUser.anonchat_username);

  if (existingPairUser) {
    return res.json({ success: false, message: `User ${user.anonchat_username} is already paired with ${existingPairUser.user1 === user.anonchat_username ? existingPairUser.user2 : existingPairUser.user1}` });
  }

  if (existingPairPairedUser) {
    return res.json({ success: false, message: `User ${pairedUser.anonchat_username} is already paired with ${existingPairPairedUser.user1 === pairedUser.anonchat_username ? existingPairPairedUser.user2 : existingPairPairedUser.user1}` });
  }
  const pair = {
    user1: user.anonchat_username,
    user2: pairedUser.anonchat_username,
  };

  pairs.push(pair);

  fs.writeFile(pairsPath, JSON.stringify(pairs, null, 2), (err) => {
    if (err) {
      console.error('Failed to update pairing information:', err);
      return res.json({ success: false, message: 'Failed to update pairing information' });
    }

    // Send message from agent to users
    const agentUrlUser1 = agents.find((a) => a.username === user.linked_agent)?.url;
    const agentUrlUser2 = agents.find((a) => a.username === pairedUser.linked_agent)?.url;

    if (!agentUrlUser1 || !agentUrlUser2) {
      return res.json({ success: false, message: 'Failed to find agent URL' });
    }

    const messagePayload1 = {
      uid: user.uid,
      message: `You have been paired with ${pair.user2}. Start chatting now!`,
    };

    const messagePayload2 = {
      uid: pairedUser.uid,
      message: `You have been paired with ${pair.user1}. Start chatting now!`,
    };

axios
  .post(`${agentUrlUser1}/sendToUser`, messagePayload1)
  .then((response) => {
    console.log(`Message sent to user ${user.anonchat_username} through agent ${user.linked_agent}`);
  })
  .catch((error) => {
    console.error(`Failed to send message to user ${user.anonchat_username} through agent ${user.linked_agent}:`, error);
  });

axios
  .post(`${agentUrlUser2}/sendToUser`, messagePayload2)
  .then((response) => {
    console.log(`Message sent to user ${pairedUser.anonchat_username} through agent ${pairedUser.linked_agent}`);
    res.json({ success: true, message: `Users ${pair.user1} and ${pair.user2} have been paired successfully` });
  })
  .catch((error) => {
    console.error(`Failed to send message to user ${pairedUser.anonchat_username} through agent ${pairedUser.linked_agent}:`, error);
    return res.json({ success: false, message: `Failed to send message to user ${pairedUser.anonchat_username}` });
  });
  });
});

module.exports = router;