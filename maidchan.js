const Discord = require('discord.js');
const mongoose = require('mongoose');
const unirest = require('unirest');

const config = require('./config.json');
const users = require('./extra/user_tokens.json');
const misc = require('./extra/misc.json');

const pokemon = require('./fun/pokemon.js');
const slots = require('./fun/slots.js');
const urbanDict = require('./fun/urbanDict.js');
const roulette = require('./fun/roulette.js');

require('./database_model/guildRoulette.js');
require('./database_model/userRoulette.js');
require('./database_model/user.js');

const client = new Discord.Client();

client.on('ready', () => {
	mongoose.connect(config.mongoURI);
	userDatabase = mongoose.model('user');
	guildRouletteDatabase = mongoose.model('guildRoulette');
	userRouletteDatabase = mongoose.model('userRoulette');
	console.log('Maid-Chan is ready to serve you Master~~~~');
});

client.on('message', (message) => {
	const prefix = config.prefix;
	const msg = message.content.toLowerCase();

	if (message.channel.type == 'dm') return;
	if (message.author.bot) return;

	if (msg.startsWith('bet')) {
		guildRouletteDatabase.findOne({'guildId': message.guild.id}, function(err, guild) {
			if (guild != null && guild.roulette == true) {
				roulette.bet(message);
			}
		})
	}

	if (msg == ('status')) {
		guildRouletteDatabase.findOne({'guildId': message.guild.id}, function(err, guild) {
			if (guild != null && guild.roulette == true) {
				roulette.account(message);
			}
		})
	}

	if (msg == ('roulette')) {
		guildRouletteDatabase.findOne({'guildId': message.guild.id}, function(err, guild) {
			if (guild != null && guild.roulette == true) {
				roulette.roulette(message);
			}
		})
	}

	if (!msg.startsWith(prefix)) return;

	// Pokemon.js
	if (msg.startsWith(`${prefix} pokemon`)) {
		pokemon.getPokemon(message);
		return;
	}

	// Slots.js
	if (msg.startsWith(`${prefix} points`)) {
		slots.points(message);
		return;
	}

	if (msg.startsWith(`${prefix} gamble`)) {
		slots.gamble(message);
		return;
	}

	// Roulette.js
	if (msg == `${prefix} roulette start`) {
		roulette.begin(message);
		return;
	}

	if (msg == `${prefix} roulette status`) {
		roulette.account(message);
		return;
	}

	if (msg.startsWith(`${prefix} roulette`)) {
		roulette.help(message);
		return;
	}

	// if (msg.startsWith(`${prefix} choose`)) {
	// 	roulette.choose(message);
	// 	return;
	// }

	// if (msg == `${prefix} status` || msg == `${prefix} create`) {
	// 	roulette.account(message);
	// 	return;
	// }
	// Both Masters and Baka
	if (msg.startsWith(`${prefix} help`)) {
		message.channel.sendEmbed({ description: 
			`
				**Commands**

				pocky
				hungry
				tell me _[~]_
				define _[~]_
				points
				gamble [#]
				pokemon
			`
		});
		return;
	}

	if (msg.startsWith(`${prefix} hungry`)) {		
		if (users.bakas.includes(message.author.id)) {
			message.channel.sendMessage('Do you feel like eating shit?')
			return;
		}	
		const randomFood = misc.foods[Math.floor((Math.random()*misc.foods.length))];
		message.channel.sendMessage(`Do you feel like eating ${randomFood}?`);
		return;
	}

	// Filter out the stupid Bakas
	if (users.bakas.includes(message.author.id)) {
		message.channel.sendMessage('Go away baka!!');
		return;
	}

	// Only Masters
	if (msg.startsWith(`${prefix} pocky`)) {
		if (users.masters.includes(message.author.id)) {
			message.channel.sendMessage('Ohkay!!! Say Ahhhhhhh~~~ *Feeds Pocky*');
		} else {
			message.channel.sendMessage('No, go away, I only feed my master~~~');
		}
		return;
	}

	if (msg.startsWith(`${prefix} tell me`)) {
		const answer = misc.eightball[Math.floor((Math.random()*misc.eightball.length))];
		message.channel.sendMessage(`${answer}`);
		return;
	}

	if (msg.startsWith(`${prefix} define`)) {
		urbanDict.define(message);
	}

	if (msg == prefix) {
		message.channel.sendMessage(`How may I help you today **${message.author.username}**-sama~~~`);
		return;
	}

	message.channel.sendMessage(`Nani?!?!?! Watashi wa dont understand desu **${message.author.username}**-sama~~~`);
});

client.login(config.discordToken);
