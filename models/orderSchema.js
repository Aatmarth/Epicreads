const mongoose= require("mongoose");
const {Schema}= mongoose;
const {v4:uuidv4}= require("uuid");

const orderSchema = new Schema({
    orderId: {
        type:String,
        default: ()=> uuidv4(),
        unique: true
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
        }
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
        required: true
    },
    InvoiceDate: {
        type: Date
    },
    status:{
        type: String,
        required: true,
        default: ["Pending","Rejected","Completed","Return Request","Returned"]
    },
    createdOn:{
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: {
        type: Boolean,
        default:0
    }
})

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;