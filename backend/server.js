const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data
const mockUser = {
  id: '1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'user'
};

// Mock JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Routes
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      user: mockUser
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple validation - in real app, check against database
  if (email && password) {
    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: mockUser
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Fallback for other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});