/*!
* Copyright 2016, - Thomas Dubosc (http://repraze.com)
* Released under the MIT license
*
* Auth module
* TODO : implement password ciphering
*/
var User = require(__dirname+'/../models/users.js');

module.exports = function(options){
	var roles = options.roles || [];

	return function(req, res, next){
		this.session = req.session;
		var self = this;

		var setup = function(req, res, next){
			req.Auth = {
				login : function(username, password, callback){
					User.findOne({username: username}, function(err,user){
						if(err || user == null){
							return callback(err, false);
						}
						if(user.password === password){
							self.session._auth.logged = true;
							self.session._auth.user = user;
							return callback(err, true);
						}
						return callback(err, false);
					});
				},
				logout : function(){
					if(self.session._auth.logged){
						self.session._auth.logged = false;
						self.session._auth.user = false;
						return true;
					}
					return false;
				},
				isLogged : function(){
					return self.session._auth.logged;
				},
				getUser : function(){
					return self.session._auth.user;
				}
			};

			next();
		}

		if(!this.session._auth){
			this.session._auth = {
				logged	: false,
				user	: null
			};

			return setup(req, res, next);
		}
		//if logged, retrieve user
		else if(this.session._auth.logged){
			User.findOne({_id: this.session._auth.user._id}, function(err,user){
				self.session._auth.user = user;

				return setup(req, res, next);
			});
		}else{
			return setup(req, res, next);
		}
	}
}
