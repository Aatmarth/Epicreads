const express = require('express');
const adminRouter = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController");
const orderController = require("../controllers/admin/orderController");
const couponController = require("../controllers/admin/couponController");
const offerController = require("../controllers/admin/offerController");
const salesReportController = require("../controllers/admin/salesReportController");
const {uploadProduct,uploadCategory} = require("../middlewares/multer");
const {adminAuth} = require("../middlewares/auth");


adminRouter.get("/login",adminController.loadLogin);
adminRouter.post("/login",adminController.login);
adminRouter.get("/",adminAuth,salesReportController.salesChart);
adminRouter.get("/salesReport",adminAuth,salesReportController.loadSalesReport);
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
adminRouter.post('/addProduct',adminAuth, uploadProduct.array('productImage', 10), productController.addProduct);
adminRouter.get("/toggleProduct",adminAuth,productController.toggleProduct);
adminRouter.get("/editProduct",adminAuth,productController.loadEditProduct);
adminRouter.post("/editProduct/:id",adminAuth,uploadProduct.array('productImage', 10),productController.editProduct);

adminRouter.get("/orders",orderController.loadOrders);
adminRouter.get("/orderInfo",orderController.loadOrderDetails);
adminRouter.post("/updateOrderStatus",orderController.updateOrderStatus);
adminRouter.post("/updateProductStatus",orderController.updateProductStatus)


adminRouter.get("/coupons",adminAuth,couponController.loadCouponPage);
adminRouter.get("/addCoupon",adminAuth,couponController.loadAddCoupon);
adminRouter.post("/addCoupon",adminAuth,couponController.addCoupon);
adminRouter.get("/toggleCoupon",adminAuth,couponController.toggleCoupon);
adminRouter.get("/deleteCoupon",adminAuth,couponController.deleteCoupon);

adminRouter.get("/productOffers",adminAuth,offerController.loadProductOffers);
adminRouter.get("/addproductOffer",adminAuth,offerController.loadAddProductOffer);
adminRouter.post("/addProductOffer",adminAuth,offerController.addProductOffer);
adminRouter.get("/toggleProductOffer",adminAuth,offerController.toggleProductOffer);
adminRouter.get("/deleteProductOffer",adminAuth,offerController.deleteProductOffer);

adminRouter.get("/categoryOffers",adminAuth,offerController.loadCategoryOffers);
adminRouter.get("/addCategoryOffer",adminAuth,offerController.loadAddCategoryOffer);
adminRouter.post("/addCategoryOffer",adminAuth,offerController.addCategoryOffer);
adminRouter.get("/toggleCategoryOffer",adminAuth,offerController.toggleCategoryOffer);
adminRouter.get("/deleteCategoryOffer",adminAuth,offerController.deleteCategoryOffer);

adminRouter.get('/salesReport/excel',adminAuth, salesReportController.downloadSalesReportExcel);
adminRouter.get('/salesReport/pdf',adminAuth, salesReportController.downloadSalesReportPDF);


module.exports = adminRouter;