const hb = require("express-handlebars");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const secrets = require("./secrets.json");
const https = require('https');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');


app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static('./public'));

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieSession({
    secret: 'my secret',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));



app.engine('handlebars', hb({defaultLayout:'layout', css: '../style.css'}));
app.set('view engine', 'handlebars');








app.get('/', function(req, res) {
    getAccessToTroiposo();
    res.render('welcome', {
        welcome:`You only live once. Travel`
    })

});


app.post('/select-city', function(req,res) {
    console.log("post body", req.body["select-city"][0]);
    let city = req.body["select-city"][0]
    req.session.city = city;
    console.log("req.session.city",req.session.city);
    res.redirect('/selectActivity')
})

app.get('/selectActivity', function(req,res) {
    res.render('selectActivity', {
        welcome:`Welcome to ${req.session.city}`,
        city:req.session.city
    })
})

app.post('/selectActivity', function(req,res) {
    console.log("select activity body", req.body);
    let activity = req.body["select-activity"][0]
    req.session.activity = activity
    console.log(req.session);
    res.redirect('/activities')
})

app.get('/activities', function(req,res) {
    let path;
    if(req.session.activity == 'Things To Do') {
        path = "poi"
    } else if (req.session.activity == "Info About " + req.session.city) {
        path = "tag"
    } else if (req.session.activity == "Event") {
        path = "local_event"
    }
    console.log(path,"path");
    getAccessToTroiposo(path, req.session.city)
    .then((response) => {

            res.render('activities', {
                welcome:`Welcome to ${req.session.city}`,
                city:req.session.city,
                activity_one: response.results[0].name,
                description_one: response.results[0].snippet,
                activity_two: response.results[1].name,
                description_two:response.results[1].snippet,
                activity_three:response.results[2].name,
                description_three:response.results[2].snippet
            })
    })
    .catch((err) => {
        console.log("error in redirecting to activities", err);
        response.redirect('/welcome', {
            error: "something went wrong"
        })

    })

})





app.listen(process.env.PORT || 8080, () => console.log(`I'm listening`) );

//===============get access to API======================

function getAccessToTroiposo(path, city) {
    return new Promise((resolve,reject) => {
        const account = secrets.accountId
        const token = secrets.token
        console.log("secrets", secrets);
        const options = {
            host:"www.triposo.com",
            path:`/api/20180206/${path}.json?account=${account}&token=${token}&location_id=${city}`,
            method: "GET",
        }

        console.log("options.path", options.path);

        const callBack = function(response) {
            var body = ''

            response.on('data', function(chunk) {
                body += chunk;
            })

            response.on('end', function() {
                const parsedBody = JSON.parse(body)
                console.log(parsedBody);
                resolve(parsedBody)  //return parsedBody

            })
            response.on("error", err => reject(err));
        }

        const request = https.request(options, callBack)

        request.end()
    })

}


// Your API token is:
//
// s9ffq4rfygnum9xh7opixq3lbpqqu67v

// display name:
// hila@SPICED
