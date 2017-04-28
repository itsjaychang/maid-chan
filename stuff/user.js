var mongoose = require('mongoose');

mongoose.model('user', {
	name: String,
	userId: String,
	points: Number
});