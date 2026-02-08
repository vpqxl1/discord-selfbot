const CommandBase = require('../CommandBase');
const fs = require("fs");
const path = require("path");

// Define the path for the autoreact rules file
const logsDir = path.join(__dirname, "..", "logs");
const rulesFile = path.join(logsDir, "autoreact_rules.json");

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Load existing rules from file
function loadRules() {
  try {
    if (fs.existsSync(rulesFile)) {
      const data = fs.readFileSync(rulesFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading autoreact rules:', error);
  }
  return [];
}

let autoReactRules = loadRules();

// Save rules to file
function saveRules() {
  try {
    const data = JSON.stringify(autoReactRules, null, 2);
    fs.writeFileSync(rulesFile, data, 'utf8');
  } catch (error) {
    console.error('Error saving autoreact rules:', error);
  }
}

// Function to check if message matches any rules
async function checkAutoReactRules(message, client) {
  if (!message.author || message.author.bot) return;
  
  for (const rule of autoReactRules) {
    try {
      let shouldReact = false;
      
      if (rule.type === 'user' && message.author.id === rule.target) {
        shouldReact = true;
      } else if (rule.type === 'keyword' && message.content.toLowerCase().includes(rule.target.toLowerCase())) {
        shouldReact = true;
      }
      
      if (shouldReact) {
        try {
          await message.react(rule.emoji);
        } catch (error) {
          // Silent fail for reactions (e.g. no permissions)
        }
      }
    } catch (error) {
      console.error('Error processing auto-react rule:', error);
    }
  }
}

module.exports = {
  name: 'autoreact',
  description: 'Automatically react to messages from specific users or with keywords',
  aliases: ['ar'],
  usage: 'autoreact add <user/keyword> <target> <emoji> | list | remove <id> | clear',
  cooldown: 2000,
  
  init(client) {
    client.on('messageCreate', (message) => {
      checkAutoReactRules(message, client);
    });
  },
  
  async execute(channel, message, client, args) {
    const base = new CommandBase();
    
    if (args.length === 0) {
      const helpEmbed = {
        color: 0x5865F2,
        title: '🔄 AutoReact Management',
        description: 'Automatically react to messages from specific users or containing keywords',
        fields: [
          {
            name: '📝 Add Rules',
            value: `\`${base.prefix}autoreact add user @user 🎉\`\n\`${base.prefix}autoreact add keyword "hello" 👋\``,
            inline: false
          },
          {
            name: '📋 Manage Rules',
            value: `\`${base.prefix}autoreact list\` - Show rules\n\`${base.prefix}autoreact remove <id>\` - Remove rule\n\`${base.prefix}autoreact clear\` - Remove all`,
            inline: false
          }
        ],
        footer: { text: `Total active rules: ${autoReactRules.length}` }
      };

      return base.sendEmbed(channel, helpEmbed);
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'add') {
      if (args.length < 4) {
        return base.sendError(channel, 'Invalid format. Use: `autoreact add <user/keyword> <target> <emoji>`');
      }

      const type = args[1].toLowerCase();
      if (!['user', 'keyword'].includes(type)) {
        return base.sendError(channel, 'Type must be either `user` or `keyword`');
      }

      let target, emoji;

      if (type === 'user') {
        target = args[2].replace(/[<@!>]/g, '');
        emoji = args[3];
        if (!/^\d{17,20}$/.test(target)) {
          return base.sendError(channel, 'Invalid user ID format.');
        }
      } else {
        target = args.slice(2, -1).join(' ').replace(/^["']|["']$/g, '');
        emoji = args[args.length - 1];
      }

      // Check for duplicate
      if (autoReactRules.find(r => r.type === type && r.target === target && r.emoji === emoji)) {
        return base.sendError(channel, 'This rule already exists.');
      }

      const newRule = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        target,
        emoji,
        created: new Date().toISOString()
      };

      autoReactRules.push(newRule);
      saveRules();

      await base.sendSuccess(channel, `Added rule: React with ${emoji} to ${type} ${type === 'user' ? `<@${target}>` : `"${target}"`}`);
    } 
    else if (subcommand === 'list') {
      if (autoReactRules.length === 0) {
        return base.sendWarning(channel, 'No auto-react rules configured.');
      }

      const list = autoReactRules.map(r => `\`${r.id}\`: ${r.emoji} on ${r.type} ${r.type === 'user' ? `<@${r.target}>` : `"${r.target}"`}`).join('\n');
      await base.safeSend(channel, `**Auto-React Rules:**\n${list}`);
    }
    else if (subcommand === 'remove') {
      const id = args[1];
      const initial = autoReactRules.length;
      autoReactRules = autoReactRules.filter(r => r.id !== id);
      
      if (autoReactRules.length === initial) {
        return base.sendError(channel, 'Rule not found.');
      }

      saveRules();
      await base.sendSuccess(channel, 'Rule removed.');
    }
    else if (subcommand === 'clear') {
      autoReactRules = [];
      saveRules();
      await base.sendSuccess(channel, 'All rules cleared.');
    }
  }
};
