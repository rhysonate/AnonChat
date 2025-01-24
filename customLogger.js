// customLogger.js
const axios = require('axios');

const originalConsoleLog = console.log;

console.log = function() {
  // Convert arguments object to an array
  const message = Array.from(arguments).join(' ');

  // Post to your logging server
  axios.post('https://anonchat-logs.xaviabot.repl.co/log', { message })
    .catch((error) => originalConsoleLog('Logging error:', error));

  // Still print to the console if needed
  originalConsoleLog.apply(console, arguments);
};
