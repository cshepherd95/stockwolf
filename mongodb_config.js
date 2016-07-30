var databaseUsername = 'admin';
var databasePassword = 'password';

var databaseString = 'mongodb://' + databaseUsername + ':' + databasePassword + '@ds019678.mlab.com:19678/stockwolf'

module.exports = {

    'database': databaseString

};