// Boilerplate declarations
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const env = require('dotenv').config();
const axios = require('axios');
const path = require('path');
const Airtable = require("airtable");
const { request } = require("http");
const { apiKey } = require("airtable");
const cacheTimeoutMs = 5 * 1000; // Cache for 5 seconds.
const cachedResponse = null; // Otherwise, we'll hit Airtable's rate limit.
const cachedResponseDate = null; // Cache the records in case we get a lot of traffic.
const base = new Airtable({
    apiKey: process.env.AIRTABLEAPIKEY // Airtable API authentication
}).base(process.env.AIRTABLEBASE);

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(express.static("public"));

app.get("/", function(request, response) {

    if (cachedResponse && new Date() - cachedResponseDate < cacheTimeoutMs) {
      response.send(cachedResponse);
    } else {
      base("Pieces")
        .select({
          maxRecords: 1,
          sort: [{ field: "Date", direction: "desc" }],
          view: "Grid view"
        })
        .firstPage(function(error, records) {
          if (error) {
            response.send({ error: error });
          } else {
            let snippetText = records[0].fields.Text
            response.render(__dirname + "/views/index", {
              // trim the last text piece to 100 characters
              snippet: snippetText.substr(snippetText.length - 150)
            });
          }
        });
    }
});

app.get("/history", function(request, response) {

    if (cachedResponse && new Date() - cachedResponseDate < cacheTimeoutMs) {
        response.send(cachedResponse);
    } else {
        base("Pieces")
        .select({
        // This sets how many records can be written at one time
        maxRecords: 900,
        sort: [{ field: "Date", direction: "asc" }],
        view: "Grid view"
        }).firstPage(function(error, records) {
            if (error) {
                response.send({ error: error });
            } else {
                cachedResponse = {
                    records: records.map(record => {
                        return {
                            text: record.get("Text")
                        };
                    })
                };

                response.render(__dirname + "/views/history", {
                    texts: records
                });
            }
        });
    }
});



app.post("/submit", function(request, response) {
    const date = new Date();
    const author = request.body.author || "Guest";
    const text = request.body.text.toString();
    const number = request.body.number;
    const src = process.env.SRC

    console.log("SMS Content:" + " " + text);
    console.log("SMS Destination:" + " " + number);

    const plivo = require('plivo');
    const client = new plivo.Client(process.env.AUTHID, process.env.AUTHTOKEN);
    
    client.messages.create(
      '16028062506',
      '15127884684',
      'Hey Casey'
    ).then(function(message_created) {
      console.log(message_created)
    });

    base("Pieces").create(
    {
        Date: date,
        Text: text
    },
    { typecast: true },
    function(err, record) {
        if (err) {
            console.error(err);
        return;
    }
        console.log(record.getId());
        response.sendFile(__dirname + "/views/success.html");
    }
  );
});

app.all('/receive_sms/', function (request, response) {
    let from_number = '15127884684' || request.query.From;
    let to_number = '16028062506' || request.query.To;
    let text = 'Hey Casey' || request.query.Text;
    //Print the message
    console.log('Message received - From: ' + from_number + ', To: ' + to_number + ', Text: ' + text);
});

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

app.get("*", function(request, response) {
    response.sendFile(__dirname + "/views/404.html");
});

app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
