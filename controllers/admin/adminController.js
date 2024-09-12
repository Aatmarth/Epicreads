const User= require("../../models/userSchema");
const mongoose= require("mongoose");
const bcrypt= require("bcrypt");

const loadLogin = async (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/login")
    }else{
        return res.render("adminLogin",{message:null})
    }
}

const login = async(req,res)=>{
    try {
        const {email, password} = req.body;
        const admin = await User.findOne({email,isAdmin:1});
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin = true;
                return res.redirect("/admin/")
            }else{
                console.log("not an admin")
                return res.redirect("/admin/login")
                
            }
        }else{
            console.log("admin entered wrong credentials");
            
            return res.redirect("/admin/login");
        }
    } catch (error) {
        console.log(error.message, "error in login")
        return res.redirect("/admin/login");
    }
}

const loadDashboard = async(req,res)=>{
  
        try {
            if(req.session.admin){
            res.render("dashboard");
        }else{
            return res.redirect("/admin/login")
        }
        } catch (error) {
            console.log(error.message, "error in dashboard")
            return res.redirect("/admin/login")
        }
   
}

const logout = async(req,res)=>{
    try {
        // req.session.destroy(err =>{
        //     if(err){
        //         console.log(error.message,"Error destroying session")
        //         res.status(500).send("Internal server error")
        //     }
           
        // })
        req.session.admin = false;
        req.session.destroy();
        res.redirect("/admin/login")
    } catch (error) {
        console.log(error.message,"Error in logout")
        res.status(500).send("Internal server error")
    }
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    logout
}

