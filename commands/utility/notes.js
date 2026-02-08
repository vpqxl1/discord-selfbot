const CommandBase = require('../CommandBase');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
const notesFile = path.join(logsDir, 'notes.json');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

function loadNotes() {
    try {
        if (fs.existsSync(notesFile)) {
            return JSON.parse(fs.readFileSync(notesFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
    return [];
}

function saveNotes(notes) {
    try {
        fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

module.exports = {
    name: 'notes',
    description: 'Take and manage personal notes',
    aliases: ['note', 'n'],
    usage: 'notes <add|list|view|delete|search> [args...]',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return this.showHelp(channel, base);
        }

        const subcommand = args[0].toLowerCase();
        const notes = loadNotes();

        switch (subcommand) {
            case 'add':
                if (args.length < 2) {
                    return base.sendError(channel, 'Please provide note content.');
                }
                const noteContent = args.slice(1).join(' ');
                const newNote = {
                    id: Date.now().toString(),
                    content: noteContent,
                    created: new Date().toISOString(),
                    author: message.author.id
                };
                notes.push(newNote);
                saveNotes(notes);
                await base.sendSuccess(channel, `Note added (ID: ${newNote.id})`);
                break;

            case 'list':
                if (notes.length === 0) {
                    return base.sendWarning(channel, 'No notes found.');
                }
                const notesList = notes.slice(-10).map(n => 
                    `**${n.id}** - ${n.content.substring(0, 50)}${n.content.length > 50 ? '...' : ''}`
                ).join('\n');
                await base.safeSend(channel, `📝 **Recent Notes:**\n${notesList}\n\n*Showing last 10 notes*`);
                break;

            case 'view':
                if (args.length < 2) {
                    return base.sendError(channel, 'Please provide a note ID.');
                }
                const viewId = args[1];
                const viewNote = notes.find(n => n.id === viewId);
                if (!viewNote) {
                    return base.sendError(channel, 'Note not found.');
                }
                const viewEmbed = {
                    title: '📝 Note Details',
                    description: viewNote.content,
                    color: 0x5865F2,
                    fields: [
                        { name: 'ID', value: viewNote.id, inline: true },
                        { name: 'Created', value: `<t:${Math.floor(new Date(viewNote.created).getTime() / 1000)}:R>`, inline: true }
                    ]
                };
                await base.sendEmbed(channel, viewEmbed);
                break;

            case 'delete':
                if (args.length < 2) {
                    return base.sendError(channel, 'Please provide a note ID.');
                }
                const deleteId = args[1];
                const initialLength = notes.length;
                const filteredNotes = notes.filter(n => n.id !== deleteId);
                if (filteredNotes.length === initialLength) {
                    return base.sendError(channel, 'Note not found.');
                }
                saveNotes(filteredNotes);
                await base.sendSuccess(channel, 'Note deleted.');
                break;

            case 'search':
                if (args.length < 2) {
                    return base.sendError(channel, 'Please provide a search term.');
                }
                const searchTerm = args.slice(1).join(' ').toLowerCase();
                const results = notes.filter(n => n.content.toLowerCase().includes(searchTerm));
                if (results.length === 0) {
                    return base.sendWarning(channel, 'No notes found matching your search.');
                }
                const resultsList = results.slice(0, 10).map(n => 
                    `**${n.id}** - ${n.content.substring(0, 50)}${n.content.length > 50 ? '...' : ''}`
                ).join('\n');
                await base.safeSend(channel, `🔍 **Search Results:**\n${resultsList}`);
                break;

            default:
                await this.showHelp(channel, base);
        }
    },

    async showHelp(channel, base) {
        const help = `📝 **Notes Help**
• \`notes add <content>\` - Add a new note
• \`notes list\` - List recent notes
• \`notes view <id>\` - View a specific note
• \`notes delete <id>\` - Delete a note
• \`notes search <term>\` - Search notes`;
        await base.safeSend(channel, help);
    }
};
