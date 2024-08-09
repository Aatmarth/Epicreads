const mongoose = require("mongoose");
const {Schema} = mongoose;

const authorSchema = new Schema({
    authorName: {
        type: String,
        required: true
    },
    authorImage: {
        type: [String],
        required: true
    }
})          

const Author = mongoose.model("Author", authorSchema);
module.exports = Author;