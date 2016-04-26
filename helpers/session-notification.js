/*!
* Copyright 2016, - Thomas Dubosc (http://repraze.com)
* Released under the MIT license
*
* Notification module
*/
module.exports = function(options){
	var options = options || {} ,
		min	= options.min || 100 ,
		types = options.types || [],
		defaultType = options.defaultType || "info",
		template = options.template;


	return function(req, res, next){
		this.session = req.session;
		if(!this.session._notifications){
			this.session._notifications = [];
		}

		var self = this;

		req.Notify = function(message, type){
			var type = type || defaultType;

			//check if type is in array
			if(types.length == 0 || types.indexOf(type) > -1){
				self.session._notifications.push({
					message	: message,
					type	: type
				});
			}else{
				console.error(type+" is not part of the supported types");
			}
		}

		res.locals.Notifications = function(type){
			var output = "";

			//compute Notifications to be displayed
			var notifs = [];
			//filter out the ones displayed and add them to the array
			self.session._notifications = self.session._notifications.filter(function( obj ) {
				if(!type || obj.type === type){
					notifs.push(obj);
					return false;
				}
				return true;
			});

			if(template){
				res.locals.notifications = notifs;
				res.render(template, res.locals, function(err, html){
					if(err){
						console.error(err);
					}
					if(html){
						output = html;
					}
				});
			}else{
				var buffer = [];
				buffer.push('<ul class="notifications">');
				for(var i = 0; i < notifs.length; i++){
					var notif = notifs[i];
					if(!type || type == notif.type){
						buffer.push('<li class="'+notif.type+'">'+notif.message+'</li>');
					}
				}
				buffer.push('</ul>');

				output = buffer.join('\n');
			}

			return output;
		}

		next();
	}
}
