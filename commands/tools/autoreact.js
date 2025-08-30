const { prefix } = require("../../config");
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

// Save rules to file
function saveRules() {
  try {
    const data = JSON.stringify(autoReactRules, null, 2);
    fs.writeFileSync(rulesFile, data, 'utf8');
    console.log(`Autoreact rules saved to: ${rulesFile}`);
  } catch (error) {
    console.error('Error saving autoreact rules:', error);
  }
}

// Load existing rules
let autoReactRules = loadRules();

// Function to validate emoji
function isValidEmoji(emoji) {
  // Check for Unicode emoji (extended range for newer emojis)
  const emojiRegex = /^(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}])$/u;
  if (emojiRegex.test(emoji)) return true;
  
  // Check for custom Discord emoji format
  const customEmojiRegex = /^<a?:\w+:\d+>$/;
  if (customEmojiRegex.test(emoji)) return true;
  
  // For complex emojis, just check if it's a single character or valid format
  if (emoji.length === 1 || emoji.length === 2) {
    // Try to validate as emoji by checking if it contains emoji characters
    try {
      return /\p{Emoji}/u.test(emoji);
    } catch (e) {
      return true; // If regex fails, assume it's valid
    }
  }
  
  return false;
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
          console.error(`Failed to react with ${rule.emoji}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error processing auto-react rule:', error);
    }
  }
}

// Initialize the auto-react system
function initAutoReact(client) {
  // Remove existing listener if it exists
  client.removeAllListeners('autoReactMessage');
  
  // Add message listener
  client.on('messageCreate', (message) => {
    checkAutoReactRules(message, client);
  });
}

module.exports = {
  name: 'autoreact',
  description: 'Automatically react to messages from specific users or with keywords',
  
  // Initialize function called when command is loaded
  init(client) {
    initAutoReact(client);
  },
  
  async execute(channel, message, client, args) {
    if (args.length === 0) {
      const helpEmbed = {
        color: 0x5865F2,
        title: '🔄 AutoReact Help Menu',
        description: 'Automatically react to messages from specific users or containing keywords',
        fields: [
          {
            name: '📝 Add Rules',
            value: `\`${prefix}autoreact add user @user 🎉\`\nReact to all messages from a specific user\n\n\`${prefix}autoreact add keyword "hello" 👋\`\nReact to messages containing a keyword`,
            inline: false
          },
          {
            name: '📋 Manage Rules',
            value: `\`${prefix}autoreact list\`\nShow all active rules\n\n\`${prefix}autoreact remove <id>\`\nRemove a rule by its ID\n\n\`${prefix}autoreact clear\`\nRemove all rules`,
            inline: false
          },
          {
            name: '💡 Examples',
            value: `\`${prefix}autoreact add user @john 😂\`\n\`${prefix}autoreact add keyword "good morning" ☀️\`\n\`${prefix}autoreact remove 1234567890\``,
            inline: false
          },
          {
            name: 'ℹ️ Notes',
            value: '• Keywords are case-insensitive\n• Use quotes around multi-word keywords\n• Supports Unicode and Discord custom emojis\n• Rules persist between restarts',
            inline: false
          }
        ],
        footer: {
          text: `Total active rules: ${autoReactRules.length}`
        },
        timestamp: new Date().toISOString()
      };

      return channel.send({ embeds: [helpEmbed] });
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'add') {
      if (args.length < 4) {
        return channel.send('❌ Invalid format. Use: `autoreact add <user/keyword> <target> <emoji>`');
      }

      const type = args[1].toLowerCase();
      
      if (!['user', 'keyword'].includes(type)) {
        return channel.send('❌ Type must be either `user` or `keyword`');
      }

      let target;
      let emoji;

      if (type === 'user') {
        // Extract user ID from mention or use raw ID
        target = args[2].replace(/[<@!>]/g, '');
        emoji = args[3];
        
        // Validate user ID format (Discord IDs are 17-19 digits)
        if (!/^\d{17,19}$/.test(target)) {
          return channel.send('❌ Invalid user ID format. Use @mention or raw user ID.');
        }
        
        // Validate user exists
        try {
          const user = await client.users.fetch(target);
          if (!user) {
            return channel.send('❌ User not found. Make sure the user ID is correct.');
          }
        } catch (error) {
          console.error('User fetch error:', error);
          return channel.send('❌ Could not find user. Make sure the user ID is correct and the user shares a server with the bot.');
        }
      } else if (type === 'keyword') {
        // Join all args except the last one as the keyword, remove quotes
        target = args.slice(2, -1).join(' ').replace(/^["']|["']$/g, '');
        emoji = args[args.length - 1];
        
        if (!target) {
          return channel.send('❌ Keyword cannot be empty.');
        }
      }

      // Validate emoji
      if (!isValidEmoji(emoji)) {
        // Try a more lenient check for complex emojis
        try {
          // Test if we can actually react with this emoji by attempting it
          await message.react(emoji);
          await message.reactions.cache.get(emoji)?.users.remove(client.user.id);
        } catch (testError) {
          console.error('Emoji validation failed:', testError);
          return channel.send('❌ Invalid emoji. Make sure it\'s a valid Unicode emoji or Discord custom emoji that the bot can use.');
        }
      }

      // Check for duplicate rules
      const duplicate = autoReactRules.find(rule => 
        rule.type === type && rule.target === target && rule.emoji === emoji
      );
      
      if (duplicate) {
        return channel.send('❌ This auto-react rule already exists.');
      }

      const newRule = {
        id: Date.now().toString(),
        type,
        target,
        emoji,
        created: new Date().toISOString()
      };

      autoReactRules.push(newRule);
      saveRules();

      const targetDisplay = type === 'user' ? `<@${target}>` : `"${target}"`;
      console.log(`Added autoreact rule: ${JSON.stringify(newRule)}`);
      channel.send(`✅ Added new auto-react rule (ID: ${newRule.id})\nWill react with ${emoji} to ${type} ${targetDisplay}`);
    } 
    else if (subcommand === 'list') {
      if (autoReactRules.length === 0) {
        return channel.send('📝 No auto-react rules configured.');
      }

      const rulesList = autoReactRules.map(rule => {
        const targetDisplay = rule.type === 'user' 
          ? `<@${rule.target}>` 
          : `"${rule.target}"`;
        return `**${rule.id}** - React with ${rule.emoji} to ${rule.type} ${targetDisplay}`;
      }).join('\n');

      channel.send(`**Auto-React Rules (${autoReactRules.length}):**\n${rulesList}`);
    }
    else if (subcommand === 'remove') {
      if (args.length < 2) {
        return channel.send('❌ Please provide a rule ID to remove. Use `autoreact list` to see all rules.');
      }

      const idToRemove = args[1];
      const initialLength = autoReactRules.length;
      autoReactRules = autoReactRules.filter(rule => rule.id !== idToRemove);
      
      if (autoReactRules.length === initialLength) {
        return channel.send('❌ Rule not found with that ID. Use `autoreact list` to see all rules.');
      }

      saveRules();
      channel.send('✅ Rule removed successfully.');
    }
    else if (subcommand === 'clear') {
      if (autoReactRules.length === 0) {
        return channel.send('📝 No auto-react rules to clear.');
      }

      const count = autoReactRules.length;
      autoReactRules = [];
      saveRules();
      
      channel.send(`✅ Cleared all ${count} auto-react rules.`);
    }
    else {
      channel.send('❌ Invalid subcommand. Use `add`, `list`, `remove`, or `clear`.');
    }
  }
};

// Export the rules and functions for external access
module.exports.getAutoReactRules = () => autoReactRules;
module.exports.saveRules = saveRules;
module.exports.checkAutoReactRules = checkAutoReactRules;
module.exports.rulesFilePath = rulesFile;
