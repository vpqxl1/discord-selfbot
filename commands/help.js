const fs = require("fs");
const path = require("path");
const { prefix } = require("../config");

module.exports = {
  name: "help",
  description: "Shows a list of available commands.",

  execute(channel, message) {
    // Delete the trigger message
    message.delete().catch(() => {}); // ignore if it can't delete

    const commandsPath = path.resolve(__dirname, "../commands");
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

    let helpText = 
`🚀━━━━━━━━━━━━━━━━━━━━🚀
         **COMMAND LIST**
━━━━━━━━━━━━━━━━━━━━━━━

Here are the available commands:\n`;

    for (const file of commandFiles) {
      try {
        const { name, description } = require(`../commands/${file}`);
        helpText += `\n🔸 **${prefix}${name}** → ${description}`;
      } catch (err) {
        console.error(`Error loading ${file}:`, err);
      }
    }

    helpText +=
`\n\n━━━━━━━━━━━━━━━━━━━━━━━
 **skidded by vpqxl**
🚀━━━━━━━━━━━━━━━━━━━━🚀`;

    // Send in chunks if too long
    helpText.match(/[\s\S]{1,2000}/g).forEach(chunk => {
      channel.send(chunk).catch(err =>
        console.error("Error sending help message:", err)
      );
    });
  }
};

