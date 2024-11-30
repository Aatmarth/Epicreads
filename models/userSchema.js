const mongoose = require("mongoose");
const {Schema} = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        sparse: true,
        default: null
    },
    mobile: {
        type: Number,
        default: null
    },
    password: {
        type: String,
        required: false,
        sparse: true,
        default: null
    },
    googleId: {
        type: String,
    },
    isBlocked: {
        type: Number,
        default: 0
    },
    isAdmin: {
        type: Number,
        default: 0
    },
    cart: [{
        type: Schema.Types.ObjectId,
        ref:"Cart", 
    }],
    wallet: {
        type: Number,
        default: 0
    },
    walletHistory: [{
        transactionId: {
            type: String,
            unique: true,
            default: () => `TRX${Date.now()}${Math.floor(Math.random() * 1000)}`
        },
        type: {
            type: String,
            enum: ["Credit", "Debit"]
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        description: {
            type: String,
            default: ""
        }
    }],
    referralCode: {
        type: String,
    },
    referredBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    wishlist: {
        type: Schema.Types.ObjectId,
        ref: "Wishlist"
    },
    orders: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],
    addresses: [{
        type: Schema.Types.ObjectId,
        ref: "Address"
    }]
},{
    timestamps: true
})

const User = mongoose.model("User", userSchema);
module.exports = User;