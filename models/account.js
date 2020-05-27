var mongoose = require('mongoose')
var Schema = mongoose.Schema
var md5 = require('md5')

const adminSchema = new Schema({
    name: {type: String, required: true, minlength: 3},
    surname: {type: String, minlength: 3},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 6}
})

adminSchema
.virtual('full_name').get(function(){
    return this.surname ? `${this.name} ${this.surname}` : this.name
})
adminSchema
.virtual('gravatar').get(function(){
    // default retro gravatar and 80px square
    return `https://www.gravatar.com/avatar/${md5(this.email.toLowerCase())}?d=retro`
})

module.exports = mongoose.model('Account', adminSchema)