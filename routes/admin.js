var express = require('express');
var router = express.Router();
var Article = require('../models/article')
var Category = require('../models/category')
var { body, param, validationResult } = require('express-validator')
var moment = require('moment-timezone')
moment.tz.setDefault('America/Bahia')
var now = moment()
const date = now.format('YYYY-MM-DD')

router.use(function (req, res, next) {
    if (req.session.accountID) {
        // when logged check path for not saving
        if (req.session.referrer) delete req.session.referrer
        next()
    } else {
        // only saves ref path if log in
        req.session.referrer = req.originalUrl
        res.redirect('/login')
    }
})

router.get('/', function (req, res, next) {
    res.render('admin/dashboard', { title: 'Dashboard' })
});
// blog data json
router.get('/p', [
    function (req, res, next) {
        const intervals = {
            day: now.subtract(1, 'day').toDate(),
            week: now.subtract(1, 'week').toDate(),
            month: now.subtract(1, 'month').toDate()
        }
        Article.aggregate([
            { $unwind: "$views" },
            {
                $match: {
                    "views.date": { $gte: intervals.month }
                }
            },
            {
                $group: {
                    _id: "views",
                    "day": {
                        $push: {
                            $cond: {
                                if: { $gte: ["$views.date", intervals.day] },
                                then: {article: "$_id", date: "$views.date"},
                                else: null
                            }
                        }
                    },
                    "week": {
                        $push: {
                            $cond: {
                                if: { $gte: ["$views.date", intervals.week] },
                                then: {article: "$_id", date: "$views.date"},
                                else: null
                            }
                        }
                    },
                    "month": {
                        $push: {article: "$_id", date: "$views.date"}
                    }
                }
            }
        ])
            .exec((err, views) => {
                if (err) { return next(err) }
                res.send(views)
            })
    }
])

router.get('/p/new', function (req, res, next) {
    Category.find()
        .lean()
        .exec((err, categories) => {
            if (err) { return next(err) }
            res.render('admin/post_create', { title: 'Novo post', date, categories })
        })
})
router.post('/p/new', [
    body('author').isMongoId(),
    body('title', 'too long').isLength({ min: 1, max: 80 }),
    body('markdown').trim().notEmpty(),
    body('category').optional({ checkFalsy: true }).isMongoId(),
    body('new_category').if((val, { req }) => !req.body.category).trim().isLength({ min: 1, max: 20 }),
    body('category_description').if((val, { req }) => !req.body.category).trim().escape().isLength({ min: 1, max: 200 }),
    body('category_color').isHexColor(),
    body('description').optional({ checkFalsy: true }).trim().escape().isLength({ min: 1, max: 300 }),
    body('reference').optional({ checkFalsy: true }).isURL(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            Category.find()
                .lean()
                .exec((err, categories) => {
                    if (err) { return next(err) }
                    return res.render('admin/post_create', { title: 'Novo post', date, categories, errors: errors.array() })
                })
        } else {
            if (!req.body.category) {
                new Category({
                    name: req.body.new_category,
                    description: req.body.category_description,
                    color: req.body.category_color
                }).save(function (err, cat) {
                    if (err) { return next(err) }
                    let article = new Article({
                        title: req.body.title,
                        date: +moment(),
                        author: req.body.author,
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
                    author: req.body.author,
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

router.get('/p/:id', [
    param('id').isMongoId(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next()
        }
        Article.findById(req.params.id)
            .populate('category')
            .lean({ virtuals: true })
            .exec((err, post) => {
                if (err) { return next(err) }
                res.render('admin/post_update', { title: `Editar ${post.title}`, article: post })
            })
    }
])
router.post('/p/:id', [
    param('id').isMongoId(),
    body('author').isMongoId(),
    body('title', 'too long').isLength({ min: 1, max: 80 }),
    body('markdown').trim().notEmpty(),
    body('description').optional({ checkFalsy: true }).trim().escape().isLength({ min: 1, max: 300 }),
    body('reference').optional({ checkFalsy: true }).isURL(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            Article.findById(req.params.id)
                .lean({ virtuals: true })
                .exec((err, post) => {
                    if (err) { return next(err) }
                    res.render('admin/post_update', { title: `Editar ${post.title}`, article: post, errors: errors.array() })
                    return
                })
        }
        Article.findById(req.params.id, (err, article) => {
            if (err) { return next() }
            article._id = req.params.id
            article.title = req.body.title
            article.markdown = req.body.markdown
            article.description = req.body.description
            article.reference = req.body.reference
            article.edits.push({ author: req.body.author })
            article.markModified('edits')
            article.save({ validateBeforeSave: true }, (err, post) => {
                if (err) { return next(err) }
                res.redirect('/blog/' + post.slug)
            })
        })
    }
])
router.get('/p/:id/del', [
    param('id').isMongoId(),
    function (req, res, next) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return next()
        }
        Article.findById(req.params.id)
            .lean({ virtuals: true })
            .populate({ path: 'edits.author', model: 'Account' })
            .exec((err, post) => {
                if (err) { return next(err) }
                res.render('admin/post_delete', { title: `Deletar ${post.title}`, article: post })
            })
    }
])

module.exports = router;