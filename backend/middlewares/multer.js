import multer from "multer";
// ye middleware file upload karne ke liye use hota hai
// multer ek middleware hai jo ki file upload karne ke liye use hota hai
// multer ke andar storage ka option hota hai jisme hum file ko kaha store karna hai wo batate hai
const storage = multer.diskStorage({
  // ye file ko public folder me store karega
  destination: (req, file, cb) => {
    cb(null, "./public");
  },
  // ye file ka original name rakh dega
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
