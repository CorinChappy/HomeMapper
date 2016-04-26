/*!
* Copyright 2016, - Thomas Dubosc (http://repraze.com)
* Released under the MIT license
*
* User model
*/
var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
	name		: {type: String, default: ''},
	email		: {type: String, default: ''},

	username	: {type: String, default: '', required: true, unique: true, dropDups: true, lowercase: true, trim: true},
	password	: {type: String, default: '', required: true}
});

module.exports = mongoose.model('User', userSchema);
