const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required:true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Attente', 'Confirmé', 'Refusé', 'Retour', 'Livré'],
      default: 'Attente',
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientAddress: {
      type: String,
      required: true,
      trim: true,
    },
    clientVille: {
      type: String,
      required: true,
      trim: true,
    },
    clientPhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
  }, { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
