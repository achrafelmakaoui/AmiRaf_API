const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true},
    description: { type: String, required: true, trim: true},
    new_price: { type: Number, required: true},
    old_price: { type: Number, required: true},
    discount_percentage: {type: Number, required: true, min: 0,},
    quantity: {type: Number, required: true, min: 1,},
    isInStock: {
      type: Boolean,
      default: function () {
        return this.quantity > 0;
      },
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 6;
        },
        message: 'You can only upload up to 6 images.',
      },
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Product", ProductSchema);
