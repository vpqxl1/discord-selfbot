const { Buffer } = require('buffer');
const { MessageEmbed } = require('discord.js-selfbot-v13');

module.exports = {
  name: 'encode',
  description: 'Encode/decode text using various methods',
  async execute(channel, message, client, args) {
    // Get prefix from client (set in index.js) or use default
    const prefix = client.prefix || '!';
    
    // Show detailed help if no arguments provided
    if (args.length === 0) {
      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('🔐 Encoding/Decoding Tool')
        .setDescription('A comprehensive tool for encoding and decoding text using various methods')
        .addFields(
          {
            name: '📋 Usage',
            value: `\`${prefix}encode <method> <operation> <text>\`\n` +
                  `Example: \`${prefix}encode base64 encode Hello World\``
          },
          {
            name: '🔄 Available Methods',
            value: '**base64** - Base64 encoding/decoding\n' +
                  '**url** - URL encoding/decoding\n' +
                  '**html** - HTML entity encoding/decoding\n' +
                  '**binary** - Binary text conversion\n' +
                  '**hex** - Hexadecimal conversion\n' +
                  '**rot13** - ROT13 cipher\n' +
                  '**reverse** - Text reversal\n' +
                  '**md5** - MD5 hashing\n' +
                  '**sha256** - SHA256 hashing\n' +
                  '**morse** - Morse code conversion'
          },
          {
            name: '⚙️ Operations',
            value: '**encode** - Convert text to encoded format\n' +
                  '**decode** - Convert encoded text back to original\n' +
                  '**hash** - Generate hash (for md5/sha256)'
          },
          {
            name: '📝 Examples',
            value: `\`${prefix}encode base64 encode Hello World\`\n` +
                  `\`${prefix}encode url decode https%3A%2F%2Fexample.com\`\n` +
                  `\`${prefix}encode morse encode SOS\`\n` +
                  `\`${prefix}encode md5 hash secret password\``
          }
        )
        .setFooter({ text: 'Use !encode <method> help for specific method information' });

      return channel.send({ embeds: [embed] });
    }

    const method = args[0].toLowerCase();
    
    // Show method-specific help if requested
    if (args.length === 1 || args[1] === 'help') {
      let methodHelp = '';
      
      switch (method) {
        case 'base64':
          methodHelp = `**Base64 Encoding**\nEncodes/decodes text using Base64 format.\n\nExamples:\n- \`${prefix}encode base64 encode Hello World\`\n- \`${prefix}encode base64 decode SGVsbG8gV29ybGQ=\``;
          break;
        case 'url':
          methodHelp = `**URL Encoding**\nEncodes/decodes text for use in URLs.\n\nExamples:\n- \`${prefix}encode url encode https://example.com/?q=hello world\`\n- \`${prefix}encode url decode https%3A%2F%2Fexample.com%2F%3Fq%3Dhello%20world\``;
          break;
        case 'html':
          methodHelp = `**HTML Encoding**\nEncodes/decodes HTML entities.\n\nExamples:\n- \`${prefix}encode html encode <div>Hello & World</div>\`\n- \`${prefix}encode html decode &lt;div&gt;Hello &amp; World&lt;/div&gt;\``;
          break;
        case 'binary':
          methodHelp = `**Binary Conversion**\nConverts text to/from binary representation.\n\nExamples:\n- \`${prefix}encode binary encode Hello\`\n- \`${prefix}encode binary decode 01001000 01100101 01101100 01101100 01101111\``;
          break;
        case 'hex':
          methodHelp = `**Hexadecimal Conversion**\nConverts text to/from hexadecimal representation.\n\nExamples:\n- \`${prefix}encode hex encode Hello\`\n- \`${prefix}encode hex decode 48656c6c6f\``;
          break;
        case 'rot13':
          methodHelp = `**ROT13 Cipher**\nApplies the ROT13 cipher to text (encode and decode are the same operation).\n\nExamples:\n- \`${prefix}encode rot13 encode Hello World\`\n- \`${prefix}encode rot13 decode Uryyb Jbeyq\``;
          break;
        case 'reverse':
          methodHelp = `**Text Reversal**\nReverses text (encode and decode are the same operation).\n\nExamples:\n- \`${prefix}encode reverse encode Hello World\`\n- \`${prefix}encode reverse decode dlroW olleH\``;
          break;
        case 'md5':
          methodHelp = `**MD5 Hashing**\nGenerates MD5 hash of text.\n\nExample:\n- \`${prefix}encode md5 hash secret password\``;
          break;
        case 'sha256':
          methodHelp = `**SHA256 Hashing**\nGenerates SHA256 hash of text.\n\nExample:\n- \`${prefix}encode sha256 hash secret password\``;
          break;
        case 'morse':
          methodHelp = `**Morse Code**\nConverts text to/from Morse code.\n\nExamples:\n- \`${prefix}encode morse encode SOS\`\n- \`${prefix}encode morse decode ... --- ...\``;
          break;
        default:
          return channel.send(
            `Unknown method "${method}". Available methods: ` +
            'base64, url, html, binary, hex, rot13, reverse, md5, sha256, morse\n' +
            `Use \`${prefix}encode\` for general help.`
          );
      }
      
      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`🔐 ${method.toUpperCase()} Help`)
        .setDescription(methodHelp)
        .setFooter({ text: `Use ${prefix}encode <method> <operation> <text> to execute` });
        
      return channel.send({ embeds: [embed] });
    }

    const operation = args[1].toLowerCase();
    const inputText = args.slice(2).join(' ');

    if (!inputText) {
      return channel.send('Please provide text to encode/decode.');
    }

    try {
      let result;
      
      switch (method) {
        case 'base64':
          if (operation === 'encode') {
            result = Buffer.from(inputText).toString('base64');
          } else if (operation === 'decode') {
            result = Buffer.from(inputText, 'base64').toString('utf8');
          } else {
            return channel.send('Invalid operation. Use "encode" or "decode".');
          }
          break;
          
        case 'url':
          if (operation === 'encode') {
            result = encodeURIComponent(inputText);
          } else if (operation === 'decode') {
            result = decodeURIComponent(inputText);
          } else {
            return channel.send('Invalid operation. Use "encode" or "decode".');
          }
          break;
          
        case 'html':
          if (operation === 'encode') {
            result = inputText
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          } else if (operation === 'decode') {
            result = inputText
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'");
          } else {
            return channel.send('Invalid operation. Use "encode" or "decode".');
          }
          break;
          
        case 'binary':
          if (operation === 'encode') {
            result = inputText.split('').map(char => {
              return char.charCodeAt(0).toString(2).padStart(8, '0');
            }).join(' ');
          } else if (operation === 'decode') {
            result = inputText.split(' ').map(bin => {
              return String.fromCharCode(parseInt(bin, 2));
            }).join('');
          } else {
            return channel.send('Invalid operation. Use "encode" or "decode".');
          }
          break;
          
        case 'hex':
          if (operation === 'encode') {
            result = Buffer.from(inputText).toString('hex');
          } else if (operation === 'decode') {
            result = Buffer.from(inputText, 'hex').toString('utf8');
          } else {
            return channel.send('Invalid operation. Use "encode" or "decode".');
          }
          break;
          
        case 'rot13':
          result = inputText.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code >= 65 && code <= 90) {
              return String.fromCharCode(((code - 65 + 13) % 26) + 65);
            } else if (code >= 97 && code <= 122) {
              return String.fromCharCode(((code - 97 + 13) % 26) + 97);
            }
            return char;
          }).join('');
          break;
          
        case 'reverse':
          result = inputText.split('').reverse().join('');
          break;
          
        case 'md5':
          if (operation === 'hash') {
            const crypto = require('crypto');
            result = crypto.createHash('md5').update(inputText).digest('hex');
          } else {
            return channel.send('Invalid operation. Use "hash".');
          }
          break;
          
        case 'sha256':
          if (operation === 'hash') {
            const crypto = require('crypto');
            result = crypto.createHash('sha256').update(inputText).digest('hex');
          } else {
            return channel.send('Invalid operation. Use "hash".');
          }
          break;
          
        case 'morse':
          const morseMap = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
            "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
            '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
            '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
            ' ': '/'
          };
          
          const reverseMorseMap = {};
          for (const [key, value] of Object.entries(morseMap)) {
            reverseMorseMap[value] = key;
          }
          
          if (operation === 'encode') {
            result = inputText.toUpperCase().split('').map(char => {
              return morseMap[char] || char;
            }).join(' ');
          } else if (operation === 'decode') {
            result = inputText.split(' ').map(code => {
              return reverseMorseMap[code] || code;
            }).join('');
          } else {
            return channel.send('Invalid operation. Use "encode" or "decode".');
          }
          break;
          
        default:
          return channel.send(
            'Invalid encoding method. Available methods: ' +
            'base64, url, html, binary, hex, rot13, reverse, md5, sha256, morse'
          );
      }
      
      // Format the result for Discord
      if (result.length > 1900) {
        // If result is too long, send as a file
        const { MessageAttachment } = require('discord.js-selfbot-v13');
        const buffer = Buffer.from(result, 'utf8');
        const attachment = new MessageAttachment(buffer, `${method}-${operation}.txt`);
        return channel.send({ 
          content: `Result of ${method} ${operation}:`,
          files: [attachment] 
        });
      } else {
        // Send as a code block with a nice embed
        const embed = new MessageEmbed()
          .setColor('#00ff00')
          .setTitle('🔐 Encoding Result')
          .addFields(
            { name: 'Input', value: `\`\`\`\n${inputText}\n\`\`\``, inline: false },
            { name: 'Output', value: `\`\`\`\n${result}\n\`\`\``, inline: false }
          )
          .setFooter({ text: `${method.toUpperCase()} ${operation.toUpperCase()}` });
        
        return channel.send({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error('Encoding/decoding error:', error);
      return channel.send('❌ Error processing your request. Please check your input and try again.');
    }
  }
};
