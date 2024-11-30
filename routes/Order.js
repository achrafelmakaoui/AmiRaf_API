const Order = require("../models/Order");

const {
    verifyToken,
    verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();



//CREATE

router.post("/", async (req, res) => {
  const { userId, items, clientName, clientAddress, clientVille, clientPhoneNumber } = req.body;

  try {
    // Calculate total price from items
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create new order
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
    res.status(201).json({ message: "Order created successfully", order: savedOrder });
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


//GET Order by id
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.productId", "title price");
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
    const orders = await Order.find({ userId: req.params.userId }).populate("items.productId", "title price");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user orders", error: err.message });
  }
});


// //GET ALL
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId", "title price");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

router.get("/status/:status", async (req, res) => {
  try {
    const orders = await Order.find({ status: req.params.status }).populate("items.productId", "title price");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders by status", error: err.message });
  }
});

router.get("/sales/total", async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $match: { status: "Livré" } }, // Only consider delivered orders
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.status(200).json({ totalSales: totalSales[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Error calculating total sales", error: err.message });
  }
});


// router.get("/search/", async (req, res) => {
//   const clientName = req.query.name;
//   const station = req.query.station; 

//   try {
//     let Orders;
//     if (clientName && station) {
//       const regex = new RegExp(clientName, "i");
//       Orders = await Order.find({nomComplet: regex, station:station});
//     } else if (clientName) {
//       const regex = new RegExp(clientName, "i");
//       Orders = await Order.find({nomComplet: regex});
//     }
//     else {
//       Orders = await Order.find();
//     }
//     res.status(200).json(Orders);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });


// router.get('/multiFilter', async (req, res) => {
//   const { mois, jour, station, ncarnet, status } = req.query;

//   try {
//     let query = {}; // Empty query object to start with

//     // Add combined date filter (month and day) to the query if both are provided
//     if (mois && jour) {
//       const month = parseInt(mois);
//       const day = parseInt(jour);

//       if (!isNaN(month) && month >= 1 && month <= 12 && !isNaN(day) && day >= 1 && day <= 31) {
//         const startDate = new Date();
//         startDate.setMonth(month - 1);
//         startDate.setDate(day);
//         startDate.setHours(0, 0, 0, 0);

//         const endDate = new Date(startDate);
//         endDate.setHours(23, 59, 59, 999);

//         query.createdAt = { $gte: startDate, $lt: endDate };
//       }
//     } else if (mois) {
//       // Add month filter to the query if only month is provided
//       const month = parseInt(mois);
//       if (!isNaN(month) && month >= 1 && month <= 12) {
//         const startDate = new Date();
//         startDate.setMonth(month - 1, 1);
//         startDate.setHours(0, 0, 0, 0);

//         const endDate = new Date(startDate);
//         endDate.setMonth(startDate.getMonth() + 1, 1);
//         endDate.setHours(0, 0, 0, -1);

//         query.createdAt = { $gte: startDate, $lt: endDate };
//       }
//     } else if (jour) {
//       // Add day filter to the query if only day is provided
//       const day = parseInt(jour);
//       if (!isNaN(day) && day >= 1 && day <= 31) {
//         const startDate = new Date();
//         startDate.setDate(day);
//         startDate.setHours(0, 0, 0, 0);

//         const endDate = new Date(startDate);
//         endDate.setHours(23, 59, 59, 999);

//         query.createdAt = { $gte: startDate, $lt: endDate };
//       }
//     }

//     // Add station filter to the query if provided
//     if (station) {
//       query.station = station;
//     }
//     if (ncarnet) {
//       query.ncarnet = ncarnet;
//     }
//     if (status) {
//       query.status = status;
//     }
//     // Find Orders based on the constructed query
//     const filteredOrders = await Order.find(query);

//     res.json(filteredOrders);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });

module.exports = router;
