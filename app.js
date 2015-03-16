'use strict';

// Transpile all ES6 to ES5
require("babel/register");

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Cookies = require('cookies');
var uuid = require('uuid');
var bookshelf = require('./app/config/bookshelf');
var ssr = require('./app/ssr/render');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/views/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/public/build')));

app.use(function(req,res,next){
   req.db = bookshelf;
   next();
});

// All paths go through this, routes determined by react
app.use('*', function (req, res) {
   var cookies = new Cookies(req, res);
   var token = cookies.get('token') || uuid();
   cookies.set('token', token, {maxAge: 30 * 24 * 60 * 60});
   ssr(req, token, function (error, html, clientToken) {
      if (!error) {
         res.render('layout', {data: JSON.stringify(clientToken), html: html});
      }else{
         res.render('error', {data: JSON.stringify(clientToken), html: html});
      }
   });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

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