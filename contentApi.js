var request = require('request');
var assert = require('assert');
var ERROR_THRESHOLD = 30; //calls per minute failure rate.

runHealthCheck();

function runHealthCheck(){
    var url = 'https://api.newrelic.com/v2/applications/21845346/metrics/data.json';
    var currentTime = new Date();
    var tenMinutesAgo = addMinutes(currentTime, -10);
    var duration = 600;
    var metricArray = "names[]=Custom/onejl.api.ContentApi%23getContent(String).502/Count"+"&names[]=Custom/onejl.api.ContentApi%23getContent(String).503/Count"+
    "&names[]=Custom/onejl.api.ContentApi%23getContent(String).504/Count"+
    "&from="+tenMinutesAgo+"&to="+currentTime+"&period="+duration;

    request({
        url: url+"?"+metricArray,
        headers: {
        'X-Api-Key':'5df10b4c67bab668003902bd8d2ccc40'
        },
        method : 'GET'
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
        var metricName = metric.name;
        metric.timeslices.forEach(function(slice){
            var errPerMinute = slice.values.calls_per_minute;
            console.log("   # " + metricName + " & error rate " + errPerMinute);
            if(errPerMinute > ERROR_THRESHOLD){
                console.log("   # " + metricName + " & error rate " + errPerMinute);
            }
            assert(errPerMinute < ERROR_THRESHOLD, "Content API Error Rate breached, should be less than threshold, but it is now - " + errPerMinute);
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
