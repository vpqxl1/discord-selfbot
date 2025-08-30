const CommandBase = require('../CommandBase');

module.exports = {
    name: 'markdown',
    description: 'Preview Discord markdown formatting',
    aliases: ['md', 'format', 'preview'],
    usage: 'markdown <text>',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return this.showHelp(channel, base);
        }

        const text = args.join(' ');
        
        const preview = `
📝 **Markdown Preview**
**Input:** 
\`\`\`
${text}
\`\`\`

**Output:**
${text}

**Available Formatting:**
• **Bold:** \\*\\*text\\*\\* → **text**
• *Italic:* \\*text\\* → *text*
• __Underline:__ \\_\\_text\\_\\_ → __text__
• ~~Strikethrough:~~ \\~\\~text\\~\\~ → ~~text~~
• `Code:` \\`code\\` → \`code\`
• ```Code Block:``` \\`\\`\\`code\\`\\`\\` → \`\`\`code\`\`\`
• > Blockquote: \\> text → > text
        `.trim();

        await base.safeSend(channel, preview);
    },

    async showHelp(channel, base) {
        const helpText = `
📝 **Markdown Help**
Use: v!markdown <text>

**Examples:**
• v!markdown **Hello** *World*
• v!markdown \\`\\`\\`js
console.log("Hello")
\\`\\`\\`
• v!markdown > This is a quote

**Escape characters with \\\\ if needed**
        `.trim();

        await base.safeSend(channel, helpText);
    }
};
