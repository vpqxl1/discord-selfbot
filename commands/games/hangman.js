const { prefix } = require("../../config");
const axios = require("axios");

const hangmanGames = new Map();
const maxAttempts = 6;

// Extended word categories with all requested additions
const wordCategories = {
  general: [
    "javascript", "discord", "hangman", "programming", "developer", 
    "bot", "nodejs", "computer", "keyboard", "internet", "algorithm",
    "database", "framework", "software", "hardware", "application",
    "network", "security", "encryption", "authentication", "interface",
    "protocol", "firewall", "compiler", "debugging", "repository"
  ],
  philosophy: [
    "epistemology", "metaphysics", "existentialism", "stoicism", "nihilism",
    "rationalism", "empiricism", "humanism", "utilitarianism", "determinism",
    "phenomenology", "deconstruction", "hermeneutics", "positivism", "skepticism",
    "dialectic", "ontology", "aesthetics", "ethics", "teleology", "dualism",
    "monism", "materialism", "idealism", "pragmatism", "structuralism"
  ],
  astronomy: [
    "telescope", "nebula", "galaxy", "constellation", "supernova",
    "blackhole", "planet", "asteroid", "cosmology", "observatory",
    "quasar", "pulsar", "asterism", "celestial", "equinox", "solstice",
    "parallax", "spectroscopy", "cosmology", "exoplanet", "meteorite",
    "eclipse", "asteroid", "comet", "universe", "astrophysics"
  ],
  science: [
    "biology", "chemistry", "physics", "experiment", "hypothesis",
    "quantum", "molecule", "organism", "laboratory", "microscope",
    "genetics", "evolution", "photosynthesis", "ecosystem", "biodiversity",
    "thermodynamics", "electromagnetism", "relativity", "nanotechnology", "biotechnology",
    "microbiology", "neuroscience", "paleontology", "biochemistry", "geology", "meteorology"
  ],
  geography: [
    "continent", "mountain", "river", "ocean", "desert", "island", "peninsula",
    "volcano", "waterfall", "canyon", "glacier", "plateau", "valley", "delta",
    "archipelago", "savanna", "tundra", "rainforest", "wetlands", "fjord",
    "isthmus", "atoll", "oasis", "prairie", "mesa", "butte"
  ],
  history: [
    "renaissance", "revolution", "empire", "dynasty", "monarchy", "republic",
    "civilization", "archaeology", "artifact", "manuscript", "hierarchy",
    "feudalism", "industrialization", "exploration", "colonization", "independence",
    "constitution", "democracy", "nationalism", "imperialism", "socialism",
    "capitalism", "globalization", "migration", "urbanization", "innovation"
  ],
  movies: [
    "director", "screenplay", "cinematography", "animation", "documentary",
    "blockbuster", "franchise", "sequel", "prequel", "protagonist",
    "antagonist", "narrative", "genre", "thriller", "comedy", "drama",
    "horror", "sciencefiction", "fantasy", "western", "noir", "romance",
    "musical", "biography", "adaptation", "screenwriter"
  ],
  music: [
    "symphony", "orchestra", "melody", "harmony", "rhythm", "tempo", "pitch",
    "composition", "improvisation", "notation", "conductor", "virtuoso",
    "repertoire", "acoustics", "resonance", "vibration", "frequency", "amplitude",
    "overtone", "consonance", "dissonance", "cadence", "modulation", "arrangement",
    "orchestration", "counterpoint"
  ],
  sports: [
    "competition", "tournament", "championship", "tournament", "olympics",
    "athletics", "endurance", "strength", "agility", "precision", "technique",
    "strategy", "offense", "defense", "goalkeeper", "referee", "scoreboard",
    "playoffs", "qualification", "victory", "defeat", "tournament", "tournament",
    "tournament", "tournament", "tournament"
  ],
  food: [
    "cuisine", "gastronomy", "nutrition", "ingredient", "recipe", "culinary",
    "seasoning", "marination", "fermentation", "preservation", "pasteurization",
    "homogenization", "emulsification", "caramelization", "crystallization",
    "dehydration", "rehydration", "gelatinization", "coagulation", "denaturation",
    "maillard", "proofing", "tempering", "blanching", "parboiling", "deglazing"
  ],
  animals: [
    "mammal", "reptile", "amphibian", "bird", "fish", "invertebrate", "arthropod",
    "mollusk", "crustacean", "arachnid", "insect", "primate", "rodent", "carnivore",
    "herbivore", "omnivore", "predator", "prey", "ecosystem", "habitat", "migration",
    "hibernation", "camouflage", "mimicry", "symbiosis", "biodiversity"
  ],
  literature: [
    "novel", "poetry", "drama", "fiction", "nonfiction", "biography", "autobiography",
    "essay", "manuscript", "publication", "narrative", "protagonist", "antagonist",
    "foreshadowing", "flashback", "allegory", "metaphor", "simile", "symbolism",
    "irony", "satire", "parody", "genre", "theme", "motif", "alliteration"
  ],
  technology: [
    "algorithm", "encryption", "authentication", "virtualization", "containerization",
    "microservices", "blockchain", "cryptocurrency", "artificialintelligence",
    "machinelearning", "deeplearning", "neuralnetwork", "quantumcomputing",
    "nanotechnology", "biometrics", "robotics", "automation", "internetofthings",
    "augmentedreality", "virtualreality", "cybersecurity", "cryptography",
    "distributedystems", "cloudcomputing", "edgecomputing", "devops"
  ],
  mathematics: [
    "algebra", "geometry", "calculus", "trigonometry", "statistics", "probability",
    "topology", "numbertheory", "combinatorics", "optimization", "algorithm",
    "theorem", "axiom", "postulate", "conjecture", "proof", "derivative", "integral",
    "matrix", "vector", "tensor", "fractal", "logarithm", "exponent", "polynomial",
    "differentialequation"
  ],
  art: [
    "painting", "sculpture", "architecture", "photography", "cinematography",
    "calligraphy", "typography", "illustration", "animation", "ceramics",
    "printmaking", "conceptualart", "performanceart", "installationart",
    "digitalart", "impressionism", "expressionism", "surrealism", "cubism",
    "abstractexpressionism", "popart", "minimalism", "contemporaryart",
    "renaissance", "baroque", "neoclassicism"
  ],
  lilpeep: [
    "crybaby", "hellboy", "beamerboy", "savee that shit", "starhopping",
    "awful things", "benz truck", "problems", "witchblades", "gym class",
    "kiss", "praying to the sky", "the brightside", "white wine", "veins",
    "nineteen", "lil kennedy", "absolute in doubt", "ghost boy", "ghost girl",
    "yesterday", "we think too much", "pray i die", "teen romance", "hair dye",
    "white tee", "downtown", "backseat"
  ]
};

// Keyless API endpoints for some categories
const apiEndpoints = {
  general: "https://random-word-api.herokuapp.com/word?length=6",
  philosophy: "https://random-word-api.herokuapp.com/word?length=8",
  astronomy: "https://api.datamuse.com/words?top=astronomy&md=s&max=10",
  science: "https://api.datamuse.com/words?top=science&md=s&max=10",
  geography: "https://api.datamuse.com/words?top=geography&md=s&max=10",
  history: "https://api.datamuse.com/words?top=history&md=s&max=10",
  movies: "https://api.datamuse.com/words?top=movies&md=s&max=10",
  music: "https://api.datamuse.com/words?top=music&md=s&max=10",
  sports: "https://api.datamuse.com/words?top=sports&md=s&max=10",
  food: "https://api.datamuse.com/words?top=food&md=s&max=10",
  animals: "https://api.datamuse.com/words?top=animals&md=s&max=10",
  literature: "https://api.datamuse.com/words?top=literature&md=s&max=10",
  technology: "https://api.datamuse.com/words?top=technology&md=s&max=10",
  mathematics: "https://api.datamuse.com/words?top=mathematics&md=s&max=10",
  art: "https://api.datamuse.com/words?top=art&md=s&max=10"
  // Note: Lil Peep category doesn't have an API endpoint
};

module.exports = {
  name: "hangman",
  description: "Play a game of hangman with different categories",

  async execute(channel, message, client, args) {
    message.delete().catch(() => {});

    if (args.length === 0) {
      const categories = Object.keys(wordCategories).join(", ");
      return channel.send(
        `**Hangman Game**\n\n` +
        `**Usage:**\n` +
        `• ${prefix}hangman start <category> - Start a new game (categories: ${categories})\n` +
        `• ${prefix}hangman guess <letter> - Guess a letter\n` +
        `• ${prefix}hangman end - End current game\n\n` +
        `**Categories available:** ${categories}`
      );
    }

    const subCommand = args[0].toLowerCase();
    const game = hangmanGames.get(message.channel.id);

    if (subCommand === "start") {
      if (game) {
        return channel.send("A game is already in progress in this channel!");
      }

      const category = args[1]?.toLowerCase() || "general";
      
      if (!wordCategories[category]) {
        const categories = Object.keys(wordCategories).join(", ");
        return channel.send(`Invalid category! Available categories: ${categories}`);
      }

      // Try to fetch a word from API first, fall back to local if fails
      let word;
      try {
        word = await fetchWordFromAPI(category);
        console.log(`Fetched word from API: ${word}`);
      } catch (error) {
        console.log("API fetch failed, using local word:", error.message);
        const words = wordCategories[category];
        word = words[Math.floor(Math.random() * words.length)];
      }
      
      // Ensure word is valid
      if (!word || word.length < 3) {
        const words = wordCategories[category];
        word = words[Math.floor(Math.random() * words.length)];
      }
      
      // For Lil Peep songs with spaces, we need special handling
      const progress = category === "lilpeep" && word.includes(" ") 
        ? word.split("").map(char => char === " " ? " " : "_")
        : Array(word.length).fill("_");
      
      const gameState = {
        word: word.toLowerCase(),
        category: category,
        progress: progress,
        attempts: maxAttempts,
        guessed: []
      };

      hangmanGames.set(message.channel.id, gameState);
      
      // Format the display differently for Lil Peep songs with spaces
      const wordDisplay = category === "lilpeep" && word.includes(" ")
        ? formatProgressWithSpaces(gameState.progress)
        : `\`${gameState.progress.join(" ")}\``;
      
      return channel.send(
        `🎮 **Hangman game started!** (Category: ${category})\n\n` +
        `${renderHangman(gameState)}\n\n` +
        `Word: ${wordDisplay}\n\n` +
        `Guess a letter with: ${prefix}hangman guess <letter>`
      );
    }

    if (subCommand === "guess") {
      if (!game) {
        return channel.send(`No active game! Start one with: ${prefix}hangman start <category>`);
      }

      const guess = args[1]?.toLowerCase();
      if (!guess || !guess.match(/[a-z]/i) || guess.length !== 1) {
        return channel.send("Please provide a valid single letter guess!");
      }

      if (game.guessed.includes(guess)) {
        return channel.send(`You already guessed "${guess}"!\n\nGuessed letters: ${game.guessed.join(", ")}`);
      }

      game.guessed.push(guess);

      // For Lil Peep songs with spaces, we need to handle spaces correctly
      if (game.category === "lilpeep" && game.word.includes(" ")) {
        let correctGuess = false;
        for (let i = 0; i < game.word.length; i++) {
          if (game.word[i] === guess && game.progress[i] === "_") {
            game.progress[i] = guess;
            correctGuess = true;
          }
        }
        
        if (!correctGuess) {
          game.attempts--;
        }
      } else {
        // Standard handling for other categories
        if (game.word.includes(guess)) {
          game.word.split("").forEach((letter, index) => {
            if (letter === guess) game.progress[index] = letter;
          });
        } else {
          game.attempts--;
        }
      }

      // Check win/lose conditions
      const currentProgress = game.category === "lilpeep" && game.word.includes(" ")
        ? game.progress.join("")
        : game.progress.join("");
        
      if (currentProgress === game.word) {
        hangmanGames.delete(message.channel.id);
        return channel.send(
          `🎉 **You won!** The word was: ${game.word}\n\n` +
          `${renderHangman(game)}\n\n` +
          `Category: ${game.category}`
        );
      }

      if (game.attempts <= 0) {
        hangmanGames.delete(message.channel.id);
        return channel.send(
          `💀 **You lost!** The word was: ${game.word}\n\n` +
          `${renderHangman(game)}\n\n` +
          `Category: ${game.category}`
        );
      }

      // Update game state
      hangmanGames.set(message.channel.id, game);
      
      // Format the display differently for Lil Peep songs with spaces
      const progressDisplay = game.category === "lilpeep" && game.word.includes(" ")
        ? formatProgressWithSpaces(game.progress)
        : `\`${game.progress.join(" ")}\``;
      
      return channel.send(
        `**Hangman** (Category: ${game.category})\n\n` +
        `${renderHangman(game)}\n\n` +
        `Progress: ${progressDisplay}\n` +
        `Guessed: ${game.guessed.join(", ")}\n` +
        `Attempts left: ${game.attempts}`
      );
    }

    if (subCommand === "end") {
      if (!game) return channel.send("No active game!");
      
      const word = game.word;
      hangmanGames.delete(message.channel.id);
      
      return channel.send(
        `Game ended! The word was: ${word}\n\n` +
        `Category: ${game.category}`
      );
    }

    if (subCommand === "categories") {
      const categories = Object.keys(wordCategories).join(", ");
      return channel.send(`**Available categories:** ${categories}`);
    }
  }
};

// Function to fetch words from keyless APIs
async function fetchWordFromAPI(category) {
  const endpoint = apiEndpoints[category];
  
  // For categories without API endpoints (like lilpeep), use local words
  if (!endpoint) {
    throw new Error("No API endpoint for this category");
  }
  
  try {
    if (category === "general" || category === "philosophy") {
      // Use random-word-api for general and philosophy
      const response = await axios.get(endpoint);
      return response.data[0];
    } else {
      // Use Datamuse API for other categories
      const response = await axios.get(endpoint);
      
      // Filter for words that are nouns and have reasonable length
      const words = response.data
        .filter(item => {
          // Check if the word has tags (part of speech info)
          const tags = item.tags || [];
          const isNoun = tags.includes("n");
          const wordLength = item.word.length;
          return isNoun && wordLength >= 5 && wordLength <= 12;
        })
        .map(item => item.word);
      
      if (words.length === 0) {
        throw new Error("No suitable words found in API response");
      }
      
      // Return a random word from the filtered list
      return words[Math.floor(Math.random() * words.length)];
    }
  } catch (error) {
    console.error("API fetch error:", error.message);
    throw new Error("Failed to fetch word from API");
  }
}

// Helper function to format progress with spaces for Lil Peep songs
function formatProgressWithSpaces(progress) {
  let result = "```";
  for (let i = 0; i < progress.length; i++) {
    if (progress[i] === " ") {
      result += "   "; // Three spaces for word separation
    } else {
      result += progress[i] + " ";
    }
  }
  result += "```";
  return result;
}

function renderHangman(game) {
  const stages = [
    `
      +---+
      |   |
          |
          |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
          |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
      |   |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
     /|   |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
     /|\\  |
          |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
     /|\\  |
     /    |
          |
    =========
    `,
    `
      +---+
      |   |
      O   |
     /|\\  |
     / \\  |
          |
    =========
    `
  ];
  return `\`\`\`${stages[maxAttempts - game.attempts]}\`\`\``;
}
