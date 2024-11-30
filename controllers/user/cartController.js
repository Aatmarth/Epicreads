const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");

const loadCart = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    if (!user) {
      return res.render("login", { message: "Please Login First" });
    }

    const cart = await Cart.findOne({ userId: user }).populate({
      path: "items.productId",
      populate: {
        path: "category",
        select: "isListed",
      },
    });

    if (!cart) {
      return res.render("cart", {
        user: userData,
        cartItems: [],
        subtotal: 0,
        shippingCharge: 0,
        total: 0,
      });
    }

    let subtotal = 0;
    const filteredItems = cart.items.filter((item) => {
      const product = item.productId;
      const category = product.category;

    
      return product.isListed && category.isListed;
    });

    filteredItems.forEach((item) => {
      const product = item.productId;
      const effectivePrice = product.offerPercentage > 0
        ? product.productPrice * (1 - product.offerPercentage / 100)
        : product.offerPrice;
      subtotal += effectivePrice * item.quantity;

      item.price = effectivePrice;
      item.totalPrice = effectivePrice * item.quantity;
    });

    let shippingCharge = subtotal > 1000 ? 0 : 60;
    const total = subtotal + shippingCharge;

    res.render("cart", {
      user: userData,
      cartItems: filteredItems,
      subtotal,
      shippingCharge,
      total,
    });
  } catch (error) {
    console.log(error.message, "Error in load cart");
    res.redirect("/pageNotFound");
  }
};

const addToCart = async (req, res) => {
  try {
    if (req.session.user) {
      const { productId, quantity = 1 } = req.body;
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const cart = await Cart.findOne({ userId: req.session.user });

      const effectivePrice = product.offerPercentage > 0 
        ? (product.productPrice * (1 - product.offerPercentage / 100)) 
        : product.offerPrice;

      if (!cart) {
        const newCart = new Cart({
          userId: req.session.user,
          items: [
            {
              productId: productId,
              quantity: quantity,
              price: effectivePrice,
              totalPrice: effectivePrice * quantity,
            },
          ],
        });
        await newCart.save();
        return res
          .status(200)
          .json({ success: true, message: "Product added to cart" });
      }

      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId.toString()
      );
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = effectivePrice;
        existingItem.totalPrice = existingItem.quantity * effectivePrice;
        await cart.save();
        return res
          .status(200)
          .json({ success: true, message: "Product quantity updated in cart" }); 
      }

      cart.items.push({
        productId: productId,
        quantity: quantity,
        price: effectivePrice,
        totalPrice: effectivePrice * quantity,
      });
      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Product added to cart" });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Please Login First" });
    }
  } catch (error) {
    console.log(error.message, "Error in add to cart");
    res.redirect("/pageNotFound");
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { quantities } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ success: false });
    }

 
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const effectivePrice = product.offerPercentage > 0 
        ? (product.productPrice * (1 - product.offerPercentage / 100)) 
        : product.offerPrice;

      if (quantities[item.productId]) {
        item.quantity = parseInt(quantities[item.productId], 10);
        item.price = effectivePrice;
        item.totalPrice = item.quantity * effectivePrice;
      }
    }

    await cart.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error.message, "Error in updating cart");
    res.status(500).json({ success: false });
  }
};


const removeProductFromCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ success: false });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    let subtotal = 0;
    cart.items.forEach(item => {
      subtotal += item.totalPrice;
    });

    const shippingCharge = subtotal > 1000 ? 0 : 60;
    const total = subtotal + shippingCharge;

    res.json({
      success: true,
      subtotal,
      shippingCharge,
      total,
    });
  } catch (error) {
    console.log(error.message, "Error in removing product from cart");
    res.status(500).json({ success: false });
  }
};


module.exports = {
  loadCart,
  addToCart,
  updateCart,
  removeProductFromCart,
};
