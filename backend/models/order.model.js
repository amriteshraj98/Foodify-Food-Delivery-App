import mongoose from "mongoose";

const shopOrderItemSchema = new mongoose.Schema(
  {
    // order kiya hua item kaun sa hai
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    name: String,
    price: Number,
    quantity: Number,
  },
  { timestamps: true }
);

const shopOrderSchema = new mongoose.Schema(
  {
    //kis shop se order kiya hai kis shop ka name hai 
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    // shop ka owner kaun hai
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // ek particular shop ka total order kitna hai
    subtotal: Number,
    // ek shop ke andar kya kya items order kiye hain
    shopOrderItems: [shopOrderItemSchema],
    status: {
      type: String,
      enum: ["pending", "preparing", "out of delivery", "delivered"],
      default: "pending",
    },
    // ye batayega ki is shop order kisko assign kiya gya hai delivery ke liye
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAssignment",
      default: null,
    },
    // delivery  kis delivery boy ko kiya gya hai
    assignedDeliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deliveryOtp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },
    deliveryAddress: {
      text: String,
      latitude: Number,
      longitude: Number,
    },
    totalAmount: {
      type: Number,
    },
    // agar ek se zyada shops hain to unke orders ko alag alag rakhne ke liye array banaya user ek se zyada shops se order kar sakta hai 
    shopOrders: [shopOrderSchema],

    payment: {
      type: Boolean,
      default: false,
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
