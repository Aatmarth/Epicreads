const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Author = require("../../models/authorSchema");
const upload = require("../../middlewares/multer");


const productInfo = async (req, res) => {
    try {
        let search= "";
        if(req.query.search){
            search = req.query.search
        }
        let page=1;
        if(req.query.page){
            page=req.query.page
        }

        const limit=8
        const productsData=await Product.find({
            productName:{$regex:".*"+search+".*"}
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();

        const count = await Product.find({
            productName:{$regex:".*"+search+".*"}
        }).countDocuments();

        
        res.render('products',{
            data:productsData,
            totalPages:Math.ceil(count/limit),
            currentPage:page,
            limit:limit,
            
        })
    } catch (error) {
        console.log(error.message, "Error in product info");
        res.status(500).send("Internal server error");
    }
};

const getAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({});
        const author = await Author.find({});
        res.render('addProduct',{categories: categories,author:author});
    } catch (error) {
        console.log(error.message, "Error in get add product");
        res.status(500).send("Internal server error");
    }
};

const addProduct = async (req, res) => {
    try {
        const productData = {
            productName: req.body.productName,
            category: req.body.category,
            productDescription: req.body.productDescription,
            productPrice: req.body.productPrice,
            author: req.body.author,
            offerPrice: req.body.offerPrice,
            pageCount: req.body.pageCount,
            quantity: req.body.quantity,
            productImage: req.files.map(file => file.filename), // Store filenames
            status: req.body.status
        };

        const newProduct = new Product(productData);
        await newProduct.save();
        res.redirect('/admin/products'); // Redirect to the product list after adding
       
    } catch (error) {
        console.log(error.message, "Error in add product");
        res.status(500).send("Internal server error");
    }
};

module.exports = {
    productInfo,
    addProduct,
    getAddProduct
};