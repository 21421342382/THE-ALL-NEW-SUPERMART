const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import store management functions
const { 
    Store, 
    createStore, 
    getAllStores, 
    findStoresNearLocation, 
    searchStoresByName 
} = require('./admin_management/manage_stores');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Store Management Routes
app.get('/api/stores/all', async (req, res) => {
    try {
        const result = await getAllStores();
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/stores/create', async (req, res) => {
    try {
        const storeData = {
            storeName: req.body.storeName,
            address: req.body.address,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        };
        
        const result = await createStore(storeData);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stores/search', async (req, res) => {
    try {
        const { name } = req.query;
        const result = await searchStoresByName(name);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/admin.html'));
});

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Welcome to THE ALL NEW SUPERMART API');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});