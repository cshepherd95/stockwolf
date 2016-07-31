// Defines the data structure of the 'Portfolio Position' object 

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PortfolioPositionSchema = new Schema({
    
    portfolioId: String,

	companyName: String,
    ticker: String,
    numberOfShares: Number,
    purchasePrice: Number,
    
    dateOrderPlaced: Date,

}, {
	collection: "PortfolioPosition"
});

module.exports = mongoose.model('PortfolioPosition', PortfolioPositionSchema);