const mongoose = require("mongoose");
const {Schema} = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    categoryImage: {
        type: [String],
        required: true
    },
    isListed: {
        type: Boolean,
        default: true
    },
    offerPercentage: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;