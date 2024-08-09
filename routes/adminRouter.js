const express = require('express');
const adminRouter = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController");
const upload = require("../middlewares/multer");
const {addProduct} = require("../controllers/admin/productController");
const {userAuth,adminAuth} = require("../middlewares/auth");



adminRouter.get("/login",adminController.loadLogin);
adminRouter.post("/login",adminController.login);
adminRouter.get("/",adminAuth,adminController.loadDashboard);
adminRouter.get("/logout",adminController.logout);

adminRouter.get("/users",adminAuth, customerController.customerInfo);
adminRouter.get("/blockCustomer",adminAuth,customerController.blockCustomer);
adminRouter.get("/unblockCustomer",adminAuth,customerController.unblockCustomer);

adminRouter.get("/categories",adminAuth,categoryController.categoryInfo);
adminRouter.post("/addCategory",adminAuth,categoryController.addCategory);

adminRouter.get("/products",adminAuth,productController.productInfo);

 adminRouter.get("/addProduct",adminAuth,productController.getAddProduct);
adminRouter.post('/addProduct',adminAuth, upload.array('productImage', 10), productController.addProduct);



module.exports = adminRouter;