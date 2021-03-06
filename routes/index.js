var express = require('express');
var router = express.Router();
var {body, validationResult} = require('express-validator')
var Account = require('../models/account')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/blog')
});

router.get('/login', function(req, res, next) {
  if(req.session.accountID) {
    res.redirect('/admin')
  } else {
    res.render('login', {title: 'log in'})
  }
})
router.post('/login', [
  body('email', 'invalid').isEmail(),
  body('password', 'too short').isAscii().isLength({min: 6}),
  function(req, res, next) {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
      res.render('login', {title: 'log in', email: req.body.email, errors: errors.array()})
    } else {
      Account.findOne({email: req.body.email})
      .exec((err, acc) => {
        if(err) {
          return next(err)
        }
        if(acc === null) {
          res.render('login', {title: 'log in', errors: [{param: 'email', msg: 'not registered'}]})
          return;
        }
        if(acc.password === req.body.password) {
          req.session.accountID = acc._id;
          return res.redirect(req.session.referrer || '/admin')
        } else {
          res.render('login', {title: 'log in', email: req.body.email, errors: [{param: 'password', msg: 'incorrect'}]})
        }
      })
    }
  }
])
router.get('/logout', function(req, res, next) {
  if(req.session.accountID) {
    delete req.session.accountID;
    res.redirect('back')
  } else {
    res.redirect('back')
  }
})

module.exports = router;