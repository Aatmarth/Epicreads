const mongoose= require("mongoose");
const {Schema}= mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required : true
    },
    authorname: {
        type: String,
        required: true
    },
    publishedYear: {
        type: Number,
        required: true
    },
    category: { 
        type: Schema.Types.ObjectId,
        ref: "Category",        
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
    isListed:{
        type:Boolean,
        default:true
    },
    status:{
        type:String,
        enum:["Available","Sold out","Discontinued"],
        required: true,
        default:"Available"
    },
    offerPercentage:{
        type:Number,
        default:0
    },
},{
    timestamps: true
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;