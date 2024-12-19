const Cart = require("../models/Cart");
const Product = require("../models/Product");
const {
    verifyToken,
    verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();

// CREATE
router.post('/', async (req, res) => {
  const { userId, items } = req.body;

  try {
    const product = await Product.findById(items[0].productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Existing cart logic
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId: items[0].productId, quantity: items[0].quantity }],
      });
    } else {
      const existingProduct = cart.items.find(item => item.productId.toString() === items[0].productId);

      if (existingProduct) {
        existingProduct.quantity += items[0].quantity;
      } else {
        cart.items.push({ productId: items[0].productId, quantity: items[0].quantity });
      }
    }

    await cart.save();

    res.status(200).json({ message: 'Product added to cart successfully', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

//UPDATE
router.put('/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body; // New quantity passed in the request body

  if (quantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than 0' });
  }

  try {
    // Find the cart for the user
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find the product in the cart
    const product = cart.items.find(item => item.productId.toString() === productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    // Update the quantity of the product
    product.quantity = quantity;

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: 'Quantity updated successfully', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating quantity', error: err.message });
  }
});


// DELETE
// DELETE
router.delete('/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params;

  try {
    // Find the cart by userId
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found', items: [] }); // Return empty items array
    }

    // Find the index of the product to remove
    const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart', items: cart.items });
    }

    // Remove the product from the cart
    cart.items.splice(productIndex, 1);

    // If the cart is empty, delete the cart
    if (cart.items.length === 0) {
      await Cart.deleteOne({ _id: cart._id }); // Delete the entire cart
      return res.status(200).json({ message: 'Cart is now empty and has been deleted', items: [] }); // Send empty items
    }

    // Otherwise, save the updated cart
    await cart.save();

    res.status(200).json({ message: 'Product removed from cart', items: cart.items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting product from cart', error: error.message });
  }
});


//GET Cart
router.get("/find/:userId", async (req, res) => {
  try {
    const Cart = await Cart.findById(req.params.userId);
    res.status(200).json(Cart);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL Cart
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId })
      .populate({
        path: 'items.productId',
        select: 'new_price image1 title old_price quantity isInStock',
      });

    if (!cart) {
      // Return an empty cart structure if not found
      return res.status(200).json({
        items: [],
        totalPrice: 0,
      });
    }

    // Calculate total price
    cart.totalPrice = cart.items.reduce((total, item) => {
      const product = item.productId;
      return total + product.new_price * item.quantity;
    }, 0);

    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
