var express = require('express');
var router = express.Router();
var Article = require('../models/article')
var Category = require('../models/category')
var {body, validationResult} = require('express-validator')
var moment = require('moment-timezone')
moment.tz.setDefault('America/Bahia')
const date = moment().format('YYYY-MM-DD')

router.use(function(req, res, next) {
  if(req.session.accountID) {
    next()
  } else {
    res.redirect('/login')
  }
})

router.get('/', function(req, res) {
  console.log(moment().format('L'))
  res.render('admin/dashboard', {title:'dashboard'})
});

router.get('/post/adicionar', function (req, res, next) {
  Category.find()
      .lean()
      .exec((err, categories) => {
          if (err) { return next(err) }
          res.render('admin/post_form', { title: 'Novo post', date, categories })
      })
})

router.post('/post/adicionar', [
  body('title', 'too long').isLength({ min: 1, max: 80 }),
  body('markdown').trim().notEmpty(),
  body('category').optional({ checkFalsy: true }).isMongoId(),
  body('new_category').if((val, { req }) => !req.body.category).trim().isLength({ min: 1, max: 20 }),
  body('category_color').isHexColor(),
  body('description').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 300 }),
  body('reference').optional({ checkFalsy: true }).isURL(),
  function (req, res, next) {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
          Category.find()
              .lean()
              .exec((err, categories) => {
                  if (err) { return next(err) }
                  return res.render('admin/post_form', { title: 'Novo post', date, categories, errors: errors.array() })
              })
      } else {
          if (!req.body.category) {
              new Category({
                  name: req.body.new_category,
                  color: req.body.category_color
              }).save(function (err, cat) {
                  if (err) { return next(err) }
                  let article = new Article({
                      title: req.body.title,
                      date: +moment(),
                      markdown: req.body.markdown,
                      category: cat._id,
                  })
                  if (req.body.description) article.description = req.body.description
                  if (req.body.reference) article.reference = req.body.reference
                  article.save(function (err, post) {
                      if (err) { return next(err) }
                      return res.redirect('/blog/' + post.slug)
                  })
              })
          } else {
              let article = new Article({
                  title: req.body.title,
                  date: +moment(),
                  markdown: req.body.markdown,
                  category: req.body.category
              })
              if (req.body.description) article.description = req.body.description
              if (req.body.reference) article.reference = req.body.reference
              article.save(function (err, post) {
                  if (err) { return next(err) }
                  return res.redirect('/blog/' + post.slug)
              })
          }
      }
  }
])

module.exports = router;
