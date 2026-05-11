# 📱 TKApp — Tài Liệu Kiến Trúc & Logic Hoạt Động Toàn Dự Án

---

## 🗂️ Cấu Trúc Thư Mục Tổng Quan

```
TKApp/
├── App.tsx                        ← Điểm khởi chạy toàn bộ app
├── index.ts                       ← Entry point đăng ký App với Expo
├── .env                           ← Biến môi trường bí mật (API Keys)
├── app.json                       ← Cấu hình tên app, icon, splash
│
├── src/
│   ├── config/
│   │   └── firebaseConfig.ts      ← Kết nối Firebase (Auth + Firestore)
│   ├── contexts/
│   │   ├── AuthContext.tsx        ← Quản lý trạng thái đăng nhập toàn app
│   │   ├── CartContext.tsx        ← Quản lý giỏ hàng toàn app
│   │   └── WishlistContext.tsx    ← Quản lý danh sách yêu thích
│   ├── navigation/
│   │   └── AppNavigator.tsx       ← Điều hướng màn hình + Phân quyền Role
│   ├── services/
│   │   └── authService.ts         ← Các hàm gọi API Firebase Auth
│   ├── types/
│   │   └── index.ts               ← Định nghĩa kiểu dữ liệu TypeScript
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.tsx
│       │   └── RegisterScreen.tsx
│       ├── customer/
│       │   ├── HomeScreen.tsx
│       │   ├── ProductDetailScreen.tsx
│       │   ├── CartScreen.tsx
│       │   ├── CheckoutScreen.tsx
│       │   ├── OrderHistoryScreen.tsx
│       │   ├── ProfileScreen.tsx
│       │   ├── PublicShopScreen.tsx
│       │   ├── ReviewScreen.tsx
│       │   └── WishlistScreen.tsx
│       ├── seller/
│       │   ├── AddProductScreen.tsx
│       │   ├── SellerDashboardScreen.tsx
│       │   ├── SellerProductsScreen.tsx
│       │   ├── SellerProfileScreen.tsx
│       │   └── SellerWalletScreen.tsx
│       ├── admin/
│       │   ├── AdminPayoutScreen.tsx
│       │   ├── AdminReconcileScreen.tsx
│       │   └── AdminRefundScreen.tsx
│       ├── ChatScreen.tsx
│       └── ChatListScreen.tsx
│
└── be/
    ├── index.js                   ← Server Node.js/Express (Payment)
    └── seed.js                    ← Script tạo dữ liệu mẫu Firestore
```

---

## 🔌 Tầng Nền Tảng (Foundation Layer)

### 1. `App.tsx` — Điểm Khởi Chạy
**Logic:** Đây là file đầu tiên được chạy. Nó bọc toàn bộ ứng dụng bằng các "bao bì" (Provider) theo thứ tự từ ngoài vào trong:

```
AuthProvider          ← Cung cấp trạng thái đăng nhập
  └── CartProvider    ← Cung cấp giỏ hàng
       └── WishlistProvider  ← Cung cấp danh sách yêu thích
            └── StripeProvider  ← Cung cấp SDK thanh toán
                 └── NavigationContainer  ← Cung cấp hệ thống điều hướng
                      └── AppNavigator  ← Màn hình thực tế
```

**Tại sao bọc như vậy?** Theo mô hình React Context, Provider ở ngoài cùng thì tất cả component con bên trong đều có thể truy cập dữ liệu của nó. Ví dụ: bất kỳ màn hình nào cũng có thể gọi `useAuth()` hay `useCart()` mà không cần truyền props thủ công.

---

### 2. `src/config/firebaseConfig.ts` — Cầu Nối Firebase
**Logic:** Kết nối ứng dụng tới dự án Firebase của bạn.
- Khởi tạo `auth` bằng `initializeAuth` với `AsyncStorage` để trạng thái đăng nhập được **lưu lại trên thiết bị** (người dùng không cần đăng nhập lại mỗi lần mở app).
- Export `auth` (đối tượng Authentication) và `db` (đối tượng Firestore) để các file khác import và sử dụng.

**Firestore Collections sử dụng trong dự án:**
| Collection | Dữ liệu |
|---|---|
| `users` | Hồ sơ người dùng, bao gồm trường `role` |
| `products` | Toàn bộ sản phẩm trên sàn |
| `orders` | Toàn bộ đơn hàng |
| `chats` | Metadata phòng chat (danh sách thành viên) |
| `chats/{chatId}/messages` | Tin nhắn trong từng phòng chat |
| `shopProfiles` | Hồ sơ shop của Seller (số dư ví, thông tin ngân hàng) |
| `payoutHistory` | Lịch sử giải ngân |

---

### 3. `src/types/index.ts` — Kiểu Dữ Liệu

Định nghĩa 3 interface dùng xuyên suốt dự án:
- **`AppUser`**: Kế thừa `User` của Firebase, mở rộng thêm `role` (`'customer' | 'business' | 'admin'`) và `hoTen`.
- **`Product`**: Sản phẩm (id, name, price, imageUrl, quantity, sellerId, ...).
- **`CartItem`**: Kế thừa `Product`, thêm trường `cartQuantity` (số lượng trong giỏ).

---

## 🔐 Hệ Thống Xác Thực & Phân Quyền

### 4. `src/services/authService.ts` — Lớp Dịch Vụ Auth
**Logic:** Tập hợp các hàm gọi trực tiếp tới Firebase Authentication.
- `registerWithEmail`: Tạo tài khoản Firebase Auth → Lưu document vào collection `users` với trường `role` được chọn.
- `loginWithEmail`: Gọi `signInWithEmailAndPassword`.
- `loginAnonymously`: Gọi `signInAnonymously` (đăng nhập khách).
- `logout`: Gọi `signOut`.

---

### 5. `src/contexts/AuthContext.tsx` — Trạng Thái Đăng Nhập Toàn Cục
**Logic:** Là "bộ nhớ trung tâm" về danh tính người dùng.

```
Khởi động App
    ↓
onAuthStateChanged (lắng nghe Firebase)
    ↓ (có user)
onSnapshot(users/{uid}) ← Lắng nghe Firestore để lấy role
    ↓
setCurrentUser({ ...firebaseUser, role, hoTen, ... })
    ↓
currentUser được chia sẻ ra toàn app qua Context
```

**Điểm đặc biệt:** Dùng `onSnapshot` thay vì `getDoc` — điều này nghĩa là nếu Admin đổi `role` của ai đó trong Firebase Console, app của người đó sẽ **tự động cập nhật giao diện ngay lập tức** mà không cần tải lại.

---

### 6. `src/navigation/AppNavigator.tsx` — Bộ Điều Hướng & Cổng Bảo Vệ

**Logic phân quyền tại đây:**

```
currentUser === null?
    → Chỉ show: LoginScreen, RegisterScreen (Stack Auth)

currentUser.role === 'admin'?
    → Show AdminTabs: [AdminReconcile, AdminPayout, AdminRefund]

currentUser.role === 'business'?
    → Show SellerTabs: [Dashboard, SellerProducts, AddProduct, ChatList, SellerWallet, SellerProfile]

Còn lại (customer / anonymous):
    → Show CustomerTabs: [Home, Cart, ChatList, Profile]
    → + CustomerStack (các màn hình con dùng chung)
```

**Màn hình dùng chung** (có thể điều hướng từ bất kỳ role nào):
`Chat`, `OrderHistory`, `Wishlist`, `Review`, `PublicShop`, `ProductDetail`, `Checkout`

---

## 👤 Luồng Khách Hàng (Customer Flow)

### 7. `HomeScreen.tsx` — Trang Chủ / Khám Phá

**Logic:**
1. Dùng `onSnapshot(collection(db, "products"))` để lắng nghe **toàn bộ sản phẩm real-time**.
2. Dùng `useMemo` để tính toán:
   - `categories`: Danh sách danh mục duy nhất lấy từ trường `category` của các sản phẩm.
   - `filteredProducts`: Lọc theo ô tìm kiếm (`name` hoặc `tags`) VÀ danh mục đang chọn.
3. Sản phẩm hết hàng (`quantity === 0`) bị làm mờ và nút "Thêm giỏ"/"Mua" bị disabled.
4. Bấm vào sản phẩm → `navigation.navigate('ProductDetail', { product: item })`.
5. Bấm "+Giỏ" → Gọi `addToCart(product)` từ `CartContext`.

---

### 8. `ProductDetailScreen.tsx` — Chi Tiết Sản Phẩm

**Logic:**
1. Nhận object `product` qua navigation params.
2. Hiển thị ảnh (slideshow nếu có nhiều ảnh), tên, giá, mô tả, thông tin shop.
3. Tích hợp **AI Gemini**: Có nút "✨ Mô tả bằng AI" gọi tới API Gemini (key từ `.env`) để tự động sinh mô tả sản phẩm bằng text.
4. Bấm "Chat với Shop" → điều hướng sang `ChatScreen` với `sellerId` là ID của người bán sản phẩm đó.
5. Bấm "Yêu thích" → Gọi hàm từ `WishlistContext`.

---

### 9. `CartScreen.tsx` — Giỏ Hàng

**Logic:**
- Đọc `cartItems` từ `CartContext` (dữ liệu được lưu **trong bộ nhớ RAM**, không lưu Firestore).
- Cho phép tăng/giảm số lượng và xóa sản phẩm.
- Bấm "Thanh toán" → Điều hướng sang `CheckoutScreen`.

---

### 10. `CheckoutScreen.tsx` — Thanh Toán (Core Feature)

Đây là màn hình phức tạp nhất, xử lý 2 luồng thanh toán:

**Luồng COD (Thanh toán khi nhận hàng):**
```
Điền thông tin giao hàng → Chọn COD → Bấm "Đặt Hàng"
    ↓
saveOrderToFirestore(status: 'pending')
    ↓
Tạo document trong collection orders với status = 'pending'
(Không cộng tiền vào ví Seller vì chưa thu được tiền)
```

**Luồng Card (Thanh toán qua Thẻ Stripe):**
```
Điền thông tin → Chọn Card → Bấm "Đặt Hàng"
    ↓
1. Gọi POST http://[BE_SERVER]/create-payment-intent
       ↓
   be/index.js → Gọi Stripe API → Trả về clientSecret
       ↓
2. initPaymentSheet(clientSecret) → Mở giao diện Stripe
       ↓
3. Người dùng nhập thẻ → presentPaymentSheet()
       ↓ (Thành công)
4. saveOrderToFirestore(status: 'paid', paymentIntentId)
       ↓
   - Tạo document orders với status = 'ready_to_ship'
   - Cộng tiền vào shopProfiles/{sellerId}.pendingBalance (Đóng băng)
```

**Logic tách đơn theo Shop:**
Nếu giỏ hàng có sản phẩm từ 2 shop khác nhau → Tự động tạo **2 document orders riêng biệt**, mỗi cái cho 1 shop.

---

### 11. `OrderHistoryScreen.tsx` — Lịch Sử Đơn Hàng

**Logic:**
- Query `collection(db, 'orders')` lọc theo `userId === currentUser.uid` để chỉ lấy đơn của người dùng hiện tại.
- Hiển thị trạng thái đơn hàng theo thời gian thực.
- Nếu đơn ở trạng thái `delivered` hoặc `completed` → Hiện nút "Đánh giá".
- Nếu đơn ở trạng thái `pending` hoặc `ready_to_ship` → Hiện nút "Yêu cầu hoàn tiền/trả hàng" → Cập nhật `status` thành `refund_pending` hoặc `return_pending`.

---

### 12. `ReviewScreen.tsx` — Đánh Giá Sản Phẩm

**Logic:**
1. Nhận `orderId`, `productId` qua navigation params.
2. Người dùng chọn số sao (1-5) và viết nhận xét.
3. Bấm gửi → `addDoc(collection(db, 'reviews'), { ... })`.
4. Cập nhật điểm rating trung bình của sản phẩm trong collection `products`.

---

### 13. `WishlistScreen.tsx` — Danh Sách Yêu Thích

**Logic:**
- Đọc từ `WishlistContext` (lưu trong RAM, chưa persist xuống Firestore).
- Cho phép xóa khỏi danh sách yêu thích.
- Bấm vào sản phẩm → Điều hướng sang `ProductDetailScreen`.

---

### 14. `PublicShopScreen.tsx` — Trang Cửa Hàng Công Khai

**Logic:**
- Nhận `sellerId` qua params.
- Query `products` lọc theo `sellerId` để hiển thị toàn bộ sản phẩm của shop đó.
- Đọc `shopProfiles/{sellerId}` để hiển thị tên shop, mô tả, rating.

---

### 15. `ProfileScreen.tsx` — Hồ Sơ Khách Hàng

**Logic:**
- Đọc thông tin từ `currentUser` (AuthContext).
- Cho phép chỉnh sửa: `hoTen`, số điện thoại, địa chỉ → `updateDoc(doc(db, 'users', uid), ...)`.
- Có nút điều hướng sang `OrderHistory`, `Wishlist`.
- Có nút Đăng xuất → gọi `logout()` từ AuthContext.

---

## 🏪 Luồng Người Bán (Seller Flow)

### 16. `AddProductScreen.tsx` — Thêm Sản Phẩm

**Logic:**
1. Seller nhập: Tên, Giá, Số lượng, Danh mục, Mô tả, Tags.
2. Chọn ảnh từ thư viện điện thoại (qua `expo-image-picker`).
3. Upload ảnh lên **Cloudinary** (dịch vụ lưu trữ ảnh đám mây) — Key lấy từ `.env`.
4. Cloudinary trả về URL của ảnh.
5. `addDoc(collection(db, 'products'), { ...productData, imageUrl, sellerId: currentUser.uid, sellerName })`.

---

### 17. `SellerProductsScreen.tsx` — Quản Lý Sản Phẩm

**Logic:**
- Query `products` lọc theo `sellerId === currentUser.uid` (chỉ thấy sản phẩm của mình).
- Dùng `onSnapshot` → real-time.
- Cho phép chỉnh sửa (giá, số lượng, mô tả) và xóa sản phẩm.

---

### 18. `SellerDashboardScreen.tsx` — Quản Lý Đơn Hàng

**Logic — Trung tâm điều hành của Seller:**
- Query `orders` lọc theo `sellerIds array-contains currentUser.uid` → Chỉ lấy đơn có sản phẩm của mình.
- Phân loại đơn theo tab: Chờ xử lý / Đang chuẩn bị / Xử lý đơn / Hoàn-Hủy.

**Luồng cập nhật trạng thái đơn:**
```
pending → ready_to_ship → shipping → delivered
```

**Khi bấm "Đã giao thành công" (delivered):**
```
writeBatch:
  1. orders/{id}.status = 'delivered'
  2. products/{id}.quantity -= cartQuantity  ← Trừ tồn kho
  3. products/{id}.soldCount += cartQuantity  ← Cộng số đã bán
```

Seller cũng có nút "💬 Nhắn tin cho khách" → Điều hướng sang `ChatScreen` với `customerId`.

---

### 19. `SellerWalletScreen.tsx` — Ví Tiền Người Bán

**Logic — 2 loại số dư:**
- **`pendingBalance` (Đóng băng):** Tiền từ đơn đã thanh toán thẻ nhưng chưa giao hàng xong. Được cộng vào ngay khi khách thanh toán thành công (trong `CheckoutScreen`).
- **`availableBalance` (Khả dụng):** Tiền đã được Admin giải ngân về. Seller có thể rút.

**Luồng rút tiền:**
```
Seller bấm "Rút tiền"
    ↓
updateDoc(shopProfiles/{uid}, { payoutRequested: true, payoutAmount: ... })
    ↓ (Admin thấy yêu cầu trên AdminPayoutScreen)
Admin bấm "Đã chuyển khoản"
    ↓
availableBalance -= amount (Trừ ví)
payoutRequested = false (Xóa cờ yêu cầu)
Lưu vào payoutHistory
```

---

### 20. `SellerProfileScreen.tsx` — Hồ Sơ Shop

**Logic:**
- Đọc/Ghi vào `shopProfiles/{uid}` trên Firestore.
- Cho phép cập nhật: Tên shop, Mô tả, Thông tin ngân hàng (để rút tiền), Banner shop.
- Upload ảnh banner lên Cloudinary.

---

## 💬 Luồng Nhắn Tin Real-Time

### 21. `ChatListScreen.tsx` — Danh Sách Phòng Chat

**Logic:**
- Query `collection(db, 'chats')` lọc theo `participants array-contains currentUser.uid`.
- Hiển thị danh sách các cuộc trò chuyện đang có, sắp xếp theo `updatedAt` (mới nhất lên đầu).

---

### 22. `ChatScreen.tsx` — Phòng Chat

**Logic xác định phòng chat:**
```javascript
const chatId = userId < targetUserId
  ? `${userId}_${targetUserId}`   // Ghép ID nhỏ hơn lên trước
  : `${targetUserId}_${userId}`;  // để 2 phía luôn ra cùng 1 chatId
```
Mẹo này đảm bảo cùng 1 cặp người dùng luôn dùng **cùng 1 phòng chat** dù Customer hay Seller chủ động nhắn trước.

**Luồng gửi tin:**
```
addDoc(chats/{chatId}/messages, { text, senderId, createdAt })
    ↓
setDoc(chats/{chatId}, { lastMessage, updatedAt }, merge: true)
```

**Luồng nhận tin (Real-time):**
```
onSnapshot(query(chats/{chatId}/messages, orderBy('createdAt')))
→ Tự động cập nhật màn hình ngay khi có tin mới
```

---

## 👑 Luồng Quản Trị (Admin Flow)

### 23. `AdminPayoutScreen.tsx` — Giải Ngân Seller

**Logic:**
- Lắng nghe `shopProfiles` lọc theo `payoutRequested === true`.
- Hiển thị danh sách các shop đang yêu cầu rút tiền.
- Admin bấm "Đã chuyển khoản" → `processPayout()`:
  ```
  writeBatch:
    1. shopProfiles/{id}.availableBalance -= amount
    2. shopProfiles/{id}.payoutRequested = false
    3. Tạo document mới trong payoutHistory
  ```

---

### 24. `AdminReconcileScreen.tsx` — Đối Soát COD

**Logic:**
- Lắng nghe `orders` lọc theo `paymentMethod === 'cod'` và `status === 'delivered'`.
- Đây là các đơn COD mà Shipper đã giao thành công và thu tiền mặt.
- Admin xác nhận đã nhận tiền mặt → Cập nhật trạng thái thành `cod_pending_reconcile` → `completed`.
- Đồng thời cộng tiền vào `availableBalance` của Seller (vì đơn COD không thu tiền ngay từ đầu).

---

### 25. `AdminRefundScreen.tsx` — Hoàn Tiền / Trả Hàng

**Logic:**
- Lắng nghe `orders` lọc theo `status` là `refund_pending` hoặc `return_pending`.
- Admin xem xét yêu cầu của khách:
  - **Chấp nhận hoàn tiền:** Gọi `POST /refund-payment` tới backend Node.js → backend gọi Stripe để hoàn tiền → Cập nhật `orders.status = 'refunded'`.
  - **Chấp nhận trả hàng:** Cập nhật `orders.status = 'returned'`.
  - **Từ chối:** Cập nhật trạng thái về trước.

---

## ⚙️ Backend Node.js (`be/index.js`)

Server chạy bằng **Express.js** trên cổng 3000. Có 2 endpoint:

| Endpoint | Method | Mục đích |
|---|---|---|
| `/create-payment-intent` | POST | Tạo PaymentIntent trên Stripe, trả về `clientSecret` cho app |
| `/refund-payment` | POST | Tạo Refund trên Stripe theo `paymentIntentId` |

**Tại sao cần backend?** Stripe Secret Key không được để trong app (vì có thể bị đánh cắp từ code). Backend đóng vai trò trung gian bảo mật — app chỉ nhận `clientSecret` (chỉ dùng 1 lần), không bao giờ thấy Secret Key.

---

## 🔄 Sơ Đồ Dòng Tiền Khép Kín

```
Khách thanh toán thẻ (Stripe)
    ↓ Tiền giữ tại Stripe
CheckoutScreen → BE /create-payment-intent
    ↓ Thanh toán thành công
orders.status = 'ready_to_ship'
shopProfiles.pendingBalance += total   ← Đóng băng
    ↓ Seller giao hàng thành công
SellerDashboard → "Xác nhận đã giao"
orders.status = 'delivered'
    ↓ (COD: Admin đối soát | Card: Seller yêu cầu rút)
AdminPayout → "Đã chuyển khoản"
shopProfiles.availableBalance += amount
shopProfiles.pendingBalance -= amount  ← Mở băng
Lưu payoutHistory
```
