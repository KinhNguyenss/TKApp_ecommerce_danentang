import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const sampleProducts = [
  {
    name: "Bình Gốm Chu Đậu",
    price: 450000,
    quantity: 10,
    imageUrl: "https://res.cloudinary.com/dqs4tuaru/image/upload/v1775439720/cxgiygn79znhmsaovna3.png", // Dán link từ Bước 1 vào đây
    description: "Sản phẩm gốm thủ công tinh xảo từ làng nghề truyền thống.",
    category: "Gốm sứ"
  },
  {
    name: "Túi Cói Handmade",
    price: 120000,
    quantity: 25,
    imageUrl: "https://res.cloudinary.com/dqs4tuaru/image/upload/v1775439720/cxgiygn79znhmsaovna3.png",
    description: "Túi cói đan tay, thân thiện với môi trường.",
    category: "Thời trang"
  },
  {
    name: "Tranh Sơn Mài Sen",
    price: 890000,
    quantity: 5,
    imageUrl: "https://res.cloudinary.com/dqs4tuaru/image/upload/v1775439720/cxgiygn79znhmsaovna3.png",
    description: "Tranh sơn mài vẽ tay nghệ thuật.",
    category: "Trang trí"
  }
];

export const seedProducts = async () => {
  try {
    const q = query(collection(db, "products"));
    const snapshot = await getDocs(q);
    
    // Nếu đã có dữ liệu rồi thì không thêm nữa để tránh trùng lặp
    if (snapshot.empty) {
      for (const product of sampleProducts) {
        await addDoc(collection(db, "products"), product);
      }
      console.log("✅ Đã khởi tạo dữ liệu mẫu thành công!");
    }
  } catch (error) {
    console.error("Lỗi khi seed data: ", error);
  }
};