var express = require('express');
var router = express.Router();
var {body, validationResult} = require('express-validator')

router.get('/', function(req, res, next) {
  if(req.session.admin) {
    res.redirect('/admin/dashboard')
  }
  res.render('login', {title: 'log in', sId: req.sessionID})
});
router.post('/', [
  body('email', 'invalid').isEmail(),
  body('password', 'too short').isAscii().isLength({min: 5}),
  function(req, res, next) {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
      res.render('login', {title: 'log in', email: req.body.email, errors: errors.array()})
    }
    if(req.body.email === 'ruansenadev@gmail.com' && req.body.password === 'admin') {
      req.session.admin = true
      res.redirect('/admin/dashboard')
      // redirect
    } else if(req.body.email === 'ruansenadev@gmail.com') {
      res.render('login', {title: 'log in', email: req.body.email, errors: [{param: 'password', msg: 'incorrect'}]})
    } else {
      res.render('login', {title: 'log in', errors: [{param: 'email', msg: 'not registered'}]})
    }
  }
])

router.get('/dashboard', function(req, res, next) {
  if(!req.session.admin) {
    return next()
  } else {
    res.render('dashboard', {title:'dashboard'})
  }
})

module.exports = router;
