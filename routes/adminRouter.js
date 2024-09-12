const express = require('express');
const adminRouter = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController");
const {uploadProduct,uploadCategory} = require("../middlewares/multer");
const {addProduct} = require("../controllers/admin/productController");
const {userAuth,adminAuth} = require("../middlewares/auth");



adminRouter.get("/login",adminController.loadLogin);
adminRouter.post("/login",adminController.login);
adminRouter.get("/",adminAuth,adminController.loadDashboard);
adminRouter.get("/logout",adminAuth,adminController.logout);

adminRouter.get("/users",adminAuth, customerController.customerInfo);
adminRouter.get("/blockCustomer",adminAuth,customerController.blockCustomer);
adminRouter.get("/unblockCustomer",adminAuth,customerController.unblockCustomer);

adminRouter.get("/categories",adminAuth,categoryController.categoryInfo);
adminRouter.post('/addCategory', adminAuth, uploadCategory.single('categoryImage'), categoryController.addCategory);
adminRouter.get("/toggleCategory",adminAuth,categoryController.toggleCategory);
adminRouter.get("/editCategory",adminAuth,categoryController.loadEditCategory);
adminRouter.post("/editCategory/:id",adminAuth,uploadCategory.single('categoryImage'),categoryController.editCategory);


adminRouter.get("/products",adminAuth,productController.productInfo);
adminRouter.get("/addProduct",adminAuth,productController.getAddProduct);
// adminRouter.post('/addProduct',adminAuth, uploadProduct.array('productImage', 10), productController.addProduct);
adminRouter.get("/toggleProduct",adminAuth,productController.toggleProduct);
adminRouter.get("/editProduct",adminAuth,productController.loadEditProduct);
adminRouter.post("/editProduct/:id",adminAuth,uploadProduct.array('productImage', 10),productController.editProduct);






const multer = require('multer');
const path = require('path');

// Set up Multer storage and file filter
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/productImages')); // Change to your image path
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid overwriting
    }
});

const upload = multer({ storage: storage });


adminRouter.use(express.urlencoded({ extended: true }));


adminRouter.post('/addProduct',adminAuth,  upload.array('productImage'), productController.addProduct);

adminRouter.post('/add-Product',adminAuth, upload.array('productImage'), (req, res) => {
    const { productName, author, category, publishedYear, productDescription, productPrice, offerPrice, pageCount, quantity, status } = req.body;

    // Array of file paths
    const productImages = req.files.map(file => file.path);

    // Log or process the form data and image paths
    console.log({
        productName,
        author,
        category,
        publishedYear,
        productDescription,
        productPrice,
        offerPrice,
        pageCount,
        quantity,
        status,
        productImages
    });
    res.send('Product added successfully');
});





module.exports = adminRouter;