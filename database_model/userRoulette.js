var mongoose = require('mongoose');

mongoose.model('userRoulette', {
	'userId': String,
	'name': String,
	'guildId': String,
	'choice': String,
	'bet': Number,
	'bank': Number
});