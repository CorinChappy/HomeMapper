/*!
* Copyright 2016, - Thomas Dubosc (http://repraze.com)
* Released under the MIT license
*
* Protection module
*/
var crypto = require('crypto');

module.exports = function(options){
	var options = options || {} ;

	return function(req, res, next){
		this.genToken = function(){
			return crypto.randomBytes(16).toString('hex');
		}

		this.session = req.session;
		if(!this.session._protection){
			this.session._protection = {
				csrf : this.genToken(),
				timestamp : new Date()
			};
			console.log("Protect timestamp : "+this.session._protection.timestamp);
		}

		var self = this;

		req.Protect = {
			isValidCSRF : function(){
				//if checked, we change it
				var csrf = self.session._protection.csrf;
				self.session._protection.csrf = self.genToken();

				if(req.body != null){
					if(req.body.csrf === csrf){
						return true;
					}
				}
				return false;
			}
		};

		res.locals.CSRF = function(){
			return '<input type="hidden" name="csrf" value="'+self.session._protection.csrf+'">';
		};

		next();
	}
}
