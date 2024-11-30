const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Razorpay = require("razorpay");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const placeOrder = async (req, res) => {
  try {
    console.log("Received request at /placeOrder", req.body); 
    const {
      orderedItems,
      totalPrice,
      discount,
      finalPrice,
      address,
      paymentMethod,
      status,
    } = req.body;

    const userId = req.session.user;
    console.log("body", req.body);

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const selectedAddress = await Address.findOne(
      { userId, "address._id": address },
      { "address.$": 1 }
    );

    const orderAddress = selectedAddress.address[0];

    if(!orderAddress){
      return res.status(404).json({ success: false, message: "Need an address to place order" });
    }


    const newOrder = new Order({
      userId: userId,
      orderedItems: orderedItems,
      totalPrice: totalPrice,
      discount: discount,
      finalPrice: finalPrice,
      address: {
        addressType: orderAddress.addressType,
        name: orderAddress.name,
        city: orderAddress.city,
        state: orderAddress.state,
        pincode: orderAddress.pincode,
        phone: orderAddress.phone,
        email: orderAddress.email ? selectedAddress.email : "",
      },
      paymentMethod: paymentMethod,
      status: status,
    });

    await newOrder.save();

    user.orders.push(newOrder._id);
    await user.save();

    if(paymentMethod!=="Payment Pending"){
    const cart = await Cart.findOneAndDelete({ userId: userId });

    for (let item of orderedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity },
      });

      const product = await Product.findById(item.productId);
      if (product.quantity <= 0) {
        product.status = "Sold out";
        await product.save();
      }
    }
    }
    return res
      .status(200)
      .json({
        success: true,
        message: "Order placed successfully",
        orderId: newOrder._id,
      });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while placing the order",
    });
  }
};


const placeRazorpayOrder = async (req, res) => {
  try {
    const { totalPrice } = req.body;
    console.log("total price", totalPrice)

    const userId= req.session.user;
    const user= await User.findById(userId)

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });

    const options = {
      amount: totalPrice * 100, 
      currency: "INR", 
      receipt: `order_rcptid_${Math.floor(Math.random() * 1000)}`, 
    };

    try {
      const order = await razorpay.orders.create(options); 

      res.status(200).json({
        success: true,
        order: order,
        key_id: process.env.RAZORPAY_KEY_ID,
        user: user.name,
      });
    } catch (error) {
      console.log("Failed to create order ", error);
      res.status(500).json({ error: "Failed to create order" }); 
    }
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

const placeWalletOrder = async (req,res)=>{
  try {
    const {
      orderedItems,
      totalPrice,
      discount,
      finalPrice,
      address,
      paymentMethod,
      status,
    } = req.body;
    const userId = req.session.user;

    console.log(req.body, "nody")
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" 
          
      });
    }

    const selectedAddress = await Address.findOne(
      { userId, "address._id": address },
      { "address.$": 1 }
    );

    const orderAddress = selectedAddress.address[0];
    
    if(!orderAddress){
      return res.status(404).json({ success: false, message: "Need an address to place order" });
    }

    if (user.wallet < finalPrice) {
      return res.status(400).json({ success: false, error: "Insufficient Wallet Balance" });
    }

    user.wallet -= finalPrice;
    user.walletHistory.push({
      date: new Date(),
      description: `Order paid via wallet`,
      type: "Debit",
      amount: finalPrice,
    });

    const newOrder = new Order({
      userId: userId,
      orderedItems: orderedItems,
      totalPrice: totalPrice,
      discount: discount,
      finalPrice: finalPrice,
      address: {
        addressType: orderAddress.addressType,
        name: orderAddress.name,
        city: orderAddress.city,
        state: orderAddress.state,
        pincode: orderAddress.pincode,
        phone: orderAddress.phone,
        email: orderAddress.email ? selectedAddress.email : "",
      },
      paymentMethod : "Wallet",
      status : "Pending"
    });

    // Save the order
    await newOrder.save();

    user.orders.push(newOrder._id);
    await user.save();

    if(paymentMethod!=="Payment Pending"){
      await Cart.findOneAndDelete({ userId: userId });

    for (let item of orderedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity },
      });

      const product = await Product.findById(item.productId);
      if (product.quantity <= 0) {
        product.status = "Sold out";
        await product.save();
      }
    }
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Order placed successfully",
        orderId: newOrder._id,
      });
  } catch (error) {
    console.log(error.message, "Error in placeWalletOrder");
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

const handlePaymentSuccess = async (req, res) => {
  try {
    const { paymentId, razorpayOrderId, orderId } = req.body;
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    order.paymentStatus = 'Paid';
    order.razorpay = {
      paymentId,
      orderId: razorpayOrderId
    };
    await order.save();
    res.json({ success: true, orderId: orderId, message: 'Order placed successfully' });

  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
    });
  }
};

const loadOrders = async (req, res) => {
  try {
    const user = req.session.user;
    if(!user){
      return res.render("login", { message: "Please Login First" });
    }
    const userDetails = await User.findById(user)
    const userData = await User.findById(user).populate({
      path: "orders",
      populate: {
        path: "orderedItems.productId",
        model: "Product",
      },
      options: { sort: { createdAt: -1 } }
    });

    if (userData && userData.orders.length > 0) {
      res.render("orders", { orders: userData.orders, userData, user: userDetails });
    } else {
      res.render("orders", { orders: [], });
    }
  } catch (error) {
    console.log(error.message, "Error in load orders");
    res.redirect("/pageNotFound");
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.id;
    const order = await Order.findById(orderId).populate(
      "orderedItems.productId"
    );

    const user = req.session.user;
    const userData = await User.findById(user);

    if (!order) {
      return res.status(404).send("Order not found");
    }
  
    res.render("orderDetails", { order, user: userData });
  } catch (error) {
    console.log(error.message, 'Error in load order details');
    res.redirect("/pageNotFound");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body; 
    const userId = req.session.user; 
    const userData = await User.findById(userId);

    const order = await Order.findOne({ _id: orderId, userId: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled.",
      });
    }

    order.status = "Cancelled";
    await order.save();

    if(order.paymentMethod!=="Cash on delivery"){
      userData.wallet += order.finalPrice;
      userData.walletHistory.push({
        date: new Date(),
        description: `Order: #${order.orderId} cancelled`,
        type: "Credit",
        amount: refundAmount
    });
      await userData.save();
    } 

    return res.status(200).json({ success: true, message: "Order cancelled successfully." });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const updatePaymentMethod = async (req, res) => {
  const { orderId, paymentMethod, paymentId } = req.body;

  console.log(req.body, "Received data for updating payment method");

  try {
      const order = await Order.findOne({orderId: orderId});

      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }

      console.log("reached")
      order.paymentMethod = paymentMethod;
      order.paymentId = paymentId;

      await order.save();

      return res.status(200).json({ success: true, message: 'Payment method updated successfully', order });
  } catch (error) {
      console.error("Error updating payment method:", error);
      return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

const returnOrder = async (req,res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    order.status = "Return Requesting";
    await order.save();
    res.json({ success: true, message: "Request for the order to return has been sent successfully" });
  } catch (error) {
    console.log(error.message, "Error in return order");
    res.status(500).json({ success: false, message: "Failed to return order" });
  }
};

const cancelProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.body; 
    const userId = req.session.user; 

    const order = await Order.findOne({ _id: orderId, userId: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const productIndex = order.orderedItems.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: "Product not found in the order." });
    }

    const product = order.orderedItems[productIndex];

    if (product.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending products can be cancelled.",
      });
    }

    product.status = "Cancelled";

    const remainingStatuses = order.orderedItems.map((item) => item.status);
    if (remainingStatuses.every((status) => status === "Cancelled")) {
      order.status = "Cancelled";
    } else if (remainingStatuses.includes("Cancelled")) {
      order.status = "Partially Cancelled";
    }

    await order.save();

    if (order.paymentMethod !== "Cash on delivery") {
      const userData = await User.findById(userId);

      const refundAmount = product.price;
      userData.wallet += refundAmount;

      userData.walletHistory.push({
        date: new Date(),
        description: `Product cancelled from Order: #${order.orderId}`,
        type: "Credit",
        amount: refundAmount,
      });

      await userData.save();
    }

    return res.status(200).json({
      success: true,
      message: "Product cancelled successfully.",
    });
  } catch (error) {
    console.error("Error cancelling product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const returnProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.body; 
    const userId = req.session.user;

    const order = await Order.findOne({ _id: orderId, userId: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const productIndex = order.orderedItems.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: "Product not found in the order." });
    }

    const product = order.orderedItems[productIndex];

    if (product.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered products can be returned.",
      });
    }

    product.status = "Return Requesting";

    const remainingStatuses = order.orderedItems.map((item) => item.status);
    if (remainingStatuses.every((status) => status === "Returned" || status === "Cancelled")) {
      order.status = "Returned";
    } else if (remainingStatuses.includes("Return Requesting")) {
      order.status = "Return Requesting";
    } else {
      order.status = "Partially Returned";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Product return request has been submitted successfully.",
    });
  } catch (error) {
    console.error("Error returning product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('Received request to download invoice for order ID:', orderId);

    const order = await Order.findById(orderId)
      .populate('userId', 'name email mobile')
      .populate('orderedItems.productId', 'productName');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const userAddress = order.address && order.address[0];

    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${orderId}-invoice.pdf"`);

    doc.pipe(res);

    // Invoice Header
    doc.fontSize(20).text(`Invoice for Order ${order.orderId}`, { align: 'center' });
    doc.fontSize(12).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'center' });

    doc.fontSize(14).text(`Customer Details:`);
    doc.fontSize(12).text(`Name: ${order.userId.name}`);
    doc.text(`Email: ${order.userId.email || 'N/A'}`);
    doc.text(`Mobile: ${order.userId.mobile || 'N/A'}`);

    if (userAddress) {
      doc.text(`Address: ${userAddress.addressType}, ${userAddress.name}, ${userAddress.city}, ${userAddress.state}, ${userAddress.pincode}`);
    } else {
      doc.text('No address provided');
    }

    doc.text('Order Details:', { align: 'left' });
    order.orderedItems.forEach(item => {
      doc.text(`${item.productId.productName} (Qty: ${item.quantity}) - ${item.price.toFixed(2)}`);
    });

    doc.text(`Total Price: ${order.totalPrice.toFixed(2)}`, { align: 'left' });  

    doc.end();

    console.log('Invoice generated and sent successfully for order ID:', orderId);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice' });
  }
};







module.exports = {
  placeOrder,
  loadOrders,
  loadOrderDetails,
  cancelOrder,
  placeRazorpayOrder,
  placeWalletOrder,
  handlePaymentSuccess,
  updatePaymentMethod,
  returnOrder,
  cancelProduct,
  returnProduct,
  downloadInvoice
};
