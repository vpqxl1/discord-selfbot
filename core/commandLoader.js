const fs = require("fs");
const path = require("path");

function loadCommands(commandsDir) {
  const commands = new Map();
  const files = fs.readdirSync(commandsDir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(commandsDir, file.name);
    if (file.isDirectory()) {
      for (const [name, cmd] of loadCommands(fullPath)) {
        commands.set(name, cmd);
      }
    } else if (file.name.endsWith('.js')) {
      try {
        delete require.cache[require.resolve(fullPath)];
        const command = require(fullPath);
        if (command && typeof command.execute === 'function' && command.name) {
          commands.set(command.name, command);
        }
      } catch (err) {
        console.error(`Error loading ${file.name}:`, err.message);
      }
    }
  }
  return commands;
}

module.exports = { loadCommands };
