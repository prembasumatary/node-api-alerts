var escape_html_entities = require('escape-html-in-json');
var http = require('http');
var ERROR_THRESHOLD = 30; //in percentage

//email fields
var mailOptions = {
    from : 'John Lewis Alerts <alertsjl@gmail.com>', // sender address
    to : ['prem.basumatary@johnlewis.co.uk'], // list of receivers
    subject : 'Desktop Orders Drop Limit Breached: Raise P3 Inc [Callout:JLWEBSUPP]',//subject
    text : '', //empty
    html : JSON.stringify(template)//html body
};

var Bucket = function (_start, _end, _threshold){
  this.start = _start;
  this.end = _end;
  this.threshold = _threshold;
}

var windows = {
  morning : 1, // this is between 6 am - 10 am
  midday : 2, //this is 10 am - 10 pm
  late_evening : 3, // 10 pm - 12 am
  midnight : 4, // 12 am - 1 am
  properties : {
    1 : {start : "6", end : "10", threshold : "30"},
    2 : {start : "10", end : "22", threshold : "20"},
    3 : {start : "22", end : "0", threshold : "40"},
    4 : {start : "0", end : "1", threshold : "70"}  
  }
};

var morning_window = windows.properties[windows.morning];
var midday_window = windows.properties[windows.midday];
var evening_window = windows.properties[windows.late_evening];
var midnight_window = windows.properties[windows.midnight];

var little_busy = new Bucket(morning_window.start, morning_window.end, morning_window.threshold);
var very_busy = new Bucket(midday_window.start, midday_window.end, midday_window.threshold);
var somewhat_busy = new Bucket(evening_window.start, evening_window.end, evening_window.threshold);
var not_busy = new Bucket(midnight_window.start, midnight_window.end, midnight_window.threshold);

var NRQL = "SELECT uniquecount(JSESSIONID) FROM PageView WHERE (pageUrl LIKE '%checkout/order-receipt%' OR pageUrl like '%checkout/receipt-page%') AND (serverId like 'b%' or serverId like 'c%' ) since 5 minutes ago COMPARE WITH 5 minutes ago";

function checkDesktopOrders(){
  $http.get({
  url: 'https://insights-api.newrelic.com/v1/accounts/1075077/query',
    headers: {
      'Accept': 'application/json',
      'X-Query-Key':'1lkko45v_mlkXperaG4rg2qAWW-5nLUU'
    },
    qs : {
      'nrql': NRQL
    }
}, function(error, response, body) {
  
    if (!error && response.statusCode == 200) {
      var resultSet = JSON.parse(body);
      var currentCount = resultSet.current.results[0].uniqueCount;
      var previousCount = resultSet.previous.results[0].uniqueCount; 
      console.log("current order count - " + currentCount + " vs previous order count - " + previousCount);

      var difference = ((previousCount - currentCount) / previousCount) * 100;
      var date = new Date();
      var threshold = getThresholdBasedOnTimeWindow(date.getHours());
      console.log("threshold for the current time period is " + threshold + " and variance is " + difference);
      
      if(!isAlertsPeriodSilent()){
        if(difference < threshold){
          console.log("orders dropped with rate " + difference + " against a threshold value of " + threshold);
          triggerAlert("Incident Raised - Desktop Orders Drop Limit Breached: Raise P3 Inc [Callout:JLWEBSUPP]", difference, threshold);
        }
        //assert(-variance < threshold, "Orders drop should not below the threshold set, it is " + variance + " against threshold of " + threshold);
      }
    }
})
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

function getThresholdBasedOnTimeWindow(currentHour){

    if (currentHour >= little_busy.start && currentHour < little_busy.end){
        return little_busy.threshold;
    } else if(currentHour >= very_busy.start && currentHour < very_busy.end) {
        return very_busy.threshold;
    } else if(currentHour >= somewhat_busy.start && currentHour != 0){
        return somewhat_busy.threshold;
    } else if(currentHour >= not_busy.start && currentHour < not_busy.end){
        return not_busy.threshold;
    } else {
      return ERROR_THRESHOLD;
    }
}

function triggerAlert(message, difference, threshold){
 // $http.get({
   // url: 'http://98b58899.ngrok.io/message/'+encodeURI(message)
  //}, function(error, response, body) {
   // console.log(response.statusCode);
    //assert(difference < threshold, "Orders drop should not be below the threshold set, it is " + difference + " against threshold of " + threshold);
  //})
  mailsender.sendmail(mailOptions);
}
/*
function _execute(){
    setInterval(function () {
        checkDesktopOrders();
    }, 300000);
}
*/
checkDesktopOrders();

//module.exports = _execute;

var template = '<div style="border-left:1px solid rgb(240,240,240);border-right:1px solid rgb(240,240,240)"><div style="border-left:1px solid rgb(235,235,235);border-right:1px solid rgb(235,235,235)"><div style="border-left:1px solid rgb(231,231,231);border-right:1px solid rgb(231,231,231)"><div style="border-left:1px solid rgb(226,226,226);border-right:1px solid rgb(226,226,226)"><div style="border-top:5px solid rgb(213,90,107)"></div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);font-size:14px"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px"><img src="john-lewis-logo.gif" alt="New Relic" class="CToWUd" height="16" width="90"></td></tr><tr><td style="padding-top:0;padding-bottom:25px;padding-left:25px;padding-right:25px"><div><div><span>New Incident </span> opened at <script>document.write(new Date());</script></div></div></td></tr></tbody></table><div style="border-top:1px solid rgb(228,228,228)"></div><div style="border-top:1px solid rgb(233,233,233)"></div><div style="border-top:1px solid rgb(239,239,239)"></div><div style="border-top:1px solid rgb(244,244,244)"></div><div><div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);background-color:rgb(242,242,242);border-bottom:1px solid rgb(234,234,234);white-space:nowrap"><tbody><tr><td style="padding-top:15px;padding-bottom:0;padding-left:25px;padding-right:25px"><div id="text" style="text-decoration:none;color:rgb(75,143,171)"><span style="font-size:130%;font-weight:bold;padding-top:10px;padding-bottom:0">Desktop Orders Drop Limit Breached: Raise P3 Inc [Callout:JLWEBSUPP]</span></div></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;font-size:120%;white-space:normal"></td></tr></tbody></table></div></div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);border-bottom:1px solid rgb(234,234,234)"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:20px 0px 20px 0px"><table style="width:300px;border-collapse:separate;border-spacing:10px;color:rgb(84,84,84)" align="center"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:8px 8px 8px 8px;text-align:center;white-space:nowrap;color:rgb(255,255,255)"><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84)"><tbody><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:0;text-align:center;white-space:nowrap;color:rgb(255,255,255);background-color:rgb(102,102,102);font-size:18px">Script Logs</td></tr></tbody></table></td><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding:8px 8px 8px 8px;text-align:center;white-space:nowrap;color:rgb(255,255,255)"><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84)"><tbody><tr></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="padding-top:25px;padding-bottom:25px;padding-left:25px;padding-right:25px;padding-top:0px"><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);margin-bottom:20px"><tbody><tr style="background-color:rgb(242,242,242)"><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left;width:115px">Start/End</td><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left"><span><script>document.write(new Date());</script></span></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left;width:115px">Duration</td><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left">5 minute(s)</td></tr></tbody></table></td></tr></tbody></table><div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);border-bottom:none"><tbody><tr><td style="padding-top:25px;padding-bottom:0;padding-left:25px;padding-right:25px"> <p style="margin-top:0;margin-bottom:10px"> <span>2</span> channels notified </p><table style="width:100%;border-collapse:collapse;border-spacing:0;color:rgb(84,84,84);margin-bottom:20px"><tbody><tr style="background-color:rgb(242,242,242)"><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left;width:115px">Email</td><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left"><a href="mailto:Jubilee_House_Operations_Bridge@johnlewis.co.uk" target="_blank">Jubilee_House_Operations_<wbr></wbr>Bridge@johnlewis.co.uk</a></td></tr><tr><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left;width:115px">Email</td><td style="padding-top:10px;padding-bottom:10px;padding-left:25px;padding-right:25px;border-bottom:1px solid rgb(234,234,234);border-top:1px solid rgb(234,234,234);text-align:left"><a href="mailto:z_jl_oas_website_front_office_support_team@johnlewis.co.uk" target="_blank">z_jl_oas_website_front_office_<wbr></wbr>support_team@johnlewis.co.uk</a></td></tr></tbody></table></td></tr></tbody></table></div><table style="width:100%;border-collapse:collapse;border-spacing:0;color:white;border-bottom:1px solid rgb(234,234,234);background-color:rgb(89,89,89)"></table></div></div></div></div>';