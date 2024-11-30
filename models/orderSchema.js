const mongoose= require("mongoose");
const {Schema}= mongoose;
const {v4:uuidv4}= require("uuid");

const generateId = () => {
    const uuid = uuidv4().replace(/[^0-9]/g, '').slice(0, 20);
    return `#INV${uuid}`
    
}


const orderSchema = new Schema({
    orderId: {
        type:String,
        default: generateId,
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderedItems: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        },
        status:{
            type: String,
            required: true,
            enum: ["Pending","Shipped","Cancelled","Delivered","Return Requesting","Returned"],
            default: "Pending"
        },
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalPrice: {
        type: Number,
        required: true
    },
    address: [{
        addressType: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        phone: {
            type : Number,
            required: true
        },
        email: {
            type: String,
            required: false
        }
    }],
    paymentMethod: {
        type: String,
        required: true,
        enum: ["Cash on delivery","Razorpay","Wallet","Payment Pending"],
    },
    status: {
        type: String,
        enum: [
            "Pending",
            "Shipped",
            "Cancelled",
            "Delivered",
            "Return Requesting",
            "Returned",
            "Partially Cancelled",
            "Partially Returned",
        ],
        default: "Pending",
    },
    couponApplied: {
        type: Boolean,
        default:0
    }
},
{
    timestamps: true
})

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;