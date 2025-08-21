const { Client, WebhookClient } = require("discord.js-selfbot-v13");
const fs = require("fs");
const path = require("path");
const { token, prefix, allowedUserIDs } = require("./config");
const axios = require("axios");

const client = new Client();
const commands = [];

// Import and initialize autoreact and log functionality
const { autoReactRules } = require("./commands/autoreact");
const { activeLogs, logMessage } = require("./commands/log");

// Ready event
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Message event
client.on("messageCreate", message => {
  if (!message.author || message.author.bot) return;
  
  // Log message if logging is active for this channel
  if (activeLogs.has(message.channel.id)) {
    logMessage(message);
  }
  
  // Auto-react functionality
  if (autoReactRules.length > 0 && message.author.id !== client.user.id) {
    autoReactRules.forEach(rule => {
      let shouldReact = false;
      
      if (rule.type === 'user' && message.author.id === rule.target) {
        shouldReact = true;
      } 
      else if (rule.type === 'keyword' && message.content.toLowerCase().includes(rule.target.toLowerCase())) {
        shouldReact = true;
      }
      
      if (shouldReact) {
        // Add a small delay to avoid rate limits
        setTimeout(() => {
          message.react(rule.emoji).catch(console.error);
        }, 500);
      }
    });
  }
  
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

// Cleanup function for graceful shutdown
function cleanup() {
  console.log('Shutting down... Closing log files.');
  activeLogs.forEach((logData, channelId) => {
    logData.writeStream.write(`\n=== Log ended at ${new Date().toISOString()} (shutdown) ===\n`);
    logData.writeStream.end();
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Login
client.login(token);
