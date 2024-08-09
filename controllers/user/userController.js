const User = require("../../models/userSchema");
const nodemailer= require("nodemailer");
const env= require("dotenv").config();
const bcrypt = require("bcrypt");
const e = require("express");
const Product = require("../../models/productSchema");



const loadhome= async(req,res)=>{
    try {
        const user= req.session.user;
        const products = await Product.find({});
        console.log(products);
        
        if(user){
            const userData = await User.findOne({_id:user});
            console.log(userData);
            res.render("homepage",{user:userData,products:products});
        }else{
            res.render("homepage",{products:products});
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
            return res.render("homepage",{message:"User with this email already exists"})
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
            
            res.json({success:true, redirectUrl:"/"})
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
            return res.render("homepage",{message:"User not found"});
        }
        if(findUser.isBlocked){
            return res.render("homepage",{message:"User is blocked by admin"});
        }
        const passwordMatch = await bcrypt.compare(password,findUser.password);
        if(!passwordMatch){
            return res.render("homepage",{message:"Invalid Password"});
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
        req.session.destroy((err)=>{
            if(err){
                console.error("Session Destruction error",err.message);
                res.status(500).send("Server error");
            }
            return res.redirect("/");
        })
    } catch (error) {
        console.error(error.message+" error in logout");
        res.status(500).send("Server error");
    }
}


module.exports={
    loadhome,
    register,
    verifyOtp,
    resendOtp,
    login,
    logout
};


