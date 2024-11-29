const Transaction = require("../models/Order");
const Client = require("../models/Product");
const {
    verifyToken,
    verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();



//CREATE

router.post("/", async (req, res) => {
  const newTransaction = new Transaction(req.body);

  try {
    const savedTransaction = await newTransaction.save();
    res.status(200).json(savedTransaction);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id",  async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedTransaction);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/:id",  async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.status(200).json("Transaction has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET Transaction by id
router.get("/find/:id", async (req, res) => {
  try {
    const Transactions = await Transaction.findById(req.params.id);
    res.status(200).json(Transactions);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET USER TransactionS
router.get("/find/:ncarnet", async (req, res) => {
  try {
    const Transactions = await Transaction.find({ ncarnet: req.params.ncarnet });
    res.status(200).json(Transactions);
  } catch (err) {
    res.status(500).json(err);
  }
});

// //GET ALL
router.get("/", async (req, res) => {
  try {
    const Transactions = await Transaction.find();
    res.status(200).json(Transactions);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/search/", async (req, res) => {
  const clientName = req.query.name;
  const station = req.query.station; 

  try {
    let transactions;
    if (clientName && station) {
      const regex = new RegExp(clientName, "i");
      transactions = await Transaction.find({nomComplet: regex, station:station});
    } else if (clientName) {
      const regex = new RegExp(clientName, "i");
      transactions = await Transaction.find({nomComplet: regex});
    }
    else {
      transactions = await Transaction.find();
    }
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/clients/:ncarnet", async (req, res) => {
  try {
    const client = await Client.findOne({ ncarnet: req.params.ncarnet });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json({ nomComplet: client.nomComplet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/multiFilter', async (req, res) => {
  const { mois, jour, station, ncarnet, status } = req.query;

  try {
    let query = {}; // Empty query object to start with

    // Add combined date filter (month and day) to the query if both are provided
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
      // Add month filter to the query if only month is provided
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
      // Add day filter to the query if only day is provided
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

    // Add station filter to the query if provided
    if (station) {
      query.station = station;
    }
    if (ncarnet) {
      query.ncarnet = ncarnet;
    }
    if (status) {
      query.status = status;
    }
    // Find transactions based on the constructed query
    const filteredTransactions = await Transaction.find(query);

    res.json(filteredTransactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
