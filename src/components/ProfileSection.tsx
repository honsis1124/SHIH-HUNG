import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Mail, Phone, Github, Linkedin, Globe, Edit3, Save, Camera, Code } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface ProfileSectionProps {
  profile: UserProfile | null;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
  isEditMode: boolean;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  onSave,
  isEditMode,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Local form state
  const [name, setName] = useState(profile?.name || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [skills, setSkills] = useState(profile?.skills || '');
  const [github, setGithub] = useState(profile?.github || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
  const [website, setWebsite] = useState(profile?.website || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when parent profile changes
  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setTitle(profile.title || '');
      setBio(profile.bio || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAvatar(profile.avatar || '');
      setSkills(profile.skills || '');
      setGithub(profile.github || '');
      setLinkedin(profile.linkedin || '');
      setWebsite(profile.website || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title || !bio || !email) {
      alert('請填寫必填欄位 (姓名、專業頭銜、自我介紹、電子郵件)');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name,
        title,
        bio,
        email,
        phone,
        avatar,
        skills,
        github,
        linkedin,
        website,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('儲存失敗，請檢查權限設定！');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('檔案過大！請上傳小於 5MB 的圖片，系統會自動將其壓縮。');
      return;
    }

    try {
      // Compress to fit Firebase limit comfortably (max size 300px, 0.7 quality)
      const base64 = await compressImage(file, 300, 300, 0.7);
      setAvatar(base64);
    } catch (err) {
      console.error(err);
      alert('圖片讀取壓縮失敗，請重新嘗試。');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Parse skill list
  const skillList = skills
    ? skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
    : [];

  return (
    <div id="profile-container" className="bg-[#11162d]/65 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden mb-8 transition-all hover:border-slate-700/60 hover:shadow-indigo-950/10 hover:shadow-2xl">
      {/* Top Banner decoration */}
      <div className="h-36 bg-gradient-to-r from-[#171b30] via-[#241c40] to-[#122c44] relative overflow-hidden">
        {/* Cool modern design grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-10%] left-[-10%] h-[150%] w-[120%] bg-[radial-gradient(ellipse_60%_80%_at_50%_-20%,rgba(120,119,198,0.22),rgba(255,255,255,0))]"></div>
        {isEditMode && !isEditing && (
          <button
            id="edit-profile-btn"
            onClick={() => setIsEditing(true)}
            className="absolute right-6 bottom-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>編輯個人檔案</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="p-6 sm:p-8 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar upload */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                <div className="w-32 h-32 rounded-2xl bg-[#171c35] border-4 border-[#11162d] shadow-md overflow-hidden relative flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 text-center p-2">
                      <Camera className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                      <span className="text-[10px] text-slate-400">上傳大頭照</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <p className="text-[10px] text-slate-400 text-center">支援 JPG、PNG，自動壓縮</p>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 100))}
                    placeholder="請輸入您的姓名"
                    className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">專業頭銜 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder="例如: 資深前端工程師"
                    className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">電子郵件 <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, 100))}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">聯絡電話</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.slice(0, 20))}
                    placeholder="0912-345-678"
                    className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">核心專業技能 (逗號分隔)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value.slice(0, 1000))}
                  placeholder="React, TypeScript, CSS, Node.js, Project Management"
                  className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">請用「半形逗號 ,」分隔各個技能，會自動呈現為精美標籤</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">GitHub 連結</label>
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value.slice(0, 200))}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">LinkedIn 連結</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value.slice(0, 200))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">個人網站 / 作品集連結</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value.slice(0, 200))}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">自我介紹 / 簡介 <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={6}
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 2000))}
                  placeholder="介紹您的工作特長、熱情所在、以及能為團隊帶來的價值..."
                  className="w-full px-3.5 py-2.5 bg-[#171c35] text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm outline-none transition-all resize-y"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>建議不超過 2,000 字</span>
                  <span>{bio.length} / 2000 字</span>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="px-4.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-indigo-500/10 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? '儲存中...' : '儲存檔案'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-6 sm:p-8 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Display */}
            <div className="mx-auto md:mx-0 flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl bg-[#171c35] border-4 border-[#11162d] shadow-lg overflow-hidden relative">
                {avatar ? (
                  <img src={avatar} alt={name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center text-3xl font-bold text-indigo-300 font-display">
                    {name ? name.charAt(0) : 'P'}
                  </div>
                )}
              </div>
            </div>

            {/* Info details */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 id="user-profile-name" className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {name || '尚未設定姓名'}
                </h1>
                <p id="user-profile-title" className="text-xs font-bold text-indigo-400 font-mono tracking-widest uppercase mt-1.5 flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  <span>{title || '尚未設定專業頭銜'}</span>
                </p>
              </div>

              {/* Bio / About */}
              <div className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap max-w-3xl">
                {bio || '歡迎登入後點選編輯按鈕，填寫您的自我介紹。此處支持詳盡的履歷自傳與職涯規劃。'}
              </div>

              {/* Contacts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 pt-4 border-t border-slate-800/80 max-w-3xl">
                <div className="flex items-center space-x-2 text-xs text-slate-300 justify-center md:justify-start">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>{email || '尚未設定 Email'}</span>
                </div>
                {phone && (
                  <div className="flex items-center space-x-2 text-xs text-slate-300 justify-center md:justify-start">
                    <Phone className="w-4 h-4 text-indigo-400" />
                    <span>{phone}</span>
                  </div>
                )}
                {github && (
                  <div className="flex items-center space-x-2 text-xs text-slate-300 justify-center md:justify-start">
                    <Github className="w-4 h-4 text-indigo-400" />
                    <a href={github} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 hover:underline">
                      {github.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                )}
                {linkedin && (
                  <div className="flex items-center space-x-2 text-xs text-slate-300 justify-center md:justify-start">
                    <Linkedin className="w-4 h-4 text-indigo-400" />
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 hover:underline">
                      LinkedIn 個人檔案
                    </a>
                  </div>
                )}
                {website && (
                  <div className="flex items-center space-x-2 text-xs text-slate-300 justify-center md:justify-start">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 hover:underline">
                      個人作品網站
                    </a>
                  </div>
                )}
              </div>

              {/* Skills Display */}
              {skillList.length > 0 && (
                <div className="pt-4">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-2.5 justify-center md:justify-start">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-mono tracking-wider uppercase text-[11px] text-slate-400">Core Expertise</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                    {skillList.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-[#1a203f]/60 text-slate-200 border border-slate-800 hover:border-indigo-500/20 hover:text-white transition-all"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
