const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const {ProductOffer, CategoryOffer}= require("../../models/offerSchema");

const loadProductOffers = async (req, res) => {
    try {
        let search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const productOffers = await ProductOffer.find({ offerName: { $regex: ".*" + search + ".*", $options: "i" } }).sort({ createdAt: -1 })
            .populate('productId', 'productName')
            .skip(skip)
            .limit(limit);
        const totalProductOffers = await ProductOffer.countDocuments({ offerName: { $regex: ".*" + search + ".*", $options: "i" } })
        const totalPages = Math.ceil(totalProductOffers / limit);

        res.render('productOffers',
            {
                productOffers,
                currentPage: page,
                totalPages,
                totalProductOffers,
                limit,
                searchQuery: search
            });
    } catch (err) {
        console.log(err.message, "Error in load product offers");
        res.status(500).send("Internal server error");
    }
};

const loadAddProductOffer = async(req,res)=>{
    try{
        const products= await Product.find({}).sort({productName: 1});
        res.render("addProductOffer", {products});
    } catch (err){
        console.log(err.message, "Error in load add product offer");
        res.status(500).send("Internal server error");
    }
}

const addProductOffer = async(req,res)=>{
    const {offerName, productId, offerPercentage} = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        
        const newOffer = new ProductOffer({
            offerName,
            productId,
            productName: product.productName,
            offerPercentage,
            isActive: true
        });
        await newOffer.save();
        product.offerPercentage = offerPercentage
        await product.save();
        res.redirect('/admin/productOffers');
    } catch (err) {
        
    }
}

const toggleProductOffer = async(req,res)=>{
    try {
        const id = req.query.id;
        const offer = await ProductOffer.findById(id);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }
        offer.isActive = !offer.isActive;
        await offer.save();
        const product = await Product.findById(offer.productId);
        if (offer.isActive) {
            product.offerPercentage = offer.offerPercentage;
        } else {
            product.offerPercentage = 0;
        }
        await product.save();
        res.redirect('/admin/productOffers');
    } catch (err) {
        console.log(err.message, "Error in toggle product offer");
        res.status(500).send("Internal server error");
    }
}

const deleteProductOffer = async(req,res)=>{
    try {
        const id = req.query.id;
        const offer = await ProductOffer.findById(id);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }
        await offer.deleteOne();
        const product = await Product.findById(offer.productId);
        product.offerPercentage = 0;
        await product.save();
        res.redirect('/admin/productOffers');
    } catch (err) {
        console.log(err.message, "Error in delete product offer");
        res.status(500).send("Internal server error");
    }
}

const loadCategoryOffers = async(req,res)=>{
    try {
        let search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const categoryOffers = await CategoryOffer.find({ offerName: { $regex: ".*" + search + ".*", $options: "i" } }).sort({ createdAt: -1 })
            .populate('categoryId', 'name')
            .skip(skip)
            .limit(limit);
        const totalCategoryOffers = await CategoryOffer.countDocuments({ offerName: { $regex: ".*" + search + ".*", $options: "i" } })
        const totalPages = Math.ceil(totalCategoryOffers / limit);

        res.render('categoryOffers',
            {
                categoryOffers,
                currentPage: page,
                totalPages,
                totalCategoryOffers,
                limit,
                searchQuery: search
            });
    } catch (err) {
        console.log(err.message, "Error in load category offers");
        res.status(500).send("Internal server error");
    }
};

const loadAddCategoryOffer = async(req,res)=>{
    try{
        const categories= await Category.find({}).sort({name: 1});
        res.render("addCategoryOffer", {categories});
    } catch (err){
        console.log(err.message, "Error in load add category offer");
        res.status(500).send("Internal server error");
    }
}

const addCategoryOffer = async(req,res)=>{
    const {offerName, categoryId, offerPercentage} = req.body;
    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).send('Category not found');
        }
        const newOffer = new CategoryOffer({
            offerName,
            categoryId,
            categoryName: category.name,
            offerPercentage,
            isActive: true
        });
        await newOffer.save();

        category.offerPercentage = offerPercentage;
        await category.save();

        const productsInCategory = await Product.find({ category: categoryId });
        for (const product of productsInCategory) {
            product.offerPercentage = offerPercentage;
            await product.save();
        }

        res.redirect('/admin/categoryOffers');
    } catch (err) {
        console.log(err.message, "Error in add category offer");
        res.status(500).send("Internal server error");
    }
}

const toggleCategoryOffer = async(req,res)=>{
    try {
        const id = req.query.id;
        const offer = await CategoryOffer.findById(id);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }
        offer.isActive = !offer.isActive;
        await offer.save();
        res.redirect('/admin/categoryOffers');
    } catch (err) {
        console.log(err.message, "Error in toggle category offer");
        res.status(500).send("Internal server error");
    }
}

const deleteCategoryOffer = async(req,res)=>{
    try {
        const id = req.query.id;
        const offer = await CategoryOffer.findById(id);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }
        await offer.deleteOne();
        res.redirect('/admin/categoryOffers');
    } catch (err) {
        console.log(err.message, "Error in delete category offer");
        res.status(500).send("Internal server error");
    }
}


module.exports = {
    loadProductOffers,
    loadAddProductOffer,
    addProductOffer,
    toggleProductOffer,
    deleteProductOffer,

    loadCategoryOffers,
    loadAddCategoryOffer,
    addCategoryOffer,
    toggleCategoryOffer,
    deleteCategoryOffer
}
