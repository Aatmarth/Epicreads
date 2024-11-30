const Cart = require("../../models/cartSchema");
const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Coupon = require("../../models/couponSchema");


const loadCheckout = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findById(user);
    const cart = await Cart.findOne({ userId: user }).populate("items.productId");
    const addressData = await Address.findOne({ userId: user });

    if (!cart) {
      return res.redirect("/cart");
    }

    let subtotal = 0;
    cart.items.forEach((item) => {
      const product = item.productId;
      let offerPrice = product.offerPrice; 

      if (product.offerPercentage) {
        offerPrice = product.productPrice * (1 - product.offerPercentage / 100);
      }

      subtotal += offerPrice * item.quantity;
    });

    const shippingCharge = subtotal > 1000 ? 0 : 60;
    const total = subtotal + shippingCharge;

    const activeCoupons = await Coupon.find({
      expireOn: { $gte: new Date() },
      isActive: true,
      userId: { $nin: [user] }
    });

    let couponDiscount = 0; 

    res.render("checkout", {
      user: userData,
      cartItems: cart.items,
      subtotal,
      shippingCharge,
      total,
      address: addressData.address ? addressData.address : [],
      activeCoupons,
      couponDiscount
    });
  } catch (error) {
    console.log(error.message, "Error loading checkout");
    res.redirect("/pageNotFound");
  }
};

const verifyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user;

    if(!userId){
      res.render("login", { message: "Please Login First" });
    }

    const coupon = await Coupon.findOne({ 
      couponCode: couponCode,
      expireOn: { $gte: new Date() },
      isActive: true,
      userId: { $nin: [userId] },
    }); 
    console.log("coupon:", coupon) 
    console.log("Current user ID:", userId);
    console.log("Searching for coupon with code:", couponCode);

    if (!coupon) {
      return res.status(400).json({ success: false, error: 'Invalid or expired coupon.' });
    }
 
    const cart = await Cart.findOne({ userId }); 
    let subtotal = 0;
    cart.items.forEach((item) => {
      subtotal += item.price * item.quantity;
      console.log("item:", item);
      console.log("item.quantity", item.quantity);

    });

    const shippingCharge = subtotal > 1000 ? 0 : 60;
    const total = subtotal + shippingCharge;
    console.log("shit", shippingCharge);
    console.log("st" ,subtotal)

    if (total < coupon.minimumPrice) {
      return res.status(400).json({ success: false, error: 'Total price is below minimum required for this coupon.' });
    }

    const discount = coupon.offerPrice;
    const newTotal = total - discount; 
    
    return res.status(200).json({
      success: true,
      discount,
      newTotal
    });
  } catch (error) {
    console.error('Error verifying coupon:', error);
    console.log(error.stack)
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};

module.exports = {
  loadCheckout,
  verifyCoupon
};
