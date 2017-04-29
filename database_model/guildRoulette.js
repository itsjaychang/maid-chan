var mongoose = require('mongoose');

mongoose.model('guildRoulette', {
	'guildId': String,
	'roulette': Boolean
})