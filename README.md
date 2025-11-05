# Foodify 🍽️
> A full-stack food delivery platform with real-time order tracking, multi-role dashboards, and Razorpay-powered checkout.

![Node.js](https://img.shields.io/badge/Node.js-18+-43853d?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-5.1.0-black?logo=express)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-4ea94b?logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black?logo=socket.io)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C2451?logo=razorpay&logoColor=white)

## 📚 Table of Contents
- [Project Overview](#-project-overview)
- [Feature Highlights](#-feature-highlights)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
  - [Environment Variables](#environment-variables)
  - [Install & Run](#install--run)
- [Available Scripts](#-available-scripts)
- [Key Workflows](#-key-workflows)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Project Overview
Foodify is an opinionated take on a multi-sided food delivery platform. Restaurant owners create digital storefronts, diners discover menus around their city, and delivery partners accept assignments, stream live locations, and close orders with OTP verification. The project demonstrates how to stitch together geospatial search, real-time messaging, third-party payments, and rich dashboards in a single codebase.

## 🍔 Feature Highlights
- **Diners**  
  Browse shops and menu items by city, filter by cuisine, build carts, choose COD or Razorpay for payment, and track deliveries on a live map.
- **Restaurant Owners**  
  Launch a storefront with Cloudinary-hosted imagery, curate menus, and receive instant notifications as orders land.
- **Delivery Partners**  
  Pick up assignments in real time, share live GPS coordinates via Socket.IO, and close deliveries with OTP validation and earnings analytics.
- **Platform Goodies**  
  JWT-secured auth with Google sign-in, OTP-based password resets, socket-driven notifications, Leaflet-powered maps, and Geoapify-backed geocoding.

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Redux Toolkit, React Router, Leaflet, Recharts, Socket.IO client.
- **Backend:** Node.js, Express 5, Mongoose, JWT, Multer, Cloudinary SDK, Razorpay, Nodemailer, Socket.IO server.
- **Infrastructure & Utilities:** MongoDB Atlas, Cloudinary CDN, Razorpay Checkout, Firebase Auth, Geoapify Geocoding, Nodemailer SMTP.

## 🏗️ Architecture
- **Request/Response:** RESTful Express API with structured routers for auth, shops, items, and orders.
- **Real-time Channel:** Socket.IO for owner notifications, delivery assignment broadcasts, and location streaming.
- **Data Layer:** MongoDB models for `User`, `Shop`, `Item`, `Order`, and `DeliveryAssignment` with role-specific indexes and population helpers.
- **Cloud Integrations:** Cloudinary for media storage, Razorpay for online payments, Nodemailer for transactional email, Geoapify for mapping.



## 📂 Folder Structure
```text
Foodify/
├── backend/              # Express API, Socket.IO server, Mongo models
│   ├── config/           # Database bootstrap & shared config
│   ├── controllers/      # Route handlers (auth, shop, item, order, user)
│   ├── middlewares/      # Auth guard, Multer setup, etc.
│   ├── models/           # Mongoose schemas & relationships
│   ├── routes/           # Versioned REST endpoints
│   └── utils/            # Cloudinary, mailer, token utilities
├── frontend/             # Vite + React SPA
│   ├── src/
│   │   ├── components/   # Dashboards, cards, map widgets
│   │   ├── hooks/        # Data fetching & side-effect hooks
│   │   ├── pages/        # Route-level views
│   │   └── redux/        # Slices for user, owner, cart, map state
└── docs/                 # Architecture diagrams & generators
```

## 🚀 Getting Started
### Prerequisites
- Node.js **18+**
- npm **9+**
- MongoDB Atlas cluster or compatible MongoDB deployment
- Cloudinary account, Razorpay test keys, SMTP credentials, Firebase project

### Environment Variables
Create `.env` files in both `backend/` and `frontend/` before running the app. Never commit real secrets to source control.

`backend/.env`
```dotenv
PORT=8000
MONGODB_URL=<your-mongodb-connection-string>
JWT_SECRET=<random-secret>
EMAIL=<smtp-email>
PASS=<smtp-app-password>
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
```

`frontend/.env`
```dotenv
VITE_FIREBASE_APIKEY=<firebase-client-api-key>
VITE_GEOAPIKEY=<geoapify-api-key>
VITE_RAZORPAY_KEY_ID=<razorpay-public-key>
```

Update `frontend/src/App.jsx` if the backend server runs on a non-default host:
```js
export const serverUrl = "http://localhost:8000";
```

### Install & Run
Use two terminals for a smooth developer experience.

```bash
# Terminal 1 – start the API
cd backend
npm install
npm run dev

# Terminal 2 – start the SPA
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:5173` and proxies API calls to `serverUrl`.

## 🧰 Available Scripts
- **Backend**
  - `npm run dev` – start the Express server with Nodemon.
- **Frontend**
  - `npm run dev` – start the Vite dev server.
  - `npm run build` – bundle the production build.
  - `npm run preview` – preview the production build locally.
  - `npm run lint` – run ESLint against the React codebase.

## 🔄 Key Workflows
- **Sign-up & Auth:** Email/password or Google OAuth, JWT cookies, OTP-based password reset.
- **Shop Management:** Owners create or edit shops, upload images to Cloudinary, manage menus with CRUD operations.
- **Ordering:** Users add items to cart, set precise Geoapify-backed delivery addresses, choose payment mode, and place Razorpay or COD orders.
- **Real-time Ops:** Owners receive instant order notifications, assignments get broadcast to delivery partners, and live GPS feeds update customer tracking maps.
- **Fulfilment:** Delivery partners accept tasks, request delivery OTP via email, and verify completion inside the app.

## 🛟 Troubleshooting
- **CORS / Cookies:** Ensure both servers share the same origin or configure `withCredentials` appropriately.
- **Socket Disconnects:** Check that `identity` events fire after authentication and that `socketHandler` records IDs in Mongo.
- **Payment Issues:** Confirm Razorpay callback URLs and keys, and double-check test mode credentials.
- **Maps & Geocoding:** Geoapify requests require a valid API key; exceeding daily quota will break reverse geocoding in checkout.
- **Image Uploads:** Multer saves temp files locally before Cloudinary upload—verify write permissions if uploads fail.

## 🤝 Contributing
1. Fork the repository & create a feature branch (`git checkout -b feat/amazing-idea`).
2. Make your changes, keeping commits scoped and conventional.
3. Run linting/build steps locally.
4. Submit a pull request with context, screenshots, and testing notes.

## 📄 License
This project is licensed under the **ISC** License as declared in `backend/package.json`. Feel free to adapt and extend responsibly.

---

Made with ❤️ for food lovers, restaurant owners, and on-the-go delivery heroes.
