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

			_mc roulette_ to create account if you haven't already (or just _status_ if a game is happening)

			to begin, _mc roulette start_

			Once games start all you need to do is (dont need to type mc)
			_bet [amount]_ to bet 
			_roulette_ to see current bets
			_status_ to check your own status
			
			the higher you bet, the higher chance you have to win
		`
	});
}

const roulette = function(message) {
	userRouletteDatabase.find({'guildId': message.guild.id, 'bet': {$ne:null}}, function(err, users) {
		message.channel.sendEmbed({ description: 
			`
				${users.length == 0 ? 'No one currently betting' : users.map(user => `**${user.name}** has currently bet **${user.bet}**`).join('')}
			`, color: 15473237
		})
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
						'choice': null,
						'bet': null,
						'bank': 1000
					}
					userRouletteDatabase.create(newUser);
					user = newUser;
				}
				message.channel.sendEmbed({ description: 
					`
						**${message.author.username}**

						bank = ${user.bank}
						${rouletteStatus ? (user.bet ? `bet = **${user.bet}**` : 'No bets yet') : 'No roulette game right now to bet'}
					`, color: 15473237
				});
			})
		})
}

const bet = function(message) {
	const splits = message.content.split(' ');
	const amount = Number(splits[1]);
	if (!Number.isInteger(amount)) {
		message.reply('Please enter a value');
		return;
	}
	getUser(message)
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
// const rouletteStatus = function({message, rouletteStatus}) {
// 	const promise = new Promise((resolve, reject) => {
// 		if (rouletteStatus == false) {
// 			message.channel.sendMessage('no roulette game happening');
// 			reject()
// 		} else {
// 			resolve(message)
// 		}
// 	})
// 	return promise;
// }

const getUser = function(message) {
	const promise = new Promise((resolve, reject) => {
		userRouletteDatabase.findOne({'userId': message.author.id, 'guildId': message.guild.id}, function(err, user) {
			if (user) {
				resolve({message: message, user: user});
			} else {
				message.reply('Make a roulette account with _status_');
				reject();
			}
		})
	})
	return promise;
}

const betAmount = function({message, user}) {
	const splits = message.content.split(' ');
	const amount = Math.min(Number(splits[1]),500); // Max bet
	var newBet = Math.max(0, user.bet + amount);
	if (newBet > user.bank) newBet = user.bank;
	userRouletteDatabase.update({'userId': message.author.id, 'guildId': message.guild.id}, {$set: {'bet': newBet}}, function (err, user) {
		if (err) return handleError(err);
	});
	message.channel.sendEmbed({ description: 
		`
			**${message.author.username}** has bet **${newBet}**
		`, color: 15473237
	});
	return;
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
			playRoulette(message, message.guild.id);
		});
	} else {
		message.channel.sendMessage('roulette already started');
	}
}

const playRoulette = function(message, guildId) {
	const delay = function({message,time}) {
		var remainingTime = time - 1000;
		const promise = new Promise((resolve, reject) => {
			setTimeout(function() {
				if (remainingTime <= 0) {
					message.channel.sendEmbed({ description: 
					`
						**ROULETTE HAS ENDED**
					`
					});	
					guildRouletteDatabase.update({'guildId': message.guild.id}, {$set: {'roulette': false}}, function(err, guild) {
						if (err) return handleError(err);		
					})	
					resolve(message);
				} else if ((remainingTime%5000 == 0 && remainingTime <= 20000)){
					message.channel.sendEmbed({ description: 
					`
						**ROULETTE HAS ${remainingTime/1000} seconds left**
						${remainingTime > 10000 ? `
						_bet [amount]_ to bet 
						_roulette_ to see current bets
						_status_ to check your own status` : ''
						}
					`
					});	
					resolve({message: message, time: remainingTime});
				} else if (remainingTime%10000 == 0) {
					message.channel.sendEmbed({ description: 
					`
						**ROULETTE HAS STARTED**

						_bet [amount]_ to bet 
						_roulette_ to see current bets
						_status_ to check your own status
					`
					});
					resolve({message: message, time: remainingTime});
				} else {
					resolve({message: message, time: remainingTime});
				}
			}, 1000);
		})
		if (remainingTime <= 0) {
			return promise;
			} else {
			return promise.then(delay)
		}
	}	
	const start = function({message,time}) {
		const promise = new Promise((resolve, reject) => {
			message.channel.sendEmbed({ description: 
				`
					**ROULETTE HAS BEGAN**

					_bet [amount]_ to bet 
					_roulette_ to see current bets
					_status_ to check your own status

					You have 60 seconds to bet
				`
			});
			resolve({message: message, time: time});
		})
		return promise;
	}

	start({message: message,time: 60000})
		.then(delay)
		.then(getParticipants)
		.then(chooseWinner)
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
					${users.length == 0 ? 'No one played :(' : users.map(user => 
					`**${user.name}** has bet **${user.bet}** and has a **${(user.bet/pot*100).toFixed(2)}%** chance to win
					`).join('')}
				`, color: 15473237
			})
			resolve({message:message,users:users, pot:pot, raffle:raffle});
		});	
	});
	return promise;
}

const chooseWinner = function({message, users, pot, raffle}) {
	setTimeout(function() {	
		if (users.length != 0) {
			shuffle(raffle);
			const randomIndex = Math.floor(Math.random() * (raffle.length + 1));
			const winnerIndex = raffle[randomIndex];
			const winningUser = users[winnerIndex];
			const winnerPot = pot - winningUser.bet;
			
			// console.log(raffle);
			// console.log(randomIndex);
			// console.log(winnerIndex);

			message.channel.sendEmbed({description:
				`
					The winner is **${winningUser.name}** and has won **${winnerPot}**
				`, color: 15473237
			})
			users.forEach(function(user) {
				if (user.userId == winningUser.userId) {
					userRouletteDatabase.update({'userId': user.userId}, {'choice': null, 'bet': null, 'bank': (user.bank + winnerPot)}, function(err, user) {
						if (err) return handleError(err);
					})	
				} else {
					userRouletteDatabase.update({'userId': user.userId}, {'choice': null, 'bet': null, 'bank': (user.bank - user.bet)}, function(err, user) {
						if (err) return handleError(err);
					})				
				} 
			}); 
		}
	}, 3000);
}

function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}

module.exports = {begin, account, bet, roulette, help};