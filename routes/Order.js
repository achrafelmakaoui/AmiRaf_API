const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const axios = require("axios");

const {
    verifyToken,
    verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();

const sendTelegramNotification = async (orderDetails) => {
  const TELEGRAM_TOKEN = "7685966625:AAEEAmiXO9YpR-yYjWA_SjwXnI9tP3xn63U";
  const CHAT_IDS = ["1428501522", "645993473"]; // Replace with your chat IDs

  // Format product details by looping through items
  const productDetails = orderDetails.items
    .map((item, index) => 
      `🔹 *Product ${index + 1}:* ID: ${item.productId}, Quantity: ${item.quantity}, Price: ${item.price} DH`
    )
    .join("\n");

  // Build the message
  const message = `
📦 *New Order Received!*

👤 *Customer:* ${orderDetails.clientName}
📍 *Address:* ${orderDetails.clientAddress}, ${orderDetails.clientVille}
📞 *Phone:* ${orderDetails.clientPhoneNumber}
💰 *Total Price:* ${orderDetails.totalPrice} DH
🛒 *Order Details:*
${productDetails}

📅 *Order Date:* ${new Date().toLocaleString()}
`;

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    // Loop through each chat ID and send the notification
    for (let chatId of CHAT_IDS) {
      await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown", // For bold and formatted text
      });
    }

    console.log("Notification sent successfully.");
  } catch (error) {
    console.error("Error sending notification:", error.response?.data || error.message);
  }
};

//CREATE

router.post("/", async (req, res) => {
  const { userId, items, clientName, clientAddress, clientVille, clientPhoneNumber } = req.body;

  try {
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder = new Order({
      userId,
      items,
      totalPrice,
      clientName,
      clientAddress,
      clientVille,
      clientPhoneNumber,
    });

    const savedOrder = await newOrder.save();

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.title}`,
        });
      }

      product.quantity -= item.quantity;

      product.isInStock = product.quantity > 0;

      await product.save();
    }

    const deletedCart = await Cart.findOneAndDelete({ userId });

    if (!deletedCart) {
      return res.status(404).json({
        message: "Order created, but no cart was found to delete for this user",
        order: savedOrder,
      });
    }

    // Send Telegram Notification
    await sendTelegramNotification({
      clientName: savedOrder.clientName,
      clientAddress: savedOrder.clientAddress,
      clientVille: savedOrder.clientVille,
      clientPhoneNumber: savedOrder.clientPhoneNumber,
      totalPrice: savedOrder.totalPrice,
      items: savedOrder.items,
    });

    res.status(201).json({
      message: "Order created successfully, product quantities updated, and cart deleted",
      order: savedOrder,
    });
  } catch (err) {
    res.status(500).json({ message: "Error creating order", error: err.message });
  }
});


//UPDATE
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Error updating order status", error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order updated successfully", order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: "Error updating order", error: err.message });
  }
});

router.put("/orders/:orderId/:itemId", async (req, res) => {
  const { orderId, itemId } = req.params;
  const {
    quantity,
    status,
    clientName,
    clientAddress,
    clientVille,
    clientPhoneNumber,
  } = req.body;

  try {
    // Check if at least one field is provided for update
    if (
      !quantity &&
      !status &&
      !clientName &&
      !clientAddress &&
      !clientVille &&
      !clientPhoneNumber
    ) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    // Find the order by orderId
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Find the specific item in the items array
    const itemToUpdate = order.items.id(itemId);
    if (!itemToUpdate) {
      return res.status(404).json({ message: "Item not found in the order." });
    }

    // Update the specific item in the items array
    if (quantity) itemToUpdate.quantity = quantity;
    if (status) itemToUpdate.status = status;

    // Update main order fields if provided
    if (clientName) order.clientName = clientName;
    if (clientAddress) order.clientAddress = clientAddress;
    if (clientVille) order.clientVille = clientVille;
    if (clientPhoneNumber) order.clientPhoneNumber = clientPhoneNumber;

    // Save the updated order document
    await order.save();

    res.status(200).json({
      message: "Order updated successfully.",
      updatedOrder: order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

//DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully", order: deletedOrder });
  } catch (err) {
    res.status(500).json({ message: "Error deleting order", error: err.message });
  }
});

router.delete("/orders/:orderId/:itemId", async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    // Step 1: Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid orderId or itemId" });
    }

    // Step 2: Remove the specified item from the 'items' array
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $pull: { items: { _id: itemId } } }, // Remove the specific item
      { new: true } // Return the updated document
    ).populate("items.productId", "title new_price image1");

    // Step 3: Check if the order exists
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Step 4: Check if 'items' array is empty after the update
    if (updatedOrder.items.length === 0) {
      // If items array is empty, delete the entire order document
      await Order.findByIdAndDelete(orderId);
      return res.status(200).json({ message: "Order deleted because it has no more items" });
    }

    // Step 5: Return the updated order if items remain
    return res.status(200).json({
      message: "Item deleted successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ message: "Error deleting item", error: error.message });
  }
});

router.get("/top-selling-products", async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$items" }, // Flatten the items array
      { $match: { "items.status": "LVR" } }, // Only include items with status 'LVR'
      {
        $group: {
          _id: "$items.productId", // Group by productId
          totalQuantity: { $sum: "$items.quantity" }, // Sum up quantities
        },
      },
      {
        $lookup: {
          from: "products", // Lookup product details from the 'products' collection
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productTitle: "$productDetails.title",
          totalQuantity: 1,
        },
      },
      { $sort: { totalQuantity: -1 } }, // Sort by totalQuantity descending
    ]);

    res.status(200).json(topProducts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching top products", error });
  }
});
router.get("/sales-over-time", async (req, res) => {
  try {
    const salesData = await Order.aggregate([
      { $unwind: "$items" }, // Flatten the items array
      { $match: { "items.status": "LVR" } }, // Only consider delivered orders
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }, // Group by day
          },
          totalSales: { $sum: "$totalPrice" }, // Sum totalPrice for each day
        },
      },
      { $sort: { _id: 1 } }, // Sort by date ascending
      {
        $project: {
          date: "$_id",
          totalSales: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json(salesData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sales data", error });
  }
});

router.get("/status-distribution", async (req, res) => {
  try {
    const statusDistribution = await Order.aggregate([
      { $unwind: "$items" }, // Flatten the items array
      {
        $group: {
          _id: "$items.status", // Group by status
          count: { $sum: 1 }, // Count the number of orders for each status
        },
      },
      {
        $project: {
          status: "$_id", // Rename _id to status
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json(statusDistribution);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order status distribution", error });
  }
});

router.get('/total-sales-revenue', async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      {
        $unwind: "$items", // Unwind the items array to work with individual products
      },
      {
        $match: { "items.status": "LVR" }, // Filter only delivered orders
      },
      {
        $group: {
          _id: null, // We don't need to group by anything
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }, // Multiply price by quantity and sum
        },
      },
    ]);

    // If no result is found, return 0
    const total = totalRevenue.length ? totalRevenue[0].totalRevenue : 0;
    res.json({ totalSalesRevenue: total });
  } catch (error) {
    console.error("Error calculating total sales revenue:", error);
    res.status(500).json({ message: "Error fetching total sales revenue" });
  }
});

//GET Order by id
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId", "title new_price images");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order", error: err.message });
  }
});

//GET USER OrderS
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).populate("items.productId", "title new_price images");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user orders", error: err.message });
  }
});


// //GET ALL
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId", "title new_price image1");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

router.get("/orders/filter", async (req, res) => {
  try {
    const { mois, jour, clientPhoneNumber, status, productId } = req.query;

    const filter = {};

    // Date filtering logic
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

        filter.createdAt = { $gte: startDate, $lt: endDate };
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

        filter.createdAt = { $gte: startDate, $lt: endDate };
      }
    } else if (jour) {
      const day = parseInt(jour);
      if (!isNaN(day) && day >= 1 && day <= 31) {
        const startDate = new Date();
        startDate.setDate(day);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);

        filter.createdAt = { $gte: startDate, $lt: endDate };
      }
    }

    if (clientPhoneNumber) {
      filter.clientPhoneNumber = clientPhoneNumber;
    }

    // Retrieve orders without deep filtering yet
    let orders = await Order.find(filter).sort({ createdAt: -1 }).populate("items.productId", "title new_price image1");

    // Post-process orders to filter specific items
    if (status || productId) {
      orders = orders.map((order) => {
        const filteredItems = order.items.filter((item) => {
          let matchesStatus = true;
          let matchesProductId = true;

          if (status) {
            matchesStatus = item.status === status;
          }

          if (productId) {
            matchesProductId =
              item.productId &&
              item.productId._id.toString() === productId;
          }

          return matchesStatus && matchesProductId;
        });

        return { ...order._doc, items: filteredItems };
      });

      // Remove orders with no matching items
      orders = orders.filter((order) => order.items.length > 0);
    }

    return res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});

router.get("/orders/:orderId/:itemId", async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    // Validate orderId and itemId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId format" });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId format" });
    }

    // Query to find the order by orderId and filter for specific item in the items array
    const order = await Order.findOne(
      {
        _id: orderId,
        "items._id": itemId, // Filter for the specific item
      },
      {
        items: { $elemMatch: { _id: itemId } }, // Project only the matching item
        clientName: 1,
        clientAddress: 1,
        clientVille: 1,
        clientPhoneNumber: 1,
      }
    ).populate("items.productId", "title image1");

    // Check if no order was found
    if (!order) {
      return res
        .status(404)
        .json({ message: "No order found for this orderId and itemId" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
});





module.exports = router;
