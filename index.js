const express = require("express");
const mongoose = require("mongoose");
const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const cartRoute = require("./routes/Cart");
const productRoute = require("./routes/Product");
const orderRoute = require("./routes/Order");
const dotenv = require("dotenv");
const path = require('path');
const cors = require("cors");
const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/',(req,res)=>{
  res.send("API WORKING !");
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connection Successfull!"))
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/cart", cartRoute);
app.use("/api/product", productRoute);
app.use("/api/order", orderRoute);


app.listen(process.env.PORT || 5000, () => {
  console.log("Backend Server Is Running!");
});
