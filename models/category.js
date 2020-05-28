var mongoose = require('mongoose')
var Schema = mongoose.Schema

const catSchema = new Schema({
    name: {type: String, required: true, maxlength: 20, match: /^\w+$/, unique: true},
    color: {type: String, default: '#FFFFFF', match: /^#(?:[0-9a-fA-F]{6}){1}$/}
})

module.exports = mongoose.model('Category', catSchema)