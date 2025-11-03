import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const createEditShop = async (req, res) => {
  try {
    const { name, city, state, address } = req.body;
    let image;
    if (req.file) {
      console.log(req.file);
      // upload image to cloudinary and get the url
      image = await uploadOnCloudinary(req.file.path);
    }
    // check if shop already exists for the user
    let shop = await Shop.findOne({ owner: req.userId });
    // if shop does not exist create a new shop else update the existing shop
    if (!shop) {
      shop = await Shop.create({
        name,
        city,
        state,
        address,
        image,
        owner: req.userId,
      });
    } else {
      shop = await Shop.findByIdAndUpdate(
        shop._id,
        {
          name,
          city,
          state,
          address,
          image,
          owner: req.userId,
        },
        { new: true }
      );
    }

    await shop.populate("owner items");
    return res.status(201).json(shop);
  } catch (error) {
    return res.status(500).json({ message: `create shop error ${error}` });
  }
};

export const getMyShop = async (req, res) => {
  try {
    // find shop of the user
    const shop = await Shop.findOne({ owner: req.userId })
      .populate("owner")
      .populate({
        path: "items",
        options: { sort: { updatedAt: -1 } },
      });
    if (!shop) {
      return null;
    }
    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({ message: `get my shop error ${error}` });
  }
};

export const getShopByCity = async (req, res) => {
  try {
    const { city } = req.params;

    // case insensitive search for city using regex 
    // for example if city is "New York" then it will match "new york", "NEW YORK", "NeW YoRk" etc.
    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${city}$`, "i") },
    }).populate("items");
    if (!shops) {
      return res.status(400).json({ message: "shops not found" });
    }
    return res.status(200).json(shops);
  } catch (error) {
    return res.status(500).json({ message: `get shop by city error ${error}` });
  }
};
