// Defines the data structure of the 'StockTicker' object 

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StockTickerSchema = new Schema({
    
    symbol: String,
    name: String,
    sector: String,
    exchange: String,
    searchable: String

}, {
	collection: "StockTicker"
});

module.exports = mongoose.model('StockTicker', StockTickerSchema);