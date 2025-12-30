Seeding courses from JSON
=========================

This folder contains helpers to seed course content into the LMS backend.

Workflow
--------

1. Export your Google Doc content into a JSON structure matching `courses_sample.json`.
   - Each item is a course with `title`, optional `slug`, `description`, and `modules`.
   - Modules are objects with `title`, `order`, and `topics` (each topic has `title`, `intro`, `description`, etc.).

2. Place your JSON file in this folder, e.g. `lms-backend/seed/courses_import.json`.

3. Run the importer (it uses `MONGODB_URI` from the project `.env`):

```bash
node seed/importFromJson.js courses_import.json
```

Notes
-----
- If an imported course includes a `slug` that matches an existing course, the existing course will be replaced.
- The importer is idempotent for slugs; otherwise it inserts new courses.
- If you need help converting the Google Doc to the expected JSON format, paste the document content here or make it publicly viewable and I can prepare a converter.
