var express	= require('express');
var router	= express.Router();
var fs = require('fs');

router.get('/', function(req, res){
	res.render('index');
});

router.post('/', function(req, res){
	var loc = req.body.location;
	if(loc != null && typeof loc === 'string'){
		loc = loc.trim();

		if(loc != ""){
			return res.redirect('/map?location='+encodeURIComponent(loc));
		}
	}
	res.render('index');
});

router.get('/map', function(req, res){
	var loc = req.query.location || "";
	loc = decodeURIComponent(loc);

	res.locals.location = loc;
	res.render('map');
});

router.get('/pages/:page', function(req, res){
	var path = __dirname+'/../pages/'+req.params.page+".ejs";
	fs.exists(path, function(exists) {
    	if (exists) {
			res.render(path, res.locals, function(err, html){
				if(err){
					console.log(err);
					return res.render('error');
				}else{
					res.locals.page = html || "";
					res.render('page');
				}
			});
		}else{
			return res.render('error');
		}
	});
});

module.exports = router;
