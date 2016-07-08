// Load the app configuration
var Config = require('config');

// Initialise the overlord instance
var Overlord = require('./lib/Overlord');
var overlord = new Overlord();
overlord.init();

// Listen to the worker to process any console output
overlord.on('message', function(data) {
  console.log('[' + (data.level || 'info') + '] ' + data.message);
});

// Start the web worker
overlord.startWorker('./app/web');

// Start the auction scraper
// Start the item scraper
