// Defines the data structure of the 'Portfolio' object 

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PortfolioSchema = new Schema({
    
    userId: String,
    name: String,

    initialPortfolioValue: Number,
    cash: Number,

    createdOnDate: Date,
    updatedOnDate: Date

}, {
	collection: "Portfolio"
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);