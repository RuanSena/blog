var express = require('express')
var router = express.Router()
var Article = require('../models/article')
var Category = require('../models/category')
var {body, validationResult} = require('express-validator')
var moment = require('moment-timezone')
moment.tz.setDefault('America/Bahia')
const date = moment().format('YYYY-MM-DD')

// router.get('/:slug', [
//     check('slug').isSlug(),
//     function(req, res, next) {
//         const errors = validationResult(req)
//         if(!errors.isEmpty()) {
//             return next()
//         }
//         Article.findOne({slug: req.params.slug})
//         .exec((err, article) => {
//             if(err) {
//                 return next()
//             }
//             res.render('post')
//         })
//     }
// ])
router.get('/adicionar', function(req, res, next) {
    Category.find()
    .exec((err, categories) => {
        if(err) {return next(err)}
        res.render('post_form', {title: 'Novo post', date, categories})
    })
})
router.post('/adicionar', [
    body('title', 'too long').isLength({max:80}).notEmpty(),
    body('date').isISO8601({strict: true}).notEmpty(),
    body('markdown').isAscii().notEmpty(),
    body('category').if((val, {req} )=> req.body.category).isAlphanumeric().isLength({max:20}),
    body('new_category').if((val, {req} )=> !req.body.category).isAlphanumeric().isLength({max:20}),
    body('category_color').isHexColor(),
    body('description').if((val, {req} )=> req.body.description).isAscii().isLength({max:300}),
    body('reference').if((val, {req} )=> req.body.reference).isURL(),
    function(req, res, next) {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            Category.find()
            .exec((err, categories) => {
                if(err) {return next(err)}
                return res.render('post_form', {title: 'Novo post', date, categories, errors: errors.array()})
            })
        } else {
            if(!req.body.category) {
                console.log('Nova categoria: '+ req.body.new_category)
                res.send('validado com nova categoria')
            } else {
                res.send('validado')
            }
        }
    }
])
module.exports = router