// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
aapp.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.use(cors({
    origin: ['http://localhost:8000', 'https://your-vercel-app.vercel.app'],
    credentials: true
}));
