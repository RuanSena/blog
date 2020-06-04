var mongoose = require('mongoose')
var Schema = mongoose.Schema
var slugify = require('slug')

const catSchema = new Schema({
    name: {type: String, required: true, maxlength: 20, match: /^\w+$/, unique: true},
    description: {type: String, maxlength: 200},
    color: {type: String, default: '#FFFFFF', match: /^#(?:[0-9a-fA-F]{6}){1}$/},
    slug: {type: String, required: true}
})

catSchema.pre('validate', function(next) {
    this.slug = slugify(this.name, {remove: /[.]/g})
    next()
})

module.exports = mongoose.model('Category', catSchema)