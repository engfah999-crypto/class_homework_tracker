import { Prompt } from "next/font/google";
import "./globals.css";

// โหลดฟอนต์ Prompt และตั้งค่าน้ำหนักที่ต้องการ
const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt", // สร้าง CSS Variable
  display: 'swap',
});

export const metadata = {
  title: "Class Homework Tracker",
  description: "ระบบจดการบ้านห้องเรียน 2/10",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      {/* เรียกใช้ฟอนต์ Prompt ในระดับ Body */}
      <body className={`${prompt.variable} font-sans antialiased bg-slate-50`}>
        {children}
      </body>
    </html>
  );
}