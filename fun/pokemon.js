const Discord = require('discord.js');
const unirest = require('unirest');

var message;

const getPokemonCount = function() {
	const promise = new Promise((resolve, reject) => {
		unirest.get('http://pokeapi.co/api/v2/pokemon-species')
			.end(function(res) {
				resolve(res.body.count);
			});
	}); 
	return promise;
}

const getRandomPokemon = function(count) {
	const randomId = Math.floor(Math.random()*(count-1)+1);
	const promise = new Promise((resolve, reject) => {
		unirest.get('http://pokeapi.co/api/v2/pokemon/'+randomId)
			.end(function(res) {
				resolve(res.body);
			});
	})
	return promise;
}

const shiny = function(pokemonJSON) {
	const shiny = (Math.random() < 0.03) ? true : false;
	if (shiny) {
		parseShinyPokemonJSON(pokemonJSON);
	} else {
		parsePokemonJSON(pokemonJSON);
	}
	return;
}

const parsePokemonJSON = function(pokemonJSON) {
	const name = pokemonJSON.name.replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase()});;
	const spriteURL = pokemonJSON.sprites.front_default;
	const embed = new Discord.RichEmbed()
  		.setDescription(`A wild **${name}** appeared!!`)	
  		.setImage(spriteURL)
  	message.channel.sendEmbed(embed);
  	return;
}

const parseShinyPokemonJSON = function(pokemonJSON) {
	const name = pokemonJSON.name.replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase()});;
	const spriteURL = pokemonJSON.sprites.front_shiny;
	const embed = new Discord.RichEmbed()
  		.setDescription(`A wild _SHINY_ **${name}** appeared!!`)	
  		.setImage(spriteURL)
  	message.channel.sendEmbed(embed);
  	return;
}

const getPokemon = function(msg) {
	message = msg;
	getPokemonCount()
		.then(getRandomPokemon)
		.then(shiny);
	return;
}

module.exports = {getPokemon};
