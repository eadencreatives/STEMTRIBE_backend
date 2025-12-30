// importFromJson.js
// Usage: set MONGODB_URI in .env then run: node importFromJson.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Course = require('../models/Course');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  const file = path.join(__dirname, 'courses_import.json');
  const courses = require(file);

  for (const item of courses) {
    try {
      const slug = item.slug;
      const doc = await Course.findOneAndUpdate(
        { slug },
        { $set: item },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log('Upserted course:', doc.title, '(', doc._id, ')');
    } catch (err) {
      console.error('Error upserting', item.slug, err);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
