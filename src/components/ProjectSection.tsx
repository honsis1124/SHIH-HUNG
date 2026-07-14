import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../types';
import { LayoutGrid, Plus, Trash2, Edit2, Code, Camera, Save, X, ExternalLink, Check } from 'lucide-react';
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
    <div id="project-container" className="bg-white border border-stone-200/80 rounded-3xl rounded-tr-none rounded-bl-none rounded-br-[80px] shadow-[8px_8px_0px_rgba(28,25,23,0.03)] p-6 sm:p-8 mb-8 transition-all hover:shadow-[12px_12px_0px_rgba(28,25,23,0.05)] hover:border-stone-300/80">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200/80">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-stone-100 text-stone-800 border border-stone-200">
            <LayoutGrid className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-lg font-display font-bold text-stone-900 tracking-tight">作品展示</h2>
        </div>
        {isEditMode && !isAdding && !editingId && (
          <button
            id="add-proj-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center space-x-1.5 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增作品</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <form
          onSubmit={isAdding ? handleAddSubmit : (e) => handleUpdateSubmit(e, editingId!)}
          className="bg-stone-50/60 border border-stone-200 rounded-2xl p-5 mb-8 space-y-4 animate-fade-in"
        >
          <h3 className="text-xs font-bold text-stone-900 tracking-wide uppercase font-mono">
            {isAdding ? '新增作品展示' : '編輯作品展示'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-white min-h-[140px] transition-all hover:border-stone-400">
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
                  className="text-center cursor-pointer hover:text-stone-800 group py-4"
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 text-stone-400 group-hover:text-stone-600 transition-all" />
                  <span className="text-xs font-semibold text-stone-500 group-hover:text-stone-700">上傳作品截圖</span>
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
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">作品名稱 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">作品連結 (選填)</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value.slice(0, 200))}
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">技術標籤 (逗號分隔)</label>
                  <input
                    type="text"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value.slice(0, 500))}
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">顯示排序 (數字愈大愈前面)</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">作品/專案簡介 <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all resize-y"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setEditingId(null);
                setIsAdding(false);
                resetForm();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 border border-stone-200 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? '儲存中...' : '儲存修改'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-xs text-stone-400 text-center py-12 font-mono">
            尚未新增任何作品展示。
          </div>
        ) : (
          projects
            .sort((a, b) => (b.order || 0) - (a.order || 0))
            .map((proj, index) => {
              const techList = proj.techStack
                ? proj.techStack.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
                : [];

              // Dynamic asymmetrical corner borders to reflect "breaking conventional template constraints"
              const cornerStyle = index % 3 === 0
                ? 'rounded-2xl rounded-tr-[50px] rounded-bl-none'
                : index % 3 === 1
                ? 'rounded-2xl rounded-tl-[50px] rounded-br-none'
                : 'rounded-2xl rounded-br-[50px] rounded-tl-none';

              // Dynamic stagger offsets on desktop to create asymmetric layout
              const staggerOffset = index % 2 === 1
                ? 'md:translate-y-4'
                : 'md:translate-y-0';

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className={`group relative flex flex-col bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-[8px_8px_0px_rgba(28,25,23,0.04)] hover:border-stone-300 transition-all duration-300 cursor-pointer ${cornerStyle} ${staggerOffset}`}
                >
                  {/* Image banner preview */}
                  <div className="h-44 bg-stone-50 overflow-hidden relative border-b border-stone-100 flex items-center justify-center">
                    {proj.image ? (
                      <img
                        src={proj.image}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-300">
                        <Code className="w-10 h-10 mb-2 stroke-[1.5] text-stone-300" />
                        <span className="text-[10px] font-mono text-stone-400">No Cover Photo</span>
                      </div>
                    )}

                    {/* View demo Link icon overlay */}
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 hover:scale-105 hover:bg-white transition-all shadow-sm"
                        title="查看作品連結"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-stone-900 font-display group-hover:text-stone-700 transition-colors duration-300 line-clamp-1 break-all">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-3 break-all">
                        {proj.description}
                      </p>
                    </div>

                    {/* Tech Stack */}
                    {techList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {techList.slice(0, 4).map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[9px] font-mono font-medium rounded-md bg-stone-50 text-stone-600 border border-stone-200/80"
                          >
                            {tech}
                          </span>
                        ))}
                        {techList.length > 4 && (
                          <span className="text-[9px] text-stone-400 font-mono self-center pl-0.5">
                            +{techList.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Administrative overlays */}
                  {isEditMode && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 left-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-lg border border-stone-200 shadow-md"
                    >
                      <button
                        id={`edit-proj-btn-${proj.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(proj);
                        }}
                        className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                        title="編輯"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-proj-btn-${proj.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(proj.id);
                        }}
                        className="p-1 rounded text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

      {/* Project details modal */}
      {selectedProject && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/45 backdrop-blur-md animate-fade-in select-text">
          <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto animate-scale-in text-left">
            {/* Close button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Project Cover Image */}
            {selectedProject.image ? (
              <div className="w-full h-64 md:h-80 bg-stone-50 border border-stone-100 rounded-2xl overflow-hidden mb-6 relative">
                <img src={selectedProject.image} alt={selectedProject.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-40 bg-stone-50 border border-stone-200/60 rounded-2xl flex flex-col items-center justify-center text-stone-300 mb-6">
                <Code className="w-12 h-12 mb-2 stroke-[1.5]" />
                <span className="text-[11px] font-mono">No Cover Photo</span>
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between space-x-4 mb-4 pb-4 border-b border-stone-100">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-stone-900 font-display break-all">
                  {selectedProject.title}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Project Showcase</p>
              </div>
            </div>

            {/* Tech Stack */}
            {selectedProject.techStack && (
              <div className="mb-6">
                <h4 className="text-[11px] font-mono tracking-wider uppercase text-stone-400 font-bold mb-2">使用技術 / Tech Stack</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.techStack.split(',').map((t) => t.trim()).filter((t) => t.length > 0).map((tech, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-mono rounded-lg bg-stone-50 text-stone-600 border border-stone-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content Description */}
            <div className="mb-8">
              <h4 className="text-[11px] font-mono tracking-wider uppercase text-stone-400 font-bold mb-2">專案簡介 / Description</h4>
              <div className="text-stone-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans break-all">
                {selectedProject.description}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
              {selectedProject.link ? (
                <a
                  href={selectedProject.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-stone-900/10 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                  <span>瀏覽作品連結</span>
                </a>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedProject(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
