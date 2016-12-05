var request = require('request');
var assert = require('assert');
var ERROR_THRESHOLD = 40; //in percentage
var log_message = "The alert condition of drop in Transaction Limit was triggered -<br/><br/>";


var NRQL = "select count(*) from Transaction WHERE appName='OneJL Browse (Live)' since 5 minutes ago COMPARE WITH 5 minutes ago";

function checkTransactions(){
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
  
    if (!error && response.statusCode == 200) {
      var resultSet = JSON.parse(body);
      if(!isAlertsPeriodSilent()){
        checkIfTransactionsDropped(resultSet);
      }  
    }
})
}

function checkIfTransactionsDropped(resultSet){
  var currentCount = resultSet.current.results[0].count;
  var previousCount = resultSet.previous.results[0].count; 
  console.log("current count - " + currentCount + " vs previous count - " + previousCount);
  log_message = log_message + "<br/>current count - " + currentCount + " vs previous count - " + previousCount + ".";
  var variance = ((previousCount - currentCount) / previousCount) * 100;
  if(variance > ERROR_THRESHOLD) {
    console.log("Transactions has dropped by " + variance);
    log_message = log_message + "Transactions has dropped by " + variance + ".";
    triggerAlert();
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
    console.log("starting the execution of transactions_drop.js...");
    setInterval(function () {
        checkForThreadsInEachServer();
    }, 300000);
}

module.exports = _execute;

function triggerAlert(){

    var subject = '1JL Drop in Transaction Limit Breached: Raise P3 Inc [Callout:JLWEBSUPP]'
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