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
const editSchema = new Schema({
    date: {type: Date, default: Date.now},
    author: {type: Schema.Types.ObjectId, ref: 'Account'}
})

const articleSchema = new Schema({
    title: {type: String, maxlength: 80, required: true},
    publish: {type: Date, default: Date.now},
    author: {type: Schema.Types.ObjectId, ref: 'Account', required: true},
    markdown: {type: String, required: true},
    description: {type: String, maxlength: 300},
    reference: {type: String},
    category: {type: Schema.Types.ObjectId, ref: 'Category', required: true},
    edits: [editSchema],
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

articleSchema.virtual('lastedit')
.get(function(){
    let value = moment(this.edits[this.edits.length-1])
    return {value, fromNow: value.fromNow(), formated: value.format('L')}
})
articleSchema.virtual('datetime')
.get(function(){
    let value = moment(this.publish)
    return { value, fromNow: value.fromNow(), formated: value.format('L') }
})

articleSchema.plugin(lean_virtuals)

module.exports = mongoose.model('Article', articleSchema)