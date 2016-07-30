// Defines the data structure of the 'User' object 

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    
    username: String,
    deviceId: String,
    password: String,
    email: String,

    admin: Boolean,

    createdOnDate: Date,
    updatedOnDate: Date

}, {
	collection: "User"
});

module.exports = mongoose.model('User', UserSchema);