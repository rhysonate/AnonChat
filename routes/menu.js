const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('../customLogger');


const usersPath = path.join(__dirname, '../db/users.json');
const agentsPath = path.join(__dirname, '../db/agents.json');
const pairsPath = path.join(__dirname, '../db/pairs.json');

router.get('/account', (req, res) => {
  const { uid, passkey } = req.query;
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  let pairs = JSON.parse(fs.readFileSync(pairsPath, 'utf8'));

  let user = users.find((u) => u.uid === uid);

  if (!user) {
    return res.json({ success: false, message: `User with UID ${uid} not found` });
  }

  // Check if the passkey matches
  if (user.passkey !== passkey) {
    return res.json({ success: false, message: `The provided passkey is incorrect` });
  }

  // Check if the language property exists
  if (!user.hasOwnProperty('language')) {
    user.language = null; // Set language to null if it doesn't exist
    // Write back to the file
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  }

  const { name, anonchat_username, language } = user;

  // Check if the user is currently paired
  const pair = pairs.find((p) => p.user1 === anonchat_username || p.user2 === anonchat_username);

  if (pair) {
    const pairedUser = pair.user1 === anonchat_username ? pair.user2 : pair.user1;
    const pairedUserObj = users.find((u) => u.anonchat_username === pairedUser);

    if (pairedUserObj) {
      const { name: pairedUserName, anonchat_username: pairedUserUsername } = pairedUserObj;
      res.json({
        success: true,
        name,
        anonchat_username,
        language,
        pairing_partner: {
          name: pairedUserName,
          anonchat_username: pairedUserUsername
        }
      });
    } else {
      res.json({ success: true, name, anonchat_username, language });
    }
  } else {
    res.json({ success: true, name, anonchat_username, language });
  }
});

router.put('/change', async (req, res) => {
  const { uid, passkey, newName, newUsername, newPasskey, newLinkedAgent, newLanguage } = req.body;
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

  const userIndex = users.findIndex((u) => u.uid === uid);

  if (userIndex === -1) {
    console.log(`User with UID ${uid} not found.`);
    return res.json({ success: false, message: `User with UID ${uid} not found` });
  }

  const user = users[userIndex];

  // Check if the passkey matches
  if (user.passkey !== passkey) {
    console.log(`Provided passkey is incorrect for user ${uid}.`);
    return res.json({ success: false, message: `The provided passkey is incorrect` });
  }

  // Check and change the name
  if (newName) {
    user.name = newName;
  }

  // Check and change the passkey
  if (newPasskey) {
    user.passkey = newPasskey;
  }

  // Check and change the linked agent
  if (newLinkedAgent) {
    user.linked_agent = newLinkedAgent;
  }

  // Check and change the language
  if (newLanguage) {
    if (newLanguage === "none") {
      user.language = null;
    } else {
      const langCodes = ['en', 'bn', 'vi', 'ja', 'af', 'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'es', 'et', 'fa', 'fi', 'fr', 'gu', 'he', 'hi', 'hr', 'hu', 'id', 'it', 'kn', 'ko', 'lt', 'lv', 'mk', 'ml', 'mr', 'ne', 'nl', 'no', 'pa', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'so', 'sq', 'sv', 'sw', 'ta', 'te', 'th', 'tl', 'tr', 'uk', 'ur', 'uz', 'vi', 'zh'];

      if (!langCodes.includes(newLanguage)) {
        console.log(`Invalid language code provided for user ${uid}.`);
        return res.json({ success: false, message: `The provided language code is invalid` });
      }

      user.language = newLanguage;
    }
  }

  // Check and change the username
  if (newUsername) {
    try {
      await axios.post('https://anonchat.xaviabot.repl.co/dismiss_pair/dismiss', { uid: user.uid, passkey: user.passkey });
      user.anonchat_username = newUsername;
      console.log(`Username changed and pair dismissed successfully for user ${uid}.`);
    } catch (error) {
      console.error(`Failed to dismiss pair for user ${uid}:`, error);
      return res.json({ success: false, message: 'Failed to dismiss pair' });
    }
  }

  // Save the updated users array back to the users.json file
  fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
    if (err) {
      console.error('Failed to update user information:', err);
       return res.json({ success: false, message: 'Failed to update user information' });
    }

    res.json({ success: true, message: 'User information updated successfully' });
  });
});
      
      
router.put('/delete-account', (req, res) => {
  const { uid, passkey } = req.body;
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

  const userIndex = users.findIndex((u) => u.uid === uid);

  if (userIndex === -1) {
    return res.json({ success: false, message: `User with UID ${uid} not found` });
  }

  const user = users[userIndex];

  // Check if the passkey matches
  if (user.passkey !== passkey) {
    return res.json({ success: false, message: `The provided passkey is incorrect.` });
  }

  // Dismiss the pair
  const dismissPayload = {
    uid: user.uid,
    passkey: user.passkey,
  };

  axios.post('https://anonchat.xaviabot.repl.co/dismiss_pair/dismiss', dismissPayload)
    .then(() => {
      // Delete the user account
      users.splice(userIndex, 1);

      // Update the users.json file with the modified users array
      fs.writeFile(usersPath, JSON.stringify(users, null, 2), (err) => {
        if (err) {
          console.error('Failed to delete user account:', err);
          return res.json({ success: false, message: 'Failed to delete user account' });
        }

        res.json({ success: true, message: 'User account deleted successfully.' });
      });
    })
    .catch((error) => {
      console.error('Failed to dismiss pair:', error);
      return res.json({ success: false, message: 'Failed to dismiss pair' });
    });
});

router.post('/pairing', (req, res) => {
  const { uid, linked_agent } = req.body;
  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

  const userIndex = users.findIndex((u) => u.uid === uid);

  if (userIndex === -1) {
    return res.json({ success: false, message: `User with UID ${uid} not found` });
  }

  const user = users[userIndex];

  // Check if the linked_agent matches
  if (user.linked_agent !== linked_agent) {
    return res.json({ success: false, message: `The linked agent does not match the user's agent` });
  }

  // Check if the pairingAllowed property exists
  if (!user.hasOwnProperty('pairingAllowed')) {
    user.pairingAllowed = false; // Set pairingAllowed to false if it doesn't exist
  }

  // Each time a request is received it will change the boolean value.
  user.pairingAllowed = !user.pairingAllowed;

  // Write back to the file
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  // Return a message to indicate the current status of the pairingAllowed property
  if (user.pairingAllowed) {
    res.json({ success: true, message: `Pairing notification is turned on.` });
  } else {
    res.json({ success: true, message: `Pairing notification is turned off.` });
  }
});

module.exports = router;
