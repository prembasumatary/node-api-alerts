var http = require("http");
var request = require('request');
var nodemailer = require('nodemailer');
var mailsender = require('./mailsender.js');

var ERROR_THRESHOLD = 130; //absolute

//email fields
var mailOptions = {
    from : 'John Lewis Alerts <alertsjl@gmail.com>', // sender address
    to : ['prem.basumatary@johnlewis.co.uk'], // list of receivers
    subject : '1JL JVM Thread Count (All Servers) Breached: Raise P3 Inc [Callout:JLWEBSUPP]',//subject
    text : '', //empty
    html : '1JL JVM Thread Count (All Servers) Breached: Raise P3 Inc [Callout:JLWEBSUPP]' //html body
};

function checkJettyThreads(){
    var url = 'https://api.newrelic.com/v2/applications/21845346/metrics/data.json';
    var currentTime = new Date();
    var tenMinutesAgo = addMinutes(currentTime, -10);

    request({
        url: url,
        headers: {
        'X-Api-Key':'5df10b4c67bab668003902bd8d2ccc40'
        },
        method : 'GET',
        qs : {
      'names[]': 'JmxBuiltIn/Threads/Thread Count',
      'period' : 600,
      'from' : tenMinutesAgo,
      'to' : currentTime
    }
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else {
            //success is 200 code;
            var response = JSON.parse(body);
            if(!isAlertsPeriodSilent()){
                checkIfErrorCountIsOk(response);
            }
        }
    });
}

function checkIfErrorCountIsOk(response_object){
    var metric_data = response_object.metric_data;
    metric_data.metrics.forEach(function(metric){
        metric.timeslices.forEach(function(slice){
            var threadCount = slice.values.max_value;
            console.log("num threads - " + threadCount);
            if(threadCount > ERROR_THRESHOLD){
                console.log("threads count high, max count of threads - " + threadCount);
                mailsender.sendmail(mailOptions);
            }
            //assert(threadCount < ERROR_THRESHOLD, "JVM Thread Limit breached with max count as - " + threadCount);
        });
    });
}

//function to return host name and id
function getServerStats(json_obj_of_the_host){
  var hostName = json_obj_of_the_host.host;
  var id = json_obj_of_the_host.id;

  return {
    hostName : hostName,
    id : id
  };
}

function isAlertsPeriodSilent(){
    var date = new Date();
    var startHour = 1;//1 am alerts should be disabled
    var stopHour = 6;//after 6 am all alerts should be effective again
    var currentHour = date.getHours();
    if (currentHour >= startHour && currentHour < stopHour){
        return true;
    } else {
        return false;
    }
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}


function _execute(){
    setInterval(function () {
        checkJettyThreads();
    }, 300000);
}

module.exports = _execute;