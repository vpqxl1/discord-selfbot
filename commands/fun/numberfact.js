const CommandBase = require('../CommandBase');

module.exports = {
    name: 'numberfact',
    description: 'Get interesting facts about numbers',
    aliases: ['numfact', 'mathfact', 'number'],
    usage: 'numberfact <number> [trivia|math|year|date]',
    cooldown: 2000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length === 0) {
            return base.sendError(channel, 'Please provide a number. Usage: v!numberfact 42');
        }

        const number = parseInt(args[0]);
        const category = args[1]?.toLowerCase() || 'trivia';

        if (isNaN(number)) {
            return base.sendError(channel, 'Please provide a valid number.');
        }

        if (number < 0 || number > 10000) {
            return base.sendError(channel, 'Please provide a number between 0 and 10000.');
        }

        try {
            const fact = this.generateNumberFact(number, category);
            
            const response = `
🔢 **Number Fact #${number}**
${fact}

**Category:** ${category}
**Properties:** ${this.getNumberProperties(number).join(', ')}
            `.trim();

            await base.safeSend(channel, response);

        } catch (error) {
            await base.sendError(channel, 'Invalid category. Use: trivia, math, year, or date');
        }
    },

    generateNumberFact(number, category) {
        const facts = {
            trivia: this.getTriviaFact(number),
            math: this.getMathFact(number),
            year: this.getYearFact(number),
            date: this.getDateFact(number)
        };

        return facts[category] || facts.trivia;
    },

    getTriviaFact(number) {
        const triviaFacts = [
            `${number} is ${this.isPrime(number) ? 'a prime' : 'not a prime'} number.`,
            `${number} in binary is ${number.toString(2)}.`,
            `${number} in Roman numerals is ${this.toRoman(number)}.`,
            `The square of ${number} is ${number * number}.`,
            `The square root of ${number} is approximately ${Math.sqrt(number).toFixed(2)}.`,
            `${number} is ${number % 2 === 0 ? 'even' : 'odd'}.`,
            `The factorial of ${number} is ${this.factorial(number)}.`,
            `${number} is ${this.isPerfectNumber(number) ? 'a perfect' : 'not a perfect'} number.`
        ];
        return triviaFacts[Math.floor(Math.random() * triviaFacts.length)];
    },

    getMathFact(number) {
        const mathFacts = [
            `Prime factors: ${this.primeFactors(number).join(' × ') || 'None'}`,
            `Divisors: ${this.getDivisors(number).join(', ')}`,
            `Digital root: ${this.digitalRoot(number)}`,
            `Sum of digits: ${this.sumOfDigits(number)}`,
            `Binary: ${number.toString(2)}`,
            `Hexadecimal: ${number.toString(16).toUpperCase()}`,
            `Octal: ${number.toString(8)}`
        ];
        return mathFacts[Math.floor(Math.random() * mathFacts.length)];
    },

    getYearFact(number) {
        if (number < 1000 || number > 9999) {
            return "Year facts are only available for 4-digit years (1000-9999).";
        }

        const yearFacts = [
            `The ${number}s decade was ${this.describeDecade(number)}.`,
            `In ${number}, ${this.getHistoricalEvent(number)}`,
            `${number} was a ${this.isLeapYear(number) ? 'leap' : 'common'} year.`,
            `The ${Math.ceil(number / 100)}th century`
        ];
        return yearFacts[Math.floor(Math.random() * yearFacts.length)];
    },

    getDateFact(number) {
        if (number < 1 || number > 31) {
            return "Date facts are only available for numbers 1-31.";
        }

        const dateFacts = [
            `The ${number}${this.getOrdinalSuffix(number)} day of the month`,
            `In the Julian calendar, day ${number}`,
            `Date fact for ${number}`
        ];
        return dateFacts[Math.floor(Math.random() * dateFacts.length)];
    },

    getNumberProperties(number) {
        const properties = [];
        if (this.isPrime(number)) properties.push('prime');
        if (number % 2 === 0) properties.push('even');
        if (number % 2 !== 0) properties.push('odd');
        if (this.isPerfectSquare(number)) properties.push('perfect square');
        if (this.isFibonacci(number)) properties.push('fibonacci');
        return properties.length > 0 ? properties : ['regular'];
    },

    isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    },

    isPerfectSquare(num) {
        return Math.sqrt(num) % 1 === 0;
    },

    isFibonacci(num) {
        return this.isPerfectSquare(5 * num * num + 4) || this.isPerfectSquare(5 * num * num - 4);
    },

    isPerfectNumber(num) {
        if (num <= 1) return false;
        let sum = 1;
        for (let i = 2; i * i <= num; i++) {
            if (num % i === 0) {
                sum += i;
                if (i !== num / i) sum += num / i;
            }
        }
        return sum === num;
    },

    primeFactors(num) {
        const factors = [];
        let n = num;
        for (let i = 2; i <= n; i++) {
            while (n % i === 0) {
                factors.push(i);
                n /= i;
            }
        }
        return factors;
    },

    getDivisors(num) {
        const divisors = [];
        for (let i = 1; i <= Math.sqrt(num); i++) {
            if (num % i === 0) {
                divisors.push(i);
                if (i !== num / i) divisors.push(num / i);
            }
        }
        return divisors.sort((a, b) => a - b);
    },

    digitalRoot(num) {
        return num === 0 ? 0 : 1 + ((num - 1) % 9);
    },

    sumOfDigits(num) {
        return num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    },

    factorial(num) {
        if (num <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= num; i++) {
            result *= i;
        }
        return result;
    },

    toRoman(num) {
        const romanNumerals = [
            { value: 1000, symbol: 'M' }, { value: 900, symbol: 'CM' },
            { value: 500, symbol: 'D' }, { value: 400, symbol: 'CD' },
            { value: 100, symbol: 'C' }, { value: 90, symbol: 'XC' },
            { value: 50, symbol: 'L' }, { value: 40, symbol: 'XL' },
            { value: 10, symbol: 'X' }, { value: 9, symbol: 'IX' },
            { value: 5, symbol: 'V' }, { value: 4, symbol: 'IV' },
            { value: 1, symbol: 'I' }
        ];
        
        let result = '';
        for (const numeral of romanNumerals) {
            while (num >= numeral.value) {
                result += numeral.symbol;
                num -= numeral.value;
            }
        }
        return result;
    },

    getOrdinalSuffix(num) {
        if (num > 3 && num < 21) return 'th';
        switch (num % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    },

    describeDecade(year) {
        const decades = {
            1920: "the Roaring Twenties",
            1930: "the Great Depression era",
            1940: "World War II era",
            1950: "the post-war era",
            1960: "the Swinging Sixties",
            1970: "the Disco era",
            1980: "the Eighties",
            1990: "the Nineties",
            2000: "the 2000s",
            2010: "the 2010s",
            2020: "the 2020s"
        };
        return decades[Math.floor(year / 10) * 10] || "a notable decade";
    },

    getHistoricalEvent(year) {
        // Simplified historical events
        const events = {
            1066: "the Battle of Hastings took place",
            1215: "Magna Carta was signed",
            1492: "Columbus reached the Americas",
            1776: "the United States declared independence",
            1789: "the French Revolution began",
            1914: "World War I began",
            1929: "the Great Depression started",
            1939: "World War II began",
            1945: "World War II ended",
            1969: "humans landed on the Moon",
            1989: "the Berlin Wall fell",
            2001: "9/11 attacks occurred",
            2020: "the COVID-19 pandemic began"
        };
        return events[year] || "many significant events occurred";
    },

    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }
};
