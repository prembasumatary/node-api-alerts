var request = require('request');
var assert = require('assert');
var servers_with_errors_and_mesg = [];

var ERROR_THRESHOLD = 130; //absolute
/**
 * there is no api to get jmx threads for all instances as instanceId is required. so we'll get all instances
 * and then get jmx count for each instance and report errors.
 */

function checkForThreadsInEachServer(){
  $http.get({
  url: 'https://api.newrelic.com/v2/applications/21845346/instances.json',
    headers: {
      'Accept': 'application/json',
      'X-Api-Key':'5df10b4c67bab668003902bd8d2ccc40'
    }
}, function(error, response, body) {
    assert(response.statusCode, 200, "Something unexpected happened, ignore this monitor.");

    if (!error && response.statusCode == 200) {
      var responseObject = JSON.parse(body); 
      //console.log(responseObject);
      responseObject.application_instances.forEach(function(instance){
        var server = getServerStats(instance);

        if(!isAlertsPeriodSilent()){
          //console.log("host - " + server.hostName + ", id - " + server.id);
          //for all instances, now check if thread count is okay
          checkIfThreadCountIsOk(server);
        }
      });
    }
})  
}

function checkIfThreadCountIsOk(server){
    var url = 'https://api.newrelic.com/v2/applications/21845346/instances/'+server.id+'/metrics/data.json';
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
            var metric_data = response.metric_data;
            metric_data.metrics.forEach(function(metric){
                metric.timeslices.forEach(function(slice){
                    //console.log(slice.values.average_value);
                    var threadCount = slice.values.max_value;
                    if(threadCount > ERROR_THRESHOLD){
                        var mesg = "threads count high for server " + server.hostName + ", count of threads - " + threadCount;
                        servers_with_errors_and_mesg.push(mesg);
                    }
                    assert(threadCount < ERROR_THRESHOLD, "thread count breached for " + server.hostName + " - " + threadCount);
                });
            });
            //console.log(servers_with_errors_and_mesg[servers_with_errors_and_mesg.length - 1]);
            //assert(servers_with_errors_and_mesg.length == 0, servers_with_errors_and_mesg[servers_with_errors_and_mesg.length - 1])
        }
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
        checkForThreadsInEachServer();
    }, 300000);
}

module.exports = _execute;