const Coupon = require("../../models/couponSchema");

const loadCouponPage = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        const query = searchQuery
            ? { couponCode: { $regex: searchQuery, $options: 'i' } }
            : {};

        const couponData = await Coupon.find(query)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit);

        const totalCoupons = await Coupon.countDocuments(query);
        const totalPages = Math.ceil(totalCoupons / limit);

        res.render("coupon", {
            data: couponData,
            currentPage: page,
            totalPages: totalPages,
            totalCoupons: totalCoupons,
            searchQuery: searchQuery 
        });

    } catch (error) {
        console.log(error.message, "Error in coupon info");
        res.status(500).send("Internal server error");
    }
}

const loadAddCoupon= async(req,res)=>{
    try{
        res.render("addCoupon")
    }catch(error){
        console.log(error.message, "Error in load add coupon");
        res.status(500).send("Internal server error")
    }
}

const addCoupon = async(req,res)=>{
    try {
        const {couponCode, offerPrice, minimumPrice, expireOn} = req.body;
        const newCoupon = new Coupon({
            couponCode,
            offerPrice,
            minimumPrice,
            expireOn: new Date(expireOn)
        })
        await newCoupon.save();
        res.redirect("/admin/coupons")
    } catch (error) {
        console.log(error.message, "Error in add coupon");
        res.status(500).send("Internal server error");
    }
}

const toggleCoupon = async (req, res) => {
    try {
      const id = req.query.id;
      const coupon = await Coupon.findById({ _id: id });
      coupon.isActive = !coupon.isActive;
      await coupon.save();
      res.redirect("/admin/coupons");
    } catch (error) {
      console.log(error.message, "Error in toggling coupon status");
      res.status(500).send("Internal server error");
    }
  };
  

const deleteCoupon = async(req,res)=>{
    try {
        let id = req.query.id;
        await Coupon.deleteOne({_id:id});
        res.redirect("/admin/coupons?deleted=true");
    } catch (error) {
        console.log(error.message, "Error in delete coupon");
        res.status(500).send("Internal server error");
    }
}

module.exports = {
    loadCouponPage,
    loadAddCoupon,
    addCoupon,
    toggleCoupon,
    deleteCoupon
}