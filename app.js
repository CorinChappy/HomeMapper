var express = require('express');
var engine = require('ejs-mate');
var session = require('express-session');

var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var app = module.exports = express();

var settings = require(__dirname+"/settings/settings.json");
var menu = require(__dirname+"/settings/menu.json");

var port = 8080;


//default
app.use(function(req, res, next){
	res.header("X-powered-by", settings.title+" Engine");
	res.locals.global = {
		base	: req.protocol + '://' + req.hostname + ':' + port,
		url		: req.protocol + '://' + req.hostname + ':' + port + req.originalUrl,
		urlPg	: req.protocol + '://' + req.hostname + ':' + port + req.originalUrl.split("?")[0]
	};

	res.locals.stg = settings;
	res.locals.menu = menu;
	next();
});

//local dir
app.use(express.static(__dirname+'/public'));

//parser for post messages
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//set the view engine to ejs with ejs mate
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');

// Routes
app.use('/', require(__dirname+'/routes/index'));


//if called directly, start server
if(require.main === module){
	//Start server
	app.listen( port, function() {
		console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
	});
}
