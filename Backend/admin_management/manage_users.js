// Backend/admin_management/manage_users.js
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    cart: {
        type: Array,
        default: []
    },
    my_order_price: {
        type: Number,
        default: 0
    },
    orderHistory: {
        type: Array,
        default: []
    },
    price: {
        type: Number,
        default: 0
    },
    phone: {
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
    },
    orders: {
        type: Array,
        default: []
    }
});

// User Model
const User = mongoose.model('User', userSchema);

// Create User
async function createUser(data) {
    try {
        const newUser = new User(data);
        await newUser.save();
        return { success: true, user: newUser };
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, error: 'Error creating user' };
    }
}

// Delete User
async function deleteUser(id) {
    try {
        const result = await User.findByIdAndDelete(id);
        if (!result) {
            return { success: false, error: 'User not found' };
        }
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, error: 'Error deleting user' };
    }
}

// Edit User
async function editUser(id, data) {
    try {
        const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
        if (!updatedUser) {
            return { success: false, error: 'User not found' };
        }
        return { success: true, user: updatedUser };
    } catch (error) {
        console.error('Error editing user:', error);
        return { success: false, error: 'Error editing user' };
    }
}

async function getAllUsers() {
    try {
        const users = await User.find();
        return { success: true, users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Error fetching users' };
    }
}

// Export the modules
module.exports = { User, createUser, deleteUser, editUser, getAllUsers };