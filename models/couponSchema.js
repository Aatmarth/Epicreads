const mongoose = require("mongoose");
const {Schema} = mongoose;

const couponSchema = new Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    expireOn: {
        type: Date, 
        required: true
    },
    offerPrice:{
        type: Number,
        required: true
    },
    minimumPrice: {
        type: Number,
        required: true
    },
    userId: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    }
})

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;