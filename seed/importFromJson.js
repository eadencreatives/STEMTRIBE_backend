const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const Course = require('../models/Course');

async function main() {
  const file = process.argv[2] || 'courses_import.json';
  const filePath = path.resolve(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.error(`JSON file not found: ${filePath}`);
    process.exit(2);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error('Invalid JSON:', err.message);
    process.exit(3);
  }

  if (!Array.isArray(payload)) payload = [payload];

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    for (const courseData of payload) {
      if (!courseData.title) {
        console.warn('Skipping course without title', courseData);
        continue;
      }

      // If slug provided, try to replace existing course with same slug
      if (courseData.slug) {
        const existing = await Course.findOne({ slug: courseData.slug });
        if (existing) {
          await Course.replaceOne({ _id: existing._id }, courseData);
          console.log(`Replaced course: ${courseData.title}`);
          continue;
        }
      }

      await Course.create(courseData);
      console.log(`Inserted course: ${courseData.title}`);
    }
  } catch (err) {
    console.error('Seeding error', err);
  } finally {
    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  }
}

if (require.main === module) main();
