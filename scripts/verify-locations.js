const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

async function verifyLocations() {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('locations');
  const all = await col.find({}).toArray();
  console.log('Total locations in DB:', all.length);

  const map = new Map();
  let duplicates = 0;
  for (const loc of all) {
    const parent = loc.parentId ? loc.parentId.toString() : 'root';
    const key = loc.type + '::' + loc.name.toLowerCase().trim() + '::' + parent;
    if (map.has(key)) {
      console.log('Duplicate detected:', loc.name, loc.type, loc._id);
      duplicates++;
    } else {
      map.set(key, loc);
    }
  }

  const countries = all.filter(l => l.type === 'COUNTRY');
  console.log(`Total Countries: ${countries.length}`);
  console.log(`Duplicates: ${duplicates}`);
  await mongoose.disconnect();
}

verifyLocations().catch(console.error);
