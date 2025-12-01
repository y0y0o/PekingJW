// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getFirestore } from 'firebase/firestore';

/**
 * TODO: 部署到 Google Cloud / Firebase 时的配置步骤：
 * 1. 访问 https://console.firebase.google.com/
 * 2. 创建一个新项目
 * 3. 添加一个 Web 应用
 * 4. 复制配置及其 API Key 到下方
 */

// 默认是空的，这意味着应用会回退到使用 LocalStorage (本地存储)
// 当你填入下方真实的 API Key 后，应用会自动切换到云端数据库
const firebaseConfig = {
  apiKey: "", // 例如: "AIzaSyD..."
  authDomain: "", // 例如: "your-project.firebaseapp.com"
  projectId: "", // 例如: "your-project"
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// 显式定义类型为 any，解决 TypeScript 的 "implicitly has an 'any' type" 报错
let db: any = null;

// 只有当配置存在时才初始化 Firebase
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase Cloud Database 连接成功");
  } catch (e) {
    console.error("Firebase 初始化失败:", e);
  }
} else {
  console.log("未检测到 Firebase 配置，应用将使用本地存储模式 (LocalStorage)");
}

export { db };