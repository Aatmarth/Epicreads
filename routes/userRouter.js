const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const userController = require('../controllers/user/userController');
const cartController = require('../controllers/user/cartController');
const checkoutController = require('../controllers/user/checkoutController');
const  { userAuth,isBlocked}= require('../middlewares/auth');


// // User Authentication // //
userRouter.get("/",userController.loadhome); 
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


// // User Pages // //
userRouter.get("/shop",isBlocked,userController.loadShop);
userRouter.get('/productPage',isBlocked,userController.loadProductPage);
// userRouter.get('/search', productController.getSuggestions);


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


// // Cart // //
userRouter.get("/cart",isBlocked,cartController.loadCart);
userRouter.post("/addToCart",isBlocked,cartController.addToCart);
userRouter.post("/updateCart",isBlocked,cartController.updateCart);
userRouter.post("/removeProductFromCart",isBlocked,cartController.removeProductFromCart);




// // Checkout // //

userRouter.get("/checkout",isBlocked,checkoutController.loadCheckout);

module.exports = userRouter; 