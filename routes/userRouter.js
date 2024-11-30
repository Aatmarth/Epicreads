const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const userController = require('../controllers/user/userController');
const cartController = require('../controllers/user/cartController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');
const  { userAuth,isBlocked}= require('../middlewares/auth');


userRouter.get("/",userController.loadhome); 


// // User Authentication // //

userRouter.get('/login',userController.loadLogin);
userRouter.get('/forgotPassword',userController.loadForgotPassword);
userRouter.post('/forgotPassword',isBlocked,userController.forgotPassword);
userRouter.get('otpResetPassword',userController.loadOtpResetPassword);
userRouter.post('/otpResetPassword',userController.otpResetPassword);
userRouter.get('/resetPassword',userController.loadResetPassword);
userRouter.post('/resetPassword',userController.ResetPassword)
userRouter.get('/register',userController.loadRegister);
userRouter.post("/register",userController.register);
userRouter.post("/verify-otp",userController.verifyOtp);
userRouter.post("/resend-otp",userController.resendOtp);
userRouter.post("/login",userController.login);
userRouter.get("/logout",userController.logout);
userRouter.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}));
userRouter.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/'}),(req,res)=>{
    console.log(req.user);
    if(req.user) req.session.user = req.user;
    res.redirect('/')
});

userRouter.get("/pageNotFound",userController.loadPageNotFound);



// // User Pages // //
userRouter.get("/shop",isBlocked,userController.loadShop);
userRouter.get('/productPage',isBlocked,userController.loadProductPage);
userRouter.get('/search', userController.searchProducts);


// // User Profile // //
userRouter.get("/userProfile",isBlocked,userController.loadUserProfile);
userRouter.get("/editProfile",isBlocked,userController.loadEditProfile);
userRouter.post("/editProfile",isBlocked,userController.editProfile);
userRouter.get("/changePassword",isBlocked,userController.loadChangePassword);
userRouter.post("/changePassword",isBlocked,userController.changePassword);
userRouter.get("/addAddress",isBlocked,userController.loadAddAddress);
userRouter.post("/addAddress",isBlocked,userController.addAddress);
userRouter.get("/editAddress",isBlocked,userController.loadEditAddress);
userRouter.post("/editAddress",isBlocked, userController.editAddress);
userRouter.get("/deleteAddress",isBlocked,userController.deleteAddress);
userRouter.get("/myWallet",isBlocked,userController.loadWallet);


// // Cart // //
userRouter.get("/cart",isBlocked,cartController.loadCart);
userRouter.post("/addToCart",isBlocked,cartController.addToCart);
userRouter.post("/updateCart",isBlocked,cartController.updateCart);
userRouter.post("/removeProductFromCart",isBlocked,cartController.removeProductFromCart);

// // Wishlist // //
userRouter.get("/wishlist",isBlocked,wishlistController.loadWishlist);
userRouter.post("/addToWishlist",isBlocked,wishlistController.addToWishlist);
userRouter.post("/removeFromWishlist",isBlocked,wishlistController.removeFromWishlist);



// // Checkout // //
userRouter.get("/checkout",isBlocked,checkoutController.loadCheckout);
userRouter.post("/checkout", isBlocked,checkoutController.loadCheckout)
userRouter.post("/verifyCoupon",isBlocked,checkoutController.verifyCoupon);


// // Order // //
userRouter.post("/placeOrder",isBlocked,orderController.placeOrder);
userRouter.get("/myOrders",isBlocked,orderController.loadOrders);
userRouter.get("/orderDetails",isBlocked,orderController.loadOrderDetails);
userRouter.post("/cancelOrder",isBlocked,orderController.cancelOrder);
userRouter.post("/placeRazorpayOrder",isBlocked,orderController.placeRazorpayOrder);
userRouter.post("/placeWalletOrder",isBlocked,orderController.placeWalletOrder);
userRouter.post('/payment-success', orderController.handlePaymentSuccess);
userRouter.post('/updatePaymentMethod',orderController.updatePaymentMethod);
userRouter.post('/returnOrder',orderController.returnOrder);

userRouter.post('/cancelProduct',isBlocked,orderController.cancelProduct);
userRouter.post('/returnProduct',isBlocked, orderController.returnProduct);
userRouter.post('/downloadInvoice', isBlocked, orderController.downloadInvoice);

module.exports = userRouter; 