const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const path = require('path');

const Airtable = require("airtable");
const { request } = require("http");
const base = new Airtable({
  apiKey:'keyYuf3wzo9M2rVP0'
}).base('appuAsYf2d96dKX9i');

// Cache the records in case we get a lot of traffic.
// Otherwise, we'll hit Airtable's rate limit.
var cacheTimeoutMs = 5 * 1000; // Cache for 5 seconds.
var cachedResponse = null;
var cachedResponseDate = null;

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
        //this may need to get increased if people are submitting their work multiple times per day.
        maxRecords: 60,
        sort: [{ field: "Date", direction: "asc" }],
        view: "Grid view"
      })
      .firstPage(function(error, records) {
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
  const text = request.body.text;
  const author = request.body.author || "Guest";

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

app.get("*", function(request, response) {
  response.sendFile(__dirname + "/views/404.html");
});

var listener = app.listen(3000, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
