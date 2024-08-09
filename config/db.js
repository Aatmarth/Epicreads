const mongoose= require("mongoose");
const env=require("dotenv").config();


const dbconnect= async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(`${error.message} from dbconnect`);
        process.exit(1);
    }
}

module.exports=dbconnect;
