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

// --- TÊN CỬA HÀNG THỦ CÔNG (HANDMADE SHOPS) ---
const SHOP_NAMES = [
  'Tiệm Gốm An Yên', 
  'Nắng Macrame & Craft', 
  'Mộc Leather Workshop',
  'Nến Thơm Chạng Vạng', 
  'Tiệm Len Của Lơ', 
  'Trạm Thêu Tay',
  'Đá Cuội Jewelry', 
  'Góc Nhà Mộc Mạc (Home Decor)', 
  'Xưởng Gỗ Nhỏ', 
  'Tiệm Hoa Khô Bình Minh'
];

// --- SẢN PHẨM HANDMADE VÀ LINK ẢNH ---
const SAMPLE_PRODUCTS = [
  // Nhóm: Gốm sứ
  {
    name: "Cốc Gốm Men Hỏa Biến Vuốt Tay",
    desc: "Cốc gốm nung củi truyền thống, mỗi chiếc là một vân men duy nhất không đụng hàng.",
    basePrice: 180000,
    category: "Gốm sứ",
    imgUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTVjC257mfWPeHIZyTo_55tug7mWr9u20MZbN1cujOZTCvzsHfSOqgSbhEtRcrYJqLDxeaU6BXjKNU0q4RpMKx8v0eh1K5f45MPnxSnHrUNH4sjoNTWeAzoTKthYjdY2azSFFQvBdxd-Q&usqp=CAc",
  },
  {
    name: "Bình Hoa Gốm Mộc Kiểu Nhật",
    desc: "Bình cắm hoa phong cách Wabi Sabi, bề mặt nhám tự nhiên.",
    basePrice: 350000,
    category: "Gốm sứ",
    imgUrl: "https://gomnhatnakano.com/img/thumb_img-8221.jpg",
  },

  // Nhóm: Len & Macrame
  {
    name: "Túi Tote Đan Macrame Phong Cách Boho",
    desc: "Túi xách đan tay từ sợi cotton thân thiện môi trường, phù hợp đi biển.",
    basePrice: 420000,
    category: "Đan Len & Macrame",
    imgUrl: "https://image.made-in-china.com/202f0j00TdeWyskKPOpS/Popular-Cotton-Rope-Hollow-Straw-Bag-Macrame-Tote-Bohemian-Ultralight-Shoulder-Bag-Net-Bag-.webp",
  },
  {
    name: "Thú Bông Len Amigurumi Thỏ Trắng",
    desc: "Móc khóa/Thú bông móc bằng sợi len baby yarn an toàn cho trẻ em.",
    basePrice: 120000,
    category: "Đan Len & Macrame",
    imgUrl: "https://bizweb.dktcdn.net/thumb/1024x1024/100/487/338/products/thu-bong-dan-len-tho-happy-vietnamoi-04.png?v=1688108466037",
  },

  // Nhóm: Đồ Da Thủ Công
  {
    name: "Ví Nam Da Bò Sáp Khâu Tay",
    desc: "Ví da sáp ngựa điên (Crazy Horse), khâu tay thủ công 100%, miễn phí khắc tên.",
    basePrice: 650000,
    category: "Đồ Da",
    imgUrl: "https://bulltino.com/wp-content/uploads/2025/05/vi-nam-da-bo-sap-dang-dung-khau-tay-thu-cong-1.jpg",
  },
  {
    name: "Sổ Tay Bìa Da Đóng Gáy Vintage",
    desc: "Sổ tay phác thảo bìa da thật, giấy kraft không tẩy trắng.",
    basePrice: 280000,
    category: "Đồ Da",
    imgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaxvyOXNTKe7o5QfzNHkG-Gosqc3MEI8416g&s",
  },

  // Nhóm: Trang sức
  {
    name: "Vòng Tay Đá Phong Thủy Quấn Dây Đồng",
    desc: "Đá Thạch Anh tím thiên nhiên quấn wire-wrap nghệ thuật.",
    basePrice: 320000,
    category: "Trang sức",
    imgUrl: "https://giadinh.mediacdn.vn/296230595582509056/2026/3/23/vong-phong-thuy-17742586492282021035753.jpg",
  },
  {
    name: "Hoa Tai Đất Sét Nung Mẫu Hoa Cúc",
    desc: "Khuyên tai làm từ polymer clay, nhẹ nặn tay tỉ mỉ từng cánh hoa.",
    basePrice: 150000,
    category: "Trang sức",
    imgUrl: "https://chus.vn/images/detailed/204/1647352733_10062-14-f2_w767_h1105.jpg",
  },

  // Nhóm: Nến & Thơm
  {
    name: "Nến Thơm Sáp Đậu Nành Hương Rừng Thông",
    desc: "Nến thơm tinh dầu thiên nhiên, bấc gỗ tạo tiếng lách tách khi đốt.",
    basePrice: 250000,
    category: "Nến & Sáp thơm",
    imgUrl: "https://nenthomhafu.com/wp-content/uploads/2024/10/nen-thom-da-lat-3-scaled.jpg",
  },
  {
    name: "Sáp Thơm Treo Tủ Quần Áo Hoa Khô",
    desc: "Sáp ong pha tinh dầu, trang trí hoa khô tự nhiên, khử mùi ẩm mốc.",
    basePrice: 95000,
    category: "Nến & Sáp thơm",
    imgUrl: "https://liscent.vn/wp-content/uploads/2024/09/vn-11134207-7r98o-lvsdldecd97eeb.jpeg",
  },

  // Nhóm: Trang trí nhà cửa (Home Decor)
  {
    name: "Tranh Thêu Tay Treo Tường Khung Tre",
    desc: "Tranh thêu tay họa tiết cỏ cây mùa xuân trên nền vải linen.",
    basePrice: 450000,
    category: "Trang trí",
    imgUrl: "https://cdn.chus.vn/images/thumbnails/767/767/detailed/208/1647352564_10294-13-f2_w767_h1105.jpg.webp",
  },
  {
    name: "Set 4 Lót Ly Mây Tre Đan Tay",
    desc: "Tấm lót ly cách nhiệt từ sợi mây tự nhiên, thân thiện với môi trường.",
    basePrice: 160000,
    category: "Trang trí",
    imgUrl: "https://tradaophuongdong.com/wp-content/uploads/2022/05/283878617_7414250081980293_9214539554017787410_n.jpg",
  }
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