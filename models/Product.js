const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true},
    description: { type: String, required: true, trim: true},
    new_price: { type: Number, required: true},
    old_price: { type: Number, required: true},
    discount_percentage: {type: Number, required: true, min: 0,},
    quantity: {type: Number, required: true},
    isInStock: {
      type: Boolean,
      default: function () {
        return this.quantity > 0;
      },
    },
    image1: { type: String, require: true},
    image2: { type: String, require: true},
    image3: { type: String, require: true},
    image4: { type: String, require: true},
    image5: { type: String, require: true},
    image6: { type: String, require: true}
  },
  { timestamps: true }
);


// Pre-save hook to update isInStock based on quantity
ProductSchema.pre("save", function (next) {
  this.isInStock = this.quantity > 0;
  next();
});


// Pre hook for update operations
ProductSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Check if 'quantity' is being updated
  if (update.quantity !== undefined || update.$set?.quantity !== undefined) {
    const newQuantity = update.quantity || update.$set.quantity;

    // Update isInStock based on the new quantity
    this.set({ isInStock: newQuantity > 0 });
  }
  next();
});

module.exports = mongoose.model("Product", ProductSchema);
