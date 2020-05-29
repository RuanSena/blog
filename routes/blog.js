var express = require('express')
var router = express.Router()
var Article = require('../models/article')
var { param, validationResult } = require('express-validator')
var moment = require('moment-timezone')
moment.tz.setDefault('America/Bahia')

router.get('/', function (req, res, next) {
    res.render('home', { title: 'blog' });
});

router.get('/:slug', [
    param('slug').isSlug(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next()
        }
        Article.findOne({ slug: req.params.slug })
            .lean()
            .exec((err, article) => {
                if (err) { return next() }
                article.date = moment(article.date).format('DD/MM/YYYY')
                res.render('post', { title: article.title, article })
            })
    }
])

module.exports = router