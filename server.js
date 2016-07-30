// ******** FRAMEWORK SETUP ******** //
// Call the packages we need & setup the app

// Main Node JS framework
var express = require('express');
var app = express();

// Configure app to use bodyParser()
// this will let us get the data from a POST
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Allows the application to to use promises
var Promise = require("bluebird");

// Gets our config file to allow login to the mlab database
var config = require('./mongodb_config'); 

// Connects the server to the mlab database
var mongoose = require('mongoose');
mongoose.connect(config.database);

// Pulls in details of the database's data structure
var User = require('./data_models/user'); // Allows server to work with the User object
var Watchlist = require('./data_models/watchlist'); // Allows server to work with the Watchlist object
var StockTicker = require('./data_models/stockticker'); // Allows server to work with the STockTicker object

// Allows application to request JSON data from the web
var request = require("request");

// Sets the port for the app and notifies that it is running
app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('API request received: ');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/)
router.get('/', function(req, res) {
    res.json({ message: 'Welcome to the StockWolf api!' });   
});


/***********************************************************************************/
/************************************ User data ************************************/
/***********************************************************************************/

// Allows the server to interact with the User model
router.route('/users')

  // Create a user 
  .post(function(req, res) {
    
    // Make sure the request to create user includes at least an email or a deviceId
    if (req.body.deviceId == null && req.body.email == null) {

      console.log("Request to create user rejected - (no id or email provided)")

      res.send({ error: 'Either a device id or an email is required'});

    } else { // Continues on to create user if minimum requirements met

      var user = new User();      // Create a new instance of the User model

      // Sets the username if one is provided
      if (req.body.username == null) {
        
        console.log("No username provided");

      } else {

        console.log("Username set as: " + req.body.username);
        user.username = req.body.username;  // Set the user's name (comes from the request)
      }

      // Sets the devicedID if one is provided
      if (req.body.deviceId == null) {

        console.log("No deviceId provided");
        user.deviceId = req.body.deviceId;

      } else {

        console.log("Device Id set as: " + req.body.deviceId);
        user.deviceId = req.body.deviceId;  // Set the User's device Id (comes from the request)
      }

      // Sets the password if one is provided
      if (req.body.password == null) {

        console.log("No password provided, temporary password set");
        user.password = "password";

      } else {

        console.log("Password set as: ");
        user.password = req.body.password;  // Set the User's device Id (comes from the request)
      }

      // Sets the User's email if one is provided
      if (req.body.password == null) {

        console.log("No email provided");

      } else {

        console.log("Password set as: ");
        user.email = req.body.email;  // Set the User's device Id (comes from the request)
      }

      // Sets the date that the user was created 
      var date = Date();
      user.createdOnDate = date;

      // Makes sure the user doesn't have admin privaledges
      user.admin = false;

      console.log(user)
      
      // save the user and check for errors
      user.save(function(err) {
          if (err)
              res.send(err);

          res.json({ message: 'User created!' });
      })
    }
  })

  // Returns all users
  .get(function(req, res) {

    User.find(function(err, users) {
      if (err)
        res.send(err);

      console.log('- Returned all users');

      res.json(users);
    });
  });

// Allows the server to work with an individual user
router.route('/users/:user_id')

  // Returns a single user
  .get(function(req, res) {

    User.findById(req.params.user_id, function(err, users) {
      if (err)
        res.send(err);

      console.log('- Returned a single user');

      res.json(users);
    });
  });

/***********************************************************************************/
/********************************** Watchlist data *********************************/
/***********************************************************************************/

// Allows the server to create and return Watchlists
router.route('/watchlist')

  // Create a watchlist for a specific user
  .post(function(req, res) {

    // The id of the User whos watchlist we want to find
    userId = req.body.userId;

    // The name of the Watchlist
    var watchlistName = req.body.watchlistName;

    // Sends a request to create a new watchlist that is associated with the userId given
    createWatchlist(userId, watchlistName).then(function(response) {

      console.log("- New Watchlist created")

      res.json(response);
    });
  })

  // Returns all Watchlists for every user
  .get(function(req, res) {

    Watchlist.find(function(err, watchlists) {
      if (err)
        res.send(err);

      console.log('- Returned all Watchlists');

      res.json(watchlists);
    });
  });

// Allows server to work with a specific Watchlist
router.route('/watchlist/:watchlist_id')

  // Returns a single watchlist matching the given id
  .get(function(req, res) {

    Watchlist.findById(req.params.watchlist_id, function(err, watchlist) {
      if (err)
        res.send(err);

      console.log('- Returned a single watchlist');

      res.json(watchlist);
    });
  })

  // Update the Watchlist with this id
  .put(function(req, res) {

    // use our Watchlist model to find the Watchlist we want
    Watchlist.findById(req.params.watchlist_id, function(err, watchlist) {

      if (err)
        res.send(err);

      // Updating the watchlist's name
      if (req.body.name != null) 
        watchlist.name = req.body.name;

      // Updating the watchlist's list of stocks
      if (req.body.listOfStockNames != null)
        watchlist.listOfStockNames = req.body.listOfStockNames; 

      // Sets the date that the watchlist was updated 
      var date = Date();
      watchlist.updatedOnDate = date;

      // Save the Watchlist
      watchlist.save(function(err) {
          if (err)
              res.send(err);

            console.log("- Watchlist updated");

          res.json({ message: 'Watchlist updated!' });
      });
    });
  });

// Allows server to work with the Watchlists associated with a single user
router.route('/watchlist/user/:user_id')

  // Returns all the watchlists associated with a single user
  .get(function(req, res) {

    // Sets up the paramaters for which watchlist the database should return
    var query = Watchlist.find({ 'userId': req.params.user_id });

    // execute the query at a later time
    query.exec(function (err, watchlist) {
      if (err)
        res.send(err);

      console.log('- Returned a single watchlist');

      res.json(watchlist);
    })
  });



/************************************************************************************/
/************************************ Stock data ************************************/
/************************************************************************************/

// Returns the current data for the world stock markets
router.route('/markets')

    .get(function(req, res) {

      // Most of the most closely followed indexes in the world (notably missing Dow Jones)
      var marketIndexTickers = ["^GSPC", "^IXIC", "^NYA", "^RUT", "^FTSE", "^GDAXI", "^FCHI", "^N225", "^HSI"]

      // Calls external API to get stock data
      getStockPortfolioData(marketIndexTickers).then(function(portfolioData) {

        console.log('- Returned Market Data');

        // Returns market data in JSON format to client
        res.json(portfolioData);
      });
    });

// Returns the current data for a single stock
router.route('/stocks/:stock_ticker')

    .get(function(req, res) {

      // Calls external API to get stock data
    	getStockDataForSingleStock(req.params.stock_ticker).then(function(stockData) {

        console.log('- Returned Single Stock Data');

        // Returns stock data in JSON format to client
	  		res.json(stockData);
  		});
    });

// Returns the current detailed data for a single stock
router.route('/stocks-detailed/:stock_ticker')

    .get(function(req, res) {

      // Calls external API to get stock data
      getDetailedStockDataForSingleStock(req.params.stock_ticker).then(function(stockData) {

        console.log('- Returned Singe Stock Data (Detailed)');

        // Returns stock data in JSON format to client
        res.json(stockData);
      });
    });

// Returns the current data for multiple stocks
router.route('/stockportfolio')

    .post(function(req, res) {

      // Gets the tickers of the stocks that need to be returned
      var arrayOfStockNames = req.body.arrayOfStockNames;

      // Calls external API to get stock data
      getStockPortfolioData(arrayOfStockNames).then(function(portfolioData) {

        console.log('- Returned Stock Portfolio Data');

        // Returns portfolio data in JSON format to client
        res.json(portfolioData);
      });
    })

// Returns the current detailed data for multiple stocks
router.route('/stockportfolio-detailed')

    .post(function(req, res) {
                  
      // Gets the tickers of the stocks that need to be returned
      var arrayOfStockNames = req.body.arrayOfStockNames;

      // Calls external API to get stock data
      getDetailedStockPortfolioData(arrayOfStockNames).then(function(portfolioData) {

        console.log('- Returned Stock Portfolio Data');

        // Returns portfolio data in JSON format to client
        res.json(portfolioData);
      });
    });



/***********************************************************************************/
/****************************** Searching Stock Tickers ****************************/
/***********************************************************************************/

// Allows server to work with a specific Watchlist
router.route('/search/:search_string')

  // Returns Stock Tickers matching the search string
  .get(function(req, res) {

    // The term that the user is searching for
    // expected to be either a stock ticker or a company name
    // formatted to lowercase for querying the database effectively
    var searchString = req.params.search_string.toLowerCase();

    // Allows the server to create promises so that the function doesn't return early
    var promises = [];

    // Promises to query database for matching stock tickers
    promises[0] = searchForStockTicker(searchString);

    // If the search string is a specific stock ticker,
    // promises to find and return the stock data for that ticker 
    promises[1] = getStockDataForSingleStock(searchString);

    // Waits until both promises are fulfilled before continuing the function
    Promise.all(promises).then(function(returnedData) {

      // Getting the data from the returned promises
      var returnedStockTickers = returnedData[0];
      var returnedStockData = returnedData[1];

      // Determines if the search term was a stock ticker
      // if it was, then we should have been able to pull its
      // stock data, if it wasn't the api call returned null
      var exactMatch

      if (returnedStockData.name == null) {

        exactMatch = false

        console.log(false);
      } else {

        exactMatch = true;
      }

      var response = {

        exactMatchFound: exactMatch, 
        stockData: returnedStockData,
        stockTickers: returnedStockTickers
      }

      res.json(response);
    });
  });

















/**********************************************************************************/
/**************************** SUPPORT FUNCTIONS ***********************************/
/**********************************************************************************/
/*** These functions are called by the cloud functions above, not by the client ***/
/**********************************************************************************/
/***********************************************************************************
 SECTIONS:
    1. Yahoo! API Functions - These functions call the Yahoo! API
    2. Database Query Functions - these functions interact with the database
    2. Parse query functions - These functions make calls to query the Parse Database 
    3. Filtering functions - takes in an array of data and returns a curated array
    4. Calculation based functions - 
    5. URL Generator functions - builds urls to make a Yahoo API call 
    6. Formatting functions - typically formatting data to send back to the client
***********************************************************************************/

/****************************************************************************************/
/**************************** Yahoo! API functions *************************************/
/****************************************************************************************/


// Returns a promise to get the stock data for a single stock ticker
function getStockDataForSingleStock (stockTicker) {

  // Gets the Yahoo Stock API url for the JSON call
    var returnedURL = buildStockURL(stockTicker);

  // Creates a promise so that the function waits for the api call to fininish before returning stockData to the client
  var stockData;

  return new Promise(function(resolve, reject) {

    request({
        url: returnedURL,
        json: true
     }, function (error, response, returnedData) {

       if (!error && response.statusCode === 200) {

          stockData = formatStockData(returnedData.query.results.quote);

          resolve (stockData);

        } else {

          reject (error)
        }
    })
  });
}

// Returns a promise to get the detailed stock data for a single stock ticker
function getDetailedStockDataForSingleStock (stockTicker) {

  // Gets the Yahoo Stock API url for the JSON call
    var returnedURL = buildStockURL(stockTicker);

  // Creates a promise so that the function waits for the api call to fininish before returning stockData to the client
  var stockData;

  return new Promise(function(resolve, reject) {

    request({
        url: returnedURL,
        json: true
     }, function (error, response, returnedData) {

       if (!error && response.statusCode === 200) {

          stockData = formatDetailedStockData(returnedData.query.results.quote);

          resolve (stockData);

        } else {

          reject (error)
        }
    })
  });
}

// Returns the stock data for multiple stock tickers
function getStockPortfolioData (arrayOfStockNames) {

  // var promiseToGetPortfolioData = new Parse.Promise();

  // Builds the Yahoo Stock API url for the JSON call
  var returnedURL = buildStockPortfolioURL(arrayOfStockNames);

  // This array will hold the final data to return to the client
  var arrayOfStockData = [];

  return new Promise(function(resolve, reject) {

    request({
      url: returnedURL,
      json: true
    }, function (error, response, returnedData) {

      if (!error && response.statusCode === 200) {

        var portfolioData = returnedData.query.results.quote

        // Filters out unnecesary information from JSON request for each stock in portfolio
        for (i = 0; i < portfolioData.length; i++) {

          var stockData = formatStockData(portfolioData[i]);
          arrayOfStockData[i] = stockData;
        }

          resolve (arrayOfStockData);

      } else {

          reject (error)
      }
    })
  });
}

// Returns the stock data for multiple stock tickers
function getDetailedStockPortfolioData (arrayOfStockNames) {

  // var promiseToGetPortfolioData = new Parse.Promise();

  // Builds the Yahoo Stock API url for the JSON call
  var returnedURL = buildStockPortfolioURL(arrayOfStockNames);

  // This array will hold the final data to return to the client
  var arrayOfStockData = [];

  return new Promise(function(resolve, reject) {

    request({
      url: returnedURL,
      json: true
    }, function (error, response, returnedData) {

      if (!error && response.statusCode === 200) {

        var portfolioData = returnedData.query.results.quote

        // Filters out unnecesary information from JSON request for each stock in portfolio
        for (i = 0; i < portfolioData.length; i++) {

          var stockData = formatDetailedStockData(portfolioData[i]);
          arrayOfStockData[i] = stockData;
        }

          resolve (arrayOfStockData);

      } else {

          reject (error)
      }
    })
  });
}


/****************************************************************************************/
/*************************** Database Query functions ***********************************/
/****************************************************************************************/

// Creates a new watchlist in the database
function createWatchlist (userId, watchlistName) {

  // The default starter watchlist
  var listOfStockNames = ["AAPL", "GOOG", "TWTR", "FB"]

  // Create a new instance of Watchlist
  var watchlist = new Watchlist(); 

  // Setting the default variables of a Watchlist
  watchlist.userId = userId;
  watchlist.listOfStockNames = listOfStockNames; 

  // Sets the name of the watchlist
  if (watchlistName == null) {

    // If no name is provided, a default name is given
    watchlist.name = "Default Watchlist";

  } else {

    // Sets the watchlist name equal to passed in parameter
    watchlist.name = watchlistName; 
  }

  // Sets the date that the user was created 
  var date = Date();
  watchlist.createdOnDate = date;

  // Creates the watchlist in the database
  return new Promise(function(resolve, reject) {

    // save the user and check for errors
    watchlist.save(function(error) {
      if (error)
        reject (error);

      resolve({ message: 'Watchlist created!' });
    });
  });
}

// Queries the database for stock tickers matching the users search term
function searchForStockTicker (searchTerm) {

  return new Promise(function(resolve, reject) {

    // Sets up the paramaters for which watchlist the database should return
    var query = StockTicker.find({ 'searchable': {$regex : ".*" + searchTerm + ".*"} });

    // Only return the relevant fields
    query.select('symbol name sector exchange');

    // Only return 10 stock tickers
    query.limit(10);

    // execute the query at a later time
    query.exec(function (error, stockTickers) {
      if (error)
        reject (error);

      var numberOfMatches = stockTickers.length;

      console.log('- Returned ' + numberOfMatches + ' matching stock ticker(s)');

      resolve (stockTickers);
    });
  });
}

/****************************************************************************************/
/**************************** Parse Query functions *************************************/
/****************************************************************************************/

// Finds all the Orders associated with the provided portfolio
function getOrders (portfolio) {

  // Function will not return until this promise is fulfilled
  var promiseToFindOrders = new Parse.Promise();

  // Sets up the Parse query to find Orders associated with this Portfolio 
  var Order =  Parse.Object.extend("Order")
  var orderQuery = new Parse.Query(Order)
  orderQuery.equalTo("portfolioID", portfolio)
  
  // Executes the query search
  promiseToFindOrders = orderQuery.find()

  return promiseToFindOrders
}

// Finds all the PortfolioPositions associated with the provided portfolio
function getPortfolioPositions (portfolio) {

  // Function will not return until this promise is fulfilled
  var promiseToFindPortfolioPositions = new Parse.Promise();

  // Sets up the Parse query to find PortfolioPositions associated with this Portfolio 
  var PortfolioPosition =  Parse.Object.extend("PortfolioPosition")
  var portfolioPositionQuery = new Parse.Query(PortfolioPosition)
  portfolioPositionQuery.equalTo("portfolioID", portfolio)

  // Executes the query search
  promiseToFindPortfolioPositions = portfolioPositionQuery.find()

  return promiseToFindPortfolioPositions
}

// Helper function for the "completeSellOrder" function
// Will find the exact reference to the security that the user is
// asking to sell, then "completeSellOrder" can store that reference
// in its porfolioPositionID property
function getPortfolioPositionForSellOrder (portfolio, ticker, datePositionCompleted) {

  // Creates a promise so that the function waits for the query 
  // to finish before returning the PortfolioPosition
  var promiseToFindPortfolioPosition = new Parse.Promise();

  // Sets up the Parse query to find the exact PortfolioPosition that matches the requirements
  var PortfolioPosition = Parse.Object.extend("PortfolioPosition")
  var portfolioPositionQuery = new Parse.Query(PortfolioPosition)
  portfolioPositionQuery.equalTo("portfolioID", portfolio);
  portfolioPositionQuery.equalTo("ticker", ticker);
  portfolioPositionQuery.equalTo("createdAt", datePositionCompleted);

  // Executes the query search
  portfolioPositionQuery.find({
    success: function(results) {
       
      // This is the users portfolio returned from the query 
      // userPortfolio = results[0]

      promiseToFindPortfolioPosition.resolve(results[0])
 
    },
    error: function(error) {
       
      promiseToFindPortfolioPosition.reject(error)
       
    }
  })

  return promiseToFindPortfolioPosition
}

// Finds the Portfolio associated with the provided User
// function getUserPortfolio (currentUser) {

//   // Function will not return until this promise is fulfilled
//   var promiseToFindPortfolio = new Parse.Promise();

//   // Sets up the Parse query to find Portfolio associated with this User
//   var Portfolio = Parse.Object.extend("Portfolio")
//   var userPortfolioQuery = new Parse.Query(Portfolio)
//   userPortfolioQuery.equalTo("userID", Parse.User.current())

//   // Executes the query search
//   promiseToFindPortfolio = userPortfolioQuery.find()

//   return promiseToFindPortfolio
// }

// Finds the Portfolio associated with the provided User
function getUserPortfolio (currentUser) {
 
  // Function will not return until this promise is fulfilled
  var promiseToFindPortfolio = new Parse.Promise();
 
  // Sets up the Parse query to find Portfolio associated with this User
  var Portfolio = Parse.Object.extend("Portfolio")
  var userPortfolio = new Portfolio()
  var userPortfolioQuery = new Parse.Query(Portfolio)
 
  userPortfolioQuery.equalTo("userID", Parse.User.current());
  userPortfolioQuery.find({
    success: function(results) {
       
      // This is the users portfolio returned from the query 
      userPortfolio = results[0]

      promiseToFindPortfolio.resolve(userPortfolio)
 
    },
    error: function(error) {
       
      promiseToFindPortfolio.reject(error)
       
    }
  })
 
  return promiseToFindPortfolio
}

/****************************************************************************************/
/**************************** Filtering functions ***************************************/
/****************************************************************************************/

// Returns a formatted (client ready) array of "pending" PortfolioPositions
function filterForAndFormatPendingPositions (userPortfolioPositions) {

  var arrayOfPendingPortfolioPositions =[]

  for (i = 0; i < userPortfolioPositions.length; i++) {

    if (userPortfolioPositions[i].get("pending") == true) {

      var formattedPosition = formatPendingPortfolioPosition(userPortfolioPositions[i])

      arrayOfPendingPortfolioPositions.push(formattedPosition)
    }
  }

  return arrayOfPendingPortfolioPositions
}

// Returns an formatted array of only "completed" PortfolioPositions
function filterForCompletedPortfolioPositions (userPortfolioPositions) {

  var arrayOfPendingPortfolioPositions =[]

  for (i = 0; i < userPortfolioPositions.length; i++) {

    if (userPortfolioPositions[i].get("pending") == false) {

      arrayOfPendingPortfolioPositions.push(userPortfolioPositions[i])
    }
  }

  return arrayOfPendingPortfolioPositions
}

// Returns an array of just the stock ticker strings from an array of PortfolioPositions
function filterForStockTickerStrings (arrayOfPortfolioPositions) {

  var arrayOfStockTickers = []

  // Loops through the array of PortfolioPositions then gets each stock ticker
  for (i = 0; i < arrayOfPortfolioPositions.length; i++) {
    
    arrayOfStockTickers.push(arrayOfPortfolioPositions[i].get("ticker"))
  }

  return arrayOfStockTickers
}

/****************************************************************************************/
/**************************** Calculation based functions *******************************/
/****************************************************************************************/

// Calculates the number of shares that a user can aford to purchase
function calculateNumberOfAffordableShares (sharePrice, cash) {

  var numberOfAffordableShares = cash / sharePrice

  return Math.floor(numberOfAffordableShares)
}

// Looks at the current PortfolioPositions of a given Portfolio then determines how much money each
// invidual PortfolioPosition has made/loss for the portfolio: both overall and on today specifically
// Returns a formatted array of "completed" PortfolioPositions, likely to be returned to client eventually
function calculatePositionGainOrLoss (userPortfolioPositions, dictionaryOfStockData) {

  var finalArrayOfCalculatedPortfolioPositions = []

  for (i = 0; i < userPortfolioPositions.length; i++) {
    
    var currentStockTicker = userPortfolioPositions[i].get("ticker")

    // These two values will need to be calculated 
    var todaysGainOrLoss = 0.0
    var totalGainOrLoss = 0.0

    // Used to calculate today's gain or loss
    var numberOfShares = userPortfolioPositions[i].get("numberOfShares")
    var previousClosingPrice = dictionaryOfStockData[currentStockTicker].previousClose

    // Used to calculate total gain or loss
    var currentPrice = dictionaryOfStockData[currentStockTicker].currentPrice
    var purchasePrice = userPortfolioPositions[i].get("purchasePrice")

    // The date that the position was ordered
    var positionOrderDate = userPortfolioPositions[i].createdAt

    // How much money the user has made in total on this position
    totalGainOrLoss =  numberOfShares * (currentPrice - purchasePrice)

    // How much money the user has made today on this position
    if (totalGainOrLoss == 0) {

      todaysGainOrLoss = totalGainOrLoss
    } else {

      todaysGainOrLoss = numberOfShares * (currentPrice - previousClosingPrice)
    }

    

    var formattedPortfolioPosition = formatPortfolioPosition(userPortfolioPositions[i], todaysGainOrLoss, totalGainOrLoss)

    finalArrayOfCalculatedPortfolioPositions.push(formattedPortfolioPosition)
  }

  return finalArrayOfCalculatedPortfolioPositions
}

// Determines if the date passed in is today or not
//********** This function is currently not used *****/
function isTheDateToday (date) {

  var todaysDate = new Date()

  // Checks if the day of the month is the same as 
  if (date.getDate() != todaysDate.getDate()) {

    return false

  // Checks if the month is the same
  } else if (date.getMonth() != todaysDate.getMonth()) {

    return false

  // Checks if the year is the same
  } else if (date.getFullYear() != todaysDate.getFullYear()) {

    return false

  } else {
    
    return true
  }
}

// Given the "pending" and "completed" PortfolioPosisions in a single portfolio, this function 
// calculates the value of the portfolio by aggregating the value of all the individual PortfolioPositions
function calculatePortfolioValue (portfolio, completedPositions, pendingOrders) {

  var portfolioFreeCash = 0.0
  var portfolioCommittedCash = 0.0
  var portfolioEquityValue = 0.0
  var portfolioTodaysGainOrLoss = 0.0
  var portfolioPositionsTotalGainOrLoss = 0.0
  var portfolioTotalGainOrLoss = 0.0

  var portfolioTotalValue = 0.0
  var numberOfPositions = completedPositions.length
  var numberOfUniquePositions = 1   // Need to determine a formula for this


  for (i = 0; i < pendingOrders.length; i++) {

    var orderType = pendingOrders[i]["orderType"]

    // Will only increase pending cash if the ordertype is a "buy"
    if (orderType == "buy") {

      var numberOfShares = pendingOrders[i]["numberOfShares"]
      var purchasePrice = pendingOrders[i]["purchasePrice"]

      // Calculates how much cash is commited to open orders
      portfolioCommittedCash += (numberOfShares * purchasePrice)      
    }
  }


  for (i = 0; i < completedPositions.length; i++) {

    // Numbers used to calculate the value of this holding as a part of the portfolio
    var numberOfShares = completedPositions[i]["numberOfShares"]
    var purchasePrice = completedPositions[i]["purchasePrice"]
    var todaysGainOrLoss = completedPositions[i]["todaysGainOrLoss"]
    var totalGainOrLoss = completedPositions[i]["totalGainOrLoss"]

    // The equity value of the position is it's value at purchase plus the total change in value
    var positionEquityValue = (numberOfShares * purchasePrice) + totalGainOrLoss

    // Update the aggregate portfolio values
    portfolioEquityValue += positionEquityValue
    portfolioTodaysGainOrLoss += todaysGainOrLoss
    // portfolioTodaysGainOrLoss += totalGainOrLoss
    portfolioPositionsTotalGainOrLoss += positionEquityValue
  }

  portfolioFreeCash = portfolio.get("cash") - portfolioCommittedCash
  portfolioTotalValue = portfolioEquityValue + portfolioFreeCash + portfolioCommittedCash
  portfolioTotalGainOrLoss = portfolioTotalValue - portfolio.get("initialPortfolioValue")

  var updatedPortfolioValues = {

    cash: parseFloat(portfolioFreeCash.toFixed(2)),
    committedCash: parseFloat(portfolioCommittedCash.toFixed(2)),
    equityValue: parseFloat(portfolioEquityValue.toFixed(2)),
    portfolioValue: parseFloat(portfolioTotalValue.toFixed(2)),
    todaysGainOrLoss: parseFloat(portfolioTodaysGainOrLoss.toFixed(2)),
    totalGainOrLoss: parseFloat(portfolioTotalGainOrLoss.toFixed(2)),
    numberOfPositions: numberOfPositions,
    numberOfUniquePositions: numberOfUniquePositions
  }

  return updatedPortfolioValues
}

// Makes sure the user can still afford to complete the desired order, given the current share price
// If they cannot, returns the number of shares that the user can afford (possibly zero) 
function calculateNumberOfSharesForCompletingOrder (desiredNumberOfShares, currentSharePrice, portfolioCash) {

  var totalCostOfCompletingOrder = desiredNumberOfShares * currentSharePrice

  if (totalCostOfCompletingOrder < portfolioCash) {

    return desiredNumberOfShares

  } else {

    return calculateNumberOfAffordableShares(currentSharePrice, portfolioCash)
  }
}

/****************************************************************************************/
/**************************** URL Generator functions ***********************************/
/****************************************************************************************/

// Returns the URL of the Yahoo Stock API for a single stock ticker
function buildStockURL (stockName) {

  var startingURL = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22"
  var endingURL = "%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback="

  var finalURL =  startingURL + encodeURI(stockName) + endingURL;

  return finalURL;

}

// Returns the URL of the Yahoo Stock API for multiple stock names
function buildStockPortfolioURL (arrayOfStockNames) {

  // Builds a different url string if there is just a single stock
  if (arrayOfStockNames.length == 1) {

    var stockURL = buildStockURL(arrayOfStockNames[0]);
    return stockURL;
  };

  // This is the first part of the RESTFUL API URL
  var startingURL = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(";

  // This is the ending part of the RESTFUL API
  var endingURL = ")&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";

  // This string is used to build the middle of the URL
  var stockSymbolString = "";
        
    // Adds a " before and after each stock name
    // Adds a comma between stock names
    for (i = 0; i < arrayOfStockNames.length; i++) {
        
        var currentStock = arrayOfStockNames[i];

        // Sets the name of the stock to something the computer can understand
        currentStock = encodeURI(currentStock);
        
        // Places a " before and after each stock name
        stockSymbolString += "%22" + currentStock + "%22";
        
        // Will add a comma after the stock if it stock isn't the last one
        // In the portfolio
        if (i != (arrayOfStockNames.length - 1)) {
            stockSymbolString += "%2C";
        }
    }
    
    // Will create the final url that the function caller is looking for
    var finalURL = startingURL + stockSymbolString + endingURL;        

  return finalURL;

}

/****************************************************************************************/
/**************************** Formatting functions **************************************/
/****************************************************************************************/

// Pulls out and returns only the relevent data from a set of JSON data on a stock
function formatStockData (JSONdata) {

  var stock = {

    name: JSONdata.Name,
    symbol: JSONdata.Symbol,
    currentPrice: parseFloat(JSONdata.LastTradePriceOnly),
    priceChange: parseFloat(JSONdata.Change),
    priceChangeInPercent: parseFloat(JSONdata.ChangeinPercent)
  };

  return stock;
}

// Pulls out and returns only the relevent data from a set of JSON data on a stock
function formatStockDataForPortfolioUpdate (JSONdata) {

  var stock = {

    symbol: JSONdata.Symbol,
    currentPrice: parseFloat(JSONdata.LastTradePriceOnly), 
    previousClose: parseFloat(JSONdata.PreviousClose) 
  };

  return stock;
}

// Pulls out and returns only the relevent data from a set of JSON data on a stock
function formatDetailedStockData (JSONdata) {

  var stock = {

    // Basic information
    name: JSONdata.Name,
    symbol: JSONdata.Symbol,

    // Price Data
    currentPrice: parseFloat(JSONdata.LastTradePriceOnly),
    priceChange: parseFloat(JSONdata.Change),
    priceChangeInPercent: parseFloat(JSONdata.ChangeinPercent),
    marketCap: JSONdata.MarketCapitalization,       // Convert this into the appropriate double value PLZ

    // Stock Details
    openPrice: parseFloat(JSONdata.Open),
    previousClose: parseFloat(JSONdata.PreviousClose),
    daysLowPrice: parseFloat(JSONdata.DaysLow),
    daysHighPrice: parseFloat(JSONdata.DaysHigh),
    volume: parseFloat(JSONdata.Volume),
    averageVolume: parseFloat(JSONdata.AverageDailyVolume),
    fiftyTwoWeekHigh: parseFloat(JSONdata.YearHigh),
    fiftyTwoWeekLow: parseFloat(JSONdata.YearLow),
    shortRatio: parseFloat(JSONdata.ShortRatio),

    // Stock Metrics
    earningsPerShare: parseFloat(JSONdata.EarningsShare),
    dividend: parseFloat(JSONdata.DividendShare),
    dividendYield: parseFloat(JSONdata.DividendYield),
    priceToEarnings: parseFloat(JSONdata.PERatio),
    priceToSales: parseFloat(JSONdata.PriceSales),
    priceToBook: parseFloat(JSONdata.PriceBook)
  };

  return stock;
}

// Formats a dictionary representing a "completed" PortfolioPosition object to be returned to the client
function formatPortfolioPosition (currentPosition, calculatedTodaysGainOrLoss, calculatedTotalGainOrLoss) {

  var portfolioPosition = {

    objectId: currentPosition.id,
    name: currentPosition.get("name"),
    ticker: currentPosition.get("ticker"),
    numberOfShares: parseFloat(currentPosition.get("numberOfShares")),
    purchasePrice: parseFloat(currentPosition.get("purchasePrice")),
    dateOrderPlaced: currentPosition.createdAt,

    // Makes sure these numbers have only two decimal places
    todaysGainOrLoss: parseFloat(calculatedTodaysGainOrLoss.toFixed(2)),
    totalGainOrLoss: parseFloat(calculatedTotalGainOrLoss.toFixed(2))
  };

  return portfolioPosition;
}

// Formats a dictionary representing a "pending" PortfolioPosition object to be returned to the client
function formatArrayOfOrders (arrayOfOrders) {

  var arrayOfFormattedOrders = []

  for (i = 0; i < arrayOfOrders.length; i++) {
    
    var currentOrder = arrayOfOrders[i]

    var formattedOrder = {

      objectId: currentOrder.id,
      name: currentOrder.get("name"),
      ticker: currentOrder.get("ticker"),
      numberOfShares: currentOrder.get("numberOfShares"),
      purchasePrice: currentOrder.get("purchasePrice"),
      dateOrderPlaced: currentOrder.createdAt,
      orderType: currentOrder.get("orderType")
    }

    arrayOfFormattedOrders.push(formattedOrder)
  }

  return arrayOfFormattedOrders
}

// Formats a dictionary representing a "pending" PortfolioPosition object to be returned to the client
function formatPendingPortfolioPosition (currentPosition) {

  var portfolioPosition = {

    name: currentPosition.get("name"),
    symbol: currentPosition.get("ticker"),
    numberOfShares: currentPosition.get("numberOfShares"),
    purchasePrice: currentPosition.get("purchasePrice"),
    dateOrderPlaced: currentPosition.createdAt,
  };

  return portfolioPosition;
}

// Takes an array of stock data and turns it into a dictionary by essentially allowing each array
// element to be called by the stock ticker (ex. 'AAPL') that the element's data represents
function formatStockPortfolioDataDictionary (currentStockPortfolioData) {

  var dictionaryOfStockData = {}

  for (i = 0; i < currentStockPortfolioData.length; i++) {
    
    var stockTicker = currentStockPortfolioData[i]["symbol"]

    dictionaryOfStockData[stockTicker] = currentStockPortfolioData[i]
  }  

  return dictionaryOfStockData
}