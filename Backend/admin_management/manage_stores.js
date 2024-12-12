const mongoose = require('mongoose');

// Store Schema
const storeSchema = new mongoose.Schema({
    storeName: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    address: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create geospatial index on location
storeSchema.index({ location: "2dsphere" });

const Store = mongoose.model('Store', storeSchema);

// Function to create a new store
async function createStore(storeData) {
    try {
        const store = new Store({
            storeName: storeData.storeName,
            location: {
                type: "Point",
                coordinates: [storeData.longitude, storeData.latitude]
            },
            address: storeData.address
        });

        const savedStore = await store.save();
        return {
            success: true,
            store: savedStore
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to get all stores
async function getAllStores() {
    try {
        const stores = await Store.find({});
        return {
            success: true,
            stores: stores
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to search stores by location within a radius (in kilometers)
async function findStoresNearLocation(latitude, longitude, radiusInKm = 5) {
    try {
        const stores = await Store.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: radiusInKm * 1000 // Convert km to meters
                }
            }
        });
        
        return {
            success: true,
            stores: stores
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to search stores by name
async function searchStoresByName(searchTerm) {
    try {
        const stores = await Store.find({
            storeName: { $regex: searchTerm, $options: 'i' }
        });
        
        return {
            success: true,
            stores: stores
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    Store,
    createStore,
    getAllStores,
    findStoresNearLocation,
    searchStoresByName
};
