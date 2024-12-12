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
            error: error.message,
            errorCode: error.code,
            errorType: error.name,
            details: error.errors
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
            error: error.message,
            errorCode: error.code,
            errorType: error.name,
            details: error.errors
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
            error: error.message,
            errorCode: error.code,
            errorType: error.name,
            details: error.errors
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
            error: error.message,
            errorCode: error.code,
            errorType: error.name,
            details: error.errors
        };
    }
}

// Function to update a store
async function updateStore(storeId, updateData) {
    try {
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                $set: {
                    storeName: updateData.storeName,
                    location: {
                        type: "Point",
                        coordinates: [updateData.longitude, updateData.latitude]
                    },
                    address: updateData.address
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedStore) {
            return {
                success: false,
                error: "Store not found",
                errorType: "NotFoundError"
            };
        }

        return {
            success: true,
            store: updatedStore
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            errorCode: error.code,
            errorType: error.name,
            details: error.errors
        };
    }
}

// Function to delete a store
async function deleteStore(storeId) {
    try {
        const deletedStore = await Store.findByIdAndDelete(storeId);

        if (!deletedStore) {
            return {
                success: false,
                error: "Store not found",
                errorType: "NotFoundError"
            };
        }

        return {
            success: true,
            message: "Store successfully deleted",
            store: deletedStore
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            errorCode: error.code,
            errorType: error.name,
            details: error.errors
        };
    }
}

module.exports = {
    Store,
    createStore,
    getAllStores,
    findStoresNearLocation,
    searchStoresByName,
    updateStore,
    deleteStore
};