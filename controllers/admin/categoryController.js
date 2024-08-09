const Category = require("../../models/categorySchema");



const categoryInfo = async(req,res)=>{
    try {
        const page= parseInt(req.query.page) || 1; 
        const limit = 4;
        const skip = (page-1)*limit;

        const categoryData = await Category.find({})
        .sort({createdAT:-1})
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories/limit);
        res.render("category",{
            data:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories
        })
        
    } catch (error) {
        console.log(error.message,"Error in category info");
        res.status(500).send("Internal server error")
    }
} 

const addCategory = async(req,res)=>{
    const {name,description} = req.body;
    try {
        const isExisting = await Category.findOne({name});
        if(isExisting){
            return res.status(400).json({error:"Category already exists"})
        }
        const newCategory = new Category({name,description});
        await newCategory.save();
        res.json({message:"Category added successfully"});
    } catch (error) {
        console.log(error.message,"Error in add category");
        res.status(500).send("Internal server error");
    }
}

module.exports = {
    categoryInfo,
    addCategory
}