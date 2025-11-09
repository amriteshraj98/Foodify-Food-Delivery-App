import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import UserOrderCard from "../components/UserOrderCard";
import OwnerOrderCard from "../components/OwnerOrderCard";
import {
  setMyOrders,
  updateOrderStatus,
  updateRealtimeOrderStatus,
} from "../redux/userSlice";

function MyOrders() {
  const { userData, myOrders, socket } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    // jab bhi socket me "newOrder" event aayega tab ye function chalega
    // aur data me wo order ka data aayega jo ki backend se bheja gaya hai
    // fir hum us order ko redux store me add kar denge taaki ui me wo show ho jaye bina page refresh kiye
    socket?.on("newOrder", (data) => {
      // ye check kar rahe hai ki jo order aaya hai uska owner ka id current user ke id ke barabar hai ya nahi
      // taaki sirf apne orders hi show kare na ki sabke orders
      // ye isliye kar rahe hai kyuki socket connection sabke liye hota hai
      // aur jab bhi koi naya order aayega to sabke paas wo order ka data chala jayega
      // isliye ye check karna jaruri hai ki jo order aaya hai uska owner ka id current user ke id ke barabar hai ya nahi
      // ye check kyu kar rhe hai ? taaki sirf apne orders hi show kare na ki sabke orders , show kaha karna hai ? MyOrders page me user ke liye ya owner ke liye ? kisko show karna hai ? current logged in user ko  
      if (data.shopOrders?.owner._id == userData._id) {
        dispatch(setMyOrders([data, ...myOrders]));
      }
    });

    socket?.on("update-status", ({ orderId, shopId, status, userId }) => {
      // ye jo userId aayi hai kya ye hamare userdata ke id ke barabar hai ya nahi taaki sirf apne orders ka status hi update kare na ki sabke orders ka status update kare
      if (userId == userData._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
      }
    });

    return () => {
      socket?.off("newOrder"); // jab bhi component unmount ho jaye to ye event listener hata dega
      socket?.off("update-status");
    };
  }, [socket]);

  return (
    <div className='"w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
      <div className="w-full max-w-[800px] p-4">
        <div className="flex items-center gap-[20px] mb-6 ">
          <div className=" z-[10] " onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
          </div>
          <h1 className="text-2xl font-bold  text-start">My Orders</h1>
        </div>
        <div className="space-y-6">
          {myOrders?.map((order, index) =>
            userData.role == "user" ? (
              <UserOrderCard data={order} key={index} />
            ) : userData.role == "owner" ? (
              <OwnerOrderCard data={order} key={index} />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

export default MyOrders;
