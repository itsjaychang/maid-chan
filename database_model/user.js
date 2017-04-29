var mongoose = require('mongoose');

mongoose.model('user', {
	'userId': String,
	'name': String,
	'points': Number
});