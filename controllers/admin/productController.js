const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const upload = require("../../middlewares/multer");

const productInfo = async (req, res) => {
  try {
      let search = req.query.search || "";
      let page = parseInt(req.query.page) || 1;
      const limit = 3;

      const productsData = await Product.find({
          $or: [
              { productName: { $regex: ".*" + search + ".*", $options: "i" } },
              { authorname: { $regex: ".*" + search + ".*", $options: "i" } },
              { 'category.name': { $regex: ".*" + search + ".*", $options: "i" } }
          ]
      })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("category")
      .exec();

      const count = await Product.countDocuments({
          $or: [
              { productName: { $regex: ".*" + search + ".*", $options: "i" } },
              { authorname: { $regex: ".*" + search + ".*", $options: "i" } },
              { 'category.name': { $regex: ".*" + search + ".*", $options: "i" } }
          ]
      });

      res.render("products", {
          data: productsData,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          limit: limit,
          search: search 
      });
  } catch (error) {
      console.log(error.message, "Error in product info");
      res.status(500).send("Internal server error");
  }
};

const getAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render("addProduct", { categories: categories });
  } catch (error) {
    console.log(error.message, "Error in get add product");
    res.status(500).send("Internal server error");
  }
};

const addProduct = async (req, res) => {
  try {
    console.log(req.body, "rtbu");
    console.log(req.files);
    const productData = {
      productName: req.body.productName,
      category: req.body.category,
      publishedYear: req.body.publishedYear,
      productDescription: req.body.productDescription,
      productPrice: req.body.productPrice,
      authorname: req.body.authorname,
      offerPrice: req.body.offerPrice,
      pageCount: req.body.pageCount,
      quantity: req.body.quantity,
      productImage: req.files.map((file) => file.filename), 
      status: req.body.status,
    };

    const newProduct = new Product(productData);
    await newProduct.save();
    res.redirect("/admin/products?success=true");
  } catch (error) {
    console.error(error.message, "Error in add product");
    res.redirect("/admin/products?success=false");
  }
};

const toggleProduct = async (req, res) => {
  try {
    let id = req.query.id;
    const product = await Product.findById({ _id: id });
    product.isListed = !product.isListed;
    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message, "Error in toggle product");
    res.status(500).send("Internal server error");
  }
};

const loadEditProduct = async (req, res) => {
  try {
    let id = req.query.id;
    const product = await Product.findOne({ _id: id }).populate("category");
    const categories = await Category.find({});
    console.log(product);
    
    res.render("editProduct", {
      product: product,
      categories: categories,
    });
  } catch (error) {
    console.log(error.message, "Error in edit product");
    res.status(500).send("Internal server error");
  }
};

const editProduct = async (req, res) => {
  console.log(req.body);
  try {
    let id = req.params.id;

    const product = await Product.findById(id);

    const removedImages = req.body.removedImages
      ? JSON.parse(req.body.removedImages)
      : [];

    let updatedImages = product.productImage.filter(
      (image) => !removedImages.includes(image)
    );

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      updatedImages = updatedImages.concat(newImages);
      console.log(newImages, "New images added");
    }

    const productData = {
      productName: req.body.productName,
      category: req.body.category,
      publishedYear: req.body.publishedYear,
      productDescription: req.body.productDescription,
      productPrice: req.body.productPrice,
      author: req.body.author,
      offerPrice: req.body.offerPrice,
      pageCount: req.body.pageCount,
      quantity: req.body.quantity,
      productImage: updatedImages,
      status: req.body.status,
    };

    await Product.updateOne({ _id: id }, { $set: productData });
    res.redirect("/admin/products?success=true");
  } catch (error) {
    console.error(error.message, "Error in add product");
    res.redirect("/admin/products?success=false");
  }
};

module.exports = {
  productInfo,
  addProduct,
  getAddProduct,
  toggleProduct,
  loadEditProduct,
  editProduct,
};
