const Wishlist= require("../../models/wishlistSchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");

const loadWishlist = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.render("login", { message: "Please Login First" });
    }

    const userData = await User.findById(user);

    const wishlist = await Wishlist.findOne({ userId: user }).populate({
      path: "products",
      populate: {
        path: "category",
        select: "isListed",
      },
    });

    if (!wishlist) {
      return res.render("wishlist", {
        user: userData,
        wishlistItems: [],
      });
    }

    const filteredWishlistItems = wishlist.products.filter((product) => {
      const category = product.category;
      return product.isListed && category.isListed;
    });

    res.render("wishlist", {
      user: userData,
      wishlistItems: filteredWishlistItems,
    });
  } catch (error) {
    console.log(error.message, "Error in load wishlist");
    res.redirect("/pageNotFound");
  }
};


const addToWishlist = async (req, res) => {
  try {
    if (req.session.user) {
      const { productId } = req.body;


      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const wishlist = await Wishlist.findOne({ userId: req.session.user });
      if (!wishlist) {
        const newWishlist = new Wishlist({
          userId: req.session.user,
          products: [productId],
        });
        await newWishlist.save();
        return res
          .status(200)
          .json({ success: true, message: "Product added to wishlist" });
      }
      const existingItem = wishlist.products.find(
        (item) => item.toString() === productId.toString()
      );
      if (existingItem) {
        return res
          .status(200)
          .json({ success: true, message: "Product already in wishlist" });
      }
      wishlist.products.push(productId);
      await wishlist.save();

      return res
        .status(200)
        .json({ success: true, message: "Product added to wishlist" });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Please Login First" });
    }
  } catch (error) {
    console.log(error.message, "Error in add to wishlist");
    res.redirect("/pageNotFound");
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.json({ success: false });
    }

    wishlist.products = wishlist.products.filter(
      (product) => product.toString() !== productId
    );

    await wishlist.save();

    res.json({ success: true });
  } catch (error) {
    console.log(error.message, "Error in removing product from wishlist");
    res.status(500).json({ success: false });
  }
};

module.exports = {
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
};