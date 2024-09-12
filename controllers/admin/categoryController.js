const Category = require("../../models/categorySchema");
const { findById } = require("../../models/userSchema");



const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        const query = searchQuery
            ? { name: { $regex: searchQuery, $options: 'i' } }
            : {};

        const categoryData = await Category.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments(query);
        const totalPages = Math.ceil(totalCategories / limit);

        res.render("category", {
            data: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
            searchQuery: searchQuery 
        });

    } catch (error) {
        console.log(error.message, "Error in category info");
        res.status(500).send("Internal server error");
    }
};

const addCategory = async(req,res)=>{
    console.log(req.body);
    console.log(req.file);
    

    const categoryData = {
        name: req.body.name,
        description:req.body.description,
        categoryImage: req.file ? req.file.filename : null
    }
    console.log(categoryData);
    
    try {
        const isExisting = await Category.findOne({name: categoryData.name});
        if(isExisting){
            return res.status(400).json({error:"Category already exists"});
        }
        const newCategory = new Category(categoryData);
        await newCategory.save();
        res.json({message:"Category added successfully"});
    } catch (error) {
        console.log(error.message,"Error in addCategory");
        res.status(500).send("Internal server error");
    }
}

const toggleCategory = async(req,res)=>{
    try {
        let id = req.query.id;
        const category = await Category.findById({_id: id})
        console.log(category);
        
        category.isListed = !category.isListed;
        await category.save();
        res.redirect("/admin/categories")
    } catch (error) {
        console.log(error.message,"Error in toListCategory");
        res.status(500).send("Internal server error");
    }
}

const loadEditCategory = async(req,res)=>{
    try {
        let id = req.query.id;
        const category = await Category.findOne({_id: id});
        res.render("editCategory", { category: category });
    } catch (error) {
        console.log(error.message, "Error in editCategory");
        res.status(500).send("Internal server error");
    }
}

const editCategory = async(req, res)=>{
    try {
        let id = req.params.id;

        // Convert the category name to lowercase for case-insensitive check
        const newName = req.body.name.trim().toLowerCase();

        const categoryData = {
            name: req.body.name.trim(),
            description: req.body.description.trim(),
        }

        if (req.file) {
            categoryData.categoryImage = req.file.filename;
        }

        // Check if the category name already exists (case-insensitive)
        const isExisting = await Category.findOne({
            name: new RegExp(`^${newName}$`, 'i'),
            _id: { $ne: id } // Exclude current category ID from the check
        });

        if (isExisting) {
            return res.status(400).json({ error: "Category already exists" });
        }

        // If no new image is uploaded, retain the existing image
        if (!req.file) {
            const existingCategory = await Category.findById(id);
            if (existingCategory && existingCategory.categoryImage) {
                categoryData.categoryImage = existingCategory.categoryImage;
            }
        }

        await Category.updateOne({ _id: id }, { $set: categoryData });

        res.status(200).json({ message: "Category updated successfully" });
    } catch (error) {
        console.log(error.message, "Error in editCategory");
        res.status(500).send("Internal server error");
    }
}



module.exports = {
    categoryInfo,
    addCategory,
    toggleCategory,
    loadEditCategory,
    editCategory
}