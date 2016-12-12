var request = require('request');
var counter = 1;

setInterval(function () {
    var url = 'https://m.acpt.project4.com/satish/'+counter;
    //var url = 'http://localhost:10808/counter/'+counter;
    console.log("url - " + url);
    request({
        url: url,
        method : 'POST',
        qs : {
            'number' : counter
        }
    }, function(error, response, body){
    });
    counter = counter + 1;
}, 1000);