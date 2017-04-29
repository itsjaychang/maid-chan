const Discord = require('discord.js');
// const {stripIndents} = require('common-tags');
const mongoose = require('mongoose');
// const path = require('path');
const unirest = require('unirest');

const config = require('./config.json');
const users = require('./extra/user_tokens.json');
const misc = require('./extra/misc.json');
const user = require('./extra/user.js');

const client = new Discord.Client();

client.on('ready', () => {
	mongoose.connect(config.mongoURI);
	database = mongoose.model('user');
	console.log('Maid-Chan is ready to serve you Master~~~~');
});

client.on('message', (message) => {
	const prefix = config.prefix;
	const msg = message.content.toLowerCase();

	if (message.channel.type == 'dm') return;
	if (message.author.bot) return;
	if (!msg.startsWith(prefix)) return;

	// pokemon
	if (msg.startsWith(`${prefix} pokemon`)) {
		const getPokemonCount = function() {
			const promise = new Promise((resolve, reject) => {
				unirest.get('http://pokeapi.co/api/v2/pokemon-species')
					.end(function(res) {
						resolve(res.body.count);
					});
			}); 
			return promise;
		}
		const getPokemon = function(count) {
			const randomId = Math.floor(Math.random()*(count-1)+1);
			const promise = new Promise((resolve, reject) => {
				unirest.get('http://pokeapi.co/api/v2/pokemon/'+randomId)
					.end(function(res) {
						resolve(res.body);
					});
			})
			return promise;
		}
		const parsePokemonJSON = function(pokemonJSON) {
			console.log('works');
			const name = pokemonJSON.name.replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase()});;
			const spriteURL = pokemonJSON.sprites.front_default;
			const embed = new Discord.RichEmbed()
  				.setDescription(`A wild **${name}** appeared!!`)	
  				.setImage(spriteURL)
  			message.channel.sendEmbed(embed);
		}
		
		getPokemonCount()
			.then(getPokemon)
			.then(parsePokemonJSON);

		return;
	}

	// Slots
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
			const points = user ? user.points : 500;
			message.channel.sendMessage(`**${message.author.username}** has ${points} points`);
		})
		return;
	}

	if (msg.startsWith(`${prefix} gamble`)) {
		var splits = message.content.split(' ');
		var gambleAmount = Number(splits[2]);
		const id = message.author.id;

		if (Number.isNaN(gambleAmount)) {
			message.channel.sendMessage('Please gamble with proper amount baka');
			return;
		}

		const getUser = function() {
			const promise = new Promise((resolve, reject) => {
				database.findOne({'userId': id}, function(err, user) {
					resolve(user);
				})
			});
			return promise;
		}

		const gamble = function(user) {
			const promise = new Promise((resolve, reject) => {
				const currentAmount = user.points;
				const win = Math.random() < 0.5 ? true : false;
				const newAmount = win ? (currentAmount + gambleAmount) : (currentAmount - gambleAmount);
				message.channel.sendMessage(`**${message.author.username}**-sama you ${win ? 'win' : 'lose'}, ${currentAmount} => ${newAmount}`)
				resolve(newAmount);
			});
			return promise;
		}

		const updateUser = function (newAmount) {
			console.log(newAmount);
			database.update({'userId': id}, {$set: {'points': newAmount}}, function (err, user) {
				if (err) return handleError(err);
			});
			return;
		}

		const conditional = function(user) {
			if (user == null) {
				message.channel.sendMessage(`**${message.author.username}**-sama, do credits first <3`);
				return;
			} else if (user.points <= 0) {
				message.channel.sendMessage(`**${message.author.username}**-sama, your such a peasant, you have ${user.points} points :,(`);
				return;
			} else {
				return gamble(user).then(updateUser);
			}
		}
		getUser()
			.then(conditional);
	
		return;
	}

	// Both Masters and Baka
	if (msg.startsWith(`${prefix} help`)) {
		message.channel.sendEmbed({ description: 
			`
				**Commands**

				pocky
				hungry
				tell me _[~]_
				define _[~]_
				credits
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
		var splits = message.content.split(' ');
		splits.splice(0, 2);
		const search = splits.join('+');
		const word = splits.join(' ');

		unirest.get('http://api.urbandictionary.com/v0/define?term='+search)
			.end(function(res) {
    			if (res.error) {
    				message.channel.sendMessage('Something bad happenened... T______T');
    			} else {
    				if (res.body.result_type == 'exact') {
    					const item = res.body.list[0];
    					const definition = item.definition ? `${item.definition}` : '';
    					const example = item.example ? `${item.example}` : '';
    					message.channel.sendEmbed({ description: 
    						`
								**${word}**

								_Definition_
								${definition}

								_Example_
								${example}
							`
						});
					} else {
						message.channel.sendMessage(`What the hell is ${word} retard...`);
					};
    			};
    		});
		return;
	}

	if (msg == prefix) {
		message.channel.sendMessage(`How may I help you today **${message.author.username}**-sama~~~`);
		return;
	}

	message.channel.sendMessage(`Nani?!?!?! Watashi wa dont understand desu **${message.author.username}**-sama~~~`);
});

client.login(config.token);
