const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
var currPath = config.music[0].path; 
var currTitle = config.music[0].name;
var currGame = config.music[0].game;
var active = true;
var dispatcher;
var connection;

function PlayMuteCity() {
	if(connection !== null) {
		dispatcher = connection.playFile(currPath);
		dispatcher.on('end', () => {
			if(connection !== null) {
				PlayMuteCity(connection);
			}
		})
	}
}

function DisconnectFromVoice() {
	connection = null;
	dispatcher = null;
	bot.voiceConnections.first().channel.leave();
}


bot.on("ready", () => {
	console.log('Bot started');
});

client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // ignore other bots
  if(message.author.bot) return;
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Let's go with a few common example commands! Feel free to delete or change those.
  
  if(command === "" OR command === "help") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    sayMessage = "Possible Commands\nhelp: brings up this prompt\non: turn on the bot\noff: disable the bot\nmusic <number>: sets the music choice"
    message.channel.send(sayMessage);
  }
  
  if(command === "on") {
    if(!active) {
      active = true;
      message.channel.send("Mute City Bot active!");
    }
    else {
      message.channel.send("Mute City Bot already active");
    }
  }

  if(command === "off") {
    if(active) {
      active = false;
      if(bot.voiceConnections.size !== 0) {
	      DisconnectFromVoice();
      }
    }
    else {
      message.channel.send("Mute City Bot already disabled");
    }
  }

  if(command === "music") {
    message.channel.send(args[0]);
  }
})

bot.on('voiceStateUpdate', (oldMember, newMember) => {
	let newUserChannel = newMember.voiceChannel
	let oldUserChannel = oldMember.voiceChannel
	if(!active) {
		return;
	}

	if(newUserChannel && newUserChannel.name === 'Mute City' && bot.voiceConnections.size === 0) {
		console.log('enter voice chann');
		//User joins voice cahnnel
		if(newMember.voiceChannel.name === 'Mute City' && bot.voiceConnections.size === 0) {
			console.log('enter mute city');
			newMember.voiceChannel.join().then(connect => {
				connection = connect;
				bot.guilds.first().member(bot.user).setMute(false);
				PlayMuteCity();
			}).catch(console.log);
		}
	} else if(bot.voiceConnections.size !== 0 && bot.voiceConnections.first().channel.members.size === 1) {
		//User leaves voice channel
		console.log('exit voice chann');
		DisconnectFromVoice();
	}
});

bot.login(config.token);
