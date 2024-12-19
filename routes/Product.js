const Product = require("../models/Product");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    verifyToken,
    verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/products/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File Filter Setup
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer Configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB per file
});

router.post(
  '/add-product',
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
    { name: 'image5', maxCount: 1 },
    { name: 'image6', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const productData = {
        title: req.body.title,
        description: req.body.description,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
        discount_percentage: req.body.discount_percentage,
        quantity: req.body.quantity,
        image1: req.files.image1 ? '/uploads/products/' + req.files.image1[0].filename : null,
        image2: req.files.image2 ? '/uploads/products/' + req.files.image2[0].filename : null,
        image3: req.files.image3 ? '/uploads/products/' + req.files.image3[0].filename : null,
        image4: req.files.image4 ? '/uploads/products/' + req.files.image4[0].filename : null,
        image5: req.files.image5 ? '/uploads/products/' + req.files.image5[0].filename : null,
        image6: req.files.image6 ? '/uploads/products/' + req.files.image6[0].filename : null,
      };

      if (Object.values(productData).some((field, index) => index >= 6 && field === null)) {
        return res.status(400).json({ message: 'All 6 images must be provided.' });
      }

      const newProduct = new Product(productData);
      await newProduct.save();

      res.status(201).json({ message: 'Product added successfully!', product: newProduct });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading product', error: error.message });
    }
  }
);


//UPDATE
router.put("/:id" , async (req, res) => {
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
router.delete("/:id" , async (req, res) => {
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


router.get('/multiFilter', async (req, res) => {
  const { mois, jour, title, quantity, isInStock } = req.query;

  try {
    let query = {};

    // Date Filtering
    if (mois && jour) {
      const month = parseInt(mois);
      const day = parseInt(jour);

      if (!isNaN(month) && month >= 1 && month <= 12 && !isNaN(day) && day >= 1 && day <= 31) {
        const startDate = new Date();
        startDate.setMonth(month - 1);
        startDate.setDate(day);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        query.createdAt = { $gte: startDate, $lt: endDate };
      }
    } else if (mois) {
      const month = parseInt(mois);
      if (!isNaN(month) && month >= 1 && month <= 12) {
        const startDate = new Date();
        startDate.setMonth(month - 1, 1);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1, 1);
        endDate.setHours(0, 0, 0, -1);

        query.createdAt = { $gte: startDate, $lt: endDate };
      }
    } else if (jour) {
      const day = parseInt(jour);
      if (!isNaN(day) && day >= 1 && day <= 31) {
        const startDate = new Date();
        startDate.setDate(day);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        query.createdAt = { $gte: startDate, $lt: endDate };
      }
    }

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (isInStock !== undefined) {
      query.isInStock = isInStock === 'true';
    }

    if (quantity) {
      const parsedQuantity = parseInt(quantity);
      if (!isNaN(parsedQuantity)) {
        query.quantity = { $gte: parsedQuantity };
      }
    }

    const filteredProducts = await Product.find(query).sort({ createdAt: -1 });

    res.json(filteredProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
