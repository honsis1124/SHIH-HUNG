import React from 'react';
import { User } from 'firebase/auth';
import { LogIn, LogOut, Eye, Settings, ShieldCheck } from 'lucide-react';
import { loginWithGoogle, logout } from '../firebase';

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
    <header id="app-header" className="sticky top-0 z-50 w-full bg-[#0a0f1d]/85 backdrop-blur-md border-b border-slate-800/80 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
              <span className="font-display font-bold text-xl tracking-tight">R</span>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">Bespoke Resume</span>
              <span className="hidden sm:inline-block ml-2.5 px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest animate-pulse">
                Cosmic Edition
              </span>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center space-x-4">
            {/* Owner controls: Toggle preview/edit */}
            {user && (
              <div className="flex items-center bg-[#161c33] p-1 rounded-xl border border-slate-800/80">
                <button
                  id="preview-mode-btn"
                  onClick={() => setIsEditMode(false)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !isEditMode
                      ? 'bg-[#1e264a] text-white shadow-sm shadow-black/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="預覽前台網頁"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
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
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isEditMode
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  } ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isOwner ? "進入後台管理編輯資料" : "限履歷擁有者進入"}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">後台管理</span>
                </button>
              </div>
            )}

            {/* Login Status */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-100 flex items-center justify-end space-x-1">
                    {user.displayName || '使用者'}
                    {isOwner && (
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 ml-1" title="擁有者帳號" />
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{user.email}</span>
                </div>
                {user.photoURL ? (
                  <img
                    id="user-nav-avatar"
                    src={user.photoURL}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-slate-700 shadow-md"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1e264a] flex items-center justify-center text-xs font-bold text-indigo-300 border border-slate-700">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <button
                  id="nav-logout-btn"
                  onClick={logout}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                  title="登出"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="nav-login-btn"
                onClick={loginWithGoogle}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:brightness-110 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>擁有者登入</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
