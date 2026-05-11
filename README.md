# TKApp

## Project Description

TKApp is a comprehensive e-commerce mobile application built to provide a seamless shopping experience. It connects users, sellers, and administrators within a unified platform. The application allows users to browse products, manage their carts, and securely checkout using integrated payment systems. It features role-based access control (RBAC) to offer tailored functionalities for standard users, sellers managing their inventory, and administrators overseeing the platform.

## Features

- **Role-Based Access Control (RBAC):** Distinct interfaces and capabilities for Users, Sellers, and Admins.
- **Secure Authentication:** User sign-up, login, and session management using Firebase Authentication.
- **Product Browsing & Search:** Intuitive UI to explore a wide range of products.
- **Shopping Cart & Checkout:** Add products to a cart and proceed to secure checkout.
- **Secure Payments:** Integrated Stripe payment gateway for handling transactions securely.
- **Seller Dashboard:** Sellers can manage their products, view orders, and track revenue.
- **Admin Panel:** Administrative tools for managing users, monitoring transactions, and overseeing platform operations.

## Technology Stack

### Frontend (Mobile App)
- **Framework:** React Native, Expo
- **Language:** TypeScript
- **Navigation:** React Navigation (Stack & Bottom Tabs)
- **Authentication & Backend Services:** Firebase
- **Payment Processing:** `@stripe/stripe-react-native`
- **State Management & Storage:** React Context API / Async Storage

### Backend (Server)
- **Framework:** Node.js, Express.js
- **Payment Processing:** Stripe Node.js SDK
- **Admin Services:** Firebase Admin SDK
- **Environment Management:** dotenv, cors

## Testing Instructions

To test the application locally on an emulator or physical device, follow the platform-specific instructions below:

### 1. For Android Users:
- Ensure you have **Android Studio** installed and configured with a working Android Virtual Device (AVD).
- Start your Android Emulator.
- From the root of the project, run:
  ```bash
  npm run android
  ```
  Alternatively, you can start the Expo development server with `npx expo start` and press `a` to open it on the Android emulator.
- To test on a physical Android device, download the **Expo Go** app from the Google Play Store, run `npx expo start`, and scan the generated QR code.

### 2. For iOS Users:
- Ensure you have **Xcode** installed on a macOS machine.
- Open the iOS Simulator.
- From the root of the project, run:
  ```bash
  npm run ios
  ```
  Alternatively, you can start the Expo development server with `npx expo start` and press `i` to open it on the iOS simulator.
- To test on a physical iOS device, download the **Expo Go** app from the App Store, run `npx expo start`, and scan the generated QR code using the iOS Camera app.

## Backend Setup

The backend handles payment intents and secure server-side logic. To set up the backend:

1. Navigate to the backend directory:
   ```bash
   cd be
   ```
2. Install the required backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `be` directory and add your Stripe Secret Key and any required Firebase Admin credentials:
   ```env
   STRIPE_SECRET_KEY=your_stripe_secret_key_here
   PORT=3000
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will typically run on `http://localhost:3000` or the port specified in your `.env` file.*

## Starting the Frontend

Once the backend is running, you can start the mobile application frontend:

1. Navigate to the root directory of the project:
   ```bash
   cd ..
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Firebase configurations and Stripe Publishable Key:
   ```env
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   # Add your Firebase keys here
   ```
4. Start the Expo development server:
   ```bash
   npm start
   ```
   *This command will open a Metro Bundler interface in your browser or terminal where you can select to run the app on Android, iOS, or Web.*

## Postman API Documentation

*If you have a Postman collection or workspace, link it below.*

**[Link to Postman Collection / API Documentation]**

To test the backend APIs (like the Stripe Payment Intent creation route):
1. Import the provided Postman collection.
2. Set your environment variables in Postman (e.g., `base_url` to `http://localhost:3000`).
3. Send requests to the documented endpoints (e.g., `POST /create-payment-intent`) to verify backend functionality.
