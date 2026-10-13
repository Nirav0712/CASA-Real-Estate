const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

async function cleanTestNodes() {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('locations');
  const testNodes = await col.find({
    $or: [
      { name: { $regex: 'Test' } },
      { name: { $regex: '_179' } },
      { slug: { $regex: '_179' } },
    ]
  }).toArray();
  console.log('Found test nodes:', testNodes.map(n => ({ id: n._id, name: n.name, type: n.type })));

  if (testNodes.length > 0) {
    const ids = testNodes.map(n => n._id);
    const del = await col.deleteMany({ _id: { $in: ids } });
    console.log('Cleaned up test nodes:', del.deletedCount);
  }
  await mongoose.disconnect();
}

cleanTestNodes().catch(console.error);
