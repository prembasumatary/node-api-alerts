var nodemailer = require('nodemailer');
// create reusable transporter object using the default SMTP transport
transporter = nodemailer.createTransport({
    service : 'Gmail',
    auth : {
        user : "alertsjl@gmail.com",
        pass : "alertsjl123$$"
    }
});

//export it so that it is available in other modules
//exports.transporter = transporter;

//function to end mails
exports.sendmail = function (mailOptions){
    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });    
}