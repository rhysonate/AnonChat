const express = require('express');
const router = express.Router();
const axios = require('axios');
require('../customLogger');


router.post('/', async (req, res) => {
  const { uid, url } = req.body;

  const data = {
    uid: uid,
    message: `Test msg from AnonChat server`,
  };

  // Send the message to the agent's URL
  axios
    .post(`${url}/sendToUser`, data)
    .then((response) => {
      console.log(`----------------------------------------`);
      console.log(`Test message sent to: ${url}`);
      console.log(`----------------------------------------`);

      res.json({ success: true, message: `This agent URL is working fine` });
    })
    .catch((error) => {
      console.error(`Failed to send test message to: ${url}`, error);
      res.json({ success: false, message: `Failed to send test message to: ${url}` });
    });
});

module.exports = router;