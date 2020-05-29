var express = require('express')
var router = express.Router()
var Article = require('../models/article')
var { param, validationResult } = require('express-validator')

router.get('/', function (req, res, next) {
    Article.find()
    .lean({virtuals: true})
    .sort('-date')
    .populate('category')
    .exec((err, articles) => {
        if(err) { return next(err) }
        res.render('home', { title: 'blog', articles});
    })
});

router.get('/:slug', [
    param('slug').isSlug(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next()
        }
        Article.findOne({ slug: req.params.slug })
            .lean({virtuals: true})
            .exec((err, article) => {
                if (err) { return next() }
                res.render('post', { title: article.title, article })
            })
    }
])

module.exports = router