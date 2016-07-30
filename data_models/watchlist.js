// Defines the data structure of the 'Watchlist' object 

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WatchlistSchema = new Schema({
    
    userId: String,

    name: String,
    listOfStockNames: [String],

    createdOnDate: Date,
    updatedOnDate: Date

}, {
	collection: "Watchlist"
});

module.exports = mongoose.model('Watchlist', WatchlistSchema);