# Tên đề tài: Xây dựng ứng dụng tìm kiếm việc làm

**Danh sách thành viên:**
1. Nguyễn Phong Nhã (Nhóm trưởng)
2. Lê Phước Suôn

## BẢNG TỔNG HỢP CHỨC NĂNG ĐÃ THỰC HIỆN

| MSSV | Họ tên | Email | Các chức năng thực hiện |
| :--- | :--- | :--- | :--- |
| 23IT137 | Nguyễn Quang Kính | kinhnq.23it@vku.udn.vn | Xem và tìm kiếm sản phẩm, Quản lý giỏ hàng & Thanh toán (Stripe), Dashboard Seller (quản lý đơn hàng, doanh thu), Quản lý User/Giao dịch |
| 23IT252 | Trịnh Thị Thanh Thảo | thaottt.23it@vku.udn.vn | Phân quyền, Thêm/sửa/xóa sản phẩm, Đăng nhập/Đăng xuất/Đăng ký, Admin hoàn tiền |

## CHI TIẾT CÁC CHỨC NĂNG ĐÃ THỰC HIỆN

### 1. Hệ thống Xác thực & Phân quyền (Auth & RBAC) - *Thảo thực hiện*
- **Đăng ký/Đăng nhập:** Hỗ trợ đăng ký và đăng nhập qua Email/Mật khẩu hoặc Đăng nhập ẩn danh (Khách) bằng Firebase Auth.
- **Phân quyền (Role-Based Access Control):** Hệ thống chia làm 3 vai trò (Customer, Seller, Admin) với giao diện tương ứng.
- **Quản lý phiên đăng nhập:** Tự động lưu trạng thái đăng nhập trên thiết bị.

### 2. Dành cho Khách hàng (Customer) - *Kính thực hiện*
- **Khám phá & Tìm kiếm:** Xem danh sách sản phẩm thời gian thực, lọc theo danh mục, từ khóa.
- **Chi tiết sản phẩm:** Xem thông tin giá, cửa hàng. Tích hợp AI (Gemini) tự động sinh tóm tắt/mô tả sản phẩm.
- **Giỏ hàng & Yêu thích:** Thêm, bớt, xóa sản phẩm khỏi giỏ hàng. Lưu danh sách yêu thích.
- **Thanh toán & Đặt hàng:** Hỗ trợ COD và Thanh toán Online (Stripe). Tự động tách đơn nếu mua từ nhiều shop.
- **Theo dõi đơn hàng:** Cập nhật trạng thái đơn hàng (chờ xử lý, đang chuẩn bị, đang giao, hoàn thành).
- **Đánh giá & Nhận xét:** Chấm sao và review sản phẩm sau khi nhận hàng.
- **Nhắn tin (Chat Real-time):** Khách hàng và Người bán có thể nhắn tin trực tiếp.

### 3. Dành cho Người bán (Seller) 
- **Quản lý sản phẩm (*Thảo*):** Đăng sản phẩm mới (upload ảnh lên Cloudinary), chỉnh sửa, xóa sản phẩm.
- **Quản lý hồ sơ Shop (*Kính*):** Cập nhật tên cửa hàng, mô tả, banner, tài khoản ngân hàng.
- **Quản lý đơn hàng (*Kính*):** Xử lý đơn khách đặt, cập nhật trạng thái. Tự động trừ tồn kho và cộng doanh số.
- **Ví điện tử (*Kính*):** Quản lý tiền đang chờ (đóng băng) và tiền khả dụng. Yêu cầu rút tiền.

### 4. Dành cho Quản trị viên (Admin)
- **Xử lý Hoàn tiền/Trả hàng (*Thảo*):** Duyệt yêu cầu hoàn tiền, gọi qua Backend (Stripe) để trả lại tiền vào thẻ khách.
- **Quản lý Giải ngân (*Kính*):** Xem và duyệt các yêu cầu rút tiền từ Seller.
- **Đối soát COD (*Kính*):** Xác nhận các đơn giao tiền mặt thành công để cộng tiền vào ví Seller.

---

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
