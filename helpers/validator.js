/*!
* Copyright 2016, - Thomas Dubosc (http://repraze.com)
* Released under the MIT license
*
* Validation module
*/
module.exports = function(options){
	var options = options || {};

	return function(req, res, next){
		var self = this;

		var valid = {};

		valid.String = {
			run : function(field, name){
				var val = field.value;
				if(!typeof val === 'string'){
					throw new Error(name+' is not a String');
				}
				if(field.trim){
					val = val.trim();
				}
				if(field.min && val.length < field.min){
					throw new Error(name+' is too short');
				}
				if(field.max && val.length > field.max){
					throw new Error(name+' is too long');
				}

				return val;
			}
		}
		valid.Email = {
			run : function(field, name){
				var val = field.value;
				if(!typeof val === 'string'){
					throw new Error(name+' is not a String');
				}
				val = val.trim();

				var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				if(!re.test(val)){
					throw new Error(name+' is not valid');
				}

				return val;
			}
		}

		var _validate = function(field, fname){
			if(!field) return {};

			var name = field.name || fname || "field";

			if(field.required && (! field.value)){
				throw new Error(name+' is required');
			}

			if(field.type){
				var val = valid[field.type].run(field, name);

				//special match check
				if(field.match && field.match instanceof Function){
					if(!field.match(val)){
						throw new Error(name+' does not match');
					}
				}

				//only return if not silent
				if(!field.silent){
					return val;
				}
			}

			return null;
		}

		req.Validate = function(v){
			var parsed = {};

			for(var field in v){
				try{
					var val = _validate(v[field], field);
					if(val !== null){
						parsed[field] = val;
					}
				} catch(ex){
					if(!parsed.error){
						parsed.error = [];
					}
					parsed.error.push(ex.message);
				}
			}

			return parsed;
		}

		next();
	}
}
