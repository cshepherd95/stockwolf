// Defines the data structure of the 'Order' object 

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OrderSchema = new Schema({
    
    portfolioId: String,

	companyName: String,
    ticker: String,
    numberOfShares: Number,
    purchasePrice: Number,
    
    orderType: String,

    dateOrderPlaced: Date,

}, {
	collection: "Order"
});

module.exports = mongoose.model('Order', OrderSchema);