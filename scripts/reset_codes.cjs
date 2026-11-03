const fs = require('fs');
['server/data/hotel_data.json', 'server/data/hotel_data.backup.json', 'data/db.json'].forEach(f => {
  if (!fs.existsSync(f)) return;
  const data = JSON.parse(fs.readFileSync(f));
  const owner = data.users.find(u => u.email === 'owner@jonakhotelgroup.in');
  if (owner && owner.recoveryCodes) {
    owner.recoveryCodes.forEach(r => r.usedAt = null);
  }
  fs.writeFileSync(f, JSON.stringify(data, null, 2));
  console.log('Reset in', f);
});

