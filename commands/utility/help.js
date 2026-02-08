const CommandBase = require('../CommandBase');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Show available commands with category pagination',
    aliases: ['h', 'commands'],
    usage: 'help [category|command]',
    cooldown: 3000,
    
    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        try {
            if (args.length > 0) {
                const query = args[0].toLowerCase();
                
                // Check if it's a specific command
                const command = client.commands.get(query) || 
                               Array.from(client.commands.values()).find(cmd => 
                                   cmd.aliases && cmd.aliases.includes(query)
                               );
                
                if (command) {
                    return this.showCommandHelp(channel, command, base);
                }
                
                // Check if it's a category
                const categories = this.getCommandCategories(client);
                if (categories[query]) {
                    return this.showCategoryCommands(channel, query, categories[query], base);
                }
                
                return base.sendError(channel, `No command or category named "${args[0]}" found`);
            }
            
            // Show main help with categories
            await this.showCategoryList(channel, client, base);
            
        } catch (error) {
            console.error('Help command error:', error);
            await base.sendError(channel, 'Failed to display help');
        }
    },
    
    async showCommandHelp(channel, command, base) {
        const helpEmbed = {
            title: `📚 Command Help: ${base.prefix}${command.name}`,
            description: `*${command.description || 'No description available'}*`,
            color: 0x5865F2,
            fields: [],
            footer: { text: '[] = optional, <> = required' }
        };
        
        if (command.usage) {
            helpEmbed.fields.push({ name: '📝 Usage', value: `\`${base.prefix}${command.usage}\``, inline: true });
        }
        
        if (command.aliases && command.aliases.length > 0) {
            helpEmbed.fields.push({ name: '🏷️ Aliases', value: command.aliases.map(a => `\`${a}\``).join(', '), inline: true });
        }
        
        if (command.cooldown) {
            helpEmbed.fields.push({ name: '⏳ Cooldown', value: `${command.cooldown / 1000}s`, inline: true });
        }
        
        await base.sendEmbed(channel, helpEmbed);
    },
    
    async showCategoryList(channel, client, base) {
        const categories = this.getCommandCategories(client);
        
        const helpEmbed = {
            title: '🤖 Selfbot Commands',
            description: `Use \`${base.prefix}help <category>\` to view commands in that category.\nUse \`${base.prefix}help <command>\` for detailed help.`,
            color: 0x5865F2,
            fields: [],
            footer: { text: `Total Commands: ${client.commands.size}` }
        };
        
        for (const [name, cmds] of Object.entries(categories)) {
            helpEmbed.fields.push({
                name: `${name.charAt(0).toUpperCase() + name.slice(1)}`,
                value: `\`${cmds.length}\` commands`,
                inline: true
            });
        }
        
        await base.sendEmbed(channel, helpEmbed);
    },
    
    async showCategoryCommands(channel, categoryName, commands, base) {
        const sorted = commands.sort((a, b) => a.name.localeCompare(b.name));
        
        const helpEmbed = {
            title: `📖 ${categoryName.toUpperCase()} Commands`,
            description: sorted.map(cmd => `• **${base.prefix}${cmd.name}** - ${cmd.description}`).join('\n'),
            color: 0x5865F2,
            footer: { text: `Total in ${categoryName}: ${commands.length}` }
        };
        
        await base.sendEmbed(channel, helpEmbed);
    },
    
    getCommandCategories(client) {
        const categories = {};
        const commandsDir = path.join(__dirname, '..');
        
        const folders = fs.readdirSync(commandsDir)
            .filter(item => fs.statSync(path.join(commandsDir, item)).isDirectory());
            
        folders.forEach(folder => {
            const folderPath = path.join(commandsDir, folder);
            const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
            
            files.forEach(file => {
                try {
                    const cmd = require(path.join(folderPath, file));
                    if (cmd.name) {
                        if (!categories[folder]) categories[folder] = [];
                        categories[folder].push({
                            name: cmd.name,
                            description: cmd.description || 'No description'
                        });
                    }
                } catch (e) {}
            });
        });
        
        return categories;
    }
};
