const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const e = require("express");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");


const loadhome = async (req, res) => {
  try {
    const products = await Product.find({ isListed: true }).populate({
      path: "category",
      match: { isListed: true },
    });
    const filteredProducts = products.filter((product) => product.category);
    const category = await Category.find({}).sort({ name: 1 });
    const newArrivals = await Product.find({ isListed: true })
      .populate({ path: "category", match: { isListed: true } })
      .sort({ createdAt: -1 });
    const filteredProductNewArrivals = newArrivals.filter(
      (product) => product.category
    );
      const user = req.session.user;

    if (user) {
      const userData = await User.findOne({ _id: user });

      res.render("homepage", {
        user: userData,
        products: filteredProducts,
        categories: category,
        newArrivals: filteredProductNewArrivals,
      });
    } else {
      res.render("homepage", {
        products: filteredProducts,
        categories: category,
        newArrivals: filteredProductNewArrivals,
      });
    }
  } catch (error) {
    console.log(error.message + "home page not found");
    res.status(500).send("Server error");
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "EPICREADS, VERIFY YOUR EMAIL",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP is ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error(error.message + `error sending email`);
    return false;
  }
}

const register = async (req, res) => {
  try {
    console.log(req.body);

    const { name, email, mobile, password } = req.body;

    const findUser = await User.findOne({ email });
    if (findUser) {
      const products = await Product.find({});
      return res.render("register", {
        message: "User with this email already exists",
        products: products,
      });
    }

    const otp = generateOtp();
    const emailSent = await sendEmail(email, otp);
    if (!emailSent) {
      return res.json("email not sent");
    }

    req.session.userOtp = otp;
    req.session.userData = { name, mobile, email, password };
    res.render("otpVerification");
    console.log("Otp sent", otp);
  } catch (error) {
    console.error(error.message + " error in register");
    res.status(500).send("Server error");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error(error.message + " error in securePassword");
    res.status(500).send("Server error");
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log("req", req.body);

    console.log("session otp", req.session.userOtp);

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      console.log("user", user);

      const passwordHash = await securePassword(user.password);
      const saveUserData = new User({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        password: passwordHash,
      });
      await saveUserData.save();
      req.session.user = saveUserData._id;
      console.log(saveUserData);

      res.json({ success: true, redirectUrl: "/logIn" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again" });
    }
  } catch (error) {
    console.error(error.message + " error in verifyOtp");
    res.status(500).send("Server error");
  }
};

const resendOtp = async (req, res) => {
  try {
    if (!req.session.userData) {
      return res
        .status(400)
        .json({ success: false, message: "Session data not found" });
    }
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email not found" });
    }

    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sendEmail(email, otp);
    if (emailSent) {
      console.log("Resent OTP:", otp);
      res
        .status(200)
        .json({ success: true, message: "OTP Resend Successfully" });
    } else {
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to resend OTP. Please try again later",
        });
    }
  } catch (error) {
    console.error(error.message + " error in resendOtp");
    res.status(500).send("Server error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await User.findOne({ isAdmin: 0, email: email });

    if (!findUser) {
      return res.render("logIn", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("logIn", { message: "User is blocked by admin" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.render("logIn", { message: "Invalid Password" });
    }

    req.session.user = findUser._id;
    res.redirect("/");
  } catch (error) {
    console.error(error.message + " error in login");
    res.status(500).send("Login Failed. Please try again later");
  }
};

const logout = async (req, res) => {
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
    console.error(error.message + " error in logout");
    res.status(500).send("Server error");
  }
};

const loadProductPage = async (req, res) => {
  try {
    const productId = req.query.id;
    const product = await Product.findById(productId).populate("category");
    const relatedProducts = await Product.find({
      category: product.category,
    }).limit(4);

    if (req.session.user) {
      const user = req.session.user;
      const userData = await User.findOne({ _id: user });
      console.log(userData);

      res.render("productPage", { user: userData, product, relatedProducts });
    } else {
      res.render("productPage", { product, relatedProducts });
    }
  } catch (error) {
    console.log(error.message, "Error in load product page");
    res.status(500).send("Internal server error");
  }
};

const loadShop = async (req, res) => {
  try {
    const category = await Category.find({});
    const products = await Product.find({ isListed: true }).populate({
      path: "category",
      match: { isListed: true },
    });
    const filteredProducts = products.filter((product) => product.category);
    if (req.session.user) {
      const user = req.session.user;
      const userData = await User.findOne({ _id: user });
      res.render("shop", {
        user: userData,
        categories: category,
        products: filteredProducts,
      });
    } else {
      res.render("shop", { categories: category, products: filteredProducts });
    }
  } catch (error) {
    console.log(error.message, "Error in load category boxed");
    res.status(500).send("Internal server error");
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message, "Error in load login");
    res.status(500).send("Internal server error");
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message, "Error in load register");
    res.status(500).send("Internal server error");
  }
};

const loadForgotPassword = async (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    console.log(error.message, "Error in load forgot password");
    res.status(500).send("Internal server error");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const findUser = await User.findOne({ email });
    if (!findUser) {
      return res.render("forgotPassword", { message: "User not found" });
    }
    const otp = generateOtp();
    console.log("otp: ", otp);
    req.session.userOtp = otp;
    req.session.userData = { email };
    const emailSent = await sendEmail(email, otp);
    if (!emailSent) {
      return res.render("forgotPassword", {
        message: "Failed to send OTP. Please try again later",
      });
    }
    res.render("otpResetPassword");
  } catch (error) {
    console.log(error.message, "Error in forgot password");
    res.status(500).send("Internal server error");
  }
};

const loadOtpResetPassword = async (req, res) => {
  try {
    res.render("otpResetPassword");
  } catch (error) {
    console.log(error.message, "Error in load otp reset password");
    res.status(500).send("Internal server error");
  }
};

const otpResetPassword = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log("req", req.body);

    if (otp === req.session.userOtp) {
      const { email } = req.session.userData;
      console.log("email", email);
      console.log("user email", email);

      // Find the user by email to confirm the user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }

      // Store user ID in session to identify the user in the next step
      req.session.user = user._id;
      console.log("OTP verified for", user.email);

      // Redirect to the new password page
      res.json({ success: true, redirectUrl: "/resetPassword" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again" });
    }
  } catch (error) {
    console.error(error.message + " error in otpResetPassword");
    res.status(500).send("Server error");
  }
};

const loadResetPassword = async (req, res) => {
  try {
    res.render("resetPassword");
  } catch (error) {
    console.log(error.message, "Error in load reset password");
    res.status(500).send("Internal server error");
  }
};

const ResetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.session.user;
    console.log("pssword", newPassword);
    console.log("userId", userId);
    if (!userId) {
      return res.render("resetPassword", {
        message: "Session expired. Please try again",
      });
    }

    const passwordHash = await securePassword(newPassword);
    console.log("Password reset successfully", passwordHash);

    await User.updateOne({ _id: userId }, { password: passwordHash });

    console.log("updated User");

    // Clear session after successful password reset
    req.session.user = null;
    console.log("Session cleared");

    res.render("login", {
      message: "Password reset successfully. Please login",
    });
  } catch (error) {
    console.error(error.message + " Error in reset password");
    res.status(500).send("Internal server error");
  }
};

const loadUserProfile = async (req, res) => {
  try {
    const user = req.session.user;
    console.log("Session User ID:", user);
    
    const userData = await User.findById(user);
    
    if (!userData) {
      return res.render("login", { message: "User logged out" });
    }
    
    const addressData = await Address.findOne({ userId: user });
    
    res.render("userProfile", { user: userData, addresses: addressData ? addressData.address : [] });
  } catch (error) {
    console.log(error.message, "Error in load user profile");
    res.status(500).send("Internal server error");
  }
};


const loadEditProfile = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    console.log(userData.name);
    res.render("editProfile", { user: userData });
  } catch (error) {
    console.log(error.message, "Error in load edit profile");
    res.status(500).send("Internal server error");
  }
};

const editProfile = async (req, res) => {
  try {
    const { name, phone} = req.body;
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    if (userData) {
      userData.name = name;
      userData.mobile = phone;
      await userData.save();
      req.session.user = userData._id;
      res.redirect("/userProfile");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(error.message, "Error in edit profile");
    res.status(500).send("Internal server error");
  }
};

const loadChangePassword = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    res.render("changePassword", { user: userData });
  } catch (error) {
    console.log(error.message, "Error in load change password");
    res.status(500).send("Internal server error");
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });

    if (!userData) {
      return res.render("login", { message: "User logged out" });
    }

    if (!oldPassword || !userData.password) {
      return res.render("changePassword", {
        user: userData,
        message: "Error: Missing old password or user data",
      });
    }

    if (oldPassword === newPassword) {
      return res.render("changePassword", {
        user: userData,
        message: "New password cannot be the same as the old password",
        showAlert: true
      });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, userData.password);
    if (passwordMatch) {
      const passwordHash = await securePassword(newPassword);
      userData.password = passwordHash;
      await userData.save();
      req.session.user = userData._id;
      return res.render("changePassword", {
        user: userData,
        success: true
      });
    } else {
      return res.render("changePassword", {
        user: userData,
        message: "Incorrect old password",
        showAlert: true
      });
    }
  } catch (error) {
    console.log(error.message, "Error in change password");
    return res.status(500).send("Internal server error");
  }
};


const loadAddAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findById(user);
    
    const addressData = await Address.findOne({ userId: user });
    
    res.render("addAddress", { user: userData, addresses: addressData ? addressData.address : [] });
  } catch (error) {
    console.log(error.message, "Error in load add address");
    res.status(500).send("Internal server error");
  }
};

const addAddress = async (req, res) => {
  try {
    const { addressType, name, city, state, pincode, phone, email } = req.body;
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });

    if (userData) {
      const newAddress = {
        addressType,
        name,
        city,
        state,
        pincode,
        phone,
        email
      };

      const addressDoc = await Address.findOne({ userId: user });
      if (addressDoc) {
        addressDoc.address.push(newAddress);
        await addressDoc.save();
      } else {
        const newAddressDoc = new Address({
          userId: user,
          address: [newAddress]
        });
        await newAddressDoc.save();
      }

      res.redirect("/userProfile");
    } else {
      res.render("login", { message: "User logged out"});
    }
  } catch (error) {
    console.log(error.message, "Error in add address");
    res.status(500).send("Internal server error");
  }
};

// 

const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.query.id; // Getting the address ID from query params
    const userId = req.session.user; // Assuming you're storing the user ID in the session

    // Find the user's document containing the address array
    const userAddress = await Address.findOne({ userId });

    if(!userId){
      return res.render("login", { message: "User logged out" });
    }

    if (!userAddress) {
      return res.status(404).send('User not found');
    }

    // Find the specific address within the address array
    const address = userAddress.address.find(addr => addr._id.toString() === addressId);

    if (!address) {
      return res.status(404).send('Address not found');
    }

    // Render the view with the specific address
    res.render('editAddress', { address });
  } catch (error) {
    console.log(error.message, "Error in load edit address");
    res.status(500).send("Internal server error");
  }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.query.id;
    const { addressType, customAddressType, name, city, state, pincode, phone, email } = req.body;

    console.log("Form data:", { addressType, customAddressType, name, city, state, pincode, phone, email });
    console.log("Address ID:", addressId);

    const updatedAddressType = addressType === 'Other' ? customAddressType : addressType;
    console.log("Updated Address Type:", updatedAddressType);


    const updateData = {
      'address.$.addressType': updatedAddressType,
      'address.$.name': name,
      'address.$.city': city,
      'address.$.state': state,
      'address.$.pincode': pincode,
      'address.$.phone': phone,
      'address.$.email': email,
    };

    const updatedAddress = await Address.findOneAndUpdate(
      { 'address._id': addressId },
      { $set: updateData },
      { new: true }
    );

    console.log("Updated Address:", updatedAddress);

    if (!updatedAddress) {
      console.log(`No address found with ID: ${addressId}`);
      return res.status(404).render('editAddress', {
        address: req.body,
        errorMessage: "Address not found"
      });
    }

    res.render('editAddress', {
      address: req.body,
      successMessage: "Address updated successfully"
    });
  } catch (error) {
    console.log(error.message, "Error in updating address");
    res.status(500).render('editAddress', {
      address: req.body,
      errorMessage: "Internal server error"
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.query.id;
    const userId = req.session.user;

    const addressDoc = await Address.findOneAndUpdate(
      { userId },
      { $pull: { address: { _id: addressId } } },
      { new: true }
    );

    if (!addressDoc) {
      return res.status(404).send('Address not found');
    }

    res.redirect('/userProfile');
  } catch (error) {
    console.log(error.message, "Error in delete address");
    res.status(500).send("Internal server error");
  }
};




module.exports = {
  loadhome,
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  loadProductPage,
  loadShop,
  loadLogin,
  loadRegister,
  loadForgotPassword,
  forgotPassword,
  loadOtpResetPassword,
  otpResetPassword,
  loadResetPassword,
  ResetPassword,
  loadUserProfile,
  loadEditProfile,
  editProfile,
  loadChangePassword,
  changePassword,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
};