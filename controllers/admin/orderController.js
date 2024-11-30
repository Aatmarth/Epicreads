const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");


const loadOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        // Query to find orders by orderId or user's name
        const query = searchQuery
            ? {
                $or: [
                    { orderId: { $regex: searchQuery, $options: 'i' } }, 
                    { 'userId.name': { $regex: searchQuery, $options: 'i' } }
                ]
              }
            : {};

        const orderData = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'userId',
                select: 'name'
            })
            .populate('orderedItems.productId')
            .exec();

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        res.render("orderManagement", {
            data: orderData,
            currentPage: page,
            totalPages: totalPages,
            totalOrders: totalOrders,
            searchQuery: searchQuery
        });

    } catch (error) {
        console.error("Error in order info:", error.message);
        res.status(500).send("Internal server error");
    }
};



const loadOrderDetails = async(req,res)=>{
    try {
        let id = req.query.id;
        const orderData = await Order.findOne({_id:id})
        .populate("orderedItems.productId")
        .exec();
        res.render("orderInfo",{orderData:orderData});
    } catch (error) {
        console.log(error.message,"Error in order details");
        res.status(500).send("Internal server error");
    }
}

const updateOrderStatus = async (req, res) => {
    console.log("Entering updateOrderStatus");

    try {
        const { orderId, newStatus } = req.body;
        console.log("Request body:", req.body);

        const order = await Order.findById(orderId).populate('orderedItems.productId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const userData = await User.findById(order.userId);
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        let refundAmount = 0;

        order.orderedItems.forEach(item => {
            if (item.status === "Cancelled" || item.status === "Returned") {
                return;
            }
            item.status = newStatus;
            if ((newStatus === "Cancelled" || newStatus === "Returned") && order.paymentMethod !== "Cash on delivery") {
                refundAmount += item.price * item.quantity;
            }
        });

        if (refundAmount > 0) {
            userData.wallet += refundAmount;
            userData.walletHistory.push({
                date: new Date(),
                description: `Refund for Order ${order.orderId} - Status: ${newStatus}`,
                type: "Credit",
                amount: refundAmount
            });
            await userData.save();
        }

        const allStatuses = order.orderedItems.map(item => item.status);

        if (allStatuses.every(status => status === "Cancelled")) {
            order.status = "Cancelled";
        } else if (allStatuses.every(status => status === "Returned")) {
            order.status = "Returned";
        } else if (allStatuses.some(status => status === "Cancelled")) {
            order.status = "Partially Cancelled";
        } else if (allStatuses.some(status => status === "Returned")) {
            order.status = "Partially Returned";
        } else {
            order.status = newStatus;
        }

        await order.save();

        return res.status(200).json({ message: 'Order and product statuses updated successfully' });
    } catch (error) {
        console.log(error.message, "Error in update order status");
        res.status(500).send("Internal server error");
    }
};

const updateProductStatus = async (req, res) => {
    try {
        const { orderId, productId, newStatus } = req.body;

        console.log("Received orderId:", orderId);
        console.log("Received productId:", productId);

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        console.log("order:",order)

        const userData = await User.findById(order.userId);
        if (!userData) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("userData:",userData)

        let productUpdated = false;
        let refundAmount = 0;

        for (const item of order.orderedItems) {
            console.log("Expected productId (req.body):", productId.toString());
            console.log("Checking against item.productId:", item.productId.toString());

            if (item._id.toString() === productId.toString()) {
                console.log("Match found. Updating product status...");
                item.status = newStatus;
                productUpdated = true;
            
                if ((newStatus === "Cancelled" || newStatus === "Returned") && order.paymentMethod !== "Cash on delivery") {
                    refundAmount += item.price * item.quantity;
                    console.log("Refund amount updated:", refundAmount);
                }
                break;
            } else {
                console.log("No match for productId:", productId.toString());
            }
        }
        console.log("reached out of the loop")

        if (!productUpdated) {
            return res.status(404).json({ message: "Product not found in the order" });
        }

        if (refundAmount > 0) {
            userData.wallet += refundAmount;
            userData.walletHistory.push({
                date: new Date(),
                description: `Refund for product in Order ${order.orderId} - Status: ${newStatus}`,
                type: "Credit",
                amount: refundAmount,
            });
            await userData.save();
        }

        const allStatuses = order.orderedItems.map(item => item.status);

        if (allStatuses.every(status => status === "Cancelled")) {
            order.status = "Cancelled";
        } else if (allStatuses.every(status => status === "Returned")) {
            order.status = "Returned";
        } else if (allStatuses.some(status => status === "Cancelled")) {
            order.status = "Partially Cancelled";
        } else if (allStatuses.some(status => status === "Returned")) {
            order.status = "Partially Returned";
        } else if (allStatuses.every(status => status === "Shipped")) {
            order.status = "Shipped";
        } else if (allStatuses.every(status => status === "Delivered")) {
            order.status = "Delivered";
        } else {
            order.status = "Pending";
        }

        await order.save();

        return res.status(200).json({ message: "Product status updated successfully" });
    } catch (error) {
        console.error("Error in updating product status:", error.message);
        res.status(500).send("Internal server error");
    }
};



module.exports = {
    loadOrders,
    loadOrderDetails,
    updateOrderStatus,
    updateProductStatus
}