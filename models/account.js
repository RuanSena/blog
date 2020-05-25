var mongoose = require('mongoose')
var Schema = mongoose.Schema

const adminSchema = new Schema({
    name: {type: String, required: true, minlength: 3},
    surname: {type: String, minlength: 3},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 6}
})

module.exports = mongoose.model('Account', adminSchema)