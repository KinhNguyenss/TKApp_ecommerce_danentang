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

const CATEGORIES = ['Điện tử', 'Thời trang', 'Gia dụng', 'Sách', 'Đồ chơi', 'Làm đẹp', 'Thể thao'];

const SAMPLE_PRODUCTS = [
  { name: 'Tai nghe Bluetooth không dây', desc: 'Tai nghe âm thanh nổi chất lượng cao', basePrice: 350000, category: 'Điện tử' },
  { name: 'Đồng hồ thông minh mặt tròn', desc: 'Đồng hồ theo dõi sức khỏe, đo nhịp tim', basePrice: 850000, category: 'Điện tử' },
  { name: 'Loa Bluetooth Mini', desc: 'Loa di động âm bass cực đỉnh', basePrice: 200000, category: 'Điện tử' },
  { name: 'Sạc dự phòng 10000mAh', desc: 'Sạc nhanh siêu tốc', basePrice: 250000, category: 'Điện tử' },
  
  { name: 'Áo thun nam cotton', desc: 'Áo thun mặc mát mẻ mùa hè', basePrice: 150000, category: 'Thời trang' },
  { name: 'Váy nữ hoạ tiết hoa', desc: 'Váy đi biển phong cách vintage', basePrice: 280000, category: 'Thời trang' },
  { name: 'Quần Jeans nam ống đứng', desc: 'Quần jeans chất bò co giãn', basePrice: 350000, category: 'Thời trang' },
  { name: 'Túi xách nữ thời trang', desc: 'Túi xách da PU cao cấp', basePrice: 420000, category: 'Thời trang' },

  { name: 'Máy xay sinh tố', desc: 'Máy xay sinh tố đa năng 3 cối', basePrice: 450000, category: 'Gia dụng' },
  { name: 'Nồi chiên không dầu', desc: 'Nồi chiên 5L dung tích lớn', basePrice: 1200000, category: 'Gia dụng' },
  { name: 'Máy hút bụi cầm tay', desc: 'Máy hút bụi mini cực mạnh', basePrice: 650000, category: 'Gia dụng' },
  { name: 'Bếp từ đơn', desc: 'Bếp từ kèm nồi lẩu', basePrice: 550000, category: 'Gia dụng' },

  { name: 'Sách Đắc Nhân Tâm', desc: 'Sách nghệ thuật thu phục lòng người', basePrice: 85000, category: 'Sách' },
  { name: 'Tiểu thuyết Nhà giả kim', desc: 'Cuốn sách bán chạy nhất mọi thời đại', basePrice: 75000, category: 'Sách' },
  
  { name: 'Bộ xếp hình Lego', desc: 'Đồ chơi phát triển trí tuệ', basePrice: 320000, category: 'Đồ chơi' },
  { name: 'Xe điều khiển từ xa', desc: 'Xe đua tốc độ cao', basePrice: 250000, category: 'Đồ chơi' },

  { name: 'Kem dưỡng da ban đêm', desc: 'Kem dưỡng ẩm trắng da', basePrice: 450000, category: 'Làm đẹp' },
  { name: 'Son môi lỳ cao cấp', desc: 'Son màu đỏ cam quyến rũ', basePrice: 280000, category: 'Làm đẹp' },

  { name: 'Thảm tập Yoga', desc: 'Thảm chống trượt siêu êm', basePrice: 150000, category: 'Thể thao' },
  { name: 'Tạ tay 5kg', desc: 'Tạ tay tập gym tại nhà', basePrice: 200000, category: 'Thể thao' }
];

async function seedData() {
  console.log('Starting Seed Data...');
  const batch = db.batch();

  // 1. Create Admins
  const adminIds = [];
  for (let i = 1; i <= 2; i++) {
    const email = `admin${i}@tkapp.com`;
    const password = 'password123';
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `Admin ${i}`,
    });
    adminIds.push(userRecord.uid);
    const userRef = db.collection('users').doc(userRecord.uid);
    batch.set(userRef, {
      hoTen: `Admin ${i}`,
      email,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  console.log('Created 2 Admins');

  // 2. Create Businesses
  const businessIds = [];
  for (let i = 1; i <= 10; i++) {
    const email = `seller${i}@tkapp.com`;
    const password = 'password123';
    const shopName = `Cửa hàng ${i} Official`;
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `Seller ${i}`,
    });
    businessIds.push(userRecord.uid);
    const userRef = db.collection('users').doc(userRecord.uid);
    batch.set(userRef, {
      hoTen: `Seller ${i}`,
      email,
      role: 'business',
      address: `10${i} Đường Nguyễn Văn Cừ, Quận 5, TP.HCM`,
      phone: `090123450${i}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const shopRef = db.collection('shopProfiles').doc(userRecord.uid);
    batch.set(shopRef, {
      shopName,
      ownerName: `Seller ${i}`,
      description: `Cửa hàng chuyên cung cấp các sản phẩm chất lượng cao. Gian hàng chính hãng.`,
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
  const customerIds = [];
  for (let i = 1; i <= 20; i++) {
    const email = `customer${i}@tkapp.com`;
    const password = 'password123';
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `Customer ${i}`,
    });
    customerIds.push(userRecord.uid);
    const userRef = db.collection('users').doc(userRecord.uid);
    batch.set(userRef, {
      hoTen: `Customer ${i}`,
      email,
      role: 'customer',
      address: `A${i} Khu đô thị Vinhomes, Bình Thạnh, TP.HCM`,
      phone: `09876543${i.toString().padStart(2, '0')}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  console.log('Created 20 Customers');

  // 4. Create Products
  // Phân bổ ngẫu nhiên sản phẩm cho các seller, mỗi seller khoảng 4-6 sản phẩm
  let productCount = 0;
  for (const sellerId of businessIds) {
    const sellerIndex = businessIds.indexOf(sellerId) + 1;
    // Chọn 5 sản phẩm ngẫu nhiên cho mỗi shop
    const numProducts = 5; 
    for (let i = 0; i < numProducts; i++) {
      const template = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
      const docRef = db.collection('products').doc();
      batch.set(docRef, {
        name: `${template.name} - Mẫu ${i+1}`,
        description: template.desc,
        price: template.basePrice + Math.floor(Math.random() * 50000),
        quantity: Math.floor(Math.random() * 100) + 10,
        soldCount: Math.floor(Math.random() * 50),
        category: template.category,
        sellerId: sellerId,
        sellerName: `Cửa hàng ${sellerIndex} Official`,
        imageUrl: 'https://via.placeholder.com/400x400.png?text=Product', // Placeholder image
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      productCount++;
    }
  }
  
  await batch.commit();
  console.log(`Created ${productCount} Products`);
  console.log('✅ Seed completed successfully!');
  
  console.log('\n--- TÀI KHOẢN ĐĂNG NHẬP MẪU ---');
  console.log('Admin 1: admin1@tkapp.com / password123');
  console.log('Seller 1: seller1@tkapp.com / password123');
  console.log('Customer 1: customer1@tkapp.com / password123');
  console.log('-------------------------------\n');
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
