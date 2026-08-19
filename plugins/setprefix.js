const fs = require('fs/promises');
const path = require('path');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix', 'changeprefix'],
    description: 'Change the command prefix (Owner only)',

    async execute(sock, m, args) {
        if (!global.owners.includes(m.sender)) {
            return m.reply('❌ You are not allowed to change the prefix.');
        }

        if (!args[0]) {
            return m.reply(
                `📝 Usage: ${global.BOT_PREFIX}setprefix <newPrefix>\n` +
                `Example: ${global.BOT_PREFIX}setprefix !`
            );
        }

        const newPrefix = args[0];

        if (newPrefix.length > 3) {
            return m.reply('❌ Prefix must be 3 characters or less.');
        }

        global.BOT_PREFIX = newPrefix;

        try {
            const configPath = path.join(__dirname, '../config.json');

            let config = {};

            try {
                const data = await fs.readFile(configPath, 'utf8');
                config = JSON.parse(data);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }

            config.prefix = newPrefix;

            await fs.writeFile(
                configPath,
                JSON.stringify(config, null, 2),
                'utf8'
            );

        } catch (error) {
            console.error('❌ Error saving prefix:', error);
            return m.reply('❌ Error saving prefix to config file.');
        }

        return m.reply(
            `✅ Prefix successfully changed to: \`${newPrefix}\``
        );
    }
};
