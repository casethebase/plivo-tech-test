const plivo = require('plivo');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(function (req, response, next) {
    response.contentType('application/xml');
    next();
});
app.set('port', (process.env.PORT || 3000));
app.all('/reply_sms/', function (request, response) {
    let from_number = request.body.From || request.query.From;
    let to_number = request.body.To || request.query.To;
    let text = request.body.Text || request.query.Text;
    console.log('Message received - From: ' + from_number + ', To: ' + to_number + ', Text: ' + text);

    //send the details to generate an XML
    let r = plivo.Response();
    let params = {
        'src': to_number,
        'dst': from_number,
    };
    let message_body = "Thank you Casey, we have received your request";
    r.addMessage(message_body, params);
    console.log(r.toXML());
    response.end(r.toXML());
});
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});