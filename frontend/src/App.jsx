import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import { useDispatch, useSelector } from "react-redux";
import Home from "./pages/Home";
import useGetCity from "./hooks/useGetCity";
import useGetMyshop from "./hooks/useGetMyShop";
import CreateEditShop from "./pages/CreateEditShop";
import AddItem from "./pages/AddItem";
import EditItem from "./pages/EditItem";
import useGetShopByCity from "./hooks/useGetShopByCity";
import useGetItemsByCity from "./hooks/useGetItemsByCity";
import CartPage from "./pages/CartPage";
import CheckOut from "./pages/CheckOut";
import OrderPlaced from "./pages/OrderPlaced";
import MyOrders from "./pages/MyOrders";
import useGetMyOrders from "./hooks/useGetMyOrders";
import useUpdateLocation from "./hooks/useUpdateLocation";
import TrackOrderPage from "./pages/TrackOrderPage";
import Shop from "./pages/Shop";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { setSocket } from "./redux/userSlice";

export const serverUrl = "http://localhost:8000";
function App() {
  // ye userData me current user ka data hoga jo ki redux me store hai
  // redux mein userdata hai aab usko access karne ke liye useSelector ka use karenge
  // useSelector ek hook hai jo ki redux store se state ko access karne ke liye use hota hai
  // useSelector ke andar ek function pass karte hai jisme state parameter hota hai jisme pura redux store ka state hota hai
  // state me jitne bhi slices hai unko access kar sakte hai jaise state.user, state.cart etc
  // userSlice me jo bhi initial state hai wo state.user me milega
  // userData ko access karne ke liye state.user.userData likhenge ya {userData} = state.user likhenge
  // ab userData me current user ka data hoga
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  useGetCurrentUser();
  useUpdateLocation();
  useGetCity();
  useGetMyshop();
  useGetShopByCity();
  useGetItemsByCity();
  useGetMyOrders();

  useEffect(() => {
    // socket io client ka instance banaya hai 
    const socketInstance = io(serverUrl, { withCredentials: true });
    dispatch(setSocket(socketInstance));
    // jab bhi socket connection banega tab ye function chalega
    // aur apna identity bhej dega jisme userId hoga taaki backend ko pata chal jaye ki kaun connect hua hai
    socketInstance.on("connect", () => {
      if (userData) {
        // socketInstance.emit ka use karke hum apna identity backend ko bhej rahe hai socketInstance.emit("event name", data)

        // backend me socket.on("event name", (data) => {}) ka use karke us event ko suna jata hai aur data ko receive kiya jata hai

        // yaha pe hum apna userId bhej rahe hai taaki backend ko pata chal jaye ki kaun connect hua hai
        
        socketInstance.emit("identity", { userId: userData._id });
      }
    });
    return () => {
      socketInstance.disconnect();
    };
  }, [userData?._id]);

  return (
    <Routes>
      {/* // agar userData hai to signup aur signin page pe na jaye balki home page pe chala jaye */}
      <Route
        path="/signup"
        element={!userData ? <SignUp /> : <Navigate to={"/"} />}
      />
      <Route
        path="/signin"
        element={!userData ? <SignIn /> : <Navigate to={"/"} />}
      />
      <Route
        path="/forgot-password"
        element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />}
      />
      <Route
        path="/"
        element={userData ? <Home /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/create-edit-shop"
        element={userData ? <CreateEditShop /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/add-item"
        element={userData ? <AddItem /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/edit-item/:itemId"
        element={userData ? <EditItem /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/cart"
        element={userData ? <CartPage /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/checkout"
        element={userData ? <CheckOut /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/order-placed"
        element={userData ? <OrderPlaced /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/my-orders"
        element={userData ? <MyOrders /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/track-order/:orderId"
        element={userData ? <TrackOrderPage /> : <Navigate to={"/signin"} />}
      />
      <Route
        path="/shop/:shopId"
        element={userData ? <Shop /> : <Navigate to={"/signin"} />}
      />
    </Routes>
  );
}

export default App;
