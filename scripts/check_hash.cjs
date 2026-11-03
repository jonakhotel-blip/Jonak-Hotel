const fs = require('fs');
const security = require('../server/security.js');

const data = JSON.parse(fs.readFileSync('server/data/hotel_data.json', 'utf-8'));
const owner = (data.users || []).find(u => u.email === 'owner@jonakhotelgroup.in');
console.log('Owner user exists:', Boolean(owner));
if (owner) {
  console.log('Password hash:', owner.passwordHash);
  const match = security.verifyPassword('JonakOwner#2026', owner.passwordHash);
  console.log('Matches JonakOwner#2026?', match);
  if (!match) {
    console.log('Updating owner password hash to match JonakOwner#2026');
    owner.passwordHash = security.hashPassword('JonakOwner#2026');
    fs.writeFileSync('server/data/hotel_data.json', JSON.stringify(data, null, 2));
    console.log('Updated hotel_data.json with fresh hash');
  }
}

