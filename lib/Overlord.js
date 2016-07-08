var util = require('util');
var child = require('child_process');
var EventEmitter = require('events').EventEmitter;

function Overlord() {
  // Call the parent constructor
  EventEmitter.call(this);

  this.workers = [];
  this.timers = [];
}

// Declare that we're using EventEmitter as the prototype
util.inherits(Overlord, EventEmitter);

Overlord.prototype.init = function() {
  // Register some basic handlers on the parent process
  process.on('close', function(code, signal) {
    this.emit('message', {
      message: 'Closing application due to ' + signal
    });
  }.bind(this));

  // Exit
  process.on('exit', function() {
    this.emit('message', {
      message: 'Exiting application'
    });

    // Clear all timers and workers
    this.clearWorkers();
    this.clearTimers();
  }.bind(this));
};

/**
 * Start a new child process to act as a worker.
 * @param  {string} module The module to run in the new process.
 * @param  {object} data   Any data to send to the process once it has been setup.
 */
Overlord.prototype.startWorker = function(module, data) {
  // Initialise the new process
  var worker = child.fork(module);
  this.addWorker(worker);

  // Check to see if we have any data to send to the new process
  if (data && worker.send) {
    worker.send(data);
  }

  // Proxy any messages from the process up the chain
  worker.on('message', function() {
    this.emit('message', arguments);
  }.bind(this));

  this.emit('message', {
    level: 'debug',
    message: 'Forking ' + module + ' #' + worker.pid,
    pid: worker.pid
  });

  return worker;
};

/**
 * Start a new worker to be executed using a timed delay.
 * @param  {integer} delay The delay required before executing the worker again.
 * @param  {string} module The module to run in the new process.
 * @param  {object} data   Any data to send to the process once it has been setup.
 */
Overlord.prototype.startTimedWorker = function (delay, module, data) {
  // Create the timer and add it to overlord
  var timer = this.addTimer(delay, function() {
    this.startWorker(module, data);
  }.bind(this));

  return timer;
};

Overlord.prototype.addWorker = function(worker) {
  // Add the worker to the collection
  this.workers.push(worker);
  this.emit('message', {
    level: 'debug',
    message: 'Adding worker #' + worker.pid,
    pid: worker.pid
  });

  // Handle removing the worker on process exit
  worker.on('exit', function(code, signal) {
    // Re-find the index of the worker process
    this.removeWorker(worker);
  }.bind(this));
};

Overlord.prototype.clearWorkers = function() {
  // Clear up any child processes
  for (var i = 0; i < this.workers.length; i++) {
    // Kill and remove the worker
    this.killWorker(i);
  }
};

Overlord.prototype.removeWorker = function (worker) {
  var index = this.workers.indexOf(worker);

  // Ensure the worker exists
  if (index > -1) {
    this.workers.splice(index, 1);
    return true;
  }

   return false;
};

Overlord.prototype.killWorker = function(index) {
  // Ensure the id exists
  if (typeof this.workers[index] !== 'undefined') {
    this.emit('message', {
      level: 'debug',
      message: 'Killing worker #' + this.workers[index].pid,
      pid: this.workers[index].pid
    });

    this.workers[index].kill();

    // Remove the worker from the list of active workers
    this.removeWorker(this.workers[index]);

    return true;
  }

  return false;
};

Overlord.prototype.addTimer = function(callback, delay) {
  // Create and add the timer object
  var timer = setInterval(callback, delay);
  this.timers.push(timer);

  return timer;
};

Overlord.prototype.clearTimers = function() {
  // Clear up any timers
  for (var i = 0; i < this.timers.length; i++) {
    this.emit('message', {
      level: 'debug',
      message: 'Removing timer'
    });
    this.stopTimer(i);
  }
};

Overlord.prototype.removeTimer = function (timer) {
  var index = this.timers.indexOf(timer);

  // Ensure the worker exists
  if (index > -1) {
    this.timers.splice(index, 1);

    return true;
  }

   return false;
};

Overlord.prototype.stopTimer = function(index) {
  if (typeof this.timers[index] !== 'undefined') {
    clearInterval(this.timers[index]);

    // Remove the timer from the list of active timers
    this.removeTimer(this.timers[index]);

    return true;
  }

  return false;
};

module.exports = Overlord;
