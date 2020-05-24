var mongoose = require('mongoose')
var Schema = mongoose.Schema

const adminSchema = new Schema({
    name: {type: String, required: true},
    surname: {type: String},
    email: {type: String, required: true},
    password: {type: String, required: true, minlength: 6}
})

module.exports = mongoose.model('Account', adminSchema)