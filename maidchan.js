const Discord = require('discord.js');
const {stripIndents} = require('common-tags');
const mongoose = require('mongoose');
// const path = require('path');
const unirest = require('unirest');

const config = require('./config.json');
const users = require('./stuff/user_tokens.json');
const misc = require('./stuff/misc.json');
const user = require('./stuff/user.js');

const client = new Discord.Client();

client.on('ready', () => {
	mongoose.connect(config.dbURL);
	database = mongoose.model('user');
	console.log('thank goodness this works');
});

client.on('message', (message) => {
	const prefix = config.prefix;
	const msg = message.content.toLowerCase();

	if (message.channel.type == 'dm') return;
	if (message.author.bot) return;
	if (!msg.startsWith(prefix)) return;

	//test
	if (msg.startsWith(`${prefix} credits`)) {
		database.findOne({'userId': message.author.id}, function(err,user) {
			if (user == null) {
				const newUser = {
								name: message.author.username,
								userId: message.author.id,
								points: 500
								}
				database.create(newUser);
			}
			const points = user.points ? user.points : 500;
			message.channel.sendMessage(`${user.name} has ${points} points`);
		})
		return;
	}

	if (msg.startsWith(`${prefix} gamble`)) {
		const id = message.author.id;
		database.findOne({'userId': id}, function(err,user) {
			if (user == null) {
				message.channel.sendMessage(`${message.author.username}-sama, do credits first <3`)
				return;
			} else if (user.points <= 0) {
				message.channel.sendMessage(`${user.name}-sama, your such a peasant, you have ${user.points}`);
				return;
			} else {
				var splits = message.content.split(' ');
				var gamble = Number(splits[2]);
				var currentAmount = user.points;
				if (Math.random() > 0.5) {
					newAmount = currentAmount - gamble;
					message.channel.sendMessage(`${user.name}-sama you lose, ${currentAmount} => ${newAmount}`)
				} else {
					newAmount = currentAmount + gamble;
					message.channel.sendMessage(`${user.name}-sama you won, ${currentAmount} => ${newAmount}`)
				}
				database.update({'userId': id}, {$set: {'points': newAmount}},
                 function (err, user) {
                     if (err) return handleError(err);
                 });
			}
		})
		return;
	}

	// Both Masters and Baka
	if (msg.startsWith(`${prefix} help`)) {
		message.channel.sendEmbed({
			description: `
				**Commands**

				pocky
				hungry
				tell me [     ]
				define [     ]
				credits
				gamble [#]
			`
		})
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
		message.channel.sendMessage('Go away baka!!')
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
		var splits = message.content.split(' ');
		splits.splice(0, 2);
		const search = splits.join("+")
		const word = splits.join(" ")

		unirest.get("http://api.urbandictionary.com/v0/define?term="+search)
			.end(function(res) {
    			if (res.error) {
    				message.channel.sendMessage('Something bad happenened... T______T');
    			} else {
    				if (res.body.result_type == 'exact') {
    					const item = res.body.list[0];
    					const definition = item.definition ? `${item.definition}` : '';
    					const example = item.example ? `${item.example}` : '';
    					message.channel.sendEmbed({
							description: `
								**${word}**

								_Definition_
								${definition}

								_Example_
								${example}
							`
						});
					} else {
						message.channel.sendMessage(`What the hell is ${word} retard...`);
					}
    			};
    		});
		return;
	}

	message.channel.sendMessage(`Nani?!?!?! Watashi wa dont understand desu ${message.author}-sama~~~`);
});

client.login(config.token);
