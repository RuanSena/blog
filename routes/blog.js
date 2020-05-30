var express = require('express')
var router = express.Router()
var async = require('async')
var Article = require('../models/article')
var Account = require('../models/account')
var { param, validationResult } = require('express-validator')

router.get('/', function (req, res, next) {
    async.parallel({
        owner: function (cb) {
            Account.findOne({ email: process.env.OWNER_EMAIL })
                .lean({virtuals: true})
                .exec(cb)
        },
        articles: function (cb) {
            Article.find()
                .lean({ virtuals: true })
                .sort('-date')
                .populate('category')
                .exec(cb)
        },
        archives: function (cb) {
            Article.aggregate([
                {
                    $group: {
                        _id: { month: {$month: '$date'}, year: {$year: '$date'} },
                        count: {$sum: 1}
                    }
                }
            ]).exec(cb)
        }
    }, (err, results) => {
        if (err) { return next(err) }
        console.log(results.archives)
        res.render('home', { title: 'blog', articles: results.articles, author: results.owner, archives: results.archives})
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
            .lean({ virtuals: true })
            .exec((err, article) => {
                if (err) { return next() }
                res.render('post', { title: article.title, article })
            })
    }
])

module.exports = router