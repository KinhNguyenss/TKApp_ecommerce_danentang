const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const collectionsToClear = [
  'users',
  'products',
  'shopProfiles',
  'orders',
  'reviews',
  'chats',
  'messages',
  'payoutHistory',
  'wishlists'
];

// --- DATA NGUỒN ĐỂ TẠO TÊN NGƯỜI VIỆT NGẪU NHIÊN ---
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Đặng', 'Bùi', 'Vũ', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const TEN_DEM = ['Văn', 'Thị', 'Hoàng', 'Thu', 'Ngọc', 'Sơn', 'Mỹ', 'Hải', 'Thanh', 'Minh', 'Đức', 'Quang', 'Hữu', 'Gia', 'Tuấn'];
const TEN = ['An', 'Bích', 'Hải', 'Thủy', 'Tuấn', 'Mai', 'Tùng', 'Linh', 'Đăng', 'Trúc', 'Hùng', 'Hương', 'Hà', 'Phong', 'Trang', 'Khang', 'Nhi', 'Khánh'];

function getRandomVietnameseName() {
  const ho = HO[Math.floor(Math.random() * HO.length)];
  const tenDem = TEN_DEM[Math.floor(Math.random() * TEN_DEM.length)];
  const ten = TEN[Math.floor(Math.random() * TEN.length)];
  return `${ho} ${tenDem} ${ten}`;
}

// --- TÊN CỬA HÀNG THỰC TẾ ---
const SHOP_NAMES = [
  'TechZone VN Official', 
  'Hải Đăng Mobile', 
  'Mỹ Phẩm Coco Cosmetics',
  'Gia Dụng Thông Minh 247', 
  'Kệ Sách Của Gấu', 
  'Lego & Toys Kids Store',
  'Gym & FitBox', 
  'Adam Store - Thời Trang Nam', 
  'Váy Xinh Boutique', 
  'Điện Máy Sunhouse Chính Hãng'
];

// --- SẢN PHẨM GẮN LIỀN VỚI THƯƠNG HIỆU THẬT VÀ LINK ẢNH ---
const SAMPLE_PRODUCTS = [
  {
    name: "Tai nghe Bluetooth Sony WF-1000XM4",
    desc: "Tai nghe chống ồn chủ động cao cấp từ Sony, pin 24h",
    basePrice: 4500000,
    category: "Điện tử",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/189ecc4fd3253dfceb2b872e1c254d0872ac76c5.jpg",
  },
  {
    name: "Đồng hồ thông minh Apple Watch SE",
    desc: "Đồng hồ theo dõi sức khỏe, đo nhịp tim chính hãng VN/A",
    basePrice: 6500000,
    category: "Điện tử",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/cad9f7b0b7d12e68ded1c94af91696764160a631.jpg",
  },
  {
    name: "Loa Bluetooth JBL Flip 6",
    desc: "Loa di động âm bass cực đỉnh, chống nước IP67",
    basePrice: 2200000,
    category: "Điện tử",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/cf69c25c14259a9c18302755e254d133dbd7c0c3.jpg",
  },
  {
    name: "Sạc dự phòng Anker PowerCore 10000mAh",
    desc: "Sạc nhanh siêu tốc 20W, thiết kế nhỏ gọn",
    basePrice: 650000,
    category: "Điện tử",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/47d99c27d089bfd4d70d771e2255ed25992b364e.jpg",
  },
  {
    name: "Áo thun nam cotton Coolmate",
    desc: "Áo thun mặc mát mẻ mùa hè, chống nhăn, kháng khuẩn",
    basePrice: 250000,
    category: "Thời trang",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/4a866469b42081d201b04adc8707261ea282f896.jpg",
  },
  {
    name: "Váy nữ hoạ tiết hoa Marc Fashion",
    desc: "Váy đi biển phong cách vintage, chất liệu lụa mềm",
    basePrice: 450000,
    category: "Thời trang",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/63ccd4b05b412b22e683e46d6f600b770e981f9e.jpg",
  },
  {
    name: "Quần Jeans nam Levi's 501 ống đứng",
    desc: "Quần jeans chất bò co giãn chính hãng, độ bền cao",
    basePrice: 1200000,
    category: "Thời trang",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/8de2bca146adb8eaacf8e5d78d826d133ec07023.jpg",
  },
  {
    name: "Túi xách nữ da thật Juno",
    desc: "Túi xách thời trang công sở cao cấp",
    basePrice: 720000,
    category: "Thời trang",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/ffc746d1446ca468166061d53c2f8b6c1cea04d9.jpg",
  },
  {
    name: "Máy xay sinh tố Philips HR2221",
    desc: "Máy xay sinh tố đa năng 5 tốc độ, công suất 700W",
    basePrice: 1150000,
    category: "Gia dụng",
    imgUrl: "https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/137d58fd-e783-5c1a-a1b5-6a8542de6ac7/c1fa9505-eea6-59ed-ae06-a866cd21a978.jpg",
  },
  {
    name: "Nồi chiên không dầu Lock&Lock 5.2L",
    desc: "Nồi chiên điện tử công nghệ nướng chân không",
    basePrice: 1850000,
    category: "Gia dụng",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/875ef18683892e3af0c27eb8933ace7cf8349c77.jpg",
  },
  {
    name: "Máy hút bụi cầm tay không dây Xiaomi",
    desc: "Lực hút mạnh 50AW, trọng lượng siêu nhẹ 1.2kg",
    basePrice: 2100000,
    category: "Gia dụng",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/403eabf894ed19e0104ba81bddcb1aeb345c10b9.jpg",
  },
  {
    name: "Bếp từ đơn Sunhouse SHD6861",
    desc: "Bếp từ kèm nồi lẩu mâm đồng siêu bền",
    basePrice: 650000,
    category: "Gia dụng",
    imgUrl: "https://cdn.tgdd.vn/Products/Images/1982/63975/tu-sieu-mong-sunhouse-shd-6861-2000w-1.jpg",
  },
  {
    name: "Sách Đắc Nhân Tâm - Dale Carnegie",
    desc: "Bản dịch chuẩn từ First News, bìa cứng",
    basePrice: 120000,
    category: "Sách",
    imgUrl: "https://pplx-res.cloudinary.com/image/upload/pplx_search_images/7c810fabc44790f17028dd58bbe0e54e94daee95.jpg",
  },
  {
    name: "Tiểu thuyết Nhà Giả Kim - Paulo Coelho",
    desc: "Cuốn sách bán chạy nhất mọi thời đại, tái bản 2023",
    basePrice: 85000,
    category: "Sách",
    imgUrl: "https://i0.wp.com/asean.edu.vn/wp-content/uploads/2024/05/2.png?fit=250%2C350&ssl=1",
  },
  {
    name: "Bộ xếp hình Lego City Cảnh Sát",
    desc: "Đồ chơi phát triển trí tuệ, an toàn cho bé",
    basePrice: 650000,
    category: "Đồ chơi",
    imgUrl: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTjO3mIkWFX4ueDK_lzcFhCNu9wZLvAd_FHsKhpIC75O2EvXhtgaUq87xvYNIrc7yTPKWLSh7xOxLEJnc602aLoIrKegfzB5O6JxwFlpiwas5VvPvvVRJkDy6BTi-QCrUuzC02O6Q6-uQ&usqp=CAc",
  },
  {
    name: "Siêu xe điều khiển từ xa RC Lamborghini",
    desc: "Xe đua tốc độ cao, pin sạc USB",
    basePrice: 350000,
    category: "Đồ chơi",
    imgUrl: "https://img.lazcdn.com/g/p/492df810a557b93ab9b0ede8a71253c7.jpg_720x720q80.jpg",
  },
  {
    name: "Kem dưỡng da ban đêm L'Oreal Paris",
    desc: "Kem dưỡng ẩm trắng da mờ thâm nám 50ml",
    basePrice: 350000,
    category: "Làm đẹp",
    imgUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSDSgXcvkLfTw5HuMf_a8YvgXFtnGEP7j9z0xecvcddgSC8uI7dDD3jGolfi5ulmr8UuzQ4puOFTqXIe7fiQ3v8zVLOIMI13l4LMRzxAXuHfFtrgtX7-7fKUlB_m0kmIF5EBkMrSg&usqp=CAc",
  },
  {
    name: "Son thỏi MAC Ruby Woo",
    desc: "Son lỳ màu đỏ huyền thoại quyến rũ phái đẹp",
    basePrice: 580000,
    category: "Làm đẹp",
    imgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGKkye_CRuqSV5q94rQwmbh0WWeYS25C--Ww&s",
  },
  {
    name: "Thảm tập Yoga định tuyến Liforme",
    desc: "Thảm cao su tự nhiên bám dính siêu tốt, dày 4.2mm",
    basePrice: 2100000,
    category: "Thể thao",
    imgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHR5uqYWqgOSEtXuw7C7OqoCUCJFY4sPJiUA&s",
  },
  {
    name: "Tạ Tay Bibo Bọc Cao Su",
    desc: "Tạ tay tập gym tại nhà, lõi gang đặc",
    basePrice: 350000,
    category: "Thể thao",
    imgUrl: "https://bizweb.dktcdn.net/100/144/271/files/18301088-807481849417390-7725329012757197099-n.jpg?v=1501899115630",
  },
];

async function clearAuthUsers() {
  console.log('Clearing Auth Users...');
  const listUsersResult = await auth.listUsers(1000);
  const uids = listUsersResult.users.map((userRecord) => userRecord.uid);
  if (uids.length > 0) {
    await auth.deleteUsers(uids);
    console.log(`Deleted ${uids.length} users from Auth.`);
  } else {
    console.log('No users to delete in Auth.');
  }
}

async function clearCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  if (snapshot.size === 0) return;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Cleared ${snapshot.size} documents from ${collectionPath}`);
}

async function clearAllCollections() {
  console.log('Clearing Firestore Collections...');
  for (const coll of collectionsToClear) {
    await clearCollection(coll);
  }
}

async function seedData() {
  console.log('Starting Seed Data...');
  const batch = db.batch();

  // 1. Create Admins
  const adminIds = [];
  for (let i = 1; i <= 2; i++) {
    const email = `admin${i}@gmail.com`;
    const password = '123456';
    const hoTen = getRandomVietnameseName();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: hoTen,
    });
    adminIds.push(userRecord.uid);
    const userRef = db.collection('users').doc(userRecord.uid);
    batch.set(userRef, {
      hoTen: hoTen,
      email,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  console.log('Created 2 Admins');

  // 2. Create Businesses
  const businessIds = [];
  for (let i = 1; i <= 10; i++) {
    const email = `seller${i}@gmail.com`;
    const password = '123456';
    const hoTen = getRandomVietnameseName();
    const shopName = SHOP_NAMES[i - 1]; // Lấy tên shop từ mảng
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: hoTen,
    });
    businessIds.push(userRecord.uid);
    
    const userRef = db.collection('users').doc(userRecord.uid);
    batch.set(userRef, {
      hoTen: hoTen,
      email,
      role: 'business',
      address: `10${i} Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM`,
      phone: `090123450${i}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const shopRef = db.collection('shopProfiles').doc(userRecord.uid);
    batch.set(shopRef, {
      shopName,
      ownerName: hoTen,
      description: `Chào mừng bạn đến với ${shopName}. Cam kết hàng chính hãng 100%, bảo hành uy tín, giao hàng hỏa tốc trong 2h.`,
      availableBalance: 0,
      pendingBalance: 0,
      payoutRequested: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      bankName: 'Vietcombank',
      bankAccountNumber: `10002000300${i}`
    });
  }
  console.log('Created 10 Businesses');

  // 3. Create Customers
  const customerInfo = [];
  for (let i = 1; i <= 20; i++) {
    const email = `customer${i}@gmail.com`;
    const password = '123456';
    const hoTen = getRandomVietnameseName();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: hoTen,
    });
    customerInfo.push({ uid: userRecord.uid, hoTen: hoTen });
    const userRef = db.collection('users').doc(userRecord.uid);
    batch.set(userRef, {
      hoTen: hoTen,
      email,
      role: 'customer',
      address: `Căn hộ A${i}, Khu đô thị Vinhomes Central Park, Bình Thạnh, TP.HCM`,
      phone: `09876543${i.toString().padStart(2, '0')}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  console.log('Created 20 Customers');

  // 4. Create Products & Reviews
  const SAMPLE_COMMENTS = [
    'Hàng chuẩn chính hãng, săn sale được giá rất hời. Đỉnh!',
    'Đóng gói cực kỳ cẩn thận, bọc chống sốc 3 lớp. Giao hàng nhanh.',
    'Chất lượng vượt ngoài mong đợi so với tầm giá. Shop tư vấn nhiệt tình.',
    'Màu sắc bên ngoài đẹp hơn trong ảnh. Rất ưng ý!',
    'Đã check mã vạch, hàng auth 100%. Sẽ giới thiệu cho bạn bè.',
    'Shipper thân thiện, hàng nguyên seal không bị móp méo.',
    'Mình mua lần thứ 2 ở shop này rồi, chưa bao giờ làm mình thất vọng.',
    'Hơi buồn vì giao trễ 1 ngày, nhưng bù lại hàng chất lượng nên vẫn cho 5 sao.',
    'Sử dụng rất êm và mượt. Đáng đồng tiền bát gạo.',
    'Tuyệt vời! Chúc shop mua may bán đắt nhé.'
  ];

  let productCount = 0;
  let reviewCount = 0;
  
  for (const sellerId of businessIds) {
    const sellerIndex = businessIds.indexOf(sellerId);
    const shopName = SHOP_NAMES[sellerIndex];
    const numProducts = 5; 
    
    for (let i = 0; i < numProducts; i++) {
      const template = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
      const productRef = db.collection('products').doc();
      
      batch.set(productRef, {
        name: template.name,
        description: template.desc,
        price: template.basePrice + (Math.floor(Math.random() * 10) * 10000), // Random giá chênh lệch một xíu
        quantity: Math.floor(Math.random() * 100) + 10,
        soldCount: Math.floor(Math.random() * 300) + 50, // Lượt bán cao cho giống hàng thật
        category: template.category,
        sellerId: sellerId,
        sellerName: shopName,
        imageUrl: template.imgUrl, // LẤY ĐÚNG LINK ẢNH TỪ MẢNG BẠN CUNG CẤP
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      productCount++;

      // Tạo đánh giá cho mỗi sản phẩm
      for (let j = 0; j < 5; j++) {
        const randomCustomer = customerInfo[Math.floor(Math.random() * customerInfo.length)];
        const reviewRef = db.collection('reviews').doc();
        batch.set(reviewRef, {
          productId: productRef.id,
          userId: randomCustomer.uid,
          userName: randomCustomer.hoTen,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 sao
          comment: SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        reviewCount++;
      }
    }
  }
  
  await batch.commit();
  console.log(`Created ${productCount} Products`);
  console.log(`Created ${reviewCount} Reviews`);
  console.log('✅ Seed completed successfully!');
  
  console.log('\n--- TÀI KHOẢN ĐĂNG NHẬP (MẬT KHẨU CHUNG: 123456) ---');
  console.log('Admin:    admin1@gmail.com');
  console.log('Seller:   seller1@gmail.com');
  console.log('Customer: customer1@gmail.com');
  console.log('--------------------------------------------------\n');
}

async function run() {
  try {
    await clearAuthUsers();
    await clearAllCollections();
    await seedData();
    process.exit(0);
  } catch (err) {
    console.error('Error in seed script:', err);
    process.exit(1);
  }
}

run();