const Cart = require("../../models/cartSchema");
const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
// const Order = require("../../models/orderSchema");

const loadCheckout = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findById(user);
    const cart = await Cart.findOne({ userId: user }).populate("items.productId");
    const addressData = await Address.findOne({ userId: user });
    console.log('adress',addressData);



    if (!cart) {
      return res.redirect("/cart");
    }

    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.productId.offerPrice * item.quantity;
    });

    const shippingCharge = 60;
    const total = subtotal + shippingCharge;

    res.render("checkout", {
      user: userData,
      cartItems: cart.items,
      subtotal,
      shippingCharge,
      total,
      address: addressData.address ? addressData.address : [],
    });
  } catch (error) {
    console.log(error.message, "Error loading checkout");
    res.status(500).send("Internal server error");
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, address, city, state, pincode, phone, paymentMethod } = req.body;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.redirect("/cart");
    }

    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.productId.offerPrice * item.quantity;
    });

    const shippingCharge = 60;
    const total = subtotal + shippingCharge;

    const newOrder = new Order({
      userId,
      items: cart.items,
      shippingDetails: { name, address, city, state, pincode, phone },
      paymentMethod,
      totalAmount: total,
      status: paymentMethod === "COD" ? "Pending" : "Processing",
    });

    await newOrder.save();

    // Clear cart after placing the order
    await Cart.deleteOne({ userId });

    res.redirect("/orderSuccess");
  } catch (error) {
    console.log(error.message, "Error placing order");
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  loadCheckout,
  placeOrder,
};
