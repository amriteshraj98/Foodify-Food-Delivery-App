import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
// ye function file ko cloudinary pe upload karega
const uploadOnCloudinary = async (file) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  try {
    // ye file ko cloudinary pe upload kar dega aur uska url return kar dega
    const result = await cloudinary.uploader.upload(file);
    fs.unlinkSync(file); // ye file ko local system se delete kar dega
    return result.secure_url; // ye url return kar dega
  } catch (error) {
    fs.unlinkSync(file);
    console.log(error);
  }
};

export default uploadOnCloudinary;
