const multer = require('multer');
const path = require('path');

const storageProduct = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/productImages');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadProduct = multer({ storage: storageProduct });

const storageCategory = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/categoryImages');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadCategory = multer({ storage: storageCategory });

module.exports = {
    uploadProduct,
    uploadCategory
};