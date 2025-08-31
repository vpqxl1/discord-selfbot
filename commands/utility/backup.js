const CommandBase = require('../CommandBase');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

module.exports = {
    name: 'backup',
    description: 'Backup server data and configuration',
    aliases: ['save', 'export'],
    usage: 'backup <create|restore|list> [name]',
    cooldown: 15000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (!message.guild) {
            return base.sendError(channel, 'This command can only be used in a server.');
        }

        if (args.length === 0) {
            return this.showHelp(channel, base);
        }

        const subcommand = args[0].toLowerCase();
        const backupName = args[1] || `backup_${Date.now()}`;
        
        try {
            switch (subcommand) {
                case 'create':
                    await this.createBackup(message.guild, backupName, channel, base);
                    break;
                    
                case 'restore':
                    await this.restoreBackup(message.guild, backupName, channel, base);
                    break;
                    
                case 'list':
                    await this.listBackups(channel, base);
                    break;
                    
                default:
                    return this.showHelp(channel, base);
            }
        } catch (error) {
            console.error('Backup error:', error);
            await base.sendError(channel, 'Failed to complete backup operation. Please check permissions and try again.');
        }
    },

    async createBackup(guild, backupName, channel, base) {
        await channel.send('📦 Creating server backup... This may take a while.');
        
        const backupData = {
            metadata: {
                name: backupName,
                date: new Date().toISOString(),
                guild: guild.name,
                id: guild.id
            },
            roles: [],
            channels: [],
            settings: {}
        };
        
        // Backup roles
        for (const [id, role] of guild.roles.cache) {
            if (role.name !== '@everyone') {
                backupData.roles.push({
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions.bitfield,
                    position: role.position,
                    hoist: role.hoist,
                    mentionable: role.mentionable
                });
            }
        }
        
        // Backup channels
        for (const [id, channel] of guild.channels.cache) {
            backupData.channels.push({
                name: channel.name,
                type: channel.type,
                position: channel.position,
                topic: channel.topic,
                nsfw: channel.nsfw,
                bitrate: channel.bitrate,
                userLimit: channel.userLimit,
                parent: channel.parent?.name,
                permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.bitfield,
                    deny: overwrite.deny.bitfield
                }))
            });
        }
        
        // Backup settings
        backupData.settings = {
            name: guild.name,
            region: guild.region,
            verificationLevel: guild.verificationLevel,
            explicitContentFilter: guild.explicitContentFilter,
            defaultMessageNotifications: guild.defaultMessageNotifications,
            afkChannel: guild.afkChannel?.name,
            afkTimeout: guild.afkTimeout,
            systemChannel: guild.systemChannel?.name,
            systemChannelFlags: guild.systemChannelFlags
        };
        
        // Create backup directory if it doesn't exist
        const backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Compress and save backup
        const compressed = await gzip(JSON.stringify(backupData, null, 2));
        const backupPath = path.join(backupDir, `${backupName}.json.gz`);
        fs.writeFileSync(backupPath, compressed);
        
        const stats = fs.statSync(backupPath);
        
        await base.sendSuccess(channel, 
            `✅ Backup created successfully!\n` +
            `**Name:** ${backupName}\n` +
            `**Size:** ${this.formatFileSize(stats.size)}\n` +
            `**Contents:** ${backupData.roles.length} roles, ${backupData.channels.length} channels\n` +
            `**Location:** ${backupPath}`
        );
    },

    async restoreBackup(guild, backupName, channel, base) {
        await channel.send('🔄 Restoring server backup... This may take a while.');
        
        const backupDir = path.join(__dirname, '../../backups');
        const backupPath = path.join(backupDir, `${backupName}.json.gz`);
        
        if (!fs.existsSync(backupPath)) {
            return base.sendError(channel, `Backup "${backupName}" not found.`);
        }
        
        // Load and decompress backup
        const compressed = fs.readFileSync(backupPath);
        const decompressed = zlib.gunzipSync(compressed);
        const backupData = JSON.parse(decompressed.toString());
        
        // Verify backup compatibility
        if (backupData.metadata.id !== guild.id) {
            return base.sendError(channel, 'This backup is from a different server and cannot be restored.');
        }
        
        // Restore roles
        for (const roleData of backupData.roles) {
            try {
                let role = guild.roles.cache.find(r => r.name === roleData.name);
                
                if (!role) {
                    role = await guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        permissions: roleData.permissions,
                        hoist: roleData.hoist,
                        mentionable: roleData.mentionable,
                        position: roleData.position
                    });
                } else {
                    await role.edit({
                        color: roleData.color,
                        permissions: roleData.permissions,
                        hoist: roleData.hoist,
                        mentionable: roleData.mentionable,
                        position: roleData.position
                    });
                }
            } catch (error) {
                console.error(`Error restoring role ${roleData.name}:`, error);
            }
        }
        
        // Restore channels
        for (const channelData of backupData.channels) {
            try {
                let channel = guild.channels.cache.find(c => c.name === channelData.name);
                
                if (!channel) {
                    // Create new channel
                    const parent = channelData.parent ? 
                        guild.channels.cache.find(c => c.name === channelData.parent) : null;
                    
                    channel = await guild.channels.create(channelData.name, {
                        type: channelData.type,
                        topic: channelData.topic,
                        nsfw: channelData.nsfw,
                        bitrate: channelData.bitrate,
                        userLimit: channelData.userLimit,
                        parent: parent?.id,
                        position: channelData.position
                    });
                }
                
                // Restore permission overwrites
                for (const overwriteData of channelData.permissionOverwrites || []) {
                    try {
                        await channel.permissionOverwrites.edit(overwriteData.id, {
                            allow: overwriteData.allow,
                            deny: overwriteData.deny
                        });
                    } catch (error) {
                        console.error('Error restoring permissions:', error);
                    }
                }
            } catch (error) {
                console.error(`Error restoring channel ${channelData.name}:`, error);
            }
        }
        
        await base.sendSuccess(channel, 
            `✅ Backup restored successfully!\n` +
            `**Name:** ${backupName}\n` +
            `**Restored:** ${backupData.roles.length} roles, ${backupData.channels.length} channels\n` +
            `**Date:** ${new Date(backupData.metadata.date).toLocaleString()}`
        );
    },

    async listBackups(channel, base) {
        const backupDir = path.join(__dirname, '../../backups');
        
        if (!fs.existsSync(backupDir)) {
            return base.sendError(channel, 'No backups found.');
        }
        
        const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json.gz'));
        
        if (files.length === 0) {
            return base.sendError(channel, 'No backups found.');
        }
        
        let list = '📦 **Available Backups**\n\n';
        
        for (const file of files) {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const backupName = file.replace('.json.gz', '');
            
            list += `• **${backupName}** - ${this.formatFileSize(stats.size)} - ${new Date(stats.mtime).toLocaleDateString()}\n`;
        }
        
        await base.safeSend(channel, list);
    },

    formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} bytes`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / 1048576).toFixed(2)} MB`;
    },

    async showHelp(channel, base) {
        const help = `
📦 **Server Backup System**

**Commands:**
• \`v!backup create [name]\` - Create a server backup
• \`v!backup restore <name>\` - Restore a server backup
• \`v!backup list\` - List all available backups

**Examples:**
• \`v!backup create my-backup\`
• \`v!backup restore important-backup\`
• \`v!backup list\`

**Backup Includes:**
• Server roles and permissions
• Channel settings and structure
• Server configuration
• Permission overwrites

**Note:** Backups are stored locally in the backups folder.
        `.trim();
        
        await base.safeSend(channel, help);
    }
};
