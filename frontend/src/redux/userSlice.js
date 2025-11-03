import { createSlice, current } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    shopInMyCity: null,
    itemsInMyCity: null,
    cartItems: [],
    totalAmount: 0,
    myOrders: [],
    searchItems: null,
    socket: null,
  },
  reducers: {
    // state is initial state and action is jo bhi data bheja jayega or action.payload me data hoga jo bhi frontend se bheja jayega
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },
    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = action.payload;
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload;
    },
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    addToCart: (state, action) => {
      const cartItem = action.payload;
      // agar item already cart me hai to uski quantity badha denge
      // agar item cart me nhi hai to usko cart me add kar denge
      const existingItem = state.cartItems.find((i) => i.id == cartItem.id);
      if (existingItem) {
        existingItem.quantity += cartItem.quantity;
      } else {
        state.cartItems.push(cartItem);
      }
      // cartItems me jo bhi item hai uske price*quantity ka total nikal ke totalAmount me store kar denge
      // sum is initial value 0 se start hoga aur har item ke price*quantity ko sum me add karte jayenge
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload;
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((i) => i.id == id);
      if (item) {
        item.quantity = quantity;
      }
      // total amount ko bhi update kar denge jab quantity update ho
      // sum is initial value 0 se start hoga aur har item ke price*quantity ko sum me add karte jayenge
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
    },

    removeCartItem: (state, action) => {
      // action.payload me item id hoga jisko remove karna hai
      // item aayega aur item ke id ko action.payload se compare karenge aur jiska id match nahi karega usko hi naya array me rakhenge
      state.cartItems = state.cartItems.filter((i) => i.id !== action.payload);
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
    },

    setMyOrders: (state, action) => {
      state.myOrders = action.payload;
    },
    addMyOrder: (state, action) => {
      // naye order ko sabse upar add kar denge
      state.myOrders = [action.payload, ...state.myOrders];
    },

    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;
      // order ko find karenge jiska id orderId ke barabar ho
      // fir us order ke shopOrders me se wo shopOrder find karenge jiska shopId match kare
      // fir us shopOrder ka status update kar denge
      // current function se hum current state ko dekh sakte hain debugging ke liye
      const order = state.myOrders.find((o) => o._id == orderId);
      if (order) {
        if (order.shopOrders && order.shopOrders.shop._id == shopId) {
          order.shopOrders.status = status;
        }
      }
    },
    // ye action tab chalega jab backend se "update-status" event aayega
    // aur isme hum order status ko realtime me update karenge bina page refresh kiye
    updateRealtimeOrderStatus: (state, action) => {
      // orderId, shopId, status, userId ye sab action.payload me hoga jo ki backend se aayega jab bhi order status update hoga
      const { orderId, shopId, status } = action.payload;

      // order ko find karenge jiska id orderId ke barabar ho
      const order = state.myOrders.find((o) => o._id == orderId);
      if (order) {
        // aab shoporder find karenge wo shoporder find karenge jis shopOrder ke andar jo shop hai uski id aur jo shopId yaha pe aayi hai wo barabar hai
        const shopOrder = order.shopOrders.find((so) => so.shop._id == shopId);
        if (shopOrder) {
          // fir us shopOrder ka status update kar denge
          shopOrder.status = status;
        }
      }
    },

    setSearchItems: (state, action) => {
      state.searchItems = action.payload;
    },
  },
});

export const {
  setUserData,
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
  setShopsInMyCity,
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  setSearchItems,
  setTotalAmount,
  setSocket,
  updateRealtimeOrderStatus,
} = userSlice.actions;
export default userSlice.reducer;
