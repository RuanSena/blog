var express = require('express')
var router = express.Router()
var async = require('async')
var Article = require('../models/article')
var Account = require('../models/account')
var { param, validationResult } = require('express-validator')
var moment = require('moment-timezone')
moment.tz.setDefault('America/Bahia')

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
            .exec((err, article) => {
                if (err) { return next() }
                let ip = req.ip || req.connection.remoteAddress
                for(let view of article.views) {
                    if(view.ip === ip) {
                        if(req.sessionID === view.session) {
                            // ip in same session don't save
                            return res.render('post', { title: article.title, article })
                        } else {
                            // count view
                            view.session = req.sessionID
                            view.dates.push(Date.now())
                            ip = false;
                            break;
                        }
                    }
                }
                if(ip) {
                    article.views.push({ip, session: req.sessionID, dates: [Date.now()]})
                }
                article.markModified('views')
                article.save(function(err, article) {
                    res.render('post', { title: article.title, article })
                })
            })
    }
])

module.exports = router