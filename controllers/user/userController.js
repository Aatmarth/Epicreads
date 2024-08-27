const User = require("../../models/userSchema");
const nodemailer= require("nodemailer");
const env= require("dotenv").config();
const bcrypt = require("bcrypt");
const e = require("express");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");



const loadhome= async(req,res)=>{
    try {
        const products = await Product.find({ isListed: true }).populate({ path: 'category', match: { isListed: true } })
        const filteredProducts = products.filter(product => product.category);
        const category = await Category.find({}).sort({name:1})
        const newArrivals=await Product.find({ isListed: true }).populate({ path: 'category', match: { isListed: true } }).sort({createdAt:-1});
        const filteredProductNewArrivals = products.filter(product => product.category);

        if(req.session.user){
            const user= req.session.user;
            const userData = await User.findOne({_id:user});
            console.log(userData);
          
            res.render("homepage",{user:userData,products:filteredProducts,categories:category,newArrivals:filteredProductNewArrivals});
        }else{
            
            res.render("homepage",{products:filteredProducts,categories:category,newArrivals:filteredProductNewArrivals});
        }
    } catch (error) {
        console.log(error.message+"home page not found");
        res.status(500).send("Server error")
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(email,otp){
    try {
        const transporter= nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })

        const info= await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "EPICREADS, VERIFY YOUR EMAIL",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP is ${otp}</b>`
        })

        return info.accepted.length>0

    } catch (error) {
        console.error(error.message+`error sending email`);
        res.status(500).send("Server error");
        return false;
    }
}

const register = async(req,res)=>{ 
    try {
        console.log(req.body);
        
        const {name, email, mobile, password} = req.body;
        

        const findUser = await User.findOne({email});
        if(findUser){
            const products = await Product.find({});
            return res.render("register",{message:"User with this email already exists",products:products})
        }

        const otp= generateOtp();
        const emailSent = await sendEmail(email,otp);
        if(!emailSent){
            return res.json("email not sent")
        }

        req.session.userOtp = otp;
        req.session.userData = {name, mobile, email, password}
        res.render("otpVerification");
        console.log("Otp sent",otp);

    } catch (error) {
        console.error(error.message+" error in register");
        res.status(500).send("Server error");
    }
}

const securePassword = async(password)=>{
    try {
        const passwordHash= await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.error(error.message+" error in securePassword");
        res.status(500).send("Server error");
    }
}


const verifyOtp = async(req,res)=>{
    try {
        const {otp} = req.body;
        console.log('req',req.body);

        console.log(otp);

        if(otp === req.session.userOtp){
            const user = req.session.userData
            console.log('user',user);

            const passwordHash= await securePassword(user.password);
            const saveUserData = new User({
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                password: passwordHash,
            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            console.log(saveUserData);
            
            res.json({success:true, redirectUrl:"/logIn"})
        }else{
            res.status(400).json({success:false, message:"Invalid OTP. Please try again"})
        }
     }catch (error) {
        console.error(error.message+" error in verifyOtp");
        res.status(500).send("Server error");
    }
}

const resendOtp = async(req,res)=>{
    try {
        if(!req.session.userData){
            return res.status(400).json({ success: false, message: "Session data not found" });
        }
        const {email} = req.session.userData;
        if(!email){
            return res.status(400).json({success:false, message:"Email not found"})
        }        

        const otp = generateOtp();
        req.session.userOtp = otp;

        const emailSent = await sendEmail(email,otp);
        if(emailSent){
            console.log("Resent OTP:",otp);
            res.status(200).json({success:true,message:"OTP Resend Successfully"})
        }else{
            res.status(500).json({success:false,message:"Failed to resend OTP. Please try again later"})
        }
    } catch (error) {
        console.error(error.message+" error in resendOtp");
        res.status(500).send("Server error");
    }
}

const login= async(req,res)=>{
    try {
        const {email,password} = req.body;
        const findUser = await User.findOne({isAdmin:0, email:email});
        if(!findUser){
            return res.render("logIn",{message:"User not found"});
        }
        if(findUser.isBlocked){
            return res.render("logIn",{message:"User is blocked by admin"});
        }
        const passwordMatch = await bcrypt.compare(password,findUser.password);
        if(!passwordMatch){
            return res.render("logIn",{message:"Invalid Password"});
        }
        req.session.user = findUser._id;
        res.redirect("/");
    } catch (error) {
        console.error(error.message+" error in login");
        res.status(500).send("Login Failed. Please try again later");
    }
}

const logout= async(req,res)=>{
    try {
        // req.session.destroy((err)=>{
        //     if(err){
        //         console.error("Session Destruction error",err.message);
        //         res.status(500).send("Server error");
        //     }
        //     return res.redirect("/");
        // });
        req.session.user = null;
        return res.redirect("/");
    } catch (error) {
        console.error(error.message+" error in logout");
        res.status(500).send("Server error");
    }
}




const loadProductPage = async(req,res)=>{
    try {
        const productId = req.query.id;
        const product= await Product.findById(productId).populate('category')
        const relatedProducts = await Product.find({category:product.category}).limit(4);
        // console.log(product);
        
        res.render("productPage",{product,relatedProducts});

    } catch (error) {
        console.log(error.message,"Error in load product page");
        res.status(500).send("Internal server error")
    }
}







const loadShop = async(req,res)=>{
    try {
        const category = await Category.find({});
        const products = await Product.find({ isListed: true }).populate({ path: 'category', match: { isListed: true } })
        const filteredProducts = products.filter(product => product.category);
        res.render("shop",{categories:category,products:filteredProducts});
    } catch (error) {
        console.log(error.message,"Error in load category boxed");
        res.status(500).send("Internal server error")
    }
}






const loadLogin = async(req,res)=>{
    try {
        res.render("login");
    } catch (error) {
        console.log(error.message,"Error in load login");
        res.status(500).send("Internal server error")
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render("register");
    } catch (error) {
        console.log(error.message, "Error in load register");
        res.status(500).send("Internal server error");
    }
};


module.exports={
    loadhome,
    register,
    verifyOtp,
    resendOtp,
    login,
    logout,
    loadProductPage,
    loadShop,
    loadLogin,
    loadRegister
};


