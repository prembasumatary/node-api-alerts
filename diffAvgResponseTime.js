var request = require('request');
var mailsender = require('./mailsender.js');
var ERROR_THRESHOLD = 75; //in percentage
var NRQL = "SELECT filter(average(duration), WHERE host like 'ulvjecpl03.johnlewis.co.uk' or host like 'ulvjecpl05.johnlewis.co.uk' or host like 'ulvjecpl07.johnlewis.co.uk' or host like 'ulvjecpl09.johnlewis.co.uk' AS 'Jubilee House'),filter(average(duration), WHERE host LIKE 'ulvjecpl06.johnlewis.co.uk' or host like 'ulvjecpl08.johnlewis.co.uk' or host like 'ulvjecpl04.johnlewis.co.uk' AS 'Woking DC') FROM Transaction SINCE 5 minutes ago";

function checkTheDifference(){
  request({
    url: 'https://insights-api.newrelic.com/v1/accounts/1075077/query',
    headers: {
      'Accept': 'application/json',
      'X-Query-Key':'1lkko45v_mlkXperaG4rg2qAWW-5nLUU'
    },
    method : 'GET',
    qs : {
      'nrql': NRQL
    }
  }, function(error, response, body) {
    if(error){
      console.log("internal error, ignore this monitor.");
    } else if (!error && response.statusCode == 200) {
      var resultSet = JSON.parse(body);
      if(!isAlertsPeriodSilent()){
        checkIfThresholdBreached(resultSet);
      }
    }
  })
}


function checkIfThresholdBreached(resultSet){
  var avgOnOneDC = resultSet.results[0].average;
  var avgOnSecondDC = resultSet.results[1].average; 
  console.log("Avg time on 1st DC - " + avgOnOneDC + " vs Avg time on 2nd DC - " + avgOnSecondDC);

  var denominatorToUse = (avgOnOneDC > avgOnSecondDC) ? avgOnSecondDC : avgOnOneDC;
  var variance = ((avgOnSecondDC - avgOnOneDC) / denominatorToUse) * 100;
  var positiveVariance = (variance < 0) ? -variance : variance;
  var log_message = "The alert condition for Difference in avg response time between DCs breached was triggered -<br/><br/>";
  if(positiveVariance > ERROR_THRESHOLD) {
    //massive difference in response times, trigger alert
    console.log("Transactions have massive response time difference between 2 DCs - " + positiveVariance);
    triggerAlert(log_message);
  } else {
      console.log("Difference in DC Response times are below threshold - " + positiveVariance + " so all OK.");
    }
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

function _execute(){
    console.log("starting the execution of diffAvgResponseTime.js...");
    setInterval(function () {
        checkTheDifference();
    }, 300000);
}

module.exports = _execute;

function triggerAlert(log_message){
  // $http.get({
   // url: 'http://98b58899.ngrok.io/message/'+encodeURI(message)
  //}, function(error, response, body) {
   // console.log(response.statusCode);
    //assert(difference < threshold, "Orders drop should not be below the threshold set, it is " + difference + " against threshold of " + threshold);
  //})
  var subject = '1JL Difference in Avg Response Times Breached Between DCs: Raise P3 Inc [Callout:JLWEBSUPP]';
  var time_now = new Date();
  var template = '<div><div><div><div><table><tbody><tr><td><img src="http://www.johnlewis.com/store/assets/header/john-lewis-logo.gif" alt="John Lewis" height="16" width="90"></td></tr><tr><td><div><span>New Incident </span> opened at '+time_now+'</div></td></tr></tbody></table><div></div><div></div><div></div><div></div><div><div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);background-color:rgb(242,242,242);border-bottom:1px solid rgb(234,234,234);white-space:nowrap"><tbody><tr><td style="padding-top:15px;padding-bottom:0;padding-left:25px;padding-right:25px"><div id="text" style="text-decoration:none;color:red"><span style="font-size:130%;font-weight:bold;padding-top:10px;padding-bottom:0">'+subject+'</span></div></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;font-size:120%;white-space:normal"></td></tr></tbody></table></div></div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);border-bottom:1px solid rgb(234,234,234)"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:20px 0px 20px 0px"><table style="width:300px;border-collapse:separate;border-spacing:10px;color:rgb(84,84,84)" align="center"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:8px 8px 8px 8px;text-align:center;white-space:nowrap;color:rgb(255,255,255)"><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84)"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:0;text-align:center;white-space:nowrap;font-size:18px">'+log_message+'</td></tr></tbody></table></td><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:8px 8px 8px 8px;text-align:center;white-space:nowrap;color:rgb(255,255,255)"><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84)"><tbody><tr></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);border-bottom:none"><tbody><tr><td style="padding-top:25px;padding-bottom:0;padding-left:25px;padding-right:25px"> <p style="margin-top:0;margin-bottom:10px">Channels notified </p><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);margin-bottom:20px"><tbody><tr style="background-color:rgb(242,242,242)"><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left;width:115px">Email</td><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left"><a href="mailto:Jubilee_House_Operations_Bridge@johnlewis.co.uk" target="_blank">Jubilee_House_Operations_<wbr></wbr>Bridge@johnlewis.co.uk</a></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left;width:115px">Email</td><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left"><a href="mailto:z_jl_oas_website_front_office_support_team@johnlewis.co.uk" target="_blank">z_jl_oas_website_front_office_<wbr></wbr>support_team@johnlewis.co.uk</a></td></tr></tbody></table></td></tr></tbody></table></div></div></div></div></div>';

  //email fields
  var mailOptions = {
    from : 'John Lewis Alerts <alertsjl@gmail.com>', // sender address
    to : ['prem.basumatary@johnlewis.co.uk','satish.sathe@johnlewis.co.uk','thomas.dooley@johnlewis.co.uk','abhishek.agrawal@johnlewis.co.uk'], // list of receivers
    subject : subject,//subject
    text : '', //empty
    html : template//html body
  };
  
  mailsender.sendmail(mailOptions);
}