// Load the app configuration
var Config = require('config');

var express = require('express');
var handlebars = require('express-handlebars');

// Initialise express
var app = express();

// Set the express template engine to use handlebars
app.engine('handlebars', handlebars({
  defaultLayout:'main'
}));
app.set('view engine', 'handlebars');

// Define web routes
app.get('/', function(request, response) {
  response.render('index', {
    message: 'Hello World'
  })
});

// Initialise the server
var server = app.listen(Config.get('web.port'), function() {
  console.log('Web access enabled on port ' + server.address().port);
})
