var mongoose = require('mongoose')
var lean_virtuals = require('mongoose-lean-virtuals')
var {JSDOM} = require('jsdom')
var purify = require('dompurify')
var marked = require('marked')
var slugify = require('slug')
var moment = require('moment-timezone')
moment.tz.setDefault('America/Bahia')
moment.locale('pt-br')
var Schema = mongoose.Schema

const viewSchema = new Schema({
    ip: {type: String, unique: true},
    session: {type: String},
    dates: [{type: Date, default: Date.now}]
})

const articleSchema = new Schema({
    title: {type: String, maxlength: 80, required: true},
    date: {type: Date, default: Date.now},
    markdown: {type: String, required: true},
    description: {type: String, maxlength: 300},
    reference: {type: String},
    category: {type: Schema.Types.ObjectId, ref: 'Category', required: true},
    slug:{type: String, required: true, unique: true},
    content: {type: String, required: true},
    views: [viewSchema]
}, {typePojoToMixed: false})

articleSchema.pre('validate', function(next) {
    this.slug = slugify(this.title, {remove: /[.]/g})
    let dom = purify(new JSDOM().window)
    this.content = dom.sanitize(marked(this.markdown))
    next()
})

articleSchema.virtual('datetime')
.get(function(){
    let value = moment(this.date)
    return { value, fromNow: value.fromNow() }
})

articleSchema.plugin(lean_virtuals)

module.exports = mongoose.model('Article', articleSchema)