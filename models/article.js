var mongoose = require('mongoose')
var Schema = mongoose.Schema

const articleSchema = new Schema({
    title: {type: String, maxlength: 100},
    date: {type: Date, default: Date.now},
    category: [{type: Schema.Types.ObjectId, ref: 'Category', required: true}],
    content: {type: String, required: true},
})

module.exports = mongoose.model('Article', articleSchema)