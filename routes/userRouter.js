const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const userController = require('../controllers/user/userController' )

userRouter.get("/",userController.loadhome); 
userRouter.get('/login',userController.loadLogin)
userRouter.get('/register',userController.loadRegister)
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
userRouter.get('/productPage',userController.loadProductPage)

userRouter.get("/shop",userController.loadShop)





module.exports = userRouter; 