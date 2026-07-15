import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { LogOut, Eye, Settings, ShieldCheck, Printer, Share2 } from 'lucide-react';
import { logout } from '../firebase';

interface NavbarProps {
  user: User | null;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  ownerEmail: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isEditMode,
  setIsEditMode,
  ownerEmail,
}) => {
  const isOwner = user?.email === ownerEmail;
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full bg-[#faf9f5]/90 border-b border-stone-200/80 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-900 text-white shadow-md">
              <span className="font-display font-bold text-xl tracking-tight">R</span>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-stone-900 tracking-tight">Bespoke Resume</span>
              <span className="hidden sm:inline-block ml-2.5 px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 uppercase tracking-widest">
                Nordic Style
              </span>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {/* Share and Print buttons (Visible for everyone, print-optimized) */}
            <button
              onClick={handleShare}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none no-print ${
                copied
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
                  : 'bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 border-stone-200/80 shadow-sm'
              }`}
              title="複製此履歷網址，方便與他人分享！"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copied ? '已複製！' : '分享履歷'}</span>
              <span className="sm:hidden">{copied ? '已複製！' : '分享'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200/80 shadow-sm transition-all cursor-pointer select-none no-print"
              title="將網頁轉換為精美的 A4 履歷並存為 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">匯出 PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Owner controls: Toggle preview/edit */}
            {user && (
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/85">
                <button
                  id="preview-mode-btn"
                  onClick={() => setIsEditMode(false)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    !isEditMode
                      ? 'bg-white text-stone-900 shadow-sm border border-stone-200/30'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                  title="預覽前台網頁"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-700" />
                  <span className="hidden md:inline">前台預覽</span>
                </button>
                <button
                  id="edit-mode-btn"
                  onClick={() => {
                    if (isOwner) {
                      setIsEditMode(true);
                    } else {
                      alert('抱歉，您不是履歷擁有者，無法開啟編輯權限。');
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isEditMode
                      ? 'bg-stone-900 text-white shadow-md'
                      : 'text-stone-500 hover:text-stone-900'
                  } ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isOwner ? "進入後台管理編輯資料" : "限履歷擁有者進入"}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">後台管理</span>
                </button>
              </div>
            )}

            {/* Login Status */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-stone-900 flex items-center justify-end space-x-1">
                    {user.displayName || '使用者'}
                    {isOwner && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 ml-1" title="擁有者帳號" />
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">{user.email}</span>
                </div>
                {user.photoURL ? (
                  <img
                    id="user-nav-avatar"
                    src={user.photoURL}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-stone-200 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 border border-stone-200">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <button
                  id="nav-logout-btn"
                  onClick={logout}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                  title="登出"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

