const { Client, WebhookClient } = require("discord.js-selfbot-v13");
const fs = require("fs");
const { token, prefix, allowedUserIDs } = require("./config");
const axios = require("axios");

const client = new Client();
const commands = [];

// Ready event
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Message event
client.on("messageCreate", message => {
  if (!message.author || message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = commands.find(cmd => cmd.name === commandName);
  if (!command) return;

  // Permission check
  if (!allowedUserIDs.includes(message.author.id)) {
    return message.channel.send("You are not allowed to use this command.")
      .catch(console.error);
  }

  // Execute command
  command.execute(message.channel, message, client, args);
  console.log(`Executed command: ${commandName} ✅`);
});

// Load commands
fs.readdirSync("./commands")
  .filter(file => file.endsWith(".js"))
  .forEach(file => {
    const command = require("./commands/" + file);
    commands.push(command);
    console.log(`Loaded command: ${command.name}`);
  });

// Login
client.login(token);

