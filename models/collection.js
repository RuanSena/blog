var mongoose = require('mongoose')
var Schema = mongoose.Schema

const collectionSchema = new Schema({
    label: {type: String, required: true, unique: true},
    referral: {type: String},
    articles: [{type: Schema.Types.ObjectId, ref: 'Article', required: true}]
})

module.exports = mongoose.model('Collection', collectionSchema)