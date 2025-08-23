// commands/log.js
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// In-memory tracking of logging channels
const activeLogs = new Map();

function getLogFileName(channel) {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0];
  const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  const channelName = channel.name 
    ? `-${channel.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}` 
    : '';
    
  return `log_${dateString}_${timeString}${channelName}.txt`;
}

function startLogging(channel) {
  if (activeLogs.has(channel.id)) {
    return { alreadyActive: true };
  }
  
  const logFilePath = path.join(logDir, getLogFileName(channel));
  const writeStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  
  writeStream.write(`=== Log started at ${new Date().toISOString()} ===\n`);
  writeStream.write(`Channel: ${channel.name || 'DM'} (${channel.id})\n`);
  writeStream.write(`Server: ${channel.guild ? channel.guild.name : 'Direct Message'}\n`);
  writeStream.write('===================================\n\n');
  
  activeLogs.set(channel.id, {
    writeStream,
    filePath: logFilePath,
    startTime: new Date()
  });
  
  return { success: true, filePath: logFilePath };
}

function stopLogging(channelId) {
  if (!activeLogs.has(channelId)) {
    return { notActive: true };
  }
  
  const logData = activeLogs.get(channelId);
  logData.writeStream.write(`\n=== Log ended at ${new Date().toISOString()} ===\n`);
  logData.writeStream.end();
  activeLogs.delete(channelId);
  
  return { success: true, filePath: logData.filePath };
}

module.exports = {
  name: 'log',
  description: 'Log messages from a channel to a file',
  async execute(channel, message, client, args) {
    if (args.length === 0) {
      return channel.send(
        `**Log Commands:**\n` +
        `- \`${prefix}log start\` - Start logging this channel\n` +
        `- \`${prefix}log stop\` - Stop logging this channel\n` +
        `- \`${prefix}log status\` - Show logging status\n` +
        `- \`${prefix}log list\` - List all log files`
      );
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'start') {
      const result = startLogging(channel);
      
      if (result.alreadyActive) {
        return channel.send('❌ Logging is already active in this channel.');
      }
      
      channel.send(`✅ Started logging this channel to: \`${result.filePath}\``);
    }
    else if (subcommand === 'stop') {
      const result = stopLogging(channel.id);
      
      if (result.notActive) {
        return channel.send('❌ No active log for this channel.');
      }
      
      channel.send(`✅ Stopped logging. File saved to: \`${result.filePath}\``);
    }
    else if (subcommand === 'status') {
      const isActive = activeLogs.has(channel.id);
      channel.send(`Logging is currently **${isActive ? 'ACTIVE' : 'INACTIVE'}** in this channel.`);
    }
    else if (subcommand === 'list') {
      try {
        const files = fs.readdirSync(logDir);
        if (files.length === 0) {
          return channel.send('No log files found.');
        }
        
        const fileList = files.slice(-10).reverse().map(file => {
          const stats = fs.statSync(path.join(logDir, file));
          return `\`${file}\` (${(stats.size / 1024).toFixed(2)} KB)`;
        }).join('\n');
        
        channel.send(`**Recent Log Files:**\n${fileList}`);
      } catch (error) {
        channel.send('Error reading log directory.');
      }
    }
    else {
      channel.send('Invalid subcommand. Use `log start`, `log stop`, `log status`, or `log list`.');
    }
  }
};

// Export functions for use in main index.js
module.exports.activeLogs = activeLogs;
module.exports.logMessage = function(message) {
  if (activeLogs.has(message.channel.id)) {
    const logData = activeLogs.get(message.channel.id);
    const timestamp = new Date().toISOString();
    const author = message.author.tag;
    const content = message.content.replace(/\n/g, '\\n');
    
    logData.writeStream.write(`[${timestamp}] ${author}: ${content}\n`);
  }
};
