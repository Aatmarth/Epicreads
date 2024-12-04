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
    res.redirect("/pageNotFound");
  }
};

const loadPageNotFound = async (req, res) => {
  try {
    res.render("pageNotFound");
  } catch (error) {
    console.log(error.message, "Error in load page not found");
    res.redirect("/pageNotFound")
  }
};


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(email, otp) {
  console.log(process.env.NODEMAILER_EMAIL,"env email");
  console.log(process.env.NODEMAILER_PASSWORD,"env email pass");

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

    const { name, email, mobile, password, referralCode } = req.body;

    const findUser = await User.findOne({ email });
    if (findUser) {
      const products = await Product.find({});
      return res.render("register", {
        message: "User with this email already exists",
        products: products,
      });
    }

    const otp = generateOtp();
    console.log(otp,"otp");
    const emailSent = await sendEmail(email, otp);
    console.log(emailSent,"emailsent");

    req.session.userOtp = otp;
    req.session.userData = { name, mobile, email, password, referralCode };
    res.render("otpVerification");
    console.log("Otp sent", otp);
  } catch (error) {
    console.error(error.message + " error in register");
    res.redirect("/pageNotFound");
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error(error.message + " error in securePassword");
    res.redirect("/pageNotFound");
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

      let referralAmount = 100;
      let referrer;
      let isVerifiedCode= false;
      if (user.referralCode) {
        referrer = await User.findOne({ referralCode: user.referralCode });
        if (referrer) {
          isVerifiedCode= true;
          referrer.wallet += referralAmount;
          referrer.walletHistory.push({
            type: "Credit",
            amount: referralAmount,
            description: `Referral bonus for referring ${user.name}`,
          });
          await referrer.save();
        }
      }

      const passwordHash = await securePassword(user.password);
      const saveUserData = new User({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        password: passwordHash,
        referredBy: referrer ? referrer._id : null,
        walletHistory: isVerifiedCode? [{
          type: "Credit",
          amount: referralAmount,
          description: `Referral bonus`
        }] : [],
        wallet: isVerifiedCode? referralAmount : 0,
      });
      await saveUserData.save();
      req.session.user = saveUserData._id;
      console.log(saveUserData);

      res.json({ success: true, redirectUrl: "/login" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again" });
    }
  } catch (error) {
    console.error(error.message + " error in verifyOtp");
    res.redirect("/pageNotFound");
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
      res.status(500).json({
        success: false,
        message: "Failed to resend OTP. Please try again later",
      });
    }
  } catch (error) {
    console.error(error.message + " error in resendOtp");
    res.redirect("/pageNotFound");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await User.findOne({ isAdmin: 0, email: email });

    if (!findUser) {
      return res.render("login", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("login", { message: "User is blocked by admin" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.render("login", { message: "Invalid Password" });
    }

    req.session.user = findUser._id;
    console.log("user", req.session.user)
    res.redirect("/");
  } catch (error) {
    console.error(error.message + " error in login");
    res.status(500).send("Login Failed. Please try again later");
  }
};

const logout = async (req, res) => {
  try {
    req.session.user = null;
    return res.redirect("/");
  } catch (error) {
    console.error(error.message + " error in logout");
    res.redirect("/pageNotFound");
  }
};

const loadProductPage = async (req, res) => {
  try {
    const productId = req.query.id;

    const product = await Product.findOne({ _id: productId}).populate("category")
    if(!product){
      return res.redirect("/pageNotFound")
    }
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
    res.redirect("/pageNotFound");
  }
};

const loadShop = async (req, res) => {
  try {
    const { categories, minPrice, maxPrice, outOfStock, sortby, page = 1, limit = 8 } = req.query;

     const currentPage = parseInt(page);
     const perPage = parseInt(limit);

    const categoryFilter = categories
      ? { _id: { $in: categories.split(",") } }
      : {};

    const priceFilter = {
      productPrice: {
        $gte: minPrice ? parseFloat(minPrice) : 0,
        $lte: maxPrice ? parseFloat(maxPrice) : Infinity,
      },
    };

    const stockFilter = outOfStock === "true" ? {} : { isListed: true };

    const category = await Category.find({});

    let products = await Product.find({
      ...priceFilter,
      ...stockFilter,
    }).populate({
      path: "category",
      match: { ...categoryFilter },
    })
    
    const filteredProducts = products.filter((product) => product.category);
    switch (sortby) {
      case "a-z":
        filteredProducts.sort((a, b) =>
          a.productName.localeCompare(b.productName)
        );
        break;
      case "z-a":
        filteredProducts.sort((a, b) =>
          b.productName.localeCompare(a.productName)
        );
        break;
      case "low-to-high":
        filteredProducts.sort((a, b) => a.offerPrice - b.offerPrice);
        break;
      case "high-to-low":
        filteredProducts.sort((a, b) => b.offerPrice - a.offerPrice);
        break;
      case "new-arrivals":
        filteredProducts.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "old-arrivals":
        filteredProducts.sort((a, b) => a.createdAt - b.createdAt);
        break;
      default:
        break;
    }

    const totalProducts = filteredProducts.length; 
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * perPage, currentPage * perPage);
    if (req.session.user) {
      const user = await User.findOne({ _id: req.session.user });
      res.render("shop", {
        user,
        categories: category,
        products: paginatedProducts,
        selectedCategories: categories ? categories.split(",") : [],
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        outOfStock: outOfStock || "false", 
        sortby: sortby,
        totalProducts,
      currentPage, 
      limit: perPage,
      });
    } else {
      res.render("shop", {
        categories: category,
        products: paginatedProducts,
        selectedCategories: categories ? categories.split(",") : [], 
        minPrice: minPrice || "", 
        maxPrice: maxPrice || "", 
        outOfStock: outOfStock || "false",
        sortby: sortby ,
        totalProducts, 
      currentPage,
      limit: perPage,
      });
    }
  } catch (error) {
    console.log(error.message, "Error in loadShop controller");
    res.redirect("/pageNotFound");
  }
};


const searchProducts = async (req, res) => {
  const query = req.query.q;
  try {
    const { categories, minPrice, maxPrice, outOfStock, sortby, page = 1, limit = 8 } = req.query;

    const currentPage = parseInt(page);
    const perPage = parseInt(limit);

    const category = await Category.find({});

    const products = await Product.find({
      $or: [
          { productName: { $regex: query, $options: 'i' } },
          { productDescription: { $regex: query, $options: 'i' } }
      ]
  });

    const totalProducts = products.length; 
    
    
      res.render('shop', { 
        categories: category,
        products: products,
        selectedCategories: categories ? categories.split(",") : [], 
        minPrice: minPrice || "", 
        maxPrice: maxPrice || "", 
        outOfStock: outOfStock || "false",
        sortby: sortby , 
        totalProducts, 
      currentPage,
      limit: perPage,
       }); 
  } catch (err) {
      console.log(err.message, "Error in search products");
      res.status(500).send("Internal server error");
  }
};


const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message, "Error in load login");
    res.redirect("/pageNotFound");
  }
};

const loadRegister = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message, "Error in load register");
    res.redirect("/pageNotFound");
  }
};

const loadForgotPassword = async (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    console.log(error.message, "Error in load forgot password");
    res.redirect("/pageNotFound");
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
    res.redirect("/pageNotFound");
  }
};

const loadOtpResetPassword = async (req, res) => {
  try {
    res.render("otpResetPassword");
  } catch (error) {
    console.log(error.message, "Error in load otp reset password");
    res.redirect("/pageNotFound");
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

      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }

      req.session.user = user._id;
      console.log("OTP verified for", user.email);

      res.json({ success: true, redirectUrl: "/resetPassword" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Please try again" });
    }
  } catch (error) {
    console.error(error.message + " error in otpResetPassword");
    res.redirect("/pageNotFound");
  }
};

const loadResetPassword = async (req, res) => {
  try {
    res.render("resetPassword");
  } catch (error) {
    console.log(error.message, "Error in load reset password");
    res.redirect("/pageNotFound");
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

    req.session.user = null;
    console.log("Session cleared");

    res.render("login", {
      message: "Password reset successfully. Please login",
    });
  } catch (error) {
    console.error(error.message + " Error in reset password");
    res.redirect("/pageNotFound");
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

    res.render("userProfile", {
      user: userData,
      addresses: addressData ? addressData.address : [],
    });
  } catch (error) {
    console.log(error.message, "Error in load user profile");
    res.redirect("/pageNotFound");
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
    res.redirect("/pageNotFound");
  }
};

const editProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
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
    res.redirect("/pageNotFound");
  }
};

const loadChangePassword = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    res.render("changePassword", { user: userData });
  } catch (error) {
    console.log(error.message, "Error in load change password");
    res.redirect("/pageNotFound");
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
        showAlert: true,
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
        success: true,
      });
    } else {
      return res.render("changePassword", {
        user: userData,
        message: "Incorrect old password",
        showAlert: true,
      });
    }
  } catch (error) {
    console.log(error.message, "Error in change password");
    return res.redirect("/pageNotFound");
  }
};

const loadAddAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findById(user);

    const addressData = await Address.findOne({ userId: user });

    res.render("addAddress", {
      user: userData,
      addresses: addressData ? addressData.address : [],
    });
  } catch (error) {
    console.log(error.message, "Error in load add address");
    res.redirect("/pageNotFound");
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
        email,
      };

      const addressDoc = await Address.findOne({ userId: user });
      if (addressDoc) {
        addressDoc.address.push(newAddress);
        await addressDoc.save();
      } else {
        const newAddressDoc = new Address({
          userId: user,
          address: [newAddress],
        });
        await newAddressDoc.save();
      }

      res.redirect("/userProfile");
      
    } else {
      res.render("login", { message: "User logged out" });
    }
  } catch (error) {
    console.log(error.message, "Error in add address");
    res.redirect("/pageNotFound");
  }
};

//

const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.query.id;
    const userId = req.session.user;

    const userAddress = await Address.findOne({ userId });

    if (!userId) {
      return res.render("login", { message: "User logged out" });
    }

    if (!userAddress) {
      return res.status(404).send("User not found");
    }

    const address = userAddress.address.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!address) {
      return res.status(404).send("Address not found");
    }

    res.render("editAddress", { address });
  } catch (error) {
    console.log(error.message, "Error in load edit address");
    res.redirect("/pageNotFound");
  }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.query.id;
    const {
      addressType,
      customAddressType,
      name,
      city,
      state,
      pincode,
      phone,
      email,
    } = req.body;

    console.log("Form data:", {
      addressType,
      customAddressType,
      name,
      city,
      state,
      pincode,
      phone,
      email,
    });
    console.log("Address ID:", addressId);

    const updatedAddressType =
      addressType === "Other" ? customAddressType : addressType;
    console.log("Updated Address Type:", updatedAddressType);

    const updateData = {
      "address.$.addressType": updatedAddressType,
      "address.$.name": name,
      "address.$.city": city,
      "address.$.state": state,
      "address.$.pincode": pincode,
      "address.$.phone": phone,
      "address.$.email": email,
    };

    const updatedAddress = await Address.findOneAndUpdate(
      { "address._id": addressId },
      { $set: updateData },
      { new: true }
    );

    console.log("Updated Address:", updatedAddress);

    if (!updatedAddress) {
      console.log(`No address found with ID: ${addressId}`);
      return res.status(404).render("editAddress", {
        address: req.body,
        errorMessage: "Address not found",
      });
    }

    res.render("editAddress", {
      address: req.body,
      successMessage: "Address updated successfully",
    });
  } catch (error) {
    console.log(error.message, "Error in updating address");
    res.status(500).render("editAddress", {
      address: req.body,
      errorMessage: "Internal server error",
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
      return res.status(404).send("Address not found");
    }

    res.redirect("/userProfile");
  } catch (error) {
    console.log(error.message, "Error in delete address");
    res.redirect("/pageNotFound");
  }
};

const loadWallet = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findById(user).select("wallet walletHistory name");
    userData.walletHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.render("myWallet", { user: userData });
  } catch (error) {
    console.error("Error in loadWallet:", error.message);
    res.redirect("/pageNotFound");
  }
};



module.exports = {
  loadhome,
  loadPageNotFound,
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  loadProductPage,
  loadShop,
  searchProducts,
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
  loadWallet
};
