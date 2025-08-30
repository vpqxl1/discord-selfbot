module.exports = {
    name: "roles",
    description: "Analyze role distribution and permission usage",
    async execute(channel, message, client, args) {
        try {
            const safeSend = async (content) => {
                try {
                    return await channel.send(content);
                } catch (err) {
                    console.log(content);
                    return null;
                }
            };

            const guild = client.guilds.cache.get(channel.guildId);
            if (!guild) return safeSend("❌ Could not fetch server info.");

            const progressMsg = await safeSend("🛡️ Analyzing server roles and permissions...");

            // Get all roles
            const roles = guild.roles.cache;
            
            // Get all members
            const members = await guild.members.fetch();
            
            // Analyze role distribution
            const roleDistribution = [];
            let totalMembers = members.size;
            
            roles.forEach(role => {
                if (role.name === '@everyone') return;
                
                const membersWithRole = members.filter(member => 
                    member.roles.cache.has(role.id)
                ).size;
                
                const percentage = (membersWithRole / totalMembers) * 100;
                
                roleDistribution.push({
                    role: role,
                    count: membersWithRole,
                    percentage: percentage
                });
            });
            
            // Sort by member count
            roleDistribution.sort((a, b) => b.count - a.count);
            
            // Analyze permission usage
            const permissionUsage = {};
            const allPermissions = [
                'ADMINISTRATOR', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_CHANNELS', 
                'MANAGE_GUILD', 'VIEW_AUDIT_LOG', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS',
                'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES',
                'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE',
                'USE_EXTERNAL_EMOJIS', 'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS',
                'MOVE_MEMBERS', 'USE_VAD', 'PRIORITY_SPEAKER'
            ];
            
            // Initialize permission usage counter
            allPermissions.forEach(perm => {
                permissionUsage[perm] = 0;
            });
            
            // Count roles with each permission
            roles.forEach(role => {
                allPermissions.forEach(perm => {
                    if (role.permissions.has(perm)) {
                        permissionUsage[perm]++;
                    }
                });
            });
            
            // Find most common permissions
            const mostCommonPermissions = Object.entries(permissionUsage)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
                
            // Find potentially dangerous permissions
            const dangerousPermissions = ['ADMINISTRATOR', 'KICK_MEMBERS', 'BAN_MEMBERS', 
                                         'MANAGE_GUILD', 'MANAGE_ROLES', 'MANAGE_CHANNELS'];
            
            const dangerousRoles = roles.filter(role => {
                return dangerousPermissions.some(perm => role.permissions.has(perm));
            });
            
            // Check for permission conflicts
            const conflictWarnings = [];
            
            roles.forEach(role => {
                // Check if role has both send messages and manage messages (potential conflict)
                if (role.permissions.has('SEND_MESSAGES') && role.permissions.has('MANAGE_MESSAGES')) {
                    conflictWarnings.push(`${role.name} has both SEND_MESSAGES and MANAGE_MESSAGES`);
                }
                
                // Check if non-admin role has dangerous permissions
                if (!role.permissions.has('ADMINISTRATOR') && dangerousPermissions.some(p => 
                    p !== 'ADMINISTRATOR' && role.permissions.has(p))) {
                    conflictWarnings.push(`${role.name} has dangerous permissions but not ADMINISTRATOR`);
                }
            });
            
            // Generate role report
            const roleReport = `🛡️ **Role & Permission Analysis**

**📊 Role Distribution:**
${roleDistribution.slice(0, 10).map((role, i) => 
    `${i+1}. ${role.role.name} - ${role.count} members (${role.percentage.toFixed(1)}%)`
).join('\n')}

**🔑 Most Common Permissions:**
${mostCommonPermissions.map(([perm, count], i) => 
    `${i+1}. ${perm} - ${count} roles`
).join('\n')}

**⚠️  Potential Issues:**
${conflictWarnings.length > 0 ? 
    conflictWarnings.slice(0, 5).map(warning => `• ${warning}`).join('\n') : 
    '• No obvious permission conflicts detected'
}
${conflictWarnings.length > 5 ? `\n• ...and ${conflictWarnings.length - 5} more` : ''}

**📈 Role Statistics:**
• Total Roles: ${roles.size}
• Roles with Dangerous Permissions: ${dangerousRoles.size}
• Average Members per Role: ${(totalMembers / roles.size).toFixed(1)}
• Members with No Extra Roles: ${members.filter(m => m.roles.cache.size === 1).size}

**🎯 Recommendations:**
${roleDistribution.filter(r => r.percentage < 5 && r.count > 0).length > 3 ? 
    '• Consider consolidating underutilized roles' : '• Role distribution looks reasonable'
}
${dangerousRoles.size > 5 ? 
    '• Review roles with dangerous permissions' : '• Dangerous permissions are appropriately distributed'
}
${conflictWarnings.length > 0 ? 
    '• Review permission conflicts listed above' : '• No permission conflicts detected'
}`;

            // Clean up progress message and send report
            if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
            await safeSend(roleReport);

        } catch (error) {
            console.error("Roles command error:", error);
            await channel.send(`❌ Error: ${error.message || "Failed to analyze roles"}`);
        }
    }
};
