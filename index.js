const express = require('express');
const app = express();
const path=require("path");
const env=require("dotenv").config();
const db=require("./config/db");
const userRouter=require("./routes/userRouter");
const adminRouter=require("./routes/adminRouter");

db();

app.use(express.json());
app.use(express.urlencoded( {extended:true}));

app.set("view engine","ejs");
app.set("views",[path.join(__dirname,"views/admin"),path.join(__dirname,"views/user")]);
app.use(express.static(path.join(__dirname, 'public')));

app.use("/adminRouter", adminRouter); 
app.use("/", userRouter);


app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
  });  

module.exports = app;