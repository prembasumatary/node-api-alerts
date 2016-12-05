var jetty = require('./jettyThreads.js');
var jettyPerServer = require('./jetty_perserver.js');
var desktopOrders = require('./desktopOrders.js');



//now call all
jetty();
jettyPerServer();
desktopOrders();