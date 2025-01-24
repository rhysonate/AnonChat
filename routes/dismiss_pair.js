const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('../customLogger');


const pairsPath = path.join(__dirname, '../db/pairs.json');
const agentsPath = path.join(__dirname, '../db/agents.json');
const usersPath = path.join(__dirname, '../db/users.json');


router.post('/dismiss', (req, res) => {
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  let agents = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
  let pairs = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));

  const { uid, passkey } = req.body;

  const user = users.find(u => u.uid === uid);
  if (!user) {
    return res.json({ success: false, message: `No user found with uid ${uid}` });
  }

  // Check if the passkey matches
  if (user.passkey !== passkey) {
    return res.json({ success: false, message: `The provided passkey is incorrect.` });
  }

  const pairIndex = pairs.findIndex((p) => p.user1 === user.anonchat_username || p.user2 === user.anonchat_username);

  if (pairIndex === -1) {
    return res.json({ success: false, message: `${user.anonchat_username} is not currently paired with anyone.` });
  }

  const pair = pairs[pairIndex];
  const pairedUser = pair.user1 === user.anonchat_username ? pair.user2 : pair.user1;

  // Remove the pair from the pairs array
  pairs.splice(pairIndex, 1);

  fs.writeFile(pairsPath, JSON.stringify(pairs, null, 2), (err) => {
    if (err) {
      console.error('Failed to update pairing information:', err);
      return res.json({ success: false, message: 'Failed to update pairing information' });
    }

    // Reset the last pair request time for both users
    const user1 = users.find((u) => u.anonchat_username === user.anonchat_username);
    const user2 = users.find((u) => u.anonchat_username === pairedUser);

    if (user1) {
      user1.last_pair_request_sent = null;
    }

    if (user2) {
      user2.last_pair_request_sent = null;
    }

    fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
      if (err) {
        console.error('Failed to reset last pair request sent:', err);
        return res.json({ success: false, message: 'Failed to reset last pair request sent' });
      }

      // Send a dismissal message to the other user
      const agentUser2 = agents.find((a) => a.username === user2.linked_agent);

      if (!agentUser2) {
        return res.json({ success: false, message: `Agent URL not found.` });
      }

      const { url: agentUrlUser2 } = agentUser2;

      const messagePayload2 = {
        uid: user2.uid,
        message: '🚫 **Pair Dismissed!**\n\nYour partner has decided to end the current pairing. Don\'t worry, there are plenty of interesting people out there!\n\n🔍 You can now initiate a new connection request and start fresh conversations. Happy chatting! 🎉',
      };

      axios
        .post(`${agentUrlUser2}/sendToUser`, messagePayload2)
        .then((response) => {
          console.log(`Dismissal message sent to user ${user2        .anonchat_username}`);
          res.json({ success: true, message: `Pair dismissed for users ${user.anonchat_username} and ${pairedUser}` });
        })
        .catch((error) => {
          console.error(`Failed to send dismissal message to user ${user2.anonchat_username}:`, error);
          return res.json({ success: false, message: `Failed to send dismissal message to user ${user2.anonchat_username}` });
        });
    });
  });
});

module.exports = router;