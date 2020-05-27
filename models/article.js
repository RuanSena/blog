var mongoose = require('mongoose')
var {JSDOM} = require('jsdom')
var purify = require('dompurify')
var marked = require('marked')
var slugify = require('slug')
var Schema = mongoose.Schema

const articleSchema = new Schema({
    title: {type: String, maxlength: 80},
    date: {type: Date, default: Date.now},
    markdown: {type: String, required: true},
    description: {type: String},
    category: [{type: Schema.Types.ObjectId, ref: 'Category', required: true}],
    collection: {type: Schema.Types.ObjectId, ref: 'Collection'},
    slug:{type: String, required: true, unique: true},
    content: {type: String, required: true}
})

articleSchema.pre('validate', function(next) {
    if(this.title) {
        this.slug = slugify(this.title, {replacement: '_', remove: /[.]/g})
    }
    let dom = purify(new JSDOM().window)
    this.content = dom.sanitize(marked(this.markdown))
    next()
})

module.exports = mongoose.model('Article', articleSchema)