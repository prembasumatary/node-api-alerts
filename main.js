var jetty = require('./jettyThreads.js');
var jettyPerServer = require('./jetty_perserver.js');
var desktopOrders = require('./desktopOrders.js');
var transactionsDrop = require('./transactions_drop.js');
var transactionsDrop_woking = require('./transaction_drop_woking.js');
var transactionsDrop_jubilee = require('./transaction_drop_jubilee.js');

//now call all
jetty();
jettyPerServer();
desktopOrders();
transactionsDrop();
transactionsDrop_woking();
transactionsDrop_jubilee();