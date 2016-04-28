var express	= require('express');
var router	= express.Router();

//redirect if connected
router.use('*', function(req, res, next){
	if(!req.Auth.isLogged()){
		return res.redirect('/login');
	}
	return next();
});

router.get('/', function(req, res){
	res.locals.user = req.Auth.getUser();
	res.render('account');
});

module.exports = router;
