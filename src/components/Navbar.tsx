import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, Eye, Settings, ShieldCheck } from 'lucide-react';
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
          <div className="flex items-center space-x-4">
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

