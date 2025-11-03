import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; // ye userId auth middleware se aa rahi hai
    if (!userId) {
      return res.status(400).json({ message: "userId is not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "user is not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `get current user error ${error}` });
  }
};

// ye user ki location update karega jab bhi user app open karega
// aur har 5 minute me bhi update karega
// taaki hume user ki current location pata chalti rahe
export const updateUserLocation = async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
      },
      { new: true }
    );
    if (!user) {
      return res.status(400).json({ message: "user is not found" });
    }

    return res.status(200).json({ message: "location updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `update location user error ${error}` });
  }
};
