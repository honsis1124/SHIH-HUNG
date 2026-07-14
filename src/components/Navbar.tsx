import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { LogIn, LogOut, Eye, Settings, ShieldCheck, X, Globe, Cookie, ExternalLink, ShieldAlert } from 'lucide-react';
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
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginClick = async () => {
    // 偵測是否在 iframe 中
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setErrorMsg("偵測到您目前在 AI Studio 的預覽窗格 (iframe) 內。因瀏覽器安全機制限制，跨域彈出式視窗無法在 iframe 內正常回傳憑證，導致視窗自動關閉。");
      setShowHelpModal(true);
      return;
    }

    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login Error Catch:", error);
      let customError = error?.message || String(error);
      if (error?.code === 'auth/popup-blocked') {
        customError = "您的瀏覽器封鎖了 Google 彈出式視窗。請於網址列右方點擊並允許此網域彈出視窗後，再試一次。";
      } else if (error?.code === 'auth/popup-closed-by-user') {
        customError = "登入視窗已手動關閉。如果是開啟後「一秒內自動關閉」，通常代表此網域尚未加入「Firebase 授權網域」或瀏覽器封鎖了第三方 Cookie。";
      } else if (error?.code === 'auth/network-request-failed') {
        customError = "網路連線失敗，請確認您的網路狀況或 Firebase 設定是否正確。";
      }
      setErrorMsg(customError);
      setShowHelpModal(true);
    }
  };

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
                onClick={handleLoginClick}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:brightness-110 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>擁有者登入</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 登入障礙排除指引 Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050814]/85 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#0f152d] border border-slate-800/80 rounded-2xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto select-text">
            
            {/* 關閉按鈕 */}
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 標頭 */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google 登入障礙排除指引</h3>
                <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">Owner Sign-In Troubleshooting</p>
              </div>
            </div>

            {/* 異常反饋訊息 */}
            {errorMsg && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
                <h4 className="text-xs font-bold text-red-400 mb-1">系統偵測到以下狀況：</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* 故障排除步驟 */}
            <div className="space-y-5 text-xs text-slate-300 text-left">
              
              {/* 狀況一 */}
              <div className="bg-[#161c38]/60 rounded-xl p-4 border border-slate-800/50">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-[10px] font-mono border border-indigo-500/20">1</span>
                  <span>您是否正位於 AI Studio 預覽畫面中？</span>
                </div>
                <p className="leading-relaxed text-slate-400 pl-7 mb-3">
                  由於瀏覽器的 iframe 沙盒安全限制，跨域登入彈窗無法直接在預覽窗格中將憑證回傳至內部網頁。
                </p>
                <div className="pl-7">
                  <button
                    onClick={() => {
                      window.open(window.location.href, '_blank');
                      setShowHelpModal(false);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>在新分頁開啟本網頁以進行登入</span>
                  </button>
                </div>
              </div>

              {/* 狀況二 */}
              <div className="bg-[#161c38]/60 rounded-xl p-4 border border-slate-800/50">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-[10px] font-mono border border-indigo-500/20">2</span>
                  <span>您在 GitHub Pages 上看到空白或無法登入？</span>
                </div>
                <div className="leading-relaxed text-slate-400 pl-7 space-y-1.5">
                  <p>
                    請確保已將您的 GitHub Pages 網域設定為 Firebase 的 **「授權網域」**，否則 Firebase 會因安全限制拒絕跨域連線：
                  </p>
                  <ol className="list-decimal pl-4 font-mono text-[11px] text-slate-300 space-y-1">
                    <li>開啟您的 <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300 inline-flex items-center space-x-0.5"><span>Firebase Console</span><ExternalLink className="w-2.5 h-2.5" /></a></li>
                    <li>進入 <strong>Authentication (驗證) &gt; Settings (設定) &gt; Authorized domains (授權網域)</strong></li>
                    <li>點擊「新增網域」，輸入：<code className="bg-[#0c1024] px-1.5 py-0.5 rounded text-indigo-300 text-[10px] border border-slate-800">h0928060675.github.io</code></li>
                  </ol>
                </div>
              </div>

              {/* 狀況三 */}
              <div className="bg-[#161c38]/60 rounded-xl p-4 border border-slate-800/50">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-[10px] font-mono border border-indigo-500/20">3</span>
                  <span>瀏覽器封鎖了第三方 Cookie / 彈窗？</span>
                </div>
                <p className="leading-relaxed text-slate-400 pl-7">
                  若瀏覽器預設阻擋第三方 Cookie（例如 Safari、Chrome 無痕模式），登入後彈窗會「自動瞬間關閉」且維持未登入。請點選網址列右方的鎖頭或眼睛圖示，<strong>允許 Firebase 使用 Cookie</strong> 後再重試。
                </p>
              </div>

            </div>

            {/* 按鈕 */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                我知道了
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
