var express = require('express');
var router = express.Router();
var {body, validationResult} = require('express-validator')
var Account = require('../models/account')

router.get('/', function(req, res, next) {
  if(req.account) {
    res.redirect('/admin/dashboard')
    return
  }
  res.render('login', {title: 'log in', sId: req.sessionID})
});
router.post('/', [
  body('email', 'invalid').isEmail(),
  body('password', 'too short').isAscii().isLength({min: 6}),
  function(req, res, next) {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
      res.render('login', {title: 'log in', email: req.body.email, errors: errors.array()})
    }
    Account.findOne({email: req.body.email})
    .exec((err, acc) => {
      if(err) {
        return next(err)
      }
      if(acc === null) {
        res.render('login', {title: 'log in', errors: [{param: 'email', msg: 'not registered'}]})
        return
      }
      if(acc.password === req.body.password) {
        req.session.accountID = acc._id;
        res.redirect('/admin/dashboard')
      } else {
        res.render('login', {title: 'log in', email: req.body.email, errors: [{param: 'password', msg: 'incorrect'}]})
      }
    })
  }
])

router.get('/dashboard', function(req, res, next) {
  if(req.session.accountID) {
    res.render('dashboard', {title:'dashboard'})
  } else {
    return next()
  }
})

module.exports = router;
