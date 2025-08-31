const CommandBase = require('../CommandBase');

module.exports = {
    name: 'convert',
    description: 'Convert between different units of measurement',
    aliases: ['conversion', 'units'],
    usage: 'convert <value> <from unit> to <to unit>',
    cooldown: 3000,

    async execute(channel, message, client, args) {
        const base = new CommandBase();
        
        if (args.length < 4 || args[2].toLowerCase() !== 'to') {
            return base.sendError(channel, 'Usage: v!convert <value> <from unit> to <to unit>\nExample: v!convert 10 km to miles');
        }

        const value = parseFloat(args[0]);
        const fromUnit = args[1].toLowerCase();
        const toUnit = args[3].toLowerCase();
        
        if (isNaN(value)) {
            return base.sendError(channel, 'Please provide a valid numeric value.');
        }

        try {
            const result = this.convertUnit(value, fromUnit, toUnit);
            
            const response = `
📏 **Unit Conversion**
**Input:** ${value} ${fromUnit}
**Output:** ${result.value.toFixed(6)} ${toUnit}
**Formula:** ${result.formula}
**Category:** ${result.category}
            `.trim();
            
            await base.safeSend(channel, response);
            
        } catch (error) {
            console.error('Conversion error:', error);
            await base.sendError(channel, 'Failed to convert units. Please check your units and try again.');
        }
    },

    convertUnit(value, fromUnit, toUnit) {
        const conversions = {
            length: {
                meters: 1,
                kilometers: 1000,
                centimeters: 0.01,
                millimeters: 0.001,
                miles: 1609.34,
                yards: 0.9144,
                feet: 0.3048,
                inches: 0.0254
            },
            weight: {
                kilograms: 1,
                grams: 0.001,
                milligrams: 0.000001,
                pounds: 0.453592,
                ounces: 0.0283495,
                tons: 907.185
            },
            temperature: {
                celsius: { convert: (v, to) => to === 'fahrenheit' ? (v * 9/5) + 32 : to === 'kelvin' ? v + 273.15 : v },
                fahrenheit: { convert: (v, to) => to === 'celsius' ? (v - 32) * 5/9 : to === 'kelvin' ? (v - 32) * 5/9 + 273.15 : v },
                kelvin: { convert: (v, to) => to === 'celsius' ? v - 273.15 : to === 'fahrenheit' ? (v - 273.15) * 9/5 + 32 : v }
            },
            // Add more categories as needed
        };

        // Find which category the units belong to
        for (const [category, units] of Object.entries(conversions)) {
            if (fromUnit in units && toUnit in units) {
                if (category === 'temperature') {
                    const result = units[fromUnit].convert(value, toUnit);
                    return {
                        value: result,
                        formula: this.getTemperatureFormula(fromUnit, toUnit),
                        category: 'Temperature'
                    };
                } else {
                    // Convert to base unit first, then to target unit
                    const baseValue = value * units[fromUnit];
                    const result = baseValue / units[toUnit];
                    return {
                        value: result,
                        formula: `${value} × (${units[fromUnit]} / ${units[toUnit]})`,
                        category: this.capitalize(category)
                    };
                }
            }
        }
        
        throw new Error('Unsupported unit conversion');
    },

    getTemperatureFormula(fromUnit, toUnit) {
        const formulas = {
            'celsius-fahrenheit': '°F = (°C × 9/5) + 32',
            'fahrenheit-celsius': '°C = (°F - 32) × 5/9',
            'celsius-kelvin': 'K = °C + 273.15',
            'kelvin-celsius': '°C = K - 273.15',
            'fahrenheit-kelvin': 'K = (°F - 32) × 5/9 + 273.15',
            'kelvin-fahrenheit': '°F = (K - 273.15) × 9/5 + 32'
        };
        
        return formulas[`${fromUnit}-${toUnit}`] || 'Custom conversion';
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};
