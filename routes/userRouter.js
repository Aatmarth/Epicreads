const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const userController = require('../controllers/user/userController' )
const productController = require('../controllers/user/productController' )

userRouter.get("/",userController.loadhome);
userRouter.post("/register",userController.register);
userRouter.post("/verify-otp",userController.verifyOtp);
userRouter.post("/resend-otp",userController.resendOtp);
userRouter.post("/login",userController.login);
userRouter.get("/logout",userController.logout);

userRouter.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}));
userRouter.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/'}),(req,res)=>{
    res.redirect('/')
});




module.exports = userRouter; 