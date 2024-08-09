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
        required: false,
        unique: true,
        sparse: true,
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
    wishlist: {
        type: Schema.Types.ObjectId,
        ref: "Wishlist"
    },
    orders: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }]
},{
    timestamps: true
})

const User = mongoose.model("User", userSchema);
module.exports = User;