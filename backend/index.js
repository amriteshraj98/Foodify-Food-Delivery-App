import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import userRouter from "./routes/user.routes.js";

import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket.js";

const app = express();
const server = http.createServer(app);

// yaha pe hum socket io ka instance create karenge jo ki http server ke sath jude ga taaki websocket connection ban sake 
const io = new Server(server, {
  cors: {
    origin: "https://foodify-food-delivery-app-1.onrender.com",
    credentials: true,
    methods: ["POST", "GET"],
  },
});

app.set("io", io); // taki hum is io instance ko kahi bhi use kar sake apne routes me

const port = process.env.PORT || 5000;
app.use(
  cors({
    // koon koon sa website hamare bakcend ki api ko access kar skta hai
    origin: "https://foodify-food-delivery-app-1.onrender.com", // frontend url
    credentials: true,
  })
);
app.use(express.json()); // jo bhi data aayega usko json me convert kar dega
app.use(cookieParser()); // cookie ko read karne ke liye
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

socketHandler(io);
server.listen(port, () => {
  connectDb();
  console.log(`server started at ${port}`);
});

