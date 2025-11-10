import mongoose from "mongoose";

const deliveryAssignmentSchema = new mongoose.Schema(
  {
    //  kis order ke liye hai ye delivery bana hai 
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    //  kis shop ka order hai ye 
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    //   kis shop order(kadhai paneer) ke liye hai ye delivery 
    shopOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // kin kin delivery boys ko ye order bheja gya hai accept karne ke liye
    brodcastedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // kis delivery boy ko ye order assign kiya gya hai
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // delivery  ka kya status hai
    status: {
      type: String,
      enum: ["brodcasted", "assigned", "completed"],
      default: "brodcasted",
    },
    acceptedAt: Date,
  },
  { timestamps: true }
);

const DeliveryAssignment = mongoose.model(
  "DeliveryAssignment",
  deliveryAssignmentSchema
);
export default DeliveryAssignment;
