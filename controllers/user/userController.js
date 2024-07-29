const loadhome= async(req,res)=>{
    try {
        res.render("homepage");
    } catch (error) {
        console.log(error.message+"home page not found");
        res.status(500).send("Server error")
    }
}

module.exports={
    loadhome
};