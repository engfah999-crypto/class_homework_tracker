"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../lib/firebase"; 
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

import { 
  BookOpen, Calendar as CalendarIcon, Home, Search, Shield, User, 
  LogOut, Moon, Sun, CheckSquare, Clock, AlertCircle, Edit3, 
  Trash2, Plus, Star, Award, ChevronLeft, ChevronRight, Menu, X, Check
} from 'lucide-react';

// ==========================================
// 1. CONSTANTS & SCHEDULE DATA
// ==========================================
const THAI_TIMEZONE = 'Asia/Bangkok';

const SCHEDULE = {
  1: [
    { id: 'mon1', name: 'การงานอาชีพ', code: 'ง22102', group: 'กลุ่ม 1' },
    { id: 'mon2', name: 'การงานอาชีพ', code: 'ง22102', group: 'กลุ่ม 2' },
    { id: 'mon3', name: 'วิทยาศาสตร์', code: 'ว22102' },
    { id: 'mon4', name: 'คณิตศาสตร์', code: 'ค22103' },
    { id: 'mon5', name: 'ภาษาอังกฤษ', code: 'อ22103' },
    { id: 'mon6', name: 'ภาษาไทย', code: 'ท22102' },
    { id: 'mon7', name: 'IS', code: 'I20201' },
  ],
  2: [
    { id: 'tue1', name: 'ภาษาอังกฤษ', code: 'อ22103' },
    { id: 'tue2', name: 'คณิตศาสตร์', code: 'ค22103' },
    { id: 'tue3', name: 'แนะแนว', code: '22901' },
    { id: 'tue4', name: 'วิชาแยก สอวน.', code: '', desc: '(ชีววิทยา, เคมี, ฟิสิกส์, ดาราศาสตร์, คอมพิวเตอร์)' },
    { id: 'tue5', name: 'ลส/นน', code: '' },
    { id: 'tue6', name: 'สังคมศึกษา', code: 'ส22101' },
  ],
  3: [
    { id: 'wed1', name: 'สุขศึกษา', code: 'พ22101' },
    { id: 'wed2', name: 'คณิตศาสตร์', code: 'ค22103' },
    { id: 'wed3', name: 'สังคมศึกษา', code: 'ส22101' },
    { id: 'wed4', name: 'Homeroom', code: '' },
    { id: 'wed5', name: 'ภาษาอังกฤษเสริม', code: 'อ22203' },
    { id: 'wed6', name: 'ภาษาไทย', code: 'ท22101' },
    { id: 'wed7', name: 'สังคมศึกษา', code: 'ส22101' },
  ],
  4: [
    { id: 'thu1', name: 'ภาษาไทย', code: 'ท22101' },
    { id: 'thu2', name: 'ภาษาอังกฤษ', code: 'อ22203' },
    { id: 'thu3', name: 'พลศึกษา', code: 'พ22102' },
    { id: 'thu4', name: 'คอมพิวเตอร์', code: 'ว20282' },
    { id: 'thu5', name: 'คณิตศาสตร์', code: 'ค22203' },
    { id: 'thu6', name: 'ศิลปะ', code: 'ศ22101' },
  ],
  5: [
    { id: 'fri1', name: 'วิทยาศาสตร์', code: 'ว22103' },
    { id: 'fri2', name: 'คณิตศาสตร์', code: 'ค22203' },
    { id: 'fri3', name: 'ประวัติศาสตร์', code: 'ส22102' },
    { id: 'fri4', name: 'ภาษาอังกฤษ', code: 'อ22103' },
  ]
};

const DAYS_TH = ['', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];
const BADGES = ['🏆 นักจดการบ้านดีเด่น', '📚 จดละเอียดแห่งสัปดาห์', '⚡ อัปเดตไวที่สุด', '🎯 ส่งครบตรงเวลา'];
const PRAISES = ['⭐ จดละเอียดมาก', '⭐ ส่งงานตรงเวลา', '⭐ สรุปดี เข้าใจง่าย', '⭐ รับผิดชอบดีมาก', '⭐ ขยันอัปเดตข้อมูล'];

const DEFAULT_USERS = [
  { id: 'u1', username: 'Yupparaj', password: 'admin m.2/10', name: 'ผู้ดูแลระบบ', role: 'admin', points: 0, badges: [], praises: [], status: 'offline', lastLogin: '-', isLocked: false, forcePwd: false },
  { id: 'u2', username: 'writer1', password: 'password', name: 'กุลรดา (คนจด)', role: 'writer', points: 15, badges: ['⚡ อัปเดตไวที่สุด'], praises: ['⭐ จดละเอียดมาก'], status: 'offline', lastLogin: '-', isLocked: false, forcePwd: false },
  { id: 'u3', username: 'writer2', password: 'password', name: 'สมชาย (คนจด)', role: 'writer', points: 5, badges: [], praises: [], status: 'offline', lastLogin: '-', isLocked: false, forcePwd: false }
];

// ==========================================
// 2. HELPER FUNCTIONS & COMPONENTS
// ==========================================
const getThaiDateInfo = (dateObj = new Date()) => {
  const thaiTime = new Date(dateObj.toLocaleString("en-US", { timeZone: THAI_TIMEZONE }));
  const day = thaiTime.getDay();
  const isWeekend = day === 0 || day === 6;
  const activeDay = isWeekend ? 1 : day;
  const dateStr = thaiTime.toISOString().split('T')[0];
  return { date: thaiTime, dayOfWeek: activeDay, dateStr, isWeekend };
};

const formatDateTH = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const SmoothTextarea = ({ value, onChange, placeholder, className }) => {
  const [localValue, setLocalValue] = useState(value || '');
  useEffect(() => { setLocalValue(value || ''); }, [value]);
  return (
    <textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => { if (localValue !== (value || '')) onChange(localValue); }}
      placeholder={placeholder}
      className={className}
    />
  );
};

// ==========================================
// 3. MAIN APP COMPONENT
// ==========================================
export default function HomeworkTracker() {

  const [users, setUsers] = useState(DEFAULT_USERS);
  const [records, setRecords] = useState({});
  const [logs, setLogs] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [pendingPwdUser, setPendingPwdUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('login');
  
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States สำหรับหน้าค้นหา
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // States สำหรับหน้าแอดมิน
  const [adminShowAddForm, setAdminShowAddForm] = useState(false);
  const [adminEditUserId, setAdminEditUserId] = useState(null);
  const [adminFormData, setAdminFormData] = useState({ username: '', password: '', name: '' });
  const [adminCustomInputs, setAdminCustomInputs] = useState({});

  // ==========================================
  // ระบบเชื่อมต่อ Firebase (Real-time Sync)
  // ==========================================

  const syncToDB = async (dataToUpdate) => {
    try {
      const docRef = doc(db, "homeworkData", "main");
      await setDoc(docRef, dataToUpdate, { merge: true });
    } catch (error) {
      console.error("Firebase Sync Error:", error);
    }
  };

  useEffect(() => {
    const todayInfo = getThaiDateInfo();
    setSelectedDateStr(todayInfo.dateStr);
    setSelectedDayOfWeek(todayInfo.dayOfWeek);
    setIsMounted(true);

    const docRef = doc(db, "homeworkData", "main");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUsers(data.users || DEFAULT_USERS);
        setRecords(data.records || {});
        setLogs(data.logs || []);
        
        if (currentUser) {
            const updatedMe = (data.users || []).find(u => u.id === currentUser.id);
            if (updatedMe) setCurrentUser(updatedMe);
        }
      } else {
        setDoc(docRef, { users: DEFAULT_USERS, records: {}, logs: [] });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // ==========================================
  // ACTIONS
  // ==========================================

  const handleLogin = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.isLocked) { alert('บัญชีนี้ถูกล็อกการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ'); return; }
      if (user.forcePwd) { setPendingPwdUser(user); return; }
      proceedLogin(user);
    } else {
      alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const proceedLogin = (user) => {
    const now = new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE });
    const newUsers = users.map(u => u.id === user.id ? { ...u, status: 'online', lastLogin: now } : u);
    
    syncToDB({ users: newUsers }); 
    setCurrentUser({ ...user, status: 'online', lastLogin: now });
    setCurrentView('dashboard');
    setPendingPwdUser(null);
  };

  const handleForcePasswordChange = (e) => {
    e.preventDefault();
    const newPwd = e.target.newPassword.value;
    const user = pendingPwdUser;
    const now = new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE });
    
    const newUsers = users.map(u => u.id === user.id ? { ...u, password: newPwd, forcePwd: false, status: 'online', lastLogin: now } : u);
    
    syncToDB({ users: newUsers });
    setCurrentUser({ ...user, password: newPwd, forcePwd: false, status: 'online', lastLogin: now });
    setCurrentView('dashboard');
    setPendingPwdUser(null);
    alert('เปลี่ยนรหัสผ่านสำเร็จ!');
  };

  const handleLogout = () => {
    if (currentUser) {
      const newUsers = users.map(u => u.id === currentUser.id ? { ...u, status: 'offline' } : u);
      syncToDB({ users: newUsers });
    }
    setCurrentUser(null);
    setCurrentView('login');
  };

  // ☁️ ฟังก์ชันอัปเดตตารางเรียน (แก้ปัญหาติ๊ก Checkbox ไม่ติด)
  const updateRecord = async (dateStr, subjectId, field, value) => {
    // 1. จำลองข้อมูลปัจจุบันขึ้นมาใหม่ทันที
    const dayRecord = records[dateStr] || { note: '', subjects: {} };
    const subjectRecord = dayRecord.subjects?.[subjectId] || { topic: '', hasHw: false, hwDetail: '', hasDue: false, dueDate: '' };
    
    const updatedDayData = { 
      ...dayRecord, 
      subjects: { 
        ...(dayRecord.subjects || {}), 
        [subjectId]: { ...subjectRecord, [field]: value } 
      } 
    };

    // 2. สั่งเปลี่ยน State ในหน้าจอตัวเองทันที เพื่อให้ Checkbox ติดหนึบไม่มีดีเลย์
    setRecords(prev => ({ ...prev, [dateStr]: updatedDayData }));

    // 3. ส่งข้อมูลชุดที่เปลี่ยน ขึ้น Firebase
    try {
      const docRef = doc(db, "homeworkData", "main");
      await setDoc(docRef, { records: { [dateStr]: updatedDayData } }, { merge: true });
    } catch (err) {
      console.error("Firebase updateRecord error:", err);
    }

    // 4. บันทึก Log การกระทำลงระบบ
    if (currentUser) {
      const scheduleItem = Object.values(SCHEDULE).flat().find(s => s.id === subjectId);
      const subjName = scheduleItem ? scheduleItem.name : 'วิชา';
      let actionDetail = '';
      if(field === 'topic') actionDetail = `แก้ไขเรื่องที่เรียน ${subjName}`;
      else if(field === 'hasHw') actionDetail = value ? `เพิ่มการบ้านวิชา ${subjName}` : `ลบการบ้านวิชา ${subjName}`;
      else if(field === 'hwDetail') actionDetail = `แก้ไขรายละเอียดการบ้านวิชา ${subjName}`;
      else if(field === 'hasDue') actionDetail = value ? `เพิ่มกำหนดส่งวิชา ${subjName}` : `ยกเลิกกำหนดส่งวิชา ${subjName}`;
      else if(field === 'dueDate') actionDetail = `เลื่อน/เปลี่ยนกำหนดส่งวิชา ${subjName}`;

      if (actionDetail) {
         setLogs(prevLogs => {
            if(prevLogs.length > 0 && prevLogs[0].detail === actionDetail && prevLogs[0].by === currentUser.name) return prevLogs;
            const newLogs = [{ id: Date.now(), action: 'อัปเดตงาน', detail: actionDetail, by: currentUser.name, time: new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE }) }, ...prevLogs].slice(0, 50);
            
            // อัปเดต Log ขึ้น Firebase
            const docRef = doc(db, "homeworkData", "main");
            setDoc(docRef, { logs: newLogs }, { merge: true });
            return newLogs;
         });
      }
    }
  };

  const updateDailyNote = async (dateStr, note) => {
    const dayRecord = records[dateStr] || { note: '', subjects: {} };
    const updatedDayData = { ...dayRecord, note };

    setRecords(prev => ({ ...prev, [dateStr]: updatedDayData }));

    try {
      const docRef = doc(db, "homeworkData", "main");
      await setDoc(docRef, { records: { [dateStr]: updatedDayData } }, { merge: true });
    } catch (err) {
      console.error("Firebase updateDailyNote error:", err);
    }
  };

  const handleDateOffset = (offset) => {
    const d = new Date(selectedDateStr);
    d.setDate(d.getDate() + offset);
    if (d.getDay() === 0) d.setDate(d.getDate() + (offset > 0 ? 1 : -2));
    if (d.getDay() === 6) d.setDate(d.getDate() + (offset > 0 ? 2 : -1));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    setSelectedDateStr(`${year}-${month}-${dayStr}`);
    setSelectedDayOfWeek(d.getDay());
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'writer';
  const isAdmin = currentUser?.role === 'admin';

  if (!isMounted) return null;

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================

  const renderDateNavigator = () => (
    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/50 w-full md:w-auto justify-center">
      <button onClick={() => handleDateOffset(-1)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"><ChevronLeft size={20} /></button>
      <div className="flex items-center gap-2 px-2">
        <input 
          type="date" 
          value={selectedDateStr}
          onChange={(e) => {
            const date = new Date(e.target.value);
            const day = date.getDay();
            if(day === 0 || day === 6) { alert("กรุณาเลือกวันจันทร์ - ศุกร์"); return; }
            setSelectedDateStr(e.target.value);
            setSelectedDayOfWeek(day);
          }}
          className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 text-sm md:text-base cursor-pointer"
        />
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 border-l border-slate-200 dark:border-slate-700 pl-3">
          {DAYS_TH[selectedDayOfWeek]}
        </span>
      </div>
      <button onClick={() => handleDateOffset(1)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"><ChevronRight size={20} /></button>
    </div>
  );

  const renderLayout = (childrenContent) => (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200`}>
      <div className={`md:hidden flex items-center justify-between p-4 shadow-sm z-20 sticky top-0 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg"><BookOpen size={24} /> <span>2/10 Tracker</span></div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">{isMobileMenuOpen ? <X /> : <Menu />}</button>
      </div>

      <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 flex-shrink-0 shadow-lg z-10 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} transition-all fixed md:sticky top-0 h-screen md:h-screen`}>
        <div className="p-6 hidden md:flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold text-xl border-b border-slate-100 dark:border-slate-700 shrink-0">
          <BookOpen size={28} /><h2>Homework Tracker</h2>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
            <p className="text-xs opacity-80 mb-1">สถานะผู้ใช้</p>
            <p className="font-semibold truncate">{currentUser ? currentUser.name : 'นักเรียน (ผู้เยี่ยมชม)'}</p>
            <p className="text-xs mt-1 bg-white/20 inline-block px-2 py-0.5 rounded-full capitalize">{currentUser ? currentUser.role : 'Guest'}</p>
          </div>

          <ul className="space-y-1">
            <li><button onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 opacity-80 hover:opacity-100'}`}><Home size={20}/> <span className="text-sm">หน้าแรก (Dashboard)</span></button></li>
            <li><button onClick={() => { setCurrentView('timetable'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentView === 'timetable' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 opacity-80 hover:opacity-100'}`}><CheckSquare size={20}/> <span className="text-sm">ตารางเรียน & การบ้าน</span></button></li>
            <li><button onClick={() => { setCurrentView('calendar'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentView === 'calendar' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 opacity-80 hover:opacity-100'}`}><CalendarIcon size={20}/> <span className="text-sm">ปฏิทินงาน</span></button></li>
            <li><button onClick={() => { setCurrentView('search'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentView === 'search' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 opacity-80 hover:opacity-100'}`}><Search size={20}/> <span className="text-sm">ค้นหาข้อมูล</span></button></li>
            
            {currentUser?.role === 'writer' && (
              <li><button onClick={() => { setCurrentView('profile'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentView === 'profile' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 opacity-80 hover:opacity-100'}`}><Star size={20}/> <span className="text-sm">โปรไฟล์นักจด</span></button></li>
            )}
            
            {isAdmin && (
              <>
                <li className="pt-4 pb-2 text-xs font-bold uppercase tracking-wider opacity-50 px-3">เมนูผู้ดูแลระบบ</li>
                <li><button onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentView === 'admin' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 opacity-80 hover:opacity-100'}`}><User size={20}/> <span className="text-sm">จัดการสมาชิก</span></button></li>
                <li><button onClick={() => { setCurrentView('logs'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${currentView === 'logs' ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 opacity-80 hover:opacity-100'}`}><Clock size={20}/> <span className="text-sm">ประวัติการแก้ไข</span></button></li>
              </>
            )}
          </ul>
        </div>
        
        <div className="w-full p-4 border-t border-slate-100 dark:border-slate-700 bg-inherit shrink-0">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium mb-2">
            {isDarkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-500"/>}
            {isDarkMode ? 'โหมดสว่าง' : 'โหมดกลางคืน'}
          </button>
          
          {currentUser ? (
            <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors text-sm font-medium"><LogOut size={20} /> ออกจากระบบ</button>
          ) : (
            <button onClick={() => setCurrentView('login')} className="flex items-center gap-3 w-full p-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-colors text-sm font-medium"><LogOut size={20} className="rotate-180" /> เข้าสู่ระบบ</button>
          )}

          {/* เครดิตผู้พัฒนา */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
              ออกแบบและพัฒนาโดย<br/>ด.ญ.กุลรดา รังสิยานนท์
            </p>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-h-screen overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-5xl mx-auto pb-20 md:pb-0">
          {childrenContent}
        </div>
      </main>
    </div>
  );

  if (currentView === 'login') {
    if (pendingPwdUser) {
      return (
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-blue-50 text-slate-800'} p-4`}>
          <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <Shield className="mx-auto text-orange-500 mb-4" size={48} />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">บังคับเปลี่ยนรหัสผ่าน</h2>
              <p className="text-sm text-slate-500 mt-2">แอดมินได้รีเซ็ตรหัสผ่านของคุณ กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัย</p>
            </div>
            <form onSubmit={handleForcePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">รหัสผ่านใหม่</label>
                <input name="newPassword" type="password" required minLength="6" className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none" placeholder="อย่างน้อย 6 ตัวอักษร" />
              </div>
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition-colors">บันทึกรหัสผ่านและเข้าสู่ระบบ</button>
              <button type="button" onClick={() => setPendingPwdUser(null)} className="w-full text-slate-500 hover:underline text-sm mt-2">ยกเลิก</button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-blue-50 text-slate-800'} p-4`}>
        <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="text-center mb-8">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full inline-block mb-4"><BookOpen size={32} /></div>
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Class Homework Tracker</h1>
            <p className="text-sm mt-2 opacity-70">ระบบจดการบ้านห้องเรียน 2/10</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(e.target.username.value, e.target.password.value); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อผู้ใช้งาน</label>
              <input name="username" type="text" required className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none" placeholder="Username" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
              <input name="password" type="password" required className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none" placeholder="Password" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
              เข้าสู่ระบบ
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm opacity-70 mb-4">หรือ</p>
            <button onClick={() => { setCurrentUser(null); setCurrentView('dashboard'); }} className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
              เข้าชมในฐานะนักเรียน (Guest) &rarr;
            </button>
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">ออกแบบและพัฒนาโดย<br/>ด.ญ.กุลรดา รังสิยานนท์</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboardView = () => {
    const todayInfo = getThaiDateInfo();
    const displayDateStr = selectedDateStr;
    const todayData = records[displayDateStr] || { subjects: {} };
    const todaySchedule = SCHEDULE[selectedDayOfWeek] || [];

    const allUpcoming = [];
    Object.keys(records).forEach(date => {
      Object.entries(records[date].subjects || {}).forEach(([id, sub]) => {
        if (sub.hasDue && sub.dueDate) {
          const due = new Date(sub.dueDate);
          const now = new Date(todayInfo.dateStr);
          const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0) {
             const scheduleItem = Object.values(SCHEDULE).flat().find(s => s.id === id);
             allUpcoming.push({ ...sub, id, date, diffDays, subjectName: scheduleItem?.name || 'Unknown' });
          }
        }
      });
    });
    allUpcoming.sort((a, b) => a.diffDays - b.diffDays);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">หน้าแรก</h1>
            <p className="text-slate-500 dark:text-slate-400">ข้อมูลของวันที่: {formatDateTH(displayDateStr)}</p>
          </div>
          {renderDateNavigator()}
        </header>

        {allUpcoming.filter(h => h.diffDays <= 2).length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold mb-2"><AlertCircle size={20} /> <span>งานด่วนใกล้ส่ง! (ภายใน 2 วัน)</span></div>
            <ul className="space-y-2">
              {allUpcoming.filter(h => h.diffDays <= 2).map((hw, i) => (
                <li key={i} className="text-sm text-red-600 dark:text-red-300 flex justify-between bg-white dark:bg-slate-800 p-2 rounded shadow-sm">
                  <span><span className="font-semibold">{hw.subjectName}:</span> {hw.hwDetail}</span>
                  <span className="font-bold">{hw.diffDays === 0 ? 'ส่งวันนี้!' : `อีก ${hw.diffDays} วัน`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400"><BookOpen size={20} /> {DAYS_TH[selectedDayOfWeek]} เรียนอะไรบ้าง</h2>
            {selectedDayOfWeek === 0 || selectedDayOfWeek === 6 ? (
              <p className="text-slate-500 italic text-center py-8">วันหยุดสุดสัปดาห์ พักผ่อนให้เต็มที่ครับ 😴</p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((sub, idx) => {
                  const data = todayData.subjects?.[sub.id];
                  return (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-start gap-3">
                      <div className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0">{idx + 1}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{sub.name} {sub.code && <span className="text-xs opacity-60">({sub.code})</span>}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{data?.topic || 'ยังไม่มีข้อมูลเรื่องที่เรียน'}</p>
                      </div>
                      {data?.hasHw && (
                        <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs px-2 py-1 rounded font-medium flex items-center gap-1"><CheckSquare size={12} /> มีการบ้าน</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400"><Edit3 size={20} /> หมายเหตุประจำวัน</h2>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded-lg min-h-[100px] whitespace-pre-wrap text-sm">
                {todayData.note || <span className="opacity-50 italic">ไม่มีหมายเหตุสำหรับวันนี้</span>}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-600 dark:text-green-400"><Clock size={20} /> งานที่ต้องส่งเร็วๆ นี้</h2>
              {allUpcoming.length === 0 ? (
                <p className="text-slate-500 italic text-center py-4 text-sm">สุดยอด! ไม่มีงานค้างเลย 🎉</p>
              ) : (
                <ul className="space-y-3">
                  {allUpcoming.slice(0, 5).map((hw, i) => (
                    <li key={i} className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3 last:border-0 text-sm">
                      <div>
                        <p className="font-semibold">{hw.subjectName}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{hw.hwDetail}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold ${hw.diffDays <= 2 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{formatDateTH(hw.dueDate)}</p>
                        <p className="text-xs opacity-70">อีก {hw.diffDays} วัน</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTimetableView = () => {
    const currentData = records[selectedDateStr] || { note: '', subjects: {} };
    const currentSchedule = SCHEDULE[selectedDayOfWeek] || [];

    const handleSave = () => {
      alert("ระบบได้บันทึกข้อมูลทุกครั้งที่ติ๊ก/พิมพ์ให้อัตโนมัติแล้วครับ! ✅");
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">ตารางเรียน & การบ้าน</h1>
            <p className="text-slate-500 dark:text-slate-400">ดูและจัดการข้อมูลของแต่ละวัน</p>
          </div>
          {renderDateNavigator()}
        </header>

        <div className="space-y-4">
          {currentSchedule.map((subject, idx) => {
            const subjectData = currentData.subjects?.[subject.id] || { topic: '', hasHw: false, hwDetail: '', hasDue: false, dueDate: '' };
            return (
              <div key={subject.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm">{idx + 1}</span>
                    <div>
                      <h3 className="font-bold text-lg">{subject.name} {subject.group && <span className="text-sm text-blue-600 ml-1">({subject.group})</span>}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{subject.code} {subject.desc}</p>
                    </div>
                  </div>
                  {subjectData.hasHw && <span className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-sm"><CheckSquare size={14} /> มีการบ้าน</span>}
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">เรื่องที่เรียนวันนี้</label>
                    {canEdit ? (
                      <SmoothTextarea 
                        className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-600 outline-none text-sm min-h-[100px] resize-y"
                        placeholder="สรุปเนื้อหาที่เรียนสั้นๆ..."
                        value={subjectData.topic}
                        onChange={(val) => updateRecord(selectedDateStr, subject.id, 'topic', val)}
                      />
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm min-h-[100px] whitespace-pre-wrap border border-transparent">{subjectData.topic || <span className="opacity-50 italic">ยังไม่มีการบันทึกข้อมูล</span>}</div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30 h-full">
                      <div className="flex items-center gap-2 mb-3">
                        {canEdit ? (
                          <input type="checkbox" className="w-5 h-5 rounded-lg accent-orange-500 cursor-pointer" checked={subjectData.hasHw || false} onChange={(e) => updateRecord(selectedDateStr, subject.id, 'hasHw', e.target.checked)} />
                        ) : ( subjectData.hasHw && <CheckSquare size={16} className="text-orange-600" /> )}
                        <label className="font-bold text-sm text-orange-800 dark:text-orange-300">มีการบ้าน / ชิ้นงาน</label>
                      </div>

                      {subjectData.hasHw && (
                        <div className="space-y-3 pl-6 animate-in slide-in-from-top-2 duration-200">
                          {canEdit ? (
                            <SmoothTextarea 
                              className="w-full p-2 rounded border focus:ring-2 focus:ring-orange-500 dark:bg-slate-800 dark:border-slate-600 outline-none text-sm"
                              placeholder="รายละเอียดการบ้าน..."
                              value={subjectData.hwDetail}
                              onChange={(val) => updateRecord(selectedDateStr, subject.id, 'hwDetail', val)}
                            />
                          ) : ( <p className="text-sm bg-white dark:bg-slate-800 p-2 rounded border border-orange-100 dark:border-slate-700">{subjectData.hwDetail || '-'}</p> )}

                          <div className="flex items-center gap-2 pt-2">
                            {canEdit ? (
                              <input type="checkbox" className="w-5 h-5 rounded-lg accent-red-500 cursor-pointer" checked={subjectData.hasDue || false} onChange={(e) => updateRecord(selectedDateStr, subject.id, 'hasDue', e.target.checked)} />
                            ) : ( subjectData.hasDue && <Clock size={16} className="text-red-500" /> )}
                            <label className="font-medium text-sm text-red-700 dark:text-red-400">กำหนดส่ง</label>
                          </div>

                          {subjectData.hasDue && (
                            <div className="pl-6 pb-2">
                              {canEdit ? (
                                <input type="date" className="p-2 rounded border focus:ring-2 focus:ring-red-500 dark:bg-slate-800 dark:border-slate-600 outline-none text-sm w-full md:w-auto cursor-pointer" value={subjectData.dueDate || ''} onChange={(e) => updateRecord(selectedDateStr, subject.id, 'dueDate', e.target.value)} />
                              ) : ( <span className="text-sm font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-3 py-1 rounded">{formatDateTH(subjectData.dueDate) || 'ไม่ได้ระบุ'}</span> )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/30 p-6 mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-400"><Edit3 size={20} /> หมายเหตุประจำวัน (สรุปสิ่งสำคัญ)</h2>
          {canEdit ? (
            <SmoothTextarea 
              className="w-full p-4 rounded-lg border focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-600 outline-none min-h-[120px]"
              placeholder="เช่น พรุ่งนี้ครูไม่อยู่, อย่าลืมเอาสีไม้มาด้วย..."
              value={currentData.note}
              onChange={(val) => updateDailyNote(selectedDateStr, val)}
            />
          ) : ( <div className="p-4 bg-white dark:bg-slate-800 rounded-lg min-h-[80px] whitespace-pre-wrap text-slate-700 dark:text-slate-300">{currentData.note || <span className="opacity-50 italic">ไม่มีหมายเหตุ</span>}</div> )}
        </div>

        {canEdit && (
          <div className="sticky bottom-4 right-0 flex justify-end mt-8 z-10">
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 transition-transform transform hover:scale-105"><Check size={20} /> ยืนยันข้อมูล</button>
          </div>
        )}
      </div>
    );
  };

  const renderSearchView = () => {
    const handleSearchClick = () => {
      if(!searchQuery.trim()) return;
      const term = searchQuery.toLowerCase();
      const found = [];
      Object.keys(records).forEach(date => {
        Object.entries(records[date].subjects || {}).forEach(([id, sub]) => {
          const scheduleItem = Object.values(SCHEDULE).flat().find(s => s.id === id);
          const subjName = scheduleItem?.name || '';
          if (subjName.toLowerCase().includes(term) || (sub.topic && sub.topic.toLowerCase().includes(term)) || (sub.hwDetail && sub.hwDetail.toLowerCase().includes(term))) {
            found.push({ date, subjectName: subjName, topic: sub.topic, hwDetail: sub.hwDetail });
          }
        });
        if (records[date]?.note && records[date].note.toLowerCase().includes(term)) {
           found.push({ date, subjectName: 'หมายเหตุประจำวัน', topic: records[date].note, hwDetail: null });
        }
      });
      setSearchResults(found.sort((a,b) => new Date(b.date) - new Date(a.date)));
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">ค้นหาข้อมูล</h1>
          <p className="text-slate-500 dark:text-slate-400">ค้นหาเรื่องที่เรียน, การบ้าน หรือชื่อวิชาย้อนหลัง</p>
        </header>

        <div className="flex gap-2">
          <input type="text" placeholder="พิมพ์คำค้นหา..." className="flex-1 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()} />
          <button onClick={handleSearchClick} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors px-6"><Search size={20} /></button>
        </div>

        <div className="mt-8 space-y-4">
          {searchResults.length > 0 ? (
            searchResults.map((res, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-blue-600 dark:text-blue-400">{res.subjectName}</h3>
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{formatDateTH(res.date)}</span>
                </div>
                {res.topic && <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap"><span className="font-semibold text-xs opacity-50 block">รายละเอียด:</span>{res.topic}</p>}
                {res.hwDetail && <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded"><span className="font-semibold text-xs block mb-1">การบ้าน:</span>{res.hwDetail}</p>}
              </div>
            ))
          ) : searchQuery ? ( <p className="text-center text-slate-500 mt-10">ไม่พบข้อมูลที่ตรงกับ "{searchQuery}"</p> ) : (
            <div className="text-center text-slate-400 dark:text-slate-500 mt-20 flex flex-col items-center"><Search size={48} className="mb-4 opacity-20" /><p>ลองพิมพ์ชื่อวิชา หรือเรื่องที่เรียนเพื่อค้นหา</p></div>
          )}
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    const dueDates = [];
    Object.keys(records).forEach(date => {
      Object.entries(records[date].subjects || {}).forEach(([id, sub]) => {
        if (sub.hasDue && sub.dueDate) {
           const scheduleItem = Object.values(SCHEDULE).flat().find(s => s.id === id);
           dueDates.push({ date: sub.dueDate, subject: scheduleItem?.name || id, detail: sub.hwDetail });
        }
      });
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="mb-6"><h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">ปฏิทินกำหนดส่งงาน</h1><p className="text-slate-500 dark:text-slate-400">ดูภาพรวมงานที่ต้องส่ง</p></header>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
           {dueDates.length === 0 ? (
             <div className="text-center py-20 opacity-50"><CalendarIcon size={48} className="mx-auto mb-4" /><p>ยังไม่มีกำหนดส่งงานในระบบ</p></div>
           ) : (
             <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {dueDates.sort((a,b) => new Date(a.date) - new Date(b.date)).map((due, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"><Clock size={16} /></div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded border shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400">{due.subject}</h4>
                        <time className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">{formatDateTH(due.date)}</time>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{due.detail}</p>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderAdminView = () => {
    if (!isAdmin) return <div className="p-8 text-center text-red-500 font-bold text-xl">ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;

    const handleAdminCustomInput = (userId, field, value) => { 
      setAdminCustomInputs(prev => ({ ...prev, [userId]: { ...prev[userId], [field]: value } })); 
    };

    const grantReward = (userId, type, value, points) => {
      let logAdded = null;
      const newUsers = users.map(u => {
        if(u.id === userId) {
          if (type === 'badge' && !(u.badges || []).includes(value)) { 
             logAdded = { id: Date.now(), action: 'มอบเหรียญรางวัล', detail: `มอบเหรียญ "${value}" ให้กับ ${u.name}`, by: currentUser.name, time: new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE }) };
             return { ...u, badges: [...(u.badges || []), value], points: (u.points || 0) + points }; 
          }
          if (type === 'praise' && !(u.praises || []).includes(value)) { 
             logAdded = { id: Date.now(), action: 'ชื่นชมผลงาน', detail: `ชื่นชม "${value}" ให้กับ ${u.name}`, by: currentUser.name, time: new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE }) };
             return { ...u, praises: [...(u.praises || []), value], points: (u.points || 0) + points }; 
          }
        }
        return u;
      });
      const newLogs = logAdded ? [logAdded, ...logs].slice(0, 50) : logs;
      
      syncToDB({ users: newUsers, logs: newLogs }); 
      setAdminCustomInputs(prev => ({ ...prev, [userId]: { ...prev[userId], [type]: '' } }));
    };

    const handleAddUser = (e) => {
      e.preventDefault();
      if (users.find(u => u.username === adminFormData.username)) { alert('Username นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่น'); return; }
      const newUser = { id: 'u' + Date.now(), username: adminFormData.username, password: adminFormData.password, name: adminFormData.name, role: 'writer', points: 0, badges: [], praises: [], status: 'offline', lastLogin: '-', isLocked: false, forcePwd: false };
      
      const newUsers = [...users, newUser];
      const newLog = { id: Date.now(), action: 'เพิ่มผู้ใช้งาน', detail: `เพิ่มบัญชีคนจดการบ้าน: ${adminFormData.name}`, by: currentUser.name, time: new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE }) };
      
      syncToDB({ users: newUsers, logs: [newLog, ...logs].slice(0, 50) }); 
      setAdminShowAddForm(false); setAdminFormData({ username: '', password: '', name: '' });
    };

    const handleUpdateUser = (e) => {
      e.preventDefault();
      const newUsers = users.map(u => u.id === adminEditUserId ? { ...u, name: adminFormData.name, username: adminFormData.username, password: adminFormData.password } : u);
      const newLog = { id: Date.now(), action: 'แก้ไขผู้ใช้งาน', detail: `แก้ไขข้อมูลคนจดการบ้าน: ${adminFormData.name}`, by: currentUser.name, time: new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE }) };
      
      syncToDB({ users: newUsers, logs: [newLog, ...logs].slice(0, 50) }); 
      setAdminEditUserId(null); setAdminFormData({ username: '', password: '', name: '' });
    };

    const handleDeleteUser = (id, name) => {
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี "${name}"?`)) { 
        const newUsers = users.filter(u => u.id !== id);
        const newLog = { id: Date.now(), action: 'ลบผู้ใช้งาน', detail: `ลบบัญชีคนจดการบ้าน: ${name}`, by: currentUser.name, time: new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE }) };
        syncToDB({ users: newUsers, logs: [newLog, ...logs].slice(0, 50) }); 
      }
    };

    const handleResetLogin = (id, name) => {
      if (window.confirm(`รีเซ็ตรหัสผ่านของ "${name}" เป็น "password" และบังคับเปลี่ยนรหัสใหม่ในการเข้าสู่ระบบครั้งหน้า?`)) {
        const newUsers = users.map(u => u.id === id ? { ...u, password: 'password', forcePwd: true } : u);
        const newLog = { id: Date.now(), action: 'รีเซ็ตรหัสผ่าน', detail: `รีเซ็ตรหัสผ่านบัญชี: ${name}`, by: currentUser.name, time: new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE }) };
        syncToDB({ users: newUsers, logs: [newLog, ...logs].slice(0, 50) }); 
        alert('รีเซ็ตสำเร็จ รหัสผ่านชั่วคราวคือ: password');
      }
    };

    const handleToggleLock = (id, name, isLocked) => {
      const action = isLocked ? 'ปลดล็อก' : 'ล็อก';
      if (window.confirm(`ต้องการ${action}บัญชี "${name}" ใช่หรือไม่?`)) { 
        const newUsers = users.map(u => u.id === id ? { ...u, isLocked: !isLocked } : u);
        const newLog = { id: Date.now(), action: `${action}บัญชี`, detail: `${action}บัญชีคนจดการบ้าน: ${name}`, by: currentUser.name, time: new Date().toLocaleString('th-TH', { timeZone: THAI_TIMEZONE }) };
        syncToDB({ users: newUsers, logs: [newLog, ...logs].slice(0, 50) }); 
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3"><Shield className="text-blue-600" /> ระบบจัดการผู้ใช้ (User Management)</h1><p className="text-slate-500 mt-2">จัดการบัญชีคนจดการบ้าน ความปลอดภัย และให้คะแนน</p></div>
          <button onClick={() => { setAdminShowAddForm(!adminShowAddForm); setAdminEditUserId(null); setAdminFormData({ username: '', password: '', name: '' }); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors w-full md:w-auto justify-center">
            {adminShowAddForm ? <X size={20}/> : <Plus size={20}/>} {adminShowAddForm ? 'ยกเลิก' : 'เพิ่มคนจดการบ้าน'}
          </button>
        </header>

        {adminShowAddForm && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/50 mb-6 animate-in slide-in-from-top-4">
            <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">เพิ่มบัญชีคนจดการบ้านใหม่</h2>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล</label><input type="text" required value={adminFormData.name} onChange={e => setAdminFormData({...adminFormData, name: e.target.value})} className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Username (ใช้ล็อกอิน)</label><input type="text" required value={adminFormData.username} onChange={e => setAdminFormData({...adminFormData, username: e.target.value})} className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">รหัสผ่าน</label><input type="text" required value={adminFormData.password} onChange={e => setAdminFormData({...adminFormData, password: e.target.value})} className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none" /></div>
              <div className="md:col-span-3 flex justify-end mt-2"><button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">บันทึกข้อมูล</button></div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users.filter(u => u.role === 'writer').map(user => (
            <div key={user.id} className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border ${user.isLocked ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'} relative`}>
              {adminEditUserId === user.id ? (
                <form onSubmit={handleUpdateUser} className="space-y-3 animate-in fade-in">
                  <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-2 border-b dark:border-slate-700 pb-2">แก้ไขข้อมูลบัญชี</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="block text-xs font-medium mb-1 text-slate-500">ชื่อ-นามสกุล</label><input type="text" required value={adminFormData.name} onChange={e => setAdminFormData({...adminFormData, name: e.target.value})} className="w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none text-sm" /></div>
                    <div><label className="block text-xs font-medium mb-1 text-slate-500">Username</label><input type="text" required value={adminFormData.username} onChange={e => setAdminFormData({...adminFormData, username: e.target.value})} className="w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none text-sm" /></div>
                    <div><label className="block text-xs font-medium mb-1 text-slate-500">รหัสผ่าน</label><input type="text" required value={adminFormData.password} onChange={e => setAdminFormData({...adminFormData, password: e.target.value})} className="w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 outline-none text-sm" /></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium flex-1">บันทึก</button>
                    <button type="button" onClick={() => setAdminEditUserId(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 px-4 py-1.5 rounded text-sm font-medium">ยกเลิก</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex gap-1">
                    <button onClick={() => { setAdminEditUserId(user.id); setAdminFormData({ username: user.username, password: user.password, name: user.name }); setAdminShowAddForm(false); }} className="text-slate-500 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors p-1.5 rounded-lg" title="แก้ไข"><Edit3 size={18} /></button>
                    <button onClick={() => handleDeleteUser(user.id, user.name)} className="text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg" title="ลบผู้ใช้"><Trash2 size={18} /></button>
                  </div>
                  <div className="flex justify-between items-start mb-4 pr-16">
                    <div><h3 className="font-bold text-lg flex items-center gap-2"><User size={18}/> {user.name} {user.isLocked && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">ถูกล็อก</span>}</h3><p className="text-sm text-slate-500 font-mono mt-1">@{user.username}</p></div>
                    <div className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 font-bold px-3 py-1 rounded-full text-sm shrink-0 flex items-center gap-1"><Star size={14} className="fill-current" /> {user.points || 0}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm mb-4">
                    <div><p className="text-slate-500 text-xs font-semibold mb-1">สถานะ</p><div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div><span className={user.status === 'online' ? 'text-green-600 font-medium' : 'text-slate-500'}>{user.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}</span></div></div>
                    <div><p className="text-slate-500 text-xs font-semibold mb-1">ใช้งานล่าสุด</p><p className="truncate text-slate-700 dark:text-slate-300">{user.lastLogin}</p></div>
                  </div>
                  <div className="flex gap-2 mb-4 border-b dark:border-slate-700 pb-4">
                     <button onClick={() => handleResetLogin(user.id, user.name)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 text-xs py-2 rounded-lg font-medium transition-colors">รีเซ็ตรหัสผ่าน</button>
                     <button onClick={() => handleToggleLock(user.id, user.name, user.isLocked)} className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${user.isLocked ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'}`}>{user.isLocked ? 'ปลดล็อกบัญชี' : 'ล็อกบัญชีชั่วคราว'}</button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase opacity-50 mb-2">เหรียญเกียรติยศ ({(user.badges || []).length})</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">{(user.badges || []).map((b, i) => <span key={i} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">{b}</span>)}</div>
                      <div className="flex gap-1">
                        <select onChange={(e) => { if(e.target.value) grantReward(user.id, 'badge', e.target.value, 10); e.target.value=''; }} className="text-xs p-1.5 rounded border dark:bg-slate-700 dark:border-slate-600 outline-none flex-1"><option value="">+ เลือกให้เหรียญรางวัล...</option>{BADGES.filter(b => !(user.badges || []).includes(b)).map((badge, i) => <option key={i} value={badge}>{badge}</option>)}</select>
                        <input type="text" placeholder="พิมพ์เอง..." className="text-xs p-1.5 rounded border dark:bg-slate-700 dark:border-slate-600 outline-none w-24" value={adminCustomInputs[user.id]?.badge || ''} onChange={(e) => handleAdminCustomInput(user.id, 'badge', e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && e.target.value) grantReward(user.id, 'badge', e.target.value, 10); }}/>
                        <button onClick={() => {if(adminCustomInputs[user.id]?.badge) grantReward(user.id, 'badge', adminCustomInputs[user.id].badge, 10);}} className="bg-blue-100 text-blue-600 px-2 rounded hover:bg-blue-200 text-xs font-bold">+</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase opacity-50 mb-2">คำชม ({(user.praises || []).length})</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">{(user.praises || []).map((p, i) => <span key={i} className="text-xs bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-900/50">{p}</span>)}</div>
                      <div className="flex gap-1">
                        <select onChange={(e) => { if(e.target.value) grantReward(user.id, 'praise', e.target.value, 5); e.target.value=''; }} className="text-xs p-1.5 rounded border dark:bg-slate-700 dark:border-slate-600 outline-none flex-1"><option value="">+ เลือกคำชม...</option>{PRAISES.filter(p => !(user.praises || []).includes(p)).map((p, i) => <option key={i} value={p}>{p}</option>)}</select>
                        <input type="text" placeholder="พิมพ์เอง..." className="text-xs p-1.5 rounded border dark:bg-slate-700 dark:border-slate-600 outline-none w-24" value={adminCustomInputs[user.id]?.praise || ''} onChange={(e) => handleAdminCustomInput(user.id, 'praise', e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && e.target.value) grantReward(user.id, 'praise', e.target.value, 5); }}/>
                        <button onClick={() => {if(adminCustomInputs[user.id]?.praise) grantReward(user.id, 'praise', adminCustomInputs[user.id].praise, 5);}} className="bg-yellow-100 text-yellow-700 px-2 rounded hover:bg-yellow-200 text-xs font-bold">+</button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLogsView = () => {
    if (!isAdmin) return <div className="p-8 text-center text-red-500 font-bold text-xl">ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="mb-6"><h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">ประวัติการแก้ไขระบบ</h1></header>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-medium border-b dark:border-slate-700">
              <tr><th className="px-6 py-4">เวลา</th><th className="px-6 py-4">ผู้ดำเนินการ</th><th className="px-6 py-4">การกระทำ</th><th className="px-6 py-4">รายละเอียด</th></tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {logs.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">ยังไม่มีประวัติการแก้ไข</td></tr>}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-3 whitespace-nowrap text-slate-500">{log.time}</td><td className="px-6 py-3 font-medium text-blue-600 dark:text-blue-400">{log.by}</td><td className="px-6 py-3">{log.action}</td><td className="px-6 py-3 text-slate-500">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProfileView = () => {
    if (currentUser?.role !== 'writer') return null;
    const myLogs = logs.filter(l => l.by === currentUser.name).slice(0, 10);
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20"></div>
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full mx-auto shadow-lg flex items-center justify-center text-white text-3xl font-bold relative z-10 mb-4">{currentUser.name.charAt(0)}</div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white relative z-10">{currentUser.name}</h1>
          <p className="text-slate-500 mb-8 relative z-10">ตำแหน่ง: คนจดการบ้านประจำห้อง</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10 mb-8">
            <div className="bg-blue-50 dark:bg-slate-700 rounded-2xl p-4"><p className="text-sm text-slate-500 font-bold mb-1">คะแนนสะสม</p><p className="text-3xl font-black text-blue-600 dark:text-blue-400">{currentUser.points || 0}</p></div>
            <div className="bg-purple-50 dark:bg-slate-700 rounded-2xl p-4"><p className="text-sm text-slate-500 font-bold mb-1">เหรียญรางวัล</p><p className="text-3xl font-black text-purple-600 dark:text-purple-400">{(currentUser.badges || []).length}</p></div>
            <div className="bg-yellow-50 dark:bg-slate-700 rounded-2xl p-4 col-span-2 md:col-span-1"><p className="text-sm text-slate-500 font-bold mb-1">คำชมที่ได้รับ</p><p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">{(currentUser.praises || []).length}</p></div>
          </div>
          <div className="text-left relative z-10 space-y-6">
            <div><h3 className="font-bold mb-3 flex items-center gap-2"><Award className="text-purple-500"/> เหรียญเกียรติยศ</h3><div className="flex flex-wrap gap-2">{(currentUser.badges || []).map((b, i) => (<div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium">{b}</div>))}{(!currentUser.badges || currentUser.badges.length === 0) && <p className="text-slate-500 text-sm italic">ยังไม่มีเหรียญรางวัล สู้ๆ นะ!</p>}</div></div>
            <div><h3 className="font-bold mb-3 flex items-center gap-2"><Star className="text-yellow-500"/> คำชมจากแอดมิน</h3><div className="flex flex-wrap gap-2">{(currentUser.praises || []).map((p, i) => (<div key={i} className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800/50 px-4 py-2 rounded-xl text-sm font-medium">{p}</div>))}{(!currentUser.praises || currentUser.praises.length === 0) && <p className="text-slate-500 text-sm italic">ยังไม่มีคำชม</p>}</div></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="text-blue-500"/> ประวัติการจดงานย้อนหลัง (ล่าสุด)</h3>
           <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {myLogs.length === 0 ? ( <p className="text-center text-slate-500 text-sm py-4">ยังไม่มีประวัติการจดข้อมูล</p> ) : (
                myLogs.map((log, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 dark:bg-slate-700 dark:border-slate-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"><Edit3 size={16} /></div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex flex-col mb-1"><span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{log.action}</span><time className="text-[10px] text-slate-400">{log.time}</time></div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{log.detail}</p>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    );
  };

  return renderLayout(
    <>
      {currentView === 'dashboard' && renderDashboardView()}
      {currentView === 'timetable' && renderTimetableView()}
      {currentView === 'calendar' && renderCalendarView()}
      {currentView === 'search' && renderSearchView()}
      {currentView === 'admin' && renderAdminView()}
      {currentView === 'logs' && renderLogsView()}
      {currentView === 'profile' && renderProfileView()}
    </>
  );
}