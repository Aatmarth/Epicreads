const User = require("../../models/userSchema");

const customerInfo = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const userData = await User.find({
            isAdmin: 0,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ]
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.countDocuments({
            isAdmin: 0,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ]
        });

        res.render("customers", {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            search
        });
    } catch (error) {
        console.log(error.message, "Error in customer info");
        res.status(500).send("Internal server error");
    }
}

const blockCustomer = async(req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:1}})
        res.redirect("/admin/users")
    } catch (error) {
        console.log(error.message,"Error in block customer");
        res.status(500).send("Internal server error")
    }
}

const unblockCustomer = async(req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:0}})
        res.redirect("/admin/users")
    } catch (error) {
        console.log(error.message,"Error in unblock customer");
        res.status(500).send("Internal server error")
    }
}       




module.exports = {
    customerInfo,
    blockCustomer,
    unblockCustomer
}