import React, { useState, useRef } from 'react';
import { Project } from '../types';
import { LayoutGrid, Plus, Trash2, Edit2, Link, Code, Camera, Save, X, ExternalLink, Check } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface ProjectSectionProps {
  projects: Project[];
  isEditMode: boolean;
  onAdd: (proj: Omit<Project, 'id'>) => Promise<void>;
  onUpdate: (proj: Project) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  isEditMode,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [techStack, setTechStack] = useState('');
  const [order, setOrder] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImage('');
    setLink('');
    setTechStack('');
    setOrder(0);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('圖片過大！請上傳小於 5MB 的圖片，系統會自動壓縮。');
      return;
    }

    try {
      // Compress to fit inside Firestore comfortably (max 600px, 0.75 quality)
      const base64 = await compressImage(file, 600, 400, 0.75);
      setImage(base64);
    } catch (err) {
      console.error(err);
      alert('圖片讀取或壓縮失敗，請重試！');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert('請填寫作品名稱和簡介');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        title,
        description,
        image,
        link,
        techStack,
        order,
        userId: '', // set in parent
      });
      setIsAdding(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('新增失敗，請檢查權限！');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (proj: Project) => {
    setEditingId(proj.id);
    setTitle(proj.title);
    setDescription(proj.description);
    setImage(proj.image || '');
    setLink(proj.link || '');
    setTechStack(proj.techStack || '');
    setOrder(proj.order || 0);
  };

  const handleUpdateSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!title || !description) {
      alert('請填寫作品名稱和簡介');
      return;
    }

    setLoading(true);
    try {
      await onUpdate({
        id,
        title,
        description,
        image,
        link,
        techStack,
        order,
        userId: '', // preserved in parent
      });
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('修改失敗，請檢查權限！');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('確定要刪除這項作品展示嗎？')) return;
    setLoading(true);
    try {
      await onDelete(id);
    } catch (err) {
      console.error(err);
      alert('刪除失敗，請檢查權限！');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="projects-container" className="bg-[#11162d]/65 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 transition-all hover:border-slate-700/60 hover:shadow-indigo-950/10 hover:shadow-2xl">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <LayoutGrid className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-lg font-display font-bold text-white tracking-tight">作品展示 / 專案成果</h2>
        </div>
        {isEditMode && !isAdding && !editingId && (
          <button
            id="add-project-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center space-x-1.5 bg-[#1b2246] hover:bg-[#252f5e] text-indigo-300 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增作品</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-[#141a35] border border-slate-800/80 rounded-2xl p-5 mb-8 space-y-4">
          <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono text-indigo-400">新增作品展示</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Upload Area */}
            <div className="flex flex-col items-center justify-center bg-[#1b2246] border border-dashed border-slate-700 rounded-xl p-4 min-h-[180px]">
              {image ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden group">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow cursor-pointer transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="text-center cursor-pointer hover:text-indigo-400 group py-4"
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 text-slate-500 group-hover:text-indigo-400 transition-all" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300">上傳作品截圖</span>
                  <p className="text-[10px] text-slate-400 mt-1">支援 JPG、PNG，自動壓縮</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Inputs Area */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">作品名稱 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder="如: 電商平台前端重構專案"
                    className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">作品連結 (選填)</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value.slice(0, 200))}
                    placeholder="https://myportfolio.com"
                    className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">技術標籤 (逗號分隔)</label>
                  <input
                    type="text"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value.slice(0, 500))}
                    placeholder="React, Redux, Tailwind CSS, TypeScript"
                    className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">顯示排序 (數字愈大愈前面)</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">作品/專案簡介 <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="介紹該作品的目標、使用的解決方案與關鍵貢獻特色..."
                  className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all resize-y"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/40">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700/60 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? '儲存中...' : '確認新增'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid of Projects */}
      {editingId && (
        <form
          onSubmit={(e) => handleUpdateSubmit(e, editingId)}
          className="bg-[#141a35] border border-slate-800 rounded-2xl p-5 mb-8 space-y-4"
        >
          <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono text-indigo-400">編輯作品資料</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center bg-[#1b2246] border border-dashed border-slate-700 rounded-xl p-4 min-h-[180px]">
              {image ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden group">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow cursor-pointer transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="text-center cursor-pointer hover:text-indigo-400 group py-4"
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 text-slate-500 group-hover:text-indigo-400 transition-all" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300">上傳作品截圖</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">作品名稱 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">作品連結 (選填)</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value.slice(0, 200))}
                    className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">技術標籤 (逗號分隔)</label>
                  <input
                    type="text"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value.slice(0, 500))}
                    className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">顯示排序 (數字愈大愈前面)</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">作品/專案簡介 <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  className="w-full px-3.5 py-2 bg-[#1b2246] border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl text-xs outline-none transition-all resize-y"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/40">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setEditingId(null);
                resetForm();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700/60 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>儲存修改</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-xs text-slate-400 text-center py-12 font-mono">
            尚未新增任何作品展示。
          </div>
        ) : (
          projects
            .sort((a, b) => (b.order || 0) - (a.order || 0))
            .map((proj) => {
              const techList = proj.techStack
                ? proj.techStack.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
                : [];

              return (
                <div
                  key={proj.id}
                  className="group relative flex flex-col bg-[#141a35]/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-indigo-950/10 hover:shadow-lg hover:border-slate-700/60 transition-all duration-300"
                >
                  {/* Image banner preview */}
                  <div className="h-44 bg-[#0d1124] overflow-hidden relative border-b border-slate-800/60 flex items-center justify-center">
                    {proj.image ? (
                      <img
                        src={proj.image}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600">
                        <Code className="w-10 h-10 mb-2 stroke-[1.5] text-slate-600" />
                        <span className="text-[10px] font-mono text-slate-500">No Cover Photo</span>
                      </div>
                    )}

                    {/* View demo Link icon overlay */}
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-slate-200 hover:text-white hover:scale-105 hover:bg-white/20 transition-all"
                        title="查看作品連結"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-white font-display group-hover:text-indigo-300 transition-colors duration-300 line-clamp-1">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {proj.description}
                      </p>
                    </div>

                    {/* Tech Stack */}
                    {techList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {techList.slice(0, 4).map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[9px] font-mono font-medium rounded-md bg-[#1e244b]/60 text-indigo-300 border border-slate-800/60"
                          >
                            {tech}
                          </span>
                        ))}
                        {techList.length > 4 && (
                          <span className="text-[9px] text-slate-400 font-mono self-center pl-0.5">
                            +{techList.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Administrative overlays */}
                  {isEditMode && (
                    <div className="absolute top-2 left-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#11162d] p-1 rounded-lg border border-slate-800/85">
                      <button
                        id={`edit-proj-btn-${proj.id}`}
                        onClick={() => handleEditClick(proj)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="編輯"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-proj-btn-${proj.id}`}
                        onClick={() => handleDeleteClick(proj.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
