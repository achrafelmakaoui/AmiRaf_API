const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    nomComplet: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
