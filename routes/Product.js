const Shoop = require("../models/Cart");
const Client = require("../models/Product");
const {
    verifyToken,
    verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();

//CREATE

router.post("/", async (req, res) => {
  const newShoop = new Shoop(req.body);

  try {
    const savedShoop = await newShoop.save();
    res.status(200).json(savedShoop);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updatedShoop = await Shoop.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedShoop);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Shoop.findByIdAndDelete(req.params.id);
    res.status(200).json("Shoop has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET Transaction by id
router.get("/find/:id", async (req, res) => {
  try {
    const Shop = await Shoop.findById(req.params.id);
    res.status(200).json(Shop);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET USER Shoop
router.get("/find/:ncarnet", async (req, res) => {
  try {
    const Shoop = await Shoop.findOne({ ncarnet: req.params.ncarnet });
    res.status(200).json(Shoop);
  } catch (err) {
    res.status(500).json(err);
  }
});

// //GET ALL

router.get("/", async (req, res) => {
  try {
    const Shoops = await Shoop.find();
    res.status(200).json(Shoops);
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

router.get("/search", async (req, res) => {
  const clientName = req.query.name;

  try {
    let Shops;
    if (clientName) {
      const regex = new RegExp(clientName, "i");
      Shops = await Shoop.find({nomComplet: regex});
    }
    else {
      Shops = await Shoop.find();
    }
    res.status(200).json(Shops);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/multiFilter', async (req, res) => {
  const { mois, jour, station, ncarnet, typeShoop } = req.query;

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
    if (typeShoop) {
      query.typeShoop = typeShoop;
    }
    // Find transactions based on the constructed query
    const filteredShoop = await Shoop.find(query);

    res.json(filteredShoop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
