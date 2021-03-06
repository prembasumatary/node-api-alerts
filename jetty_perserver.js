var request = require('request');
var servers_with_errors_and_mesg = [];
var ERROR_THRESHOLD = 130; //absolute
/**
 * there is no api to get jmx threads for all instances as instanceId is required. so we'll get all instances
 * and then get jmx count for each instance and report errors.
 */

function checkForThreadsInEachServer(){
  request({
  url: 'https://api.newrelic.com/v2/applications/21845346/instances.json',
    headers: {
      'Accept': 'application/json',
      'X-Api-Key':'5df10b4c67bab668003902bd8d2ccc40'
    }
}, function(error, response, body) {

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
                        var log_message = "The alert condition of drop in Jetty JVM threads was triggered -<br/><br/>";
                        servers_with_errors_and_mesg.push(mesg);
                        log_message = log_message + "<br/>"+mesg;

                        triggerAlert(log_message);
                    }
                });
            });
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
    console.log("starting the execution of jettyThreads_perServer.js...");
    setInterval(function () {
        checkForThreadsInEachServer();
    }, 300000);
}

module.exports = _execute;

function triggerAlert(log_message){

    var subject = '1JL JVM Thread Count (Per Server) Breached: Raise P3 Inc [Callout:JLWEBSUPP]'
    var time_now = new Date();
    var template = '<div><div><div><div><table><tbody><tr><td><img src="http://www.johnlewis.com/store/assets/header/john-lewis-logo.gif" alt="John Lewis" height="16" width="90"></td></tr><tr><td><div><span>New Incident </span> opened at '+time_now+'</div></td></tr></tbody></table><div></div><div></div><div></div><div></div><div><div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);background-color:rgb(242,242,242);border-bottom:1px solid rgb(234,234,234);white-space:nowrap"><tbody><tr><td style="padding-top:15px;padding-bottom:0;padding-left:25px;padding-right:25px"><div id="text" style="text-decoration:none;color:red"><span style="font-size:130%;font-weight:bold;padding-top:10px;padding-bottom:0">'+subject+'</span></div></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;font-size:120%;white-space:normal"></td></tr></tbody></table></div></div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);border-bottom:1px solid rgb(234,234,234)"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:20px 0px 20px 0px"><table style="width:300px;border-collapse:separate;border-spacing:10px;color:rgb(84,84,84)" align="center"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:8px 8px 8px 8px;text-align:center;white-space:nowrap;color:rgb(255,255,255)"><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84)"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:0;text-align:center;white-space:nowrap;font-size:18px">'+log_message+'</td></tr></tbody></table></td><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:8px 8px 8px 8px;text-align:center;white-space:nowrap;color:rgb(255,255,255)"><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84)"><tbody><tr></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);border-bottom:none"><tbody><tr><td style="padding-top:25px;padding-bottom:0;padding-left:25px;padding-right:25px"> <p style="margin-top:0;margin-bottom:10px">Channels notified </p><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);margin-bottom:20px"><tbody><tr style="background-color:rgb(242,242,242)"><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left;width:115px">Email</td><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left"><a href="mailto:Jubilee_House_Operations_Bridge@johnlewis.co.uk" target="_blank">Jubilee_House_Operations_<wbr></wbr>Bridge@johnlewis.co.uk</a></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left;width:115px">Email</td><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left"><a href="mailto:z_jl_oas_website_front_office_support_team@johnlewis.co.uk" target="_blank">z_jl_oas_website_front_office_<wbr></wbr>support_team@johnlewis.co.uk</a></td></tr></tbody></table></td></tr></tbody></table></div></div></div></div></div>';
    //email fields
    var mailOptions = {
        from : 'John Lewis Alerts <alertsjl@gmail.com>', // sender address
        to : ['prem.basumatary@johnlewis.co.uk','satish.sathe@johnlewis.co.uk','thomas.dooley@johnlewis.co.uk','abhishek.agrawal@johnlewis.co.uk'], // list of receivers
        subject : subject,//subject
        text : '', //empty
        html : template //html body
    };
    mailsender.sendmail(mailOptions);
}