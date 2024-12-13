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
    storeName: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: { type: [Number], required: true }
    }
});

// Create index for geospatial queries
storeSchema.index({ location: '2dsphere' });

// Store Model
const Store = mongoose.model('Store', storeSchema);

// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    stock: { type: Boolean, required: true },
    inner_category: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true }, // Store image URL
    sale_price: { type: Number, required: true },
    original_price: { type: Number, required: true },
    avail_outlets: { type: [String], required: true },
    weight: { type: Number, required: true },
    weight_unit: { type: String, enum: ['kg', 'g'], required: true }
});

// Product Model
const Product = mongoose.model('Product', productSchema);

// Store Management Routes
app.get('/api/stores/all', async (req, res) => {
    try {
        const stores = await Store.find();
        res.json({ success: true, stores });
    } catch (error) {
        console.error('Error fetching stores:', error);
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

// Product Management Routes
app.get('/api/products/all', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: 'Error fetching products' });
    }
});

// Updated endpoint to create a product without file upload
app.post('/api/products/create', async (req, res) => {
    try {
        const { name, description, stock, inner_category, category, image, sale_price, original_price, avail_outlets, weight, weight_unit } = req.body;

        // Check if all required fields are present
        if (!name || !description || stock === undefined || !inner_category || !category || !image || !sale_price || !original_price || !avail_outlets || !weight || !weight_unit) {
            return res.status(400).json({ success: false, error: 'All fields are required.' });
        }

        const newProduct = new Product({
            name,
            description,
            stock,
            inner_category,
            category,
            image, // Use the image URL directly
            sale_price,
            original_price,
            avail_outlets,
            weight,
            weight_unit
        });

        await newProduct.save();
        res.json({ success: true, product: newProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, error: 'Error creating product', details: error.message });
    }
});

app.delete('/api/products/delete/:id', async (req, res) => {
    try {
        const result = await Product.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, error: 'Error deleting product' });
    }
});

// New endpoint to edit product details
app.put('/api/products/edit/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, product: updatedProduct });
    } catch (error) {
        console.error('Error editing product:', error);
        res.status(500).json({ success: false, error: 'Error editing product' });
    }
});

// User Schema
const userSchema = new mongoose.Schema({
    cart: { type: Array, default: [] },
    my_order_price: { type: Number, default: 0 },
    orderHistory: { type: Array, default: [] },
    price: { type: Number, default: 0 },
    phone: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: { type: [Number], required: true }
    },
    orders: { type: Array, default: [] }
});

// User Model
const User = mongoose.model('users', userSchema);

// User Management Routes
app.post('/api/users/create', async (req, res) => {
    const {
        phone,
        location,
        cart = [], // Default to empty array if not provided
        orderHistory = [], // Default to empty array if not provided
        my_order_price = 0, // Default to 0 if not provided
        price = 0, // Default to 0 if not provided
        orders = [] // Default to empty array if not provided
    } = req.body;

    const newUser = new User({ cart, my_order_price, orderHistory, price, phone, location, orders });
    try {
        await newUser.save();
        res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: 'Error creating user' });
    }
});

app.delete('/api/users/delete/:id', async (req, res) => {
    try {
        const result = await User.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Error deleting user' });
    }
});

app.get('/api/users/all', async (req, res) => {
    try {
        const users = await User.find();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Error fetching users' });
    }
});

app.put('/api/users/edit/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Error editing user:', error);
        res.status(500).json({ success: false, error: 'Error editing user' });
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