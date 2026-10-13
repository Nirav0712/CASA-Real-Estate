const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

async function deduplicateLocations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const collection = mongoose.connection.collection('locations');
  const allLocations = await collection.find({}).toArray();
  console.log(`Total location records found before cleanup: ${allLocations.length}`);

  // Map to detect duplicates by unique business key:
  // For COUNTRY: type + countryCode (or slug)
  // For other types: type + slug + (countryCode || '')
  const groups = new Map();

  for (const loc of allLocations) {
    let key;
    if (loc.type === 'COUNTRY') {
      key = `COUNTRY:${loc.countryCode || loc.slug}`;
    } else {
      key = `${loc.type}:${loc.slug}:${loc.countryCode || ''}`;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(loc);
  }

  const idRemap = new Map(); // oldId -> canonicalId
  const toDelete = [];

  for (const [key, list] of groups.entries()) {
    if (list.length > 1) {
      // Pick the first one as canonical, delete the rest
      const canonical = list[0];
      console.log(`Duplicate found for "${key}" (${list.length} instances). Keeping ${canonical._id}`);
      for (let i = 1; i < list.length; i++) {
        idRemap.set(list[i]._id.toString(), canonical._id);
        toDelete.push(list[i]._id);
      }
    }
  }

  console.log(`Identified ${toDelete.length} duplicate records to remove.`);

  if (toDelete.length > 0) {
    // 1. Remap parentId and ancestorIds in remaining documents
    console.log('Updating child parentId and ancestorIds references...');
    for (const [oldIdStr, newId] of idRemap.entries()) {
      const oldId = new mongoose.Types.ObjectId(oldIdStr);

      // Update parentId
      await collection.updateMany(
        { parentId: oldId },
        { $set: { parentId: newId } }
      );

      // Update ancestorIds array
      await collection.updateMany(
        { ancestorIds: oldId },
        { $set: { 'ancestorIds.$': newId } }
      );

      // Update properties collection if any reference location
      try {
        await mongoose.connection.collection('properties').updateMany(
          { locationId: oldId },
          { $set: { locationId: newId } }
        );
      } catch (err) {
        // ignore if properties collection doesn't exist
      }
    }

    // 2. Delete the duplicates
    const deleteResult = await collection.deleteMany({ _id: { $in: toDelete } });
    console.log(`Successfully deleted ${deleteResult.deletedCount} duplicate location records.`);
  }

  // Double check any second-pass duplicates:
  // If child nodes had different slugs like 'satellite-ahmedabad' vs 'satellite', let's check by name + type + cityCode/stateCode
  const remaining = await collection.find({}).toArray();
  console.log(`Remaining locations after first pass: ${remaining.length}`);

  const secondGroups = new Map();
  for (const loc of remaining) {
    const key = `${loc.type}:${loc.name.trim().toLowerCase()}:${loc.parentId ? loc.parentId.toString() : 'root'}`;
    if (!secondGroups.has(key)) secondGroups.set(key, []);
    secondGroups.get(key).push(loc);
  }

  const secondDelete = [];
  for (const [key, list] of secondGroups.entries()) {
    if (list.length > 1) {
      const canonical = list[0];
      console.log(`Second pass duplicate for "${key}": keeping ${canonical._id}`);
      for (let i = 1; i < list.length; i++) {
        secondDelete.push(list[i]._id);
      }
    }
  }

  if (secondDelete.length > 0) {
    await collection.deleteMany({ _id: { $in: secondDelete } });
    console.log(`Second pass deleted ${secondDelete.length} duplicates.`);
  }

  const finalLocations = await collection.find({}).toArray();
  const countries = finalLocations.filter(l => l.type === 'COUNTRY');
  console.log(`Final total location records: ${finalLocations.length}`);
  console.log(`Final total countries: ${countries.length}`);
  console.log('Countries list:', countries.map(c => `${c.name} (${c.countryCode})`));

  await mongoose.disconnect();
  console.log('Finished deduplication successfully.');
}

deduplicateLocations().catch((err) => {
  console.error('Deduplication failed:', err);
  process.exit(1);
});
