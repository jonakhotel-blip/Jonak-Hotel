const crypto = require('crypto');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('server/data/hotel_data.json', 'utf-8'));
const owner = data.users.find(u => u.email === 'owner@jonakhotelgroup.in');
const code = owner.initialRecoveryCodesPlain[0];
const clean = code.replace(/[\s-]/g, '');
const hash = crypto.createHash('sha256').update(clean).digest('hex');
console.log('Plain code:', code, 'Clean:', clean);
console.log('Computed hash:', hash);
console.log('Stored hash in recoveryCodes[0]:', owner.recoveryCodes[0].hash);
console.log('Match?', hash === owner.recoveryCodes[0].hash);
console.log('usedAt:', owner.recoveryCodes[0].usedAt);

