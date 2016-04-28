var express	= require('express');
var router	= express.Router();

var User = require(__dirname+'/../models/users.js');

var target = '/account';

//Login
var login = function(req, res){
	res.locals.form = req.body || {};
	res.render('login');
}

//redirect if connected
router.use('/login', function(req, res, next){
	if(req.Auth.isLogged()){
		return res.redirect(target);
	}
	return next();
});

router.get('/login', function(req, res){
	return login(req, res);
});

router.post('/login', function(req, res){
	var parsed = req.Validate({
		username: {value: req.body.username, type: 'String', trim: true, required: true, min: 1},
		password: {value: req.body.password, type: 'String', required: true, min: 1},
	});

	if(parsed.error){
		req.Notify(parsed.error[0], 'error');
		return login(req, res);
	}

	req.Auth.login(parsed.username, parsed.password, function(err, con){
		if(con){
			return res.redirect(target);
		}else{
			req.Notify("username or password incorrect", 'error');
		}

		return login(req, res);
	});
});

//Logout
router.use('/logout', function(req, res, next){
	req.Auth.logout();
	return res.redirect('/login');
});

//Sign Up
var signup = function(req, res){
	res.locals.form = req.body || {};
	res.render('signup');
}

//redirect if connected
router.use('/signup', function(req, res, next){
	if(req.Auth.isLogged()){
		return res.redirect(target);
	}
	return next();
});

router.get('/signup', function(req, res){
	return signup(req, res);
});

router.post('/signup', function(req, res){
	var parsed = req.Validate({
		username: {value: req.body.username, type: 'String', trim: true, required: true, min: 3, max: 20},
		email	: {value: req.body.email, type: 'Email', trim: true, required: true},
		password: {value: req.body.password, type: 'String', required: true, min: 6, max: 20},

		passwordCheck: {value: req.body.passwordCheck, type: 'String', required: true, silent: true, name: "password confirmation", match: function(){return req.body.password === req.body.passwordCheck}}
	});

	if(parsed.error){
		req.Notify(parsed.error[0], 'error');
		return signup(req, res);
	}

	User.findOne({username: parsed.username}, function(err,user){
		if(user){
			req.Notify("username already exists", 'error');
			return signup(req, res);
		}

		var user = new User(parsed);
		user.save(function (err, page) {
			if(err){
				console.log(err);
				req.Notify('An error has occured', 'error');
				return signup(req, res);
			}
			res.redirect('/login');
		});
	});
});

module.exports = router;
