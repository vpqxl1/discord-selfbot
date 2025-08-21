module.exports = {
    name: "security",
    description: "Comprehensive server security assessment",
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

            const progressMsg = await safeSend("🔒 Performing security audit...");

            // Security assessment
            const vulnerabilities = [];
            const recommendations = [];
            let securityScore = 100; // Start with perfect score

            // 1. Check verification level
            if (guild.verificationLevel < 2) { // Below MEDIUM
                vulnerabilities.push("Verification level is set to LOW");
                recommendations.push("Increase verification level to at least MEDIUM");
                securityScore -= 15;
            }

            // 2. Check 2FA requirement for moderation
            if (guild.mfaLevel === 0) {
                vulnerabilities.push("2FA is not required for moderation actions");
                recommendations.push("Enable 2FA requirement for moderators");
                securityScore -= 20;
            }

            // 3. Check explicit content filter
            if (guild.explicitContentFilter === 0) { // DISABLED
                vulnerabilities.push("Explicit content filter is disabled");
                recommendations.push("Enable explicit content filtering");
                securityScore -= 10;
            }

            // 4. Check role permissions
            const roles = guild.roles.cache;
            roles.forEach(role => {
                // Check for roles with dangerous permissions
                const dangerousPerms = ['ADMINISTRATOR', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_ROLES', 'MANAGE_GUILD'];
                const hasDangerousPerms = dangerousPerms.some(perm => role.permissions.has(perm));
                
                if (hasDangerousPerms && role.members.size > 5) {
                    vulnerabilities.push(`Role "${role.name}" has dangerous permissions and is assigned to ${role.members.size} members`);
                    recommendations.push(`Review permissions for role "${role.name}"`);
                    securityScore -= 5;
                }
            });

            // 5. Check bot permissions
            const botMember = guild.members.cache.get(client.user.id);
            if (botMember) {
                const botPerms = botMember.permissions;
                if (botPerms.has('ADMINISTRATOR')) {
                    vulnerabilities.push("Bot has ADMINISTRATOR permission (potential security risk)");
                    recommendations.push("Consider reducing bot permissions to only what's necessary");
                    securityScore -= 10;
                }
            }

            // 6. Check channel permissions
            guild.channels.cache.forEach(ch => {
                if (ch.type === 0) { // Text channels
                    // Check if @everyone has send permissions in sensitive channels
                    const everyonePerms = ch.permissionsFor(guild.roles.everyone);
                    if (ch.name.includes('admin') || ch.name.includes('mod') || ch.name.includes('staff')) {
                        if (everyonePerms.has('SEND_MESSAGES')) {
                            vulnerabilities.push(`Public send permissions in potentially sensitive channel: #${ch.name}`);
                            recommendations.push(`Restrict send permissions in #${ch.name}`);
                            securityScore -= 5;
                        }
                    }
                }
            });

            // 7. Check server features
            if (guild.features.includes('COMMUNITY') && !guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) {
                vulnerabilities.push("Community server without membership screening enabled");
                recommendations.push("Enable membership screening for new members");
                securityScore -= 10;
            }

            // Generate security report
            const securityLevel = securityScore >= 80 ? "🟢 EXCELLENT" : 
                                securityScore >= 60 ? "🟡 MODERATE" : "🔴 POOR";

            const securityReport = `🔒 **Security Audit Report**

**📊 Security Assessment:**
• Overall Score: ${securityScore}/100
• Security Level: ${securityLevel}
• Vulnerabilities Found: ${vulnerabilities.length}

**⚠️ Identified Vulnerabilities:**
${vulnerabilities.length > 0 ? 
    vulnerabilities.slice(0, 5).map((vuln, i) => `• ${vuln}`).join('\n') : 
    '• No critical vulnerabilities detected'
}
${vulnerabilities.length > 5 ? `\n• ...and ${vulnerabilities.length - 5} more` : ''}

**🎯 Recommendations:**
${recommendations.length > 0 ? 
    recommendations.slice(0, 5).map((rec, i) => `• ${rec}`).join('\n') : 
    '• Your server security configuration appears solid'
}
${recommendations.length > 5 ? `\n• ...and ${recommendations.length - 5} more recommendations` : ''}

**🛡️ Security Features:**
• Verification Level: ${['NONE', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'][guild.verificationLevel]}
• 2FA Requirement: ${guild.mfaLevel > 0 ? 'Enabled' : 'Disabled'}
• Content Filter: ${['DISABLED', 'MEMBERS_WITHOUT_ROLES', 'ALL_MEMBERS'][guild.explicitContentFilter]}
• Community Features: ${guild.features.includes('COMMUNITY') ? 'Enabled' : 'Disabled'}

*Note: This is an automated assessment.*`;

            // Clean up progress message and send report
            if (progressMsg && progressMsg.deletable) await progressMsg.delete().catch(() => {});
            await safeSend(securityReport);

        } catch (error) {
            console.error("Security command error:", error);
            await channel.send(`❌ Error: ${error.message || "Failed to perform security audit"}`);
        }
    }
};
