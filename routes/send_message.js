const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('../customLogger');

const usersPath = path.join(__dirname, '../db/users.json');
const agentsPath = path.join(__dirname, '../db/agents.json');
const pairsPath = path.join(__dirname, '../db/pairs.json');

router.post('/', async (req, res) => {
  const { uid, message, agent_username } = req.body;
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  let agents = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
  let pairs = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));

  const user = users.find((u) => u.uid === uid);

  if (!user) {
    return res.json({ success: false, message: `User with UID ${uid} not found` });
  }

  if (!('language' in user)) {
    user.language = null;
  }

  const linkedAgent = user.linked_agent;

  if (linkedAgent !== agent_username) {
    return res.json({ success: false, message: `Bot agent ${agent_username} is not linked with ${user.anonchat_username}` });
  }

  const pair = pairs.find((p) => p.user1 === user.anonchat_username || p.user2 === user.anonchat_username);

  if (!pair) {
    return res.json({ success: false, message: `${user.name} is not currently paired with anyone` });
  }

  const otherUser = pair.user1 === user.anonchat_username ? pair.user2 : pair.user1;
  const otherUserObj = users.find((u) => u.anonchat_username === otherUser);

  if (!otherUserObj) {
    return res.json({ success: false, message: `AnonChat username: ${otherUser} not found.` });
  }

  const recipientAgent = otherUserObj.linked_agent;

  if (!recipientAgent) {
    return res.json({ success: false, message: `Linked agent not found for ${otherUser}.` });
  }

  const agent = agents.find((a) => a.username === recipientAgent);

  if (!agent) {
    return res.json({ success: false, message: `Bot agent ${recipientAgent} not found.` });
  }

  const agentUrl = agent.url;

  if (!agentUrl) {
    return res.json({ success: false, message: `Agent URL not found for Agent ${recipientAgent}` });
  }

  let translatedMessage = message;

  if (user.language) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${user.language}&dt=t&q=${encodeURIComponent(message)}`;
    await axios.get(url)
        .then(res => {
            translatedMessage = res.data[0].map(item => item[0]).join("");
        })
        .catch(err => {
            console.error(err);
            translatedMessage = message; // if translation fails, use original message
        });
  }

  const data = {
    uid: otherUserObj.uid,
    message: `AnonChat: ${translatedMessage}`,
  };

  // Send the message to the recipient's bot agent
  axios
    .post(`${agentUrl}/sendToUser`, data)
    .then((response) => {
      console.log(`----------------------------------------`);
      console.log(`Sender: ${user.anonchat_username} via ${agent_username}`);
      console.log(`Recipient: ${otherUserObj.anonchat_username}`);
          console.log(`Message: ${translatedMessage}`);
        console.log(`----------------------------------------`);

        res.json({ success: true, message: `Message from ${user.anonchat_username} sent to user ${otherUserObj.anonchat_username}` });
      })
      .catch((error) => {
        console.error(`Failed to send message from ${user.anonchat_username} sent via ${agent_username} to user ${otherUserObj.anonchat_username}. Content: ${translatedMessage}`, error);
        res.json({ success: false, message: `Failed to send message from ${user.anonchat_username} to user ${otherUserObj.anonchat_username}` });
      });

    // Update the user's language setting
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
});

module.exports = router;