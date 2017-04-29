const Discord = require('discord.js');

// Entry
const begin = function(message) {
	getGuildStatus(message)
		.then(guildStatus)
}

const help = function(message) {
	message.channel.sendEmbed({ description: 
		`
			**ROULETTES**

			_mc roulette_ to create account if you haven't already

			to begin, _mc roulette start_

			_mc bet ###_ to add to the pool
			
			the higher you bet, the higher chance you have to win
		`
	});
}

const account = function(message) {
	getGuildStatus(message)
		.then(function({message, rouletteStatus}) {
			userRouletteDatabase.findOne({'userId': message.author.id, 'guildId': message.guild.id}, function(err, user) {
				if (user == null) {
					const newUser = {
						'userId': message.author.id,
						'name': message.author.username,
						'guildId': message.guild.id,
						'choice': 0,
						'bet': 0,
						'bank': 1000
					}
					userRouletteDatabase.create(newUser);
					user = newUser;
				}
				message.channel.sendEmbed({ description: 
					`
						**${message.author.username}**
						bank = ${user.bank}

						${rouletteStatus ? `has bet **${user.bet ? user.bet : 'nothing'}**` : 'No roulette game right now'}
					`
				});
			})
		})
}

const bet = function(message) {
	const splits = message.content.split(' ');
	const amount = Math.min(Number(splits[2]),1000);
	if (!Number.isInteger(amount)) {
		message.channel.sendMessage('please enter a value');
		return;
	}
	getGuildStatus(message)
		.then(rouletteStatus)
		.then(getUser)
		.then(betAmount)
}


// const choose = function(message) {
// 	const splits = message.content.split(' ');
// 	const value = Math.min(Number(splits[2]),1000);
// 	if (!Number.isInteger(value)) {
// 		message.channel.sendMessage('please enter a value');
// 		return;
// 	}
// 	getGuildStatus(message)
// 		.then(rouletteStatus)
// 		.then(getUser)
// 		.then(choseValue)
// } 

////////////////////////////
const rouletteStatus = function({message, rouletteStatus}) {
	const promise = new Promise((resolve, reject) => {
		if (rouletteStatus == false) {
			message.channel.sendMessage('no roulette game happening');
			reject()
		} else {
			resolve(message)
		}
	})
	return promise;
}

const getUser = function(message) {
	const promise = new Promise((resolve, reject) => {
		userRouletteDatabase.findOne({'userId': message.author.id, 'guildId': message.guild.id}, function(err, user) {
			if (user) {
				resolve(message);
			} else {
				message.channel.sendMessage('make a roulette account with _mc roulette_');
				reject();
			}
		})
	})
	return promise;
}

const betAmount = function(message) {
	const splits = message.content.split(' ');
	const amount = Math.min(Number(splits[2]),1000);
	message.channel.sendMessage(`betting ${amount}`);
	userRouletteDatabase.findOne({'userId': message.author.id, 'guildId': message.guild.id}, function(err, user) {
		if (user) { 
			var newBet = Math.min(Math.max(0, user.bet + amount), 500);
			if (newBet > user.bank) newBet = user.bank;
			userRouletteDatabase.update({'userId': message.author.id, 'guildId': message.guild.id}, {$set: {'bet': newBet}}, function (err, user) {
				if (err) return handleError(err);
			});
			message.channel.sendEmbed({ description: 
				`
					**${message.author.username}**
					bank = ${user.bank}

					has bet **${newBet}**
				`
			});
		} else {
			message.channel.sendMessage('make a roulet account');
		}
	})
}

// const choseValue = function(message) {
// 	const splits = message.content.split(' ');
// 	const value = Number(splits[2]);
// 	message.channel.sendMessage(`chose ${value}`);
// 	userRouletteDatabase.findOne({'userId': message.author.id, 'guildId': message.guild.id}, function(err, user) {
// 		if (user) {
// 			const newChoice = value;
// 			userRouletteDatabase.update({'userId': message.author.id, 'guildId': message.guild.id}, {$set: {'choice': newChoice}}, function (err, user) {
// 				if (err) return handleError(err);
// 			});
// 			message.channel.sendEmbed({ description: 
// 				`
// 					**${message.author.username}**
// 					bank = ${user.bank}

// 					has bet **${user.bet ? user.bet : 'nothing'}** on **${newChoice}**
// 				`
// 			});
// 		} else {
// 			message.channel.sendMessage('make a roulet account');
// 		}
// 	})
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const getGuildStatus = function(message) {
	const promise = new Promise((resolve, reject) => {
		const guildId = message.guild.id;
		guildRouletteDatabase.findOne({'guildId': guildId}, function(err, guild) {
			if (guild == null) {
				const newGuild = {
					guildId: guildId,
					roulette: false
				}
				guildRouletteDatabase.create(newGuild);
				guild = newGuild;
			}
			resolve({message: message, rouletteStatus: guild.roulette})
		})
	})
	return promise;
}

const guildStatus = function({message, rouletteStatus}) {

	if (rouletteStatus == false) {
		guildRouletteDatabase.update({'guildId': message.guild.id}, {$set: {'roulette': true}}, function (err, guild) {
			if (err) return handleError(err);
			startRoulette(message, message.guild.id);
		});
	} else {
		message.channel.sendMessage('roulette already started');
	}
}

const startRoulette = function(message, guildId) {
	message.channel.sendEmbed({ description: 
		`
			**ROULETTE HAS STARTED**

			_mc roulette account_ to create account if you haven't already
			_mc bet ###_ to add to the pool
			the higher you bet, the higher chance you have to win
		`
	});

	const delay = function({message,time}) {
		const promise = new Promise((resolve, reject) => {
			setTimeout(function() {
				remainingTime = time - 5000;
				message.channel.sendMessage(`timeremaining ${remainingTime/1000} sec`);
				// message.channel.sendEmbed({ description: 
				// 	`
				// 		**ROULETTE HAS ${remainingTime/1000} seconds left**
				// 		_mc bet ###_ to add to your pool
				// 		_mc choose ###_ to choose your number
				// 	`
				// });		
			resolve({message: message, time: remainingTime});
			}, 5000);
		})
		return promise;
	}
	const start = function({message,time}) {
		const promise = new Promise((resolve, reject) => {
			message.channel.sendMessage(`timeremaining ${time/1000} sec`);
			// message.channel.sendEmbed({ description: 
			// 	`
			// 		**ROULETTE HAS ${remainingTime/1000} seconds left**
			// 		_mc bet ###_ to add to your pool
			// 		_mc choose ###_ to choose your number
			// 	`
			// });

			resolve({message: message, time: time});
		})
		return promise;
	}

	start({message: message,time: 30000})
		.then(delay)
		.then(delay)
		.then(delay)
		.then(delay)
		.then(delay)
		.then(delay)
		.then(endRoulette)
		.then(getParticipants)
		// .then(animation)
		.then(chooseWinner)
}

const endRoulette = function({message,time}) {
	const promise = new Promise((resolve, reject) => {
		guildRouletteDatabase.update({'guildId': message.guild.id}, {$set: {'roulette': false}}, function(err, guild) {
			if (err) return handleError(err);
			message.channel.sendMessage('roulette has ended');
			resolve(message);
		})	
	})
	return promise;
}

const getParticipants = function(message) {
	const promise = new Promise((resolve, reject) => {
		userRouletteDatabase.find({'guildId': message.guild.id, 'bet': {$ne:null}}, function(err, users) {
			var raffle = [];
			var pot = 0;
			users.forEach(function(user, index) {
				pot += users[index].bet;
				var userArray = new Array(users[index].bet);
				userArray.fill(index)
				raffle = raffle.concat(userArray);			
			});
			message.channel.sendEmbed({description: 
				`
					${users.map(user => 
					`**${user.name}** has bet **${user.bet}** and has a **${(user.bet/pot*100).toFixed(2)}%** chance to win
					`).join('')}
				`
			})
			resolve({message:message,users:users, pot:pot, raffle:raffle});
		});	
	});
	return promise;
}

// const animation = function({message, users, pot, raffle}) {
// 	const promise = new Promise((resolve, reject) => {
// 		message.channel.sendMessage(`calculating winner,,,,,,,,,`);				
// 			resolve({message:message,users:users, pot:pot, raffle:raffle});
// 		}, 3000);
// 	})
// 	return promise;
// }

const chooseWinner = function({message, users, pot, raffle}) {

	shuffle(raffle);
	// console.log(raffle)
	const randomIndex = Math.floor(Math.random() * (raffle.length + 1));
	const winnerIndex = raffle[randomIndex];
	const winningUser = users[winnerIndex];
	pot = pot - winningUser.bet;
	console.log(pot);

				setTimeout(function() {	

	message.channel.sendMessage(`the winnner is ${winningUser.name} and won ${pot}`);
	
	users.forEach(function(user) {
		// console.log(winningUser);
		// console.log(user);
		if (user.userId == winningUser.userId) {
			userRouletteDatabase.update({'userId': user.userId}, {'choice': null, 'bet': null, 'bank': (user.bank + pot)}, function(err, user) {
				console.log("winner")
				if (err) return handleError(err);
			})	
		} else {
			userRouletteDatabase.update({'userId': user.userId}, {'choice': null, 'bet': null, 'bank': (user.bank - user.bet)}, function(err, user) {
				console.log("reg")
				if (err) return handleError(err);
			})				
		}
	})
			}, 3000);

}

function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}

module.exports = {begin, account, bet, help};