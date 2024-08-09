const mongoose= require("mongoose");
const {Schema}= mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required : true
    },
    author: {
        type: String,
        required: true
    },
    category: { 
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    productPrice: {
        type: Number,
        required: true
    },
    offerPrice: {
        type :Number,
        required: true
    },
    pageCount: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        default: true
    },
    productImage: {
        type: [String],
        required: true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","Sold out","Discontinued"],
        required: true,
        default:"Available"
    }
},{
    timestamps: true
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;