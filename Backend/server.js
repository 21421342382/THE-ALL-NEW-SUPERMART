const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Store Schema
const storeSchema = new mongoose.Schema({
    storeName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

// Create index for geospatial queries
storeSchema.index({ location: '2dsphere' });

// Store Model
const Store = mongoose.model('Store', storeSchema);

// Store Management Routes
app.get('/api/stores/all', async (req, res) => {
    try {
        const stores = await Store.find();
        res.json({ success: true, stores });
    } catch (error) {
        console.error('youhave reached Error fetching stores:', error);
        res.status(500).json({ success: false, error: 'Error fetching stores' });
    }
});

app.post('/api/stores/create', async (req, res) => {
    try {
        const { storeName, address, latitude, longitude } = req.body;
        
        const newStore = new Store({
            storeName,
            address,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // MongoDB uses [longitude, latitude] order
            }
        });

        await newStore.save();
        res.json({ success: true, store: newStore });
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({ success: false, error: 'Error creating store' });
    }
});

app.delete('/api/stores/delete/:id', async (req, res) => {
    try {
        const result = await Store.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, error: 'Store not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({ success: false, error: 'Error deleting store' });
    }
});

// Serve managestores.html
app.get('/managestores', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/managestores.html'));
});

// Admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/admin.html'));
});

// Admin login API endpoint
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Add your authentication logic here
    // For testing purposes:
    if (username === 'admin' && password === 'password') {
        res.json({ token: 'dummy_token' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
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