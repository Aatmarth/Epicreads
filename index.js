const express = require('express');
const app = express();
const path=require("path");
const env=require("dotenv").config();
const bcrypt=require("bcrypt");
const session = require("express-session");
const passport= require("./config/passport")
const db=require("./config/db");
const User = require("./models/userSchema");
const userRouter=require("./routes/userRouter");
const adminRouter=require("./routes/adminRouter");
const Category = require("./models/categorySchema");
const Wishlist = require("./models/wishlistSchema");
const Cart = require("./models/cartSchema");
const nocache = require('nocache');

db();

app.use(express.json());
app.use(express.urlencoded( {extended:true}));
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
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
});

app.use(async (req, res, next) => {
  try {
    if (req.session.user) {
      // Find the user from the database
      const user = await User.findById(req.session.user);
      req.user = user; // Set req.user for consistent access
    }
    next();
  } catch (error) {
    console.error("Error syncing req.user:", error);
    next(error);
  }
});

app.use(async (req, res, next) => {
  try {
      const category = await Category.find({}).sort({name:1})
      res.locals.category = category;
      next();
  } catch (error) {
      next(error);
  }
});

app.use(async (req, res, next) => {
  try {
    if (req.session.user) {
      const userId = req.session.user;

      // Fetch and filter cart items
      const cart = await Cart.findOne({ userId }).populate({
        path: "items.productId",
        populate: {
          path: "category",
          select: "isListed", // Only fetch the isListed field of the category
        },
      });

      const cartCount = cart
        ? cart.items
            .filter((item) => {
              const product = item.productId;
              const category = product.category;

              // Only count items where both product and category are listed
              return product.isListed && category.isListed;
            })
            .reduce((total, item) => total + item.quantity, 0)
        : 0;

      // Fetch and filter wishlist items
      const wishlist = await Wishlist.findOne({ userId }).populate({
        path: "products",
        populate: {
          path: "category",
          select: "isListed", // Only fetch the isListed field of the category
        },
      });

      const wishlistCount = wishlist
        ? wishlist.products.filter((product) => {
            const category = product.category;

            // Only count products where both product and category are listed
            return product.isListed && category.isListed;
          }).length
        : 0;

      // Assign counts to res.locals
      res.locals.cartCount = cartCount;
      res.locals.wishlistCount = wishlistCount;
    } else {
      // User not logged in, default counts
      res.locals.cartCount = 0;
      res.locals.wishlistCount = 0;
    }

    next();
  } catch (error) {
    console.error("Error in cart/wishlist middleware:", error);
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