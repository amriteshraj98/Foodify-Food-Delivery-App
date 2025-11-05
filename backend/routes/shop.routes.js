import express from "express";
import {
  createEditShop,
  getMyShop,
  getShopByCity,
} from "../controllers/shop.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const shopRouter = express.Router();

// create or edit shop details and image multer se image upload krna hoga toh upload.single("image") use krna hoga yaha usse pehle isAuth lagana hoga taki sirf authenticated user hi apni shop create ya edit kr ske
shopRouter.post("/create-edit", isAuth, upload.single("image"), createEditShop);
shopRouter.get("/get-my", isAuth, getMyShop);
shopRouter.get("/get-by-city/:city", isAuth, getShopByCity);

export default shopRouter;
