const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");

const loadCart = async (req, res) => {
  try {
    console.log("reached loadCart");

    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    if (!user) {
      return res.render("login", { message: "Please Login First" });
    }

    const cart = await Cart.findOne({ userId: user }).populate(
      "items.productId"
    );
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
    cart.items.forEach((item) => {
      subtotal += item.productId.offerPrice * item.quantity;
    });

    const shippingCharge = 60;
    const total = subtotal + shippingCharge;

    res.render("cart", {
      cartItems: cart.items,
      subtotal,
      shippingCharge,
      total,
    });
  } catch (error) {
    console.log(error.message, "Error in load cart");
    res.status(500).send("Internal server error");
  }
};

const addToCart = async (req, res) => {
  try {
    if (req.session.user) {
      const { productId, quantity = 1 } = req.body;
      console.log("reached cart");
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      const cart = await Cart.findOne({ userId: req.session.user });
      console.log("cart", cart);

      if (!cart) {
        const newCart = new Cart({
          userId: req.session.user,
          items: [
            {
              productId: productId,
              quantity: quantity,
              price: product.offerPrice,
              totalPrice: product.offerPrice * quantity,
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
        existingItem.totalPrice = existingItem.quantity * product.offerPrice;
        await cart.save();
        return res
          .status(200)
          .json({ success: true, message: "Product quantity updated in cart" });
      }
      cart.items.push({
        productId: productId,
        quantity: quantity,
        price: product.offerPrice,
        totalPrice: product.offerPrice * quantity,
      });
      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Product added to cart" });
    }else{
      res.render("login", { message: "Please Login First" });
    }
  } catch (error) {
    console.log(error.message, "Error in add to cart");
    res.status(500).send("Internal server error");
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { quantities } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ success: false }); // Respond with JSON
    }

    cart.items.forEach((item) => {
      if (quantities[item.productId]) {
        item.quantity = parseInt(quantities[item.productId], 10);
        item.totalPrice = item.quantity * item.price;
      }
    });

    await cart.save();

    res.json({ success: true }); // Respond with JSON
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

    // Remove the product from the cart
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    res.json({ success: true });
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
