import { Prompt } from "next/font/google";
import "./globals.css";

// โหลดฟอนต์ Prompt (เอา variable ออก)
const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
});

export const metadata = {
  title: "Class Homework Tracker",
  description: "ระบบจดการบ้านห้องเรียน 2/10",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      {/* ใช้ prompt.className ตรงๆ เลย Next.js จะบังคับยัดฟอนต์ Prompt ให้ทุกจุดอัตโนมัติ */}
      <body className={`${prompt.className} antialiased bg-slate-50 text-slate-800`}>
        {children}
      </body>
    </html>
  );
}