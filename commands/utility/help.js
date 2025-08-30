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
                // Check if it's a specific command
                const command = client.commands.get(args[0].toLowerCase()) || 
                               Array.from(client.commands.values()).find(cmd => 
                                   cmd.aliases && cmd.aliases.includes(args[0].toLowerCase())
                               );
                
                if (command) {
                    await this.showCommandHelp(channel, command, base);
                    return;
                }
                
                // Check if it's a category
                const categories = this.getCommandCategories(client);
                const categoryName = args[0].toLowerCase();
                
                if (categories[categoryName]) {
                    await this.showCategoryCommands(channel, categoryName, categories[categoryName], base);
                    return;
                }
                
                await base.sendError(channel, `No command or category named "${args[0]}" found`);
                return;
            }
            
            // Show main help with categories
            await this.showCategoryList(channel, client, base);
            
        } catch (error) {
            console.error('Help command error:', error);
            await base.sendError(channel, 'Failed to display help');
        }
    },
    
    async showCommandHelp(channel, command, base) {
        let helpText = `📚 **Command Help: ${base.prefix}${command.name}**\n\n`;
        helpText += `*${command.description || 'No description available'}*\n\n`;
        
        if (command.usage) {
            helpText += `**Usage:** ${base.prefix}${command.usage}\n`;
        }
        
        if (command.aliases && command.aliases.length > 0) {
            helpText += `**Aliases:** ${command.aliases.map(a => base.prefix + a).join(', ')}\n`;
        }
        
        if (command.cooldown) {
            helpText += `**Cooldown:** ${command.cooldown / 1000} seconds\n`;
        }
        
        await base.safeSend(channel, helpText);
    },
    
    async showCategoryList(channel, client, base) {
        const categories = this.getCommandCategories(client);
        
        let categoryList = `🤖 **Selfbot Command Categories**\n\n`;
        categoryList += `Use **${base.prefix}help <category>** to view commands in that category\n`;
        categoryList += `Use **${base.prefix}help <command>** for detailed command help\n\n`;
        
        categoryList += `**Available Categories:**\n`;
        
        for (const [categoryName, commands] of Object.entries(categories)) {
            categoryList += `• **${categoryName}** - ${commands.length} commands\n`;
        }
        
        categoryList += `\n**Total Commands:** ${client.commands.size}`;
        
        await base.safeSend(channel, categoryList);
    },
    
    async showCategoryCommands(channel, categoryName, commands, base) {
        // Sort commands alphabetically
        const sortedCommands = commands.sort((a, b) => a.name.localeCompare(b.name));
        
        let commandList = `📖 **${categoryName.toUpperCase()} Commands**\n\n`;
        commandList += `Use **${base.prefix}help <command>** for detailed help\n\n`;
        
        for (const cmd of sortedCommands) {
            const line = `• **${base.prefix}${cmd.name}**`;
            const aliases = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
            const description = ` - ${cmd.description || 'No description'}\n`;
            
            commandList += line + aliases + description;
        }
        
        commandList += `\n**Total in ${categoryName}:** ${commands.length} commands`;
        
        await base.safeSend(channel, commandList);
    },
    
    getCommandCategories(client) {
        const categories = {};
        const commandsDir = path.join(__dirname, '..');
        
        try {
            // Get all category folders
            const categoryFolders = fs.readdirSync(commandsDir)
                .filter(item => {
                    try {
                        return fs.statSync(path.join(commandsDir, item)).isDirectory();
                    } catch {
                        return false;
                    }
                })
                .filter(folder => !folder.startsWith('.'));
            
            // Initialize categories
            for (const folder of categoryFolders) {
                categories[folder] = [];
            }
            
            // Add uncategorized category
            categories['general'] = [];
            
            // Categorize commands
            for (const [name, command] of client.commands) {
                let foundCategory = false;
                
                // Check each category folder for this command
                for (const category of categoryFolders) {
                    const categoryPath = path.join(commandsDir, category);
                    try {
                        const commandFiles = fs.readdirSync(categoryPath)
                            .filter(file => file.endsWith('.js') && file !== 'CommandBase.js');
                        
                        for (const file of commandFiles) {
                            try {
                                const cmdModule = require(path.join(categoryPath, file));
                                if (cmdModule.name === name) {
                                    categories[category].push({
                                        name: command.name,
                                        description: command.description || 'No description',
                                        aliases: command.aliases || []
                                    });
                                    foundCategory = true;
                                    break;
                                }
                            } catch (error) {
                                continue;
                            }
                        }
                        if (foundCategory) break;
                    } catch (error) {
                        continue;
                    }
                }
                
                // If no category found, put in general
                if (!foundCategory) {
                    categories['general'].push({
                        name: command.name,
                        description: command.description || 'No description',
                        aliases: command.aliases || []
                    });
                }
            }
            
        } catch (error) {
            console.error('Error building command categories:', error);
            // Fallback: put all commands in general category
            categories['general'] = Array.from(client.commands.values()).map(cmd => ({
                name: cmd.name,
                description: cmd.description || 'No description',
                aliases: cmd.aliases || []
            }));
        }
        
        // Remove empty categories
        Object.keys(categories).forEach(category => {
            if (categories[category].length === 0) {
                delete categories[category];
            }
        });
        
        return categories;
    }
};
