require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var session = require('express-session')
var mongoose = require('mongoose')
var logger = require('morgan');
var path = require('path');
var Account = require('./models/account');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/login');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true , useCreateIndex: true})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true}));
app.use(express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  if(req.session.accountID) {
    Account.findById(req.session.accountID).exec((err, acc) => {
      if (err) {
        delete req.session.accountID;
        next();
      }
      req.account = acc;
      next()
    })
  } else {
    next()
  }
})

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
