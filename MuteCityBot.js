const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
var blacklist = {};
var currPath = config.music[0].path; 
var currName = config.music[0].name;
var currGame = config.music[0].game;
var active = true;
var shuffle = false;
var dispatcher;
var connection;

function SetCurrent(num) {
      currPath = config.music[num].path;
      currGame = config.music[num].game;
      currName = config.music[num].name;
}

//bug fixed in discord.js develop: https://github.com/hydrabolt/discord.js/issues/1831
function SetPlayedGame(gameName) {
	bot.user.setPresence({ game: { name: gameName, type: 0 } })
}


function PlayMuteCity() {
	if(connection !== null) {
		if(shuffle) {
		  SetCurrent(Math.floor(Math.random() * config.music.length));
		}
		dispatcher = connection.playFile(currPath);
		SetPlayedGame(currGame);
		dispatcher.on('end', () => {
			if(connection !== null) {
				PlayMuteCity();
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
	SetPlayedGame(config.prefix);
});

bot.on("message", (message) => {
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
  
  if(command === "" || command === "help") {
    sayMessage = "Possible Commands\nhelp: brings up this prompt\non: turn on the bot\noff: disable the bot\nmusic <number>: sets the music choice\nblacklist <on/off>: when enabled, will not play music while you're in the channel"
    message.channel.send(sayMessage);
  }
  
  if(command === "on") {
    if(!active) {
      active = true;
      message.channel.send("Mute City Bot active!");
      SetPlayedGame(config.prefix);
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
      SetPlayedGame("disabled (" + config.prefix + ")");
    }
    else {
      message.channel.send("Mute City Bot already disabled");
    }
  }

  if(command === "blacklist") {
    var newid = message.author.id;
    if(args[0] === "on") {
      //add user to blacklist
      if(blacklist[newid]) {
        message.channel.send("You're already on the blacklist");
      } else {
        blacklist[newid] = true;
        message.channel.send("You're now blacklisted");
      }
    } else if (args[0] === "off") {
      //remove user from blacklist
      if(blacklist[newid]) {
        delete blacklist[newid];
        message.channel.send("Removed from blacklist");
      } else {
        message.channel.send("You're not currently blacklisted");
      }
    } else {
      message.channel.send("Usage: blacklist <on/off>\nThis will disallow/allow music to be played while you're in the channel");
    }
  }

  if(command === "music") {
    if(args[0] === undefined) {
      musicMessage = "Possbile music choices include: ";
      for(var i = 0; i < config.music.length; i++) {
	      musicMessage += ("[" + i + "]\""+ config.music[i].name + "\" ")
      }
      musicMessage += ("[" + i + "]\"Shuffle All\"");
      if(shuffle) {
      musicMessage += "\nCurrently Shuffling";
      }
      else {
      musicMessage += "\nCurrently selected: " + currName;
      }
      message.channel.send(musicMessage);
    }
    else {
      musicChoice = parseInt(args[0]);
      if(!isNaN(musicChoice) && musicChoice <= config.music.length) {
	      if(musicChoice == config.music.length) {
	         shuffle = true;
	         message.channel.send("Shuffle Enabled!")
	      }
	      else {
	      	SetCurrent(musicChoice);
	      	message.channel.send("Music changed to " + currName + "!")
		shuffle = false;
	      }

      }
      else {
	      message.channel.send("Music choice invalid")
      }
    }
  }
})

bot.on('voiceStateUpdate', (oldMember, newMember) => {
	let newUserChannel = newMember.voiceChannel
	let oldUserChannel = oldMember.voiceChannel
	if(!active) {
		return;
	}

        // If blacklisted member leaves afk, and someone is still afk play music
        if(blacklist[oldMember.id] && oldUserChannel && oldUserChannel.name === 'Mute City' && oldUserChannel.members.size !== 0) {
          var shouldJoin = true;
          var voiceMembers = oldUserChannel.members.array();
          for(var i = 0; i < voiceMembers.length; i++) {
            if(blacklist[voiceMembers[i].id]) {
              shouldJoin = false;
              break;
            }
          }
          if(shouldJoin) {
            oldUserChannel.join().then(connect => {
              connection = connect;
              bot.guilds.first().member(bot.user).setMute(false);
              PlayMuteCity();
            }).catch(console.log);
          }
        } else if(newUserChannel && newUserChannel.name === 'Mute City') {
		console.log('enter voice chann');
                if(blacklist[newMember.id]) {
                  console.log('Blacklisted member, do not join/leave channel now');
                  if(bot.voiceConnections.size === 1) {
                    DisconnectFromVoice();
                    SetPlayedGame(config.prefix);
                  }
                } else if(newMember.voiceChannel.name === 'Mute City' && bot.voiceConnections.size === 0) {
		        //User joins voice cahnnel
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
		SetPlayedGame(config.prefix);
	}
});

bot.login(config.token);
