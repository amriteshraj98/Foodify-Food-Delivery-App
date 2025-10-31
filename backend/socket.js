import User from "./models/user.model.js";

export const socketHandler = (io) => {
  // jab bhi koi naya client connect hoga toh ye function chalega aur uske andar ka code chalega
  io.on("connection", (socket) => {
    console.log(socket.id);
    // jab bhi koi naya client connect hoga toh uska socket id mil jayega aur fir hum usko database me store kar denge taaki baad me usko identify kar sake
    // aur jab bhi client disconnect hoga toh uska socket id null kar denge taaki pata chal jaye ki wo offline hai
    socket.on("identity", async ({ userId }) => {
      try {
        const user = await User.findByIdAndUpdate(
          userId,
          {
            socketId: socket.id,
            isOnline: true,
          },
          { new: true }
        );
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("updateLocation", async ({ latitude, longitude, userId }) => {
      try {
        // user ka location update kar denge
        // aur saath me isOnline ko true kar denge taaki pata chal jaye ki user online hai
        // aur socketId ko bhi update kar denge taaki pata chal jaye ki user kaunse socket se connected hai
        const user = await User.findByIdAndUpdate(userId, {
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          isOnline: true,
          socketId: socket.id,
        });

        // agar user mila toh deliveryLocation update karenge jo user ko dikhegi map me 
        if (user) {
          io.emit("updateDeliveryLocation", {
            deliveryBoyId: userId,
            latitude,
            longitude,
          });
        }
      } catch (error) {
        console.log("updateDeliveryLocation error");
      }
    });

    // jab bhi koi client disconnect hoga toh  uska socket id null kar denge taaki pata chal jaye ki wo offline hai
    socket.on("disconnect", async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          {
            socketId: null,
            isOnline: false,
          }
        );
      } catch (error) {
        console.log(error);
      }
    });
  });
};
