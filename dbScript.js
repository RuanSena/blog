require('dotenv').config()
var mongoose = require('mongoose')

console.log('This script creates an admin account to your "test" database. Specified database uri in .env file - e.g.: MONGODB_URL=populatedb mongodb+srv://cooluser:coolpassword@cluster0-mbdj7.mongodb.net/test?retryWrites=true');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

var async = require('async')
var Account = require('./models/account')
var Category = require('./models/category')

var accounts = []
var categories = []

function createAcc(name='', surname='', email='', password='', cb) {
    let acc = {name, email, password}
    if(surname) acc.surname = surname;

    let account = new Account(acc)
    account.save(function(err) {
        if(err) { cb(err); return }
        console.log('new account: '+acc.email)
        accounts.push(account)
        cb(null, account)
    })
}
function createCat(name='', hex='', cb) {
    let cat = {
        name,
    }
    if(hex) cat.color = hex;
    let category = new Category(cat)
    category.save(function(err) {
        if(err) { cb(err); return }
        console.log('new category: '+category.name)
        categories.push(category)
        cb(null, category)
    })
}

function createAccounts(cb) {
    async.parallel([
        function(callback) {
            createAcc('Example', null, 'email@domain.com', 'catpass', callback)
        },
        function(callback) {
            createAcc('Secondary', 'Example', 'email2@domain.com', 'catpass', callback)
        }
    ], cb)
}
function createCategories(cb) {
    async.parallel([
        function(callback) {
            createCat('Code', '#581845', callback)
        },
        function(callback) {
            createCat('Design', '#48C9B0', callback)
        },
        function(callback) {
            createCat('Hobby', '#DAF7A6', callback)
        },
        function(callback) {
            createCat('Random', null, callback)
        },
    ], cb)
}

async.series([
    createAccounts,
    createCategories
], function(err, results) {
    if(err) {
        console.log('FINAL ERR: '+err)
    } else {
        console.log('Categories: '+categories )
    }
    mongoose.connection.close()
})