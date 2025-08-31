const CommandBase = require('../CommandBase');
const fs = require('fs');
const path = require('path');

// Use a CommonJS compatible file type detection
let fileType;
try {
  // Try to use file-type with dynamic import
  (async () => {
    try {
      fileType = (await import('file-type')).default;
    } catch (e) {
      // Fallback to alternative
      console.log('Using file-type fallback');
      fileType = require('file-type-from-buffer');
    }
  })();
} catch (e) {
  console.error('Could not load file type module:', e);
}

module.exports = {
    name: 'metadata',
    description: 'Extract metadata from files',
    aliases: ['exif', 'info'],
    usage: 'metadata <attachment>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (message.attachments.size === 0) {
            return base.safeSend(channel, '❌ Please attach a file to extract metadata from.');
        }

        const attachment = message.attachments.first();
        
        try {
            // Download the file
            const response = await fetch(attachment.url);
            const buffer = await response.buffer();
            
            let metadata = {};
            
            // Try to extract metadata based on file type
            if (fileType) {
                const type = await fileType.fromBuffer(buffer);
                if (type) {
                    metadata.fileType = type;
                }
            }
            
            // Add basic file info
            metadata.name = attachment.name;
            metadata.size = attachment.size;
            metadata.url = attachment.url;
            
            await base.safeSend(channel, `📄 **File Metadata**\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``);
            
        } catch (error) {
            console.error('Error extracting metadata:', error);
            await base.safeSend(channel, '❌ Failed to extract metadata from the file.');
        }
    }
};
