var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cradle = require('cradle');
//var riemman = require('riemman');
//var fs = require('fs');

var conn = new(cradle.Connection)('http://nibbed.io', 5984, {
  auth: { username: '', password: '' }
});
var db = conn.database('primero_tracing_request_production');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// couchdb
db.exists(function (err, exists) {
if (err) {
  console.log('error', err);
} else if (exists) {
  console.log('the force is with you.');
} else {
  console.log('database does not exist.');
}
});

//riemman
var client = require('riemann').createClient({
  host: '',
  port: 5555
});

client.on('connect', function() {
  console.log('connected!');
});


db.get('_changes', function (err, doc) {
      console.log(doc);
  });

var feed = db.changes({ since: 1 });

feed.on('change', function (change) {
      console.log(change);
      client.send(client.Event({
        service: 'primeromc.primero.production.tracing.creation',
        metric:  1,
        tags:    ['Tracing Request']
                             }), client.tcp);
  });



/// error handlers

process.on('uncaughtException', function (err) {
    console.log(err);
})

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});




module.exports = app;
