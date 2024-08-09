const User = require("../../models/userSchema");

const customerInfo = async(req,res)=>{
    try {
        let search = "";
        if(req.query.search){
            search = req.query.search;
        }
        let page= 1;
        if(req.query.page){
            page= req.query.page;
        }
        const limit =3;
        const userData = await User.find({
            isAdmin:0,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}},
            ]
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();

        const count= await User.find({
            isAdmin:0,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}},
            ]
        }).countDocuments();

        res.render("customers",{
            data:userData,
            totalPages:Math.ceil(count/limit),
            currentPage:page
        })
    } catch (error) {
        console.log(error.message,"Error in customer info");
        res.status(500).send("Internal server error")
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