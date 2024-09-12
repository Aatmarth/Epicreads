const express = require('express');
const app = express();
const path=require("path");
const env=require("dotenv").config();
const bcrypt=require("bcrypt");
const session = require("express-session");
const passport= require("./config/passport")
const db=require("./config/db");
const userRouter=require("./routes/userRouter");
const adminRouter=require("./routes/adminRouter");
const Category = require("./models/categorySchema");
const nocache = require('nocache');



db();


app.use(express.json());
app.use(express.urlencoded( {extended:true}));
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false,
    httpOnly: true,
    maxAge: 72*60*60*1000
}
}));

app.use(passport.initialize());
app.use(passport.session());


app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next();
})
app.use(async (req, res, next) => {
  try {
      const category = await Category.find({}).sort({name:1})
      res.locals.category = category;
      next();
  } catch (error) {
      next(error);
  }
});

app.use(nocache());

app.set("view engine","ejs");
app.set("views",[path.join(__dirname,"views/admin"),path.join(__dirname,"views/user")]);
app.use(express.static(path.join(__dirname, 'public')));

app.use("/admin", adminRouter); 
app.use("/", userRouter);


app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
  });  

module.exports = app;  