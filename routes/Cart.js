const Client = require("../models/Product");
const {
    verifyToken,
    verifyTokenAdmin,
} = require("./verifyToken");

const router = require("express").Router();

// CREATE
router.post("/", async (req, res) => {
  const newClient = new Client(req.body);

  try {
    const savedClient = await newClient.save();
    res.status(200).json(savedClient);
  } catch (err) {
    res.status(500).json(err);
  }
});

//UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedClient);
  } catch (err) {
    res.status(500).json(err);
  }
});

//DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.status(200).json("Client has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET Client
router.get("/find/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    res.status(200).json(client);
  } catch (err) {
    res.status(500).json(err);
  }
});

//GET ALL Client
router.get("/", async (req, res) => {
  const query = req.query.new;
  try {
    const clients = query
      ? await Client.find().sort({ _id: -1 })
      : await Client.find();
    res.status(200).json(clients);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/search/", async (req, res) => {
  const sname = req.query.name;
  const stationInscription = req.query.stationInscription; 

  try {
    let Clients;
    if (sname && stationInscription) {
      const regex = new RegExp(sname, "i");
      Clients = await Client.find({nomComplet: regex, stationInscription: stationInscription});
    } else if (sname) {
      const regex = new RegExp(sname, "i");
      Clients = await Client.find({nomComplet: regex});
    }
    else {
      Clients = await Client.find();
    }
    res.status(200).json(Clients);
  } catch (err) {
    res.status(500).json(err);
  }
});


router.get('/multiFilter', async (req, res) => {
  const proprietaire = req.query.proprietaire; // 'oui' or 'non'
  const stationInscription = req.query.stationInscription; 
  const totalPoints = parseInt(req.query.totalPoints);
  const totalVisits = parseInt(req.query.freqVisiteParMois);

  try {
    let query = {}; // Empty query object to start with
    
    // Add proprietaire filter to the query if provided
    if (proprietaire !== undefined) {
      query.proprietaire = (proprietaire === 'oui'); // Convert 'oui' to true, 'non' to false
    }

    // Add stationInscription filter to the query if provided
    if (stationInscription) {
      query.stationInscription = stationInscription;
    }

    // Add totalPoints filter to the query if provided
    if (!isNaN(totalPoints)) {
      query.totalPoints = { $gte: totalPoints };
    }

    // Add totalVisits filter to the query if provided
    if (!isNaN(totalVisits)) {
      query.freqVisiteParMois = { $gte: totalVisits };
    }

    // Find clients based on the constructed query
    const filteredClients = await Client.find(query);

    res.json(filteredClients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
