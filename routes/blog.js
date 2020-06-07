var express = require('express')
var router = express.Router()
var async = require('async')
var Article = require('../models/article')
var Account = require('../models/account')
var Category = require('../models/category')
var { param, query, validationResult } = require('express-validator')
var moment = require('moment-timezone')
moment.tz.setDefault('America/Bahia')
const now = moment()
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// article feed
router.get('/', [
    query('items').optional({ checkFalsy: true }).matches(/[6-8]/).toInt(),
    query('left').optional({ checkFalsy: true }).isNumeric().toInt(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next()
        }
        req.query.items = req.query.items || 6
        async.parallel({
            owner: function (cb) {
                Account.findOne({ email: process.env.OWNER_EMAIL })
                    .lean({ virtuals: true })
                    .exec(cb)
            },
            articles: function (cb) {
                Article.find()
                    .lean({ virtuals: true })
                    .sort('-date')
                    .skip(req.query.items * req.query.left)
                    .limit(req.query.items+1)
                    .populate('category')
                    .exec((err, articles) => {
                        if(err) { return cb(err) }
                        articles = articles[req.query.items] ? [articles.slice(0, req.query.items), true] : [articles, false]
                        cb(null, articles)
                    })
            },
            archives: function (cb) {
                Article.aggregate([
                    {
                        $group: {
                            _id: { month: { $month: '$date' }, year: { $year: '$date' } },
                            count: { $sum: 1 }
                        }
                    }
                ]).exec((err, archives) => {
                    if (err) { return cb(err) }
                    archives = archives.reduce((dates, group) => {
                        if (!dates[group._id.year]) dates[group._id.year] = [];
                        dates[group._id.year].unshift({ month: group._id.month, name: months[group._id.month - 1], items: group.count})
                        return dates
                    }, {})
                    cb(null, archives)
                })
            }
        }, (err, results) => {
            if (err) { return next(err) }
            res.render('home', { title: 'blog', articles: results.articles[0], author: results.owner, archives: results.archives, actual: now.year(), page: req.query.left ? req.query.left+1 : 1, more: results.articles[1] })
        })
    }
]);

// category list
router.get('/c', function (req, res, next) {
    Category.find()
        .lean()
        .exec(function (err, categories) {
            if (err) { return next() }
            async.map(categories, function (cat, cb) {
                Article.findOne({ category: cat._id })
                    .sort('-date')
                    .lean({ virtuals: true })
                    .exec((err, last) => {
                        if (err) { return cb(err) }
                        cat.last = last;
                        cb(null, cat)
                    })
            }, (err, results) => {
                if (err) { return next(err) }
                results.sort((a, b) => {
                    if (a.last && b.last) { return a.last.date > b.last.date ? -1 : 1 }
                    if (!a.last) { return 1 }
                    if (!b.last) { return -1 }
                })
                res.render('categories', { title: 'Categorias', categories: results })
            })
        })
})
// category article feed
router.get('/c/:slug', [
    param('slug').isSlug(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next(err)
        }
        Category.findOne({ slug: req.params.slug })
            .lean()
            .exec((err, cat) => {
                if (err || !cat) { return next() }
                Article.find({ category: cat._id })
                    .lean({ virtuals: true })
                    .exec((err, articles) => {
                        if (err) { return next(err) }
                        res.render('category', { title: cat.name, category: cat, articles })
                    })
            })
    }
])
// archives list route
router.get('/a', [
    query('m').optional({ checkFalsy: true }).matches(/\d{1,2}/).toInt(),
    query('y').optional({ checkFalsy: true }).matches(/\d{4}/).toInt(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next()
        }
        req.query.y = req.query.y || now.year()
        req.query.m = req.query.m || now.month() + 1;
        Article.find({
            $and: [
                { $expr: { $eq: [{ $month: "$date" }, req.query.m] } },
                { $expr: { $eq: [{ $year: "$date" }, req.query.y] } }
            ]
        })
            .lean({ virtuals: true })
            .populate('category')
            .exec((err, month) => {
                if (err) { return next(err) }
                let { m, y } = req.query
                let ref = `${months[m - 1]}/${req.query.y}`
                res.render('archives', { title: `${months[req.query.m - 1]} - ${req.query.y}`, month, ref, y })
            })
    }
])
// article read route
router.get('/:slug', [
    param('slug').isSlug(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next()
        }
        Article.findOne({ slug: req.params.slug })
            .exec((err, article) => {
                if (err || !article) { return next() }
                let ip = req.ip || req.connection.remoteAddress
                for (let view of article.views) {
                    if (view.ip === ip) {
                        if (req.sessionID === view.session) {
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
                if (ip) {
                    article.views.push({ ip, session: req.sessionID, dates: [Date.now()] })
                }
                article.markModified('views')
                article.save(function (err, article) {
                    res.render('post', { title: article.title, article })
                })
            })
    }
])

module.exports = router