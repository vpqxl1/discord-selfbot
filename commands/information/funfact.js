const axios = require("axios");

module.exports = {
  name: "funfact",
  description: "Displays a random fun fact from an API.",

  async execute(channel, message) {
    // Delete the trigger message
    message.delete().catch(() => {}); // ignore if it can't delete

    try {
      // Send a loading message first
      const loadingMsg = await channel.send("🔍 Fetching a fun fact...");

      // Try multiple APIs as fallbacks
      let factText = null;
      let source = "";

      try {
        // Primary API: uselessfacts.jsph.pl (clean, reliable)
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        factText = response.data.text.replace(/`/g, ''); // Remove backticks that might break formatting
        source = "UselessFacts API";
      } catch (error) {
        console.log("Primary API failed, trying backup...");
        
        try {
          // Backup API: api.api-ninjas.com/v1/facts
          const response = await axios.get('https://api.api-ninjas.com/v1/facts', {
            headers: {
              'X-Api-Key': 'SSQCwotrVF0pKIAi6licFg==f5OCTOXpUncl2SZh' // You can get a free key at api.api-ninjas.com
            }
          });
          factText = response.data[0].fact;
          source = "API Ninjas";
        } catch (error2) {
          console.log("Backup API also failed, using local fallback...");
          
          // Local fallback facts
          const fallbackFacts = [
            "Octopuses have three hearts and blue blood!",
            "Honey never spoils - archaeologists have found edible honey in ancient Egyptian tombs!",
            "A giraffe's tongue is about 20 inches long and is blue-black in color to prevent sunburn.",
            "The Moon is gradually moving away from Earth at about 3.8 cm per year.",
            "More than 80% of our ocean is unmapped, unobserved, and unexplored.",
            "Sharks have been around for more than 400 million years - they predate trees!",
            "Your brain uses about 20% of your body's total energy, despite being only 2% of your body weight."
          ];
          factText = fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)];
          source = "Local Backup";
        }
      }

      // Add some random emojis for fun
      const emojis = ['🌟', '🔥', '⚡', '💫', '🎯', '🚀', '💎', '🌈', '⭐', '🎪'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

      const factMessage = 
`╔══════════════════════════════╗
           **FUN FACT TIME!**
 ╚══════════════════════════════╝

${factText}

╔══════════════════════════════╗
 **Did you know? Now you do!** 
╚══════════════════════════════╝`;

      // Delete the loading message and send the fact
      loadingMsg.delete().catch(() => {});
      channel.send(factMessage).catch(err =>
        console.error("Error sending fun fact:", err)
      );

    } catch (error) {
      console.error("Error in funfact command:", error);
      channel.send("❌ Sorry, I couldn't fetch a fun fact right now. Try again later!").catch(console.error);
    }
  }
};
