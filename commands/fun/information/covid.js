const axios = require('axios');

module.exports = {
    name: 'covid',
    description: 'Get COVID-19 statistics for a country',
    async execute(channel, message, client, args) {
        const country = args.join(' ') || 'global';
        
        try {
            const url = country.toLowerCase() === 'global' 
                ? 'https://disease.sh/v3/covid-19/all'
                : `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(country)}`;
            
            const response = await axios.get(url);
            const data = response.data;
            
            const covidEmbed = {
                title: `COVID-19 Statistics ${country === 'global' ? 'Worldwide' : `for ${data.country || country}`}`,
                color: 0xff0000,
                fields: [
                    {
                        name: 'Total Cases',
                        value: data.cases.toLocaleString(),
                        inline: true
                    },
                    {
                        name: 'Today Cases',
                        value: data.todayCases.toLocaleString(),
                        inline: true
                    },
                    {
                        name: 'Total Deaths',
                        value: data.deaths.toLocaleString(),
                        inline: true
                    },
                    {
                        name: 'Today Deaths',
                        value: data.todayDeaths.toLocaleString(),
                        inline: true
                    },
                    {
                        name: 'Recovered',
                        value: data.recovered.toLocaleString(),
                        inline: true
                    },
                    {
                        name: 'Active Cases',
                        value: data.active.toLocaleString(),
                        inline: true
                    }
                ],
                footer: {
                    text: 'Data from disease.sh'
                },
                timestamp: new Date()
            };
            
            channel.send({ embeds: [covidEmbed] });
        } catch (error) {
            console.error('COVID stats error:', error);
            channel.send('Could not fetch COVID-19 statistics. Check the country name or try again later.');
        }
    }
};
