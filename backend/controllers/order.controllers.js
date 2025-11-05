import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import { sendDeliveryOtpMail } from "../utils/mail.js";
import RazorPay from "razorpay";
import dotenv from "dotenv";
import { count } from "console";

dotenv.config();
let instance = new RazorPay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;
    if (cartItems.length == 0 || !cartItems) {
      return res.status(400).json({ message: "cart is empty" });
    }
    if (
      !deliveryAddress.text ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      return res.status(400).json({ message: "send complete deliveryAddress" });
    }

    const groupItemsByShop = {};
    // cartItems me jo bhi item hai unko shop ke hisab se group kar denge
    // jaise ki ek shop se 3 item hain to wo ek array me aa jayenge aur dusre shop ke item dusre array me
    // iss tarah se hume pata chal jayega ki kis shop se kya kya order kiya hai
    cartItems.forEach((item) => {
      const shopId = item.shop; // item ke andar shop ka id hoga
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = [];
      }
      groupItemsByShop[shopId].push(item); // dominios se pizza, burger, coke
      // mcdonalds se fries, coke
    });

    // ab hume har shop ke liye ek shopOrder create karna hai jisme us shop ke items honge
    // aur us shopOrder ko hum order ke andar shopOrders array me push kar denge
    // shopOrder me hume shop ka id, owner ka id, subtotal, shopOrderItems chahiye
    // shopOrderItems me hume item ka id, price, quantity chahiye
    // subtotal me hume us shop ke jitne bhi items hain unka price*quantity ka total nikalna hai
    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");
        if (!shop) {
          return res.status(400).json({ message: "shop not found" });
        }
        // ab hume us shop ke items chahiye jo ki groupItemsByShop me hain
        const items = groupItemsByShop[shopId];
        // fir un items ka subtotal nikal lenge
        const subtotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0
        );
        // fir shopOrder return kar denge jisme shop, owner, subtotal, shopOrderItems honge
        // shopOrderItems me hume item ka id, price, quantity chahiye jo ki items me se nikal lenge
        // aur item ka name bhi chahiye hume taaki delivery boy ko pata chale ki kya item hai
        // isliye items me se name bhi le aayenge
        return {
          shop: shop._id,
          owner: shop.owner._id,
          subtotal,
          shopOrderItems: items.map((i) => ({
            item: i.id,
            price: i.price,
            quantity: i.quantity,
            name: i.name,
          })),
        };
      })
    );

    if (paymentMethod == "online") {
      // order is created
      const razorOrder = await instance.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });
      const newOrder = await Order.create({
        user: req.userId, // ye user id auth middleware se aa rahi hai
        paymentMethod,
        deliveryAddress,
        totalAmount,
        shopOrders,
        razorpayOrderId: razorOrder.id,
        payment: false,
      });

      return res.status(200).json({
        razorOrder,
        orderId: newOrder._id,
      });
    }

    const newOrder = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
    });

    await newOrder.populate(
      "shopOrders.shopOrderItems.item",
      "name image price"
    );
    await newOrder.populate("shopOrders.shop", "name");
    await newOrder.populate("shopOrders.owner", "name socketId");
    await newOrder.populate("user", "name email mobile");

    // yaha pe hum socket io ka instance le rahe hain req.app.get("io") se jo ki humne index.js me set kiya hai
    const io = req.app.get("io");

    // ab hum har shopOrder ke owner ko notify karenge ki uske shop me naya order aaya hai taaki wo apne dashboard me dekh sake in real time without refreshing the page
    if (io) {
      // maan lo dominios se pizza order hua or
      // burger king se burger order hua
      // toh yaha kya ho rha ? ham har shopOrder ke liye owner ko socketId bhejenge
      newOrder.shopOrders.forEach((shopOrder) => {
        const ownerSocketId = shopOrder.owner.socketId;
        if (ownerSocketId) {
          // yaha event bhej rhe hai io.to se kisi specific ko event bhej skte hai
          // .emit me dete hai "event name" , data aur isko listen karenge frontend me
          // yaha ham owner ka socket id leke usko detail bhej rhe hai
          io.to(ownerSocketId).emit("newOrder", {
            _id: newOrder._id,
            paymentMethod: newOrder.paymentMethod,
            user: newOrder.user,
            shopOrders: shopOrder,
            createdAt: newOrder.createdAt,
            deliveryAddress: newOrder.deliveryAddress,
            payment: newOrder.payment,
          });
        }
      });
    }

    return res.status(201).json(newOrder);
  } catch (error) {
    return res.status(500).json({ message: `place order error ${error}` });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, orderId } = req.body;
    // iss razorpay_payment_id se hume payment verify karna hai ki payment sahi me hua hai ya nahi , aur aab iss payment me store hoga -> kya payment hua hai ya nahi , kya status hai , etc
    const payment = await instance.payments.fetch(razorpay_payment_id);
    if (!payment || payment.status != "captured") {
      return res.status(400).json({ message: "payment not captured" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({ message: "order not found" });
    }

    order.payment = true;
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    await order.populate("shopOrders.shopOrderItems.item", "name image price");
    await order.populate("shopOrders.shop", "name");
    await order.populate("shopOrders.owner", "name socketId");
    await order.populate("user", "name email mobile");

    const io = req.app.get("io");

    if (io) {
      order.shopOrders.forEach((shopOrder) => {
        const ownerSocketId = shopOrder.owner.socketId;
        if (ownerSocketId) {
          io.to(ownerSocketId).emit("newOrder", {
            _id: order._id,
            paymentMethod: order.paymentMethod,
            user: order.user,
            shopOrders: shopOrder,
            createdAt: order.createdAt,
            deliveryAddress: order.deliveryAddress,
            payment: order.payment,
          });
        }
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: `verify payment  error ${error}` });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    // pahle user ko find karenge uske id se jo auth middleware se aa rahi hai
    // fir uske role ke hisab se orders nikalenge
    // agar user ka role user hai to uske orders nikalenge jisme user id uski ho
    // agar user ka role owner hai to uske shop ke orders nikalenge jisme shopOrders me owner ki id uski ho
    // dono case me orders ko populate kar denge taaki hume shop ka name, items ka name, price, image, user ka name, email, mobile mil jaye

    const user = await User.findById(req.userId);
    if (user.role == "user") {
      const orders = await Order.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price");

      return res.status(200).json(orders);
    } else if (user.role == "owner") {
      // owner ke liye orders nikalenge jisme shopOrders me owner ki id uski ho
      const orders = await Order.find({ "shopOrders.owner": req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("user")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

      const filteredOrders = orders.map((order) => ({
        _id: order._id,
        paymentMethod: order.paymentMethod,
        user: order.user, // order karne wala user
        // har order me se wo shopOrder nikal lenge jiska owner ki id req.userId ke barabar ho usko return kar denge taaki owner ko sirf apne shop ke orders hi dikhen
        shopOrders: order.shopOrders.find((o) => o.owner._id == req.userId),
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
        payment: order.payment,
      }));
      console.log(filteredOrders);
      return res.status(200).json(filteredOrders);
    }
  } catch (error) {
    return res.status(500).json({ message: `get User order error ${error}` });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);

    // aab hame order se shopOrder nikalana hai aur uska status update karna hai
    // order me shopOrders hai unme hame find karna hai ye jo shopId hai or iss shopOrders ki Id hai agar ye barabar hai to usi shopOrder ka status update kar dena hai
    // shopOrder is basically item ka order hai ek specific shop se jo order me shopOrders array me hota hai jaise gupta shop se kadhai paneer order kiya hai to wo ek shopOrder hoga jisme gupta shop ka id hoga aur usme kadhai paneer ka item hoga
    // frontend se hame orderId, shopId aur status mil raha hai jo update karna hai
    const shopOrder = order.shopOrders.find((o) => o.shop == shopId); // jo shopOrder update karna hai wo mil jayega
    console.log(`shop order is :~`, shopOrder);
    if (!shopOrder) {
      return res.status(400).json({ message: "shop order not found" });
    }
    shopOrder.status = status;
    // agar status out for delivery hua and agar shopOrder ka koi deliveryAssignment nhi hai  to hum nearby delivery boys find karenge jo ki available honge aur unko ye order brodcast kar denge taaki wo accept kar saken
    let deliveryBoysPayload = [];
    if (status == "out of delivery" && !shopOrder.assignment) {
      // step 1 : order ka delivery address le lenge 
      const { longitude, latitude } = order.deliveryAddress;
      const nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
        location: {
          // yaha ham geospatial query use kar rahe hain taaki hume 10km ke andar ke delivery boys mil jayein
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
            },
            $maxDistance: 10000,
          },
        },
      });
      // aab ham aaise delivery boys ko filter karenge jo busy na ho

      // yaha nearByIds ek array hoga jisme un delivery boys ke id honge jo 10km ke andar hain
      const nearByIds = nearByDeliveryBoys.map((b) => b._id);
      // yaha busyIds me un delivery boys ke id aa jayenge jo already kisi order pe assigned hain aur jinka status brodcasted ya completed nahi hai
      // isse hume pata chal jayega ki kaun kaun se delivery boys available nahi hain

      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["brodcasted", "completed"] },
      }).distinct("assignedTo");

      // ab hum busyIds ko ek set me convert kar denge taaki lookup fast ho jaye
      const busyIdSet = new Set(busyIds.map((id) => String(id)));

      // ab hum un delivery boys ko filter karenge jo busy nahi hain
      // availableBoys me wo delivery boys aa jayenge jo 10km ke andar hain aur busy nahi hain

      const availableBoys = nearByDeliveryBoys.filter(
        (b) => !busyIdSet.has(String(b._id))
      );
      console.log("available boys are :~ ", availableBoys);
      // ab hum un available boys ke id nikal lenge jo order ko assign karne ke liye candidates banenge
      const candidates = availableBoys.map((b) => b._id);
      // agar available boys ki length 0 hui to hum order ko save kar denge bina kisi assignment ke
      // aur response me ek message bhej denge ki order status update ho gaya hai lekin koi available delivery boys nahi hain
      if (candidates.length == 0) {
        await order.save();
        return res.json({
          message:
            "order status updated but there is no available delivery boys",
        });
      }
      // ab hum delivery assignment create karenge
      const deliveryAssignment = await DeliveryAssignment.create({
        order: order?._id,
        shop: shopOrder.shop,
        shopOrderId: shopOrder?._id,
        brodcastedTo: candidates, // ye un delivery boys ke id hain jo available hain
        status: "brodcasted",
      });
      // ab hum shopOrder me assignment ka reference aur assignedDeliveryBoy ka reference daal denge
      shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo; // ye abhi null hoga kyunki abhi tak kisi ne accept nahi kiya hai
      shopOrder.assignment = deliveryAssignment._id; // ye delivery assignment id hai jo humne abhi create kiya hai

      // ye saare delivery boys ka data store kar lenge taaki frontend me bhej saken ki itne delivery boys available hain
      deliveryBoysPayload = availableBoys.map((b) => ({
        id: b._id, // delivery boy ka id
        fullName: b.fullName,
        longitude: b.location.coordinates?.[0],
        latitude: b.location.coordinates?.[1],
        mobile: b.mobile,
      }));

      await deliveryAssignment.populate("order");
      await deliveryAssignment.populate("shop");
      const io = req.app.get("io");
      if (io) {
        // ye iss liye kar rhe hai taaki jaise hi order out for delivery hota hai to sabhi available delivery boys ko notify kar den taaki wo apne app me dekh saken ki naya order available hai without refreshing the page
        // aur fir wo apne app me jaake us order ko accept kar saken

        availableBoys.forEach((boy) => {
          const boySocketId = boy.socketId;
          if (boySocketId) {
            // io.to -> means kisko event bhejna hai yaha boySocketId ko event bhej rhe hain
            // .emit me pehla parameter event ka naam hai jisko backend me sunna hai aur dusra parameter data hai jo bhejna hai

            io.to(boySocketId).emit("newAssignment", {
              sentTo: boy._id,
              assignmentId: deliveryAssignment._id,
              orderId: deliveryAssignment.order._id,
              shopName: deliveryAssignment.shop.name,
              deliveryAddress: deliveryAssignment.order.deliveryAddress,
              items:
                deliveryAssignment.order.shopOrders.find((so) =>
                  so._id.equals(deliveryAssignment.shopOrderId)
                ).shopOrderItems || [],
              subtotal: deliveryAssignment.order.shopOrders.find((so) =>
                so._id.equals(deliveryAssignment.shopOrderId)
              )?.subtotal,
            });
          }
        });
      }
    }

    await order.save();
    // abhi tak ham pure order ke liye deliveryAssignment create kar rahe the
   // aab hame ek particular shopOrder ke liye bhejna hai
   // hamari shop ke liye jo owner hai uski shop ke liye order wala nikalenge uske andar pura data rahega ki uski paticular shop se jo order hua hai usme kya kya items hain , kyunki ek order ko multiple users ne alag alag shops se kiya hoga isliye hame particular shopOrder ka data nikalna hai 
    // jaise dominos se pizza order hua hai to uske owner ko sirf dominos ka order hi dikhana hai na ki burger king ka jo ki us order me ek alag shopOrder hoga , kebal usi ke liye order dikhe or jitne delivery boys assigned hain wo bhi dikhaye
    const updatedShopOrder = order.shopOrders.find((o) => o.shop == shopId);
    console.log("hello kya hal hai",updatedShopOrder);
    await order.populate("shopOrders.shop", "name");
    await order.populate(
      "shopOrders.assignedDeliveryBoy",
      "fullName email mobile"
    );
    await order.populate("user", "socketId");

    const io = req.app.get("io");
    if (io) {
      const userSocketId = order.user.socketId;
      if (userSocketId) {
        io.to(userSocketId).emit("update-status", {
          orderId: order._id,
          shopId: updatedShopOrder.shop._id,
          status: updatedShopOrder.status,
          userId: order.user._id, // ye userId isliye bhej rahe hain taaki frontend me pata chal jaye ki kis user ka order status update hua hai
        });
      }
    }
    // jab owner order ka status ko out for delivery karega tab ham ye data bhejenge frontend ko taaki wo available delivery boys ko dikha sake 
    return res.status(200).json({
      shopOrder: updatedShopOrder,
      assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
      availableBoys: deliveryBoysPayload,
      assignment: updatedShopOrder?.assignment?._id,
    });
  } catch (error) {
    return res.status(500).json({ message: `order status error ${error}` });
  }
};

export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    // hame deliveryAssignment me se wo assignments nikalne hain jisme brodcastedTo me ye deliveryBoyId ho aur status brodcasted ho
    // fir hame order aur shop dono ko populate karna hai taaki hume order ka deliveryAddress aur shop ka name mil jaye
    const assignments = await DeliveryAssignment.find({
      brodcastedTo: deliveryBoyId,
      status: "brodcasted",
    })
      .populate("order")
      .populate("shop");

    // ab hume assignments ko format karna hai taaki frontend me bhej saken
    const formated = assignments.map((a) => ({
      assignmentId: a._id,
      orderId: a.order._id,
      shopName: a.shop.name,
      deliveryAddress: a.order.deliveryAddress,
      // aab ham items bhejne hai jo user ne order kiye the us shop se , 
      // deliveryAssignment me ek shopOrderId hai , agar ye shopOrderId barabar hai particular shop se toh yaha pe ye wale items hame bhejna hai iss shopOrderId wali id ke 
      // jaise dominos se pizza order hua hai toh hame dominos ka pizza hi bhejna hai koi aur item nahi dikhe delivery boy ko apne page pe
      items:
        a.order.shopOrders.find((so) => so._id.equals(a.shopOrderId))
          .shopOrderItems || [],
      subtotal: a.order.shopOrders.find((so) => so._id.equals(a.shopOrderId))
        ?.subtotal,
    }));

    return res.status(200).json(formated);
  } catch (error) {
    return res.status(500).json({ message: `get Assignment error ${error}` });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    // jis bhi order ko accept karna hai uska assignment id hame params me milega
    const { assignmentId } = req.params;
    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(400).json({ message: "assignment not found" });
    }
    if (assignment.status !== "brodcasted") {
      return res.status(400).json({ message: "assignment is expired someone else took the order" });
    }
    //aab ham find karenge ye delivery boy already kisi order pe assigned to nahi hai
    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: { $nin: ["brodcasted", "completed"] },
    });

    if (alreadyAssigned) {
      return res
        .status(400)
        .json({ message: "You are already assigned to another order" });
    }
    // aab kya karenge assignment ko update karenge
    //assignment me assignedTo me ye delivery boy ki id daal denge jo accept kar raha hai 
    assignment.assignedTo = req.userId;
    // aur status ko assigned kar denge
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(400).json({ message: "order not found" });
    }
    // aab hame order me se  wo shopOrder find karna  hai jiska id assignment ke shopOrderId ke barabar ho 
    let shopOrder = order.shopOrders.id(assignment.shopOrderId);
    // ye order iss delivery boy ko assign kariya gya 
    shopOrder.assignedDeliveryBoy = req.userId;
    await order.save();

    return res.status(200).json({
      message: "order accepted",
    });
  } catch (error) {
    return res.status(500).json({ message: `accept order error ${error}` });
  }
};

export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned",
    })
      .populate("shop", "name")
      .populate("assignedTo", "fullName email mobile location")
      .populate({
        path: "order",
        populate: [{ path: "user", select: "fullName email location mobile" }],
      });

    if (!assignment) {
      return res.status(400).json({ message: "assignment not found" });
    }
    if (!assignment.order) {
      return res.status(400).json({ message: "order not found" });
    }
    // ab hume order me se wo shopOrder nikalna hai jiska id assignment.shopOrderId ke barabar ho
    const shopOrder = assignment.order.shopOrders.find(
      (so) => String(so._id) == String(assignment.shopOrderId)
    );

    if (!shopOrder) {
      return res.status(400).json({ message: "shopOrder not found" });
    }

    let deliveryBoyLocation = { lat: null, lon: null };
    if (assignment.assignedTo.location.coordinates.length == 2) {
      deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
      deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
    }

    let customerLocation = { lat: null, lon: null };
    if (assignment.order.deliveryAddress) {
      customerLocation.lat = assignment.order.deliveryAddress.latitude;
      customerLocation.lon = assignment.order.deliveryAddress.longitude;
    }

    return res.status(200).json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: assignment.order.deliveryAddress,
      deliveryBoyLocation,
      customerLocation,
    });
  } catch (error) {}
};

// for customers ye dikhega tracking page pe 
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user")
      .populate({
        path: "shopOrders.shop",
        model: "Shop",
      })
      .populate({
        // iska mtlb hai shopOrders me se har shopOrder ke assignedDeliveryBoy ko populate karna hai ... model ka use kis liye kiya hai ? taaki hume assignedDeliveryBoy ka pura object mil jaye
        path: "shopOrders.assignedDeliveryBoy",
        model: "User",
      })
      .populate({
        path: "shopOrders.shopOrderItems.item",
        model: "Item",
      })
      .lean(); // ye lean isliye use kar rahe hain taaki hume plain javascript object mile na ki mongoose document jisme methods bhi hote hain

    if (!order) {
      return res.status(400).json({ message: "order not found" });
    }
    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: `get by id order error ${error}` });
  }
};

export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;
    const order = await Order.findById(orderId).populate("user");
    const shopOrder = order.shopOrders.id(shopOrderId);
    if (!order || !shopOrder) {
      return res.status(400).json({ message: "enter valid order/shopOrderid" });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpires = Date.now() + 5 * 60 * 1000;
    await order.save(); // order kyu save karaya ? taaki shopOrder me changes save ho jayein
    // ab hume otp mail karna hai user ko
    await sendDeliveryOtpMail(order.user, otp);
    return res
      .status(200)
      .json({ message: `Otp sent Successfuly to ${order?.user?.fullName}` });
  } catch (error) {
    return res.status(500).json({ message: `delivery otp error ${error}` });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body;
    const order = await Order.findById(orderId).populate("user");
    const shopOrder = order.shopOrders.id(shopOrderId);
    if (!order || !shopOrder) {
      return res.status(400).json({ message: "enter valid order/shopOrderid" });
    }
    if (
      shopOrder.deliveryOtp !== otp ||
      !shopOrder.otpExpires ||
      shopOrder.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid/Expired Otp" });
    }

    shopOrder.status = "delivered";
    shopOrder.deliveredAt = Date.now();
    await order.save();
    // jab owner ne order ko out for delivery kiya tha tab humne delivery assignment create kiya tha
    // aur usme status brodcasted tha
    // jab delivery boy ne order accept kiya tha tab humne us assignment me status assigned kar diya tha
    // ab jab order deliver ho gaya hai to hume us assignment ko delete kar dena chahiye
    await DeliveryAssignment.deleteOne({
      shopOrderId: shopOrder._id,
      order: order._id,
      assignedTo: shopOrder.assignedDeliveryBoy,
    });

    return res.status(200).json({ message: "Order Delivered Successfully!" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `verify delivery otp error ${error}` });
  }
};

export const getTodayDeliveries = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const startsOfDay = new Date();
    startsOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      "shopOrders.assignedDeliveryBoy": deliveryBoyId,
      "shopOrders.status": "delivered",
      "shopOrders.deliveredAt": { $gte: startsOfDay },
    }).lean();

    let todaysDeliveries = [];

    orders.forEach((order) => {
      order.shopOrders.forEach((shopOrder) => {
        if (
          shopOrder.assignedDeliveryBoy == deliveryBoyId &&
          shopOrder.status == "delivered" &&
          shopOrder.deliveredAt &&
          shopOrder.deliveredAt >= startsOfDay
        ) {
          todaysDeliveries.push(shopOrder);
        }
      });
    });

    let stats = {};

    todaysDeliveries.forEach((shopOrder) => {
      const hour = new Date(shopOrder.deliveredAt).getHours();
      stats[hour] = (stats[hour] || 0) + 1;
    });

    let formattedStats = Object.keys(stats).map((hour) => ({
      hour: parseInt(hour),
      count: stats[hour],
    }));

    formattedStats.sort((a, b) => a.hour - b.hour);

    return res.status(200).json(formattedStats);
  } catch (error) {
    return res.status(500).json({ message: `today deliveries error ${error}` });
  }
};
