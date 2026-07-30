const fs = require('fs');
const content = fs.readFileSync('prisma/migrations/0_init/migration.sql');
// Se começar com BOM ou tiver null bytes, limpa
let text = content.toString('utf16le');
if (text.includes('\u0000')) {
    text = content.toString('utf8');
    text = text.replace(/\0/g, '');
}
if (content[0] === 0xff && content[1] === 0xfe) {
    text = content.slice(2).toString('utf16le');
}
fs.writeFileSync('prisma/migrations/0_init/migration.sql', text, 'utf8');
