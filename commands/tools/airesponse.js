const CommandBase = require('../CommandBase');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Define the path for AI response rules
const logsDir = path.join(__dirname, '..', 'logs');
const rulesFile = path.join(logsDir, 'airesponse_rules.json');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Load existing rules
function loadRules() {
    try {
        if (fs.existsSync(rulesFile)) {
            const data = fs.readFileSync(rulesFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading AI response rules:', error);
    }
    return {
        enabled: false,
        ollamaUrl: 'http://localhost:11434',
        model: 'llama2',
        rules: []
    };
}

let aiConfig = loadRules();

// Save rules
function saveRules() {
    try {
        fs.writeFileSync(rulesFile, JSON.stringify(aiConfig, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving AI response rules:', error);
    }
}

// Check if message matches any AI response rules
async function checkAIResponseRules(message, client) {
    if (!aiConfig.enabled || !message.author || message.author.id === client.user.id) return;
    
    for (const rule of aiConfig.rules) {
        let shouldRespond = false;
        
        if (rule.type === 'user' && message.mentions.users.has(client.user.id)) {
            // Respond when mentioned
            shouldRespond = true;
        } else if (rule.type === 'channel' && message.channel.id === rule.target) {
            // Respond in specific channel
            shouldRespond = true;
        } else if (rule.type === 'dm' && message.channel.type === 'DM') {
            // Respond in DMs
            shouldRespond = true;
        } else if (rule.type === 'user_specific' && message.author.id === rule.target) {
            // Respond to specific user
            shouldRespond = true;
        }
        
        if (shouldRespond) {
            try {
                // Get AI response from Ollama
                const response = await getOllamaResponse(message.content, rule.systemPrompt || 'You are a helpful assistant.');
                
                if (response) {
                    // Split response if too long
                    if (response.length > 2000) {
                        const chunks = response.match(/[\s\S]{1,1900}/g) || [];
                        for (const chunk of chunks) {
                            await message.channel.send(chunk);
                        }
                    } else {
                        await message.channel.send(response);
                    }
                }
            } catch (error) {
                console.error('AI response error:', error.message);
            }
            break; // Only respond once per message
        }
    }
}

// Get response from Ollama
async function getOllamaResponse(prompt, systemPrompt) {
    try {
        const response = await axios.post(`${aiConfig.ollamaUrl}/api/generate`, {
            model: aiConfig.model,
            prompt: prompt,
            system: systemPrompt,
            stream: false
        }, {
            timeout: 30000
        });
        
        return response.data.response;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Ollama is not running. Start it with: ollama serve');
        } else {
            console.error('Ollama API error:', error.message);
        }
        return null;
    }
}

module.exports = {
    name: 'airesponse',
    description: 'Configure AI-powered auto responses using Ollama',
    aliases: ['ai', 'aiconfig'],
    usage: 'airesponse <enable|disable|add|remove|list|test|config>',
    cooldown: 3000,
    
    init(client) {
        // Listen for messages to trigger AI responses
        client.on('messageCreate', (message) => {
            checkAIResponseRules(message, client);
        });
    },
    
    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return this.showHelp(channel, base);
        }
        
        const subcommand = args[0].toLowerCase();
        
        switch (subcommand) {
            case 'enable':
                aiConfig.enabled = true;
                saveRules();
                await base.sendSuccess(channel, 'AI auto-response system enabled!');
                break;
                
            case 'disable':
                aiConfig.enabled = false;
                saveRules();
                await base.sendSuccess(channel, 'AI auto-response system disabled.');
                break;
                
            case 'add':
                await this.addRule(channel, message, args.slice(1), base);
                break;
                
            case 'remove':
                await this.removeRule(channel, args.slice(1), base);
                break;
                
            case 'list':
                await this.listRules(channel, base);
                break;
                
            case 'test':
                await this.testAI(channel, args.slice(1), base);
                break;
                
            case 'config':
                await this.configureAI(channel, args.slice(1), base);
                break;
                
            default:
                await this.showHelp(channel, base);
        }
    },
    
    async addRule(channel, message, args, base) {
        if (args.length < 1) {
            return base.sendError(channel, 'Usage: `airesponse add <mention|channel|dm|user> [target] [system_prompt]`');
        }
        
        const type = args[0].toLowerCase();
        let target = null;
        let systemPrompt = 'You are a helpful assistant.';
        
        if (type === 'mention') {
            // Respond when mentioned
            if (args.length > 1) {
                systemPrompt = args.slice(1).join(' ');
            }
        } else if (type === 'channel') {
            // Respond in specific channel
            if (args.length < 2) {
                return base.sendError(channel, 'Please provide a channel ID.');
            }
            target = args[1];
            if (args.length > 2) {
                systemPrompt = args.slice(2).join(' ');
            }
        } else if (type === 'dm') {
            // Respond in all DMs
            if (args.length > 1) {
                systemPrompt = args.slice(1).join(' ');
            }
        } else if (type === 'user') {
            // Respond to specific user
            if (args.length < 2) {
                return base.sendError(channel, 'Please provide a user ID or mention.');
            }
            target = args[1].replace(/[<@!>]/g, '');
            if (args.length > 2) {
                systemPrompt = args.slice(2).join(' ');
            }
        } else {
            return base.sendError(channel, 'Invalid type. Use: mention, channel, dm, or user');
        }
        
        const newRule = {
            id: Math.random().toString(36).substr(2, 9),
            type: type === 'mention' ? 'user' : type === 'user' ? 'user_specific' : type,
            target: target,
            systemPrompt: systemPrompt,
            created: new Date().toISOString()
        };
        
        aiConfig.rules.push(newRule);
        saveRules();
        
        await base.sendSuccess(channel, `AI response rule added (ID: ${newRule.id})\nType: ${type}\nPrompt: ${systemPrompt}`);
    },
    
    async removeRule(channel, args, base) {
        if (args.length < 1) {
            return base.sendError(channel, 'Please provide a rule ID to remove.');
        }
        
        const id = args[0];
        const initialLength = aiConfig.rules.length;
        aiConfig.rules = aiConfig.rules.filter(r => r.id !== id);
        
        if (aiConfig.rules.length === initialLength) {
            return base.sendError(channel, 'Rule not found.');
        }
        
        saveRules();
        await base.sendSuccess(channel, 'Rule removed successfully.');
    },
    
    async listRules(channel, base) {
        if (aiConfig.rules.length === 0) {
            return base.sendWarning(channel, 'No AI response rules configured.');
        }
        
        const embed = {
            title: '🤖 AI Response Rules',
            description: `Status: ${aiConfig.enabled ? '✅ Enabled' : '❌ Disabled'}\nModel: ${aiConfig.model}\nOllama URL: ${aiConfig.ollamaUrl}`,
            color: 0x5865F2,
            fields: aiConfig.rules.map(r => ({
                name: `${r.id} - ${r.type}`,
                value: `Target: ${r.target || 'N/A'}\nPrompt: ${r.systemPrompt.substring(0, 100)}${r.systemPrompt.length > 100 ? '...' : ''}`,
                inline: false
            })),
            footer: { text: `Total rules: ${aiConfig.rules.length}` }
        };
        
        await base.sendEmbed(channel, embed);
    },
    
    async testAI(channel, args, base) {
        if (args.length === 0) {
            return base.sendWarning(channel, 'Please provide a test message.');
        }
        
        const testPrompt = args.join(' ');
        
        await base.safeSend(channel, '🤖 Testing AI response...');
        
        try {
            const response = await getOllamaResponse(testPrompt, 'You are a helpful assistant.');
            
            if (response) {
                await base.safeSend(channel, `**AI Response:**\n${response}`);
            } else {
                await base.sendError(channel, 'Failed to get AI response. Make sure Ollama is running.');
            }
        } catch (error) {
            await base.sendError(channel, `AI test failed: ${error.message}`);
        }
    },
    
    async configureAI(channel, args, base) {
        if (args.length < 2) {
            return base.sendWarning(channel, 'Usage: `airesponse config <model|url> <value>`');
        }
        
        const setting = args[0].toLowerCase();
        const value = args.slice(1).join(' ');
        
        if (setting === 'model') {
            aiConfig.model = value;
            saveRules();
            await base.sendSuccess(channel, `AI model set to: ${value}`);
        } else if (setting === 'url') {
            aiConfig.ollamaUrl = value;
            saveRules();
            await base.sendSuccess(channel, `Ollama URL set to: ${value}`);
        } else {
            await base.sendError(channel, 'Invalid setting. Use: model or url');
        }
    },
    
    async showHelp(channel, base) {
        const embed = {
            title: '🤖 AI Auto-Response System',
            description: 'Configure AI-powered responses using Ollama',
            color: 0x5865F2,
            fields: [
                {
                    name: '⚙️ Setup',
                    value: '`airesponse enable` - Enable AI responses\n`airesponse disable` - Disable AI responses\n`airesponse config model <name>` - Set AI model\n`airesponse config url <url>` - Set Ollama URL',
                    inline: false
                },
                {
                    name: '📝 Rules',
                    value: '`airesponse add mention [prompt]` - Respond when mentioned\n`airesponse add channel <id> [prompt]` - Respond in channel\n`airesponse add dm [prompt]` - Respond in DMs\n`airesponse add user <id> [prompt]` - Respond to user',
                    inline: false
                },
                {
                    name: '🔧 Management',
                    value: '`airesponse list` - List all rules\n`airesponse remove <id>` - Remove a rule\n`airesponse test <message>` - Test AI response',
                    inline: false
                },
                {
                    name: '💡 Example',
                    value: '`airesponse add mention You are a funny bot that makes jokes`',
                    inline: false
                }
            ],
            footer: { text: 'Requires Ollama running locally or remotely' }
        };
        
        await base.sendEmbed(channel, embed);
    }
};

module.exports.getAIConfig = () => aiConfig;
module.exports.saveRules = saveRules;
