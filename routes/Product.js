const Product = require("../models/Product");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    verifyToken,
    verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();

//CREATE

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/products/';
    
    // Check if the directory exists, if not, create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir); // Store images in 'uploads/products' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate unique filename
  }
});

// Set up file filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create an upload middleware using Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { files: 6, fileSize: 10 * 1024 * 1024 } // Allow up to 6 files and limit file size to 10MB
});

// POST route to handle image uploads and product creation
router.post('/add-product', upload.array('images', 6), async (req, res) => {
  try {
    const imagePaths = req.files.map(file => '/uploads/products/' + file.filename); // Generate file paths
    const productData = {
      title: req.body.title,
      description: req.body.description,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      discount_percentage: req.body.discount_percentage,
      quantity: req.body.quantity,
      images: imagePaths, // Store the file paths
    };
    
    const newProduct = new Product(productData);
    await newProduct.save();
    
    res.status(201).json({ message: 'Product added successfully!', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading product', error: error.message });
  }
});

//UPDATE
router.put("/:id", verifyTokenAdmin, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/:id", verifyTokenAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Product has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET by id
router.get("/find/:id", async (req, res) => {
  try {
    const Shop = await Product.findById(req.params.id);
    res.status(200).json(Shop);
  } catch (err) {
    res.status(500).json(err);
  }
});


// //GET ALL
router.get("/", async (req, res) => {
  try {
    const Products = await Product.find();
    res.status(200).json(Products);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
