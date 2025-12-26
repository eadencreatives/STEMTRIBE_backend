// api/auth/register.js (Vercel serverless)
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  
  const { name, email, password } = req.body;
  
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('lms');
    const users = db.collection('users');
    
    // Check existing user
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Hash password & create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      name, email, password: hashedPassword, role: 'student',
      createdAt: new Date()
    };
    await users.insertOne(user);
    
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name, email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    await client.close();
  }
}
