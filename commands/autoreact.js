// commands/autoreact.js
const fs = require('fs');
const path = require('path');

const rulesPath = path.join(__dirname, '..', 'autoreact_rules.json');

// Load existing rules or create empty array
let autoReactRules = [];
if (fs.existsSync(rulesPath)) {
  try {
    autoReactRules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  } catch (error) {
    console.error('Error loading autoreact rules:', error);
  }
}

function saveRules() {
  fs.writeFileSync(rulesPath, JSON.stringify(autoReactRules, null, 2));
}

module.exports = {
  name: 'autoreact',
  description: 'Automatically react to messages from specific users or with keywords',
  async execute(channel, message, client, args) {
    if (args.length === 0) {
      return channel.send(
        `**AutoReact Commands:**\n` +
        `- \`${prefix}autoreact add user @user 🎉\` - React to a user's messages\n` +
        `- \`${prefix}autoreact add keyword "hello" 👋\` - React to messages containing a keyword\n` +
        `- \`${prefix}autoreact list\` - Show all rules\n` +
        `- \`${prefix}autoreact remove <id>\` - Remove a rule by ID`
      );
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'add') {
      if (args.length < 4) {
        return channel.send('Invalid format. Use: `autoreact add <user/keyword> <target> <emoji>`');
      }

      const type = args[1].toLowerCase();
      const target = type === 'user' ? args[2].replace(/[<@!>]/g, '') : args.slice(2, -1).join(' ').replace(/"/g, '');
      const emoji = args[args.length - 1];

      // Validate user ID if type is user
      if (type === 'user' && !client.users.cache.has(target)) {
        return channel.send('User not found. Make sure you mention the user correctly.');
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

      channel.send(`✅ Added new auto-react rule (ID: ${newRule.id})`);
    } 
    else if (subcommand === 'list') {
      if (autoReactRules.length === 0) {
        return channel.send('No auto-react rules configured.');
      }

      const rulesList = autoReactRules.map(rule => {
        const targetDisplay = rule.type === 'user' 
          ? `<@${rule.target}>` 
          : `"${rule.target}"`;
        return `**${rule.id}** - React with ${rule.emoji} to ${rule.type} ${targetDisplay}`;
      }).join('\n');

      channel.send(`**Auto-React Rules:**\n${rulesList}`);
    }
    else if (subcommand === 'remove') {
      if (args.length < 2) {
        return channel.send('Please provide a rule ID to remove.');
      }

      const idToRemove = args[1];
      const initialLength = autoReactRules.length;
      autoReactRules = autoReactRules.filter(rule => rule.id !== idToRemove);
      
      if (autoReactRules.length === initialLength) {
        return channel.send('Rule not found with that ID.');
      }

      saveRules();
      channel.send('✅ Rule removed successfully.');
    }
    else {
      channel.send('Invalid subcommand. Use `autoreact add`, `autoreact list`, or `autoreact remove`.');
    }
  }
};

// Export the rules so they can be used in the main index.js
module.exports.autoReactRules = autoReactRules;
