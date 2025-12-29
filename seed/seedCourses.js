const Course = require('../models/Course');

const sample = {
  title: 'Intro to Web Development',
  slug: 'intro-web-dev',
  description: 'Learn the fundamentals of web development: HTML, CSS, and JavaScript.',
  modules: [
    {
      title: 'HTML Basics',
      order: 0,
      topics: [
        {
          title: 'What is HTML?',
          intro: 'HTML is the markup language for web pages.',
          description: 'Covers tags, structure and semantic HTML.',
          examples: ['<h1>Hello</h1>', '<p>Paragraph</p>'],
          practiceQuestions: [
            { question: 'What tag is used for a paragraph?', choices: ['<p>', '<div>', '<span>'], answer: '<p>' }
          ],
          order: 0
        },
        {
          title: 'HTML Forms',
          intro: 'Build forms to collect user input.',
          description: 'Input types, labels, and form submission.',
          examples: ['<form><input /></form>'],
          practiceQuestions: [],
          order: 1
        }
      ]
    },
    {
      title: 'CSS Basics',
      order: 1,
      topics: [
        {
          title: 'Selectors & Layout',
          intro: 'Selectors and the box model.',
          description: 'Display, margin, padding, and layout basics.',
          examples: ['.container { display: flex; }'],
          practiceQuestions: [],
          order: 0
        }
      ]
    }
  ]
};

async function seedCourses() {
  try {
    const count = await Course.countDocuments();
    if (count === 0) {
      await Course.create(sample);
      console.log('✅ Seeded sample course');
    } else {
      console.log('No seeding needed — courses exist');
    }
  } catch (err) {
    console.error('Seed error', err);
  }
}

module.exports = seedCourses;
