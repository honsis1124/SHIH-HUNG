import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../types';
import { LayoutGrid, Plus, Trash2, Edit2, Code, Camera, Save, X, ExternalLink, Check, Search, Video, Sparkles, SlidersHorizontal, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

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
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Enhancement States (Suggestion 1, 2, 3)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoverPreviewIdx, setHoverPreviewIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [techStack, setTechStack] = useState('');
  const [order, setOrder] = useState(0);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);

  // Hover preview auto-cycling logic (Suggestion 2)
  useEffect(() => {
    if (!hoveredCardId) return;
    const currentProj = projects.find(p => p.id === hoveredCardId);
    if (!currentProj) return;

    const mediaList = [
      ...(currentProj.image ? [currentProj.image] : []),
      ...(currentProj.extraImages || [])
    ];
    if (mediaList.length <= 1) return;

    const interval = setInterval(() => {
      setHoverPreviewIdx((prev) => (prev + 1) % mediaList.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [hoveredCardId, projects]);

  // Keyboard control integration: handles Arrow keys (switching media) & Escape (closing modals)
  useEffect(() => {
    if (!selectedProject) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. ESC key: Close lightbox if open, otherwise close selectedProject modal
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          setSelectedProject(null);
        }
        return;
      }

      // 2. Arrow keys: Change active media index (only if multiple media items exist)
      const mediaItems: { type: 'video' | 'image'; url: string }[] = [];
      if (selectedProject.videoUrl) {
        mediaItems.push({ type: 'video', url: selectedProject.videoUrl });
      }
      if (selectedProject.image) {
        mediaItems.push({ type: 'image', url: selectedProject.image });
      }
      if (selectedProject.extraImages && selectedProject.extraImages.length > 0) {
        selectedProject.extraImages.forEach((img) => {
          mediaItems.push({ type: 'image', url: img });
        });
      }

      if (mediaItems.length <= 1) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        if (isLightboxOpen) {
          // In Lightbox, we only cycle through images!
          const imageIndices = mediaItems
            .map((item, idx) => (item.type === 'image' ? idx : -1))
            .filter((idx) => idx !== -1);
            
          if (imageIndices.length > 1) {
            const currentImgSubIdx = imageIndices.indexOf(activeMediaIndex);
            if (currentImgSubIdx !== -1) {
              let nextSubIdx = 0;
              if (e.key === 'ArrowLeft') {
                nextSubIdx = (currentImgSubIdx - 1 + imageIndices.length) % imageIndices.length;
              } else {
                nextSubIdx = (currentImgSubIdx + 1) % imageIndices.length;
              }
              setActiveMediaIndex(imageIndices[nextSubIdx]);
            }
          }
        } else {
          // Regular modal: cycle through all media items (images and videos)
          let nextIdx = 0;
          if (e.key === 'ArrowLeft') {
            nextIdx = (activeMediaIndex - 1 + mediaItems.length) % mediaItems.length;
          } else {
            nextIdx = (activeMediaIndex + 1) % mediaItems.length;
          }
          setActiveMediaIndex(nextIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProject, isLightboxOpen, activeMediaIndex]);

  // Compile all unique tech tags dynamically (Suggestion 3)
  const allDynamicTechs = useMemo(() => {
    const techsSet = new Set<string>();
    projects.forEach(p => {
      if (p.techStack) {
        p.techStack.split(',').forEach(tech => {
          const cleaned = tech.trim();
          if (cleaned) {
            techsSet.add(cleaned);
          }
        });
      }
    });
    return Array.from(techsSet).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  // Dynamically filtered projects (Suggestion 3)
  const filteredProjects = useMemo(() => {
    return projects.filter(proj => {
      // Search text match
      const textToSearch = `${proj.title} ${proj.description} ${proj.techStack || ''}`.toLowerCase();
      const matchesSearch = searchQuery.trim() === '' || textToSearch.includes(searchQuery.toLowerCase());
      
      // Multi-select tags match (all selected must match)
      const projTechs = proj.techStack
        ? proj.techStack.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
        : [];
      const matchesTechs = selectedTechs.length === 0 || selectedTechs.every(tech => 
        projTechs.includes(tech.toLowerCase())
      );
      
      return matchesSearch && matchesTechs;
    });
  }, [projects, searchQuery, selectedTechs]);

  const toggleTechSelect = (tech: string) => {
    setSelectedTechs(prev => 
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImage('');
    setLink('');
    setTechStack('');
    setOrder(0);
    setExtraImages([]);
    setVideoUrl('');
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

  const handleExtraImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingCount = 5 - extraImages.length;
    if (remainingCount <= 0) {
      alert('最多只能上傳 5 張額外圖片！');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingCount) as File[];
    const newImages: string[] = [];

    for (const file of filesToUpload) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`圖片 ${file.name} 過大！請上傳小於 5MB 的圖片，系統會自動壓縮。`);
        continue;
      }
      try {
        const base64 = await compressImage(file, 600, 400, 0.75);
        newImages.push(base64);
      } catch (err) {
        console.error(err);
        alert(`圖片 ${file.name} 讀取或壓縮失敗，請重試！`);
      }
    }

    if (newImages.length > 0) {
      setExtraImages((prev) => [...prev, ...newImages]);
    }

    e.target.value = '';
  };

  const handleExtraImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const remainingCount = 5 - extraImages.length;
    if (remainingCount <= 0) {
      alert('最多只能上傳 5 張額外圖片！');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingCount) as File[];
    const newImages: string[] = [];

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        alert('請上傳圖片檔案！');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`圖片 ${file.name} 過大！請上傳小於 5MB 的圖片，系統會自動壓縮。`);
        continue;
      }
      try {
        const base64 = await compressImage(file, 600, 400, 0.75);
        newImages.push(base64);
      } catch (err) {
        console.error(err);
        alert(`圖片 ${file.name} 讀取或壓縮失敗，請重試！`);
      }
    }

    if (newImages.length > 0) {
      setExtraImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeExtraImage = (index: number) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
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
        extraImages,
        videoUrl,
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
    setExtraImages(proj.extraImages || []);
    setVideoUrl(proj.videoUrl || '');
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
        extraImages,
        videoUrl,
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

          {/* Extra Media Fields */}
          <div className="border-t border-stone-200/60 pt-4 space-y-4">
            <h4 className="text-[11px] font-bold text-stone-700 uppercase tracking-wider font-mono">
              額外展示圖片與影音設定 (選填)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Extra Images Upload & Preview */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-stone-700">
                  額外展示圖片 (最多 5 張，已上傳 {extraImages.length}/5 張) <span className="text-[10px] text-stone-400 font-normal">支援拖曳檔案</span>
                </label>
                
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleExtraImageDrop}
                  className="p-3 bg-stone-100/50 rounded-2xl border border-stone-200 flex flex-wrap gap-2 items-center min-h-[92px] transition-all hover:bg-stone-100/80 group"
                >
                  {extraImages.map((imgBase64, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 group bg-stone-50 transition-all hover:scale-105 hover:shadow-md">
                      <img src={imgBase64} alt={`Extra ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExtraImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full shadow-sm cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                        title="移除圖片"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  
                  {extraImages.length < 5 ? (
                    <button
                      type="button"
                      onClick={() => extraFileInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 hover:border-stone-500 hover:bg-white flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 transition-all cursor-pointer bg-white"
                      title="新增額外展示圖片"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-0.5">新增</span>
                    </button>
                  ) : null}

                  {extraImages.length === 0 && (
                    <span className="text-[10px] text-stone-400 font-mono ml-2 pointer-events-none">
                      可在此處點擊新增或拖曳上傳最多 5 張圖片
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  ref={extraFileInputRef}
                  onChange={handleExtraImageChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Video URL Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-stone-700">影音/影片連結 (選填)</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value.slice(0, 500))}
                    placeholder="支援 YouTube 網址或 MP4 影片路徑"
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                  />
                  
                  {/* Immediate YouTube/Video Preview (Suggestion 2) */}
                  {(() => {
                    const ytEmbed = getYouTubeEmbedUrl(videoUrl);
                    if (ytEmbed) {
                      // Extract YT ID for thumbnail
                      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                      const match = videoUrl.match(regExp);
                      const ytId = match && match[2].length === 11 ? match[2] : null;
                      
                      return (
                        <div className="relative w-full h-24 bg-stone-950 border border-stone-200 rounded-xl overflow-hidden flex items-center justify-center group/yt-preview">
                          {ytId ? (
                            <img 
                              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} 
                              alt="YouTube Video Preview" 
                              className="absolute inset-0 w-full h-full object-cover opacity-60 filter blur-[0.5px]"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-stone-950/40" />
                          <div className="relative z-10 flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-[10px] font-bold">
                            <Video className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span>YouTube 影音連結已解析</span>
                          </div>
                        </div>
                      );
                    } else if (videoUrl && videoUrl.toLowerCase().endsWith('.mp4')) {
                      return (
                        <div className="relative w-full h-24 bg-stone-950 border border-stone-200 rounded-xl overflow-hidden flex items-center justify-center">
                          <video src={videoUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" muted />
                          <div className="relative z-10 flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-[10px] font-bold">
                            <Video className="w-3.5 h-3.5 text-amber-400" />
                            <span>MP4 影音連結已載入</span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p className="text-[10px] text-stone-400 leading-tight">
                        可貼上如：https://www.youtube.com/watch?v=... 或 MP4 直連網址。
                      </p>
                    );
                  })()}
                </div>
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

      {/* Dynamic Search & Tech Filter Bar (Suggestion 3) */}
      {projects.length > 0 && (
        <div className="mb-8 p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-4 no-print animate-fade-in">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋作品名稱、描述或技術標籤..."
                className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clear Filters Helper */}
            {(searchQuery || selectedTechs.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTechs([]);
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 cursor-pointer self-start md:self-auto bg-amber-500/5 px-3 py-2 rounded-xl border border-amber-500/10 hover:bg-amber-500/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>清除所有篩選條件</span>
              </button>
            )}
          </div>

          {/* Dynamic Technology Filter Tags */}
          {allDynamicTechs.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-stone-200/50">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono">
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
                <span>依技術標籤過濾 (可複選)：</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allDynamicTechs.map((tech) => {
                  const isSelected = selectedTechs.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTechSelect(tech)}
                      className={`px-3 py-1 text-xs font-mono rounded-lg transition-all border cursor-pointer select-none ${
                        isSelected
                          ? 'bg-stone-900 border-stone-950 text-white shadow-md'
                          : 'bg-white hover:bg-stone-100 border-stone-200/80 text-stone-600 hover:text-stone-900 shadow-sm'
                      }`}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-xs text-stone-400 text-center py-16 bg-stone-50 rounded-2xl border border-stone-200/50 font-mono flex flex-col items-center justify-center space-y-2">
            <LayoutGrid className="w-8 h-8 text-stone-300 stroke-[1.5]" />
            <span>
              {projects.length === 0 ? '尚未新增任何作品展示。' : '找不到符合條件的作品，試試其他關鍵字吧！'}
            </span>
          </div>
        ) : (
          filteredProjects
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

              // Hover preview media computation (Suggestion 2)
              const isHovered = hoveredCardId === proj.id;
              const hoverMediaUrls = [
                ...(proj.image ? [proj.image] : []),
                ...(proj.extraImages || [])
              ];
              const currentImgSrc = (isHovered && hoverMediaUrls.length > 1)
                ? hoverMediaUrls[hoverPreviewIdx]
                : (proj.image || '');

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveMediaIndex(0);
                    setSelectedProject(proj);
                  }}
                  onMouseEnter={() => {
                    setHoveredCardId(proj.id);
                    setHoverPreviewIdx(0);
                  }}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className={`group relative flex flex-col bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-[8px_8px_0px_rgba(28,25,23,0.04)] hover:border-stone-300 transition-all duration-300 cursor-pointer ${cornerStyle} ${staggerOffset}`}
                >
                  {/* Image banner preview */}
                  <div className="h-44 bg-stone-50 overflow-hidden relative border-b border-stone-100 flex items-center justify-center">
                    {currentImgSrc ? (
                      <img
                        src={currentImgSrc}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-all duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-300">
                        <Code className="w-10 h-10 mb-2 stroke-[1.5] text-stone-300" />
                        <span className="text-[10px] font-mono text-stone-400">No Cover Photo</span>
                      </div>
                    )}

                    {/* Media Badges Overlay (Suggestion 2) */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10 pointer-events-none select-none no-print">
                      {proj.videoUrl && (
                        <span className="inline-flex items-center space-x-1.5 bg-amber-400 text-stone-900 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md tracking-wide uppercase font-mono">
                          <Video className="w-2.5 h-2.5 fill-stone-900" />
                          <span>影音</span>
                        </span>
                      )}
                      {proj.extraImages && proj.extraImages.length > 0 && (
                        <span className="inline-flex items-center space-x-1.5 bg-stone-900/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md tracking-wide font-mono">
                          <Camera className="w-2.5 h-2.5 text-stone-300" />
                          <span>+{proj.extraImages.length} 媒體</span>
                        </span>
                      )}
                    </div>

                    {/* Hover Carousel Indicator Dots (Suggestion 2) */}
                    {isHovered && hoverMediaUrls.length > 1 && (
                      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full z-10 transition-opacity no-print">
                        {hoverMediaUrls.map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`block w-1 h-1 rounded-full transition-all duration-300 ${
                              dotIdx === hoverPreviewIdx ? 'bg-amber-400 w-1.5' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* View demo Link icon overlay */}
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 hover:scale-105 hover:bg-white transition-all shadow-sm z-20"
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
                      className="absolute top-2 left-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-lg border border-stone-200 shadow-md no-print"
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
      {selectedProject && (() => {
        const mediaItems: { type: 'video' | 'image'; url: string }[] = [];
        if (selectedProject.videoUrl) {
          mediaItems.push({ type: 'video', url: selectedProject.videoUrl });
        }
        if (selectedProject.image) {
          mediaItems.push({ type: 'image', url: selectedProject.image });
        }
        if (selectedProject.extraImages && selectedProject.extraImages.length > 0) {
          selectedProject.extraImages.forEach((img) => {
            mediaItems.push({ type: 'image', url: img });
          });
        }
        const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0];

        return createPortal(
          <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/45 backdrop-blur-md animate-fade-in select-text no-print">
              <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in text-left">
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Media Player / Viewer */}
                <div className="mb-6 space-y-3">
                  <div className="w-full h-64 md:h-96 bg-stone-50 border border-stone-100 rounded-2xl overflow-hidden relative flex items-center justify-center group/player">
                    {mediaItems.length > 0 && activeMedia ? (
                      activeMedia.type === 'video' ? (
                        (() => {
                          const ytEmbed = getYouTubeEmbedUrl(activeMedia.url);
                          if (ytEmbed) {
                            return (
                              <iframe
                                src={ytEmbed}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          } else {
                            return (
                              <video
                                src={activeMedia.url}
                                controls
                                className="w-full h-full object-contain bg-black"
                              />
                            );
                          }
                        })()
                      ) : (
                        <div 
                          onClick={() => setIsLightboxOpen(true)}
                          className="relative w-full h-full flex items-center justify-center cursor-zoom-in"
                        >
                          <img src={activeMedia.url} alt={selectedProject.title} className="w-full h-full object-cover" />
                          
                          {/* Eye zoom-in indicator overlay */}
                          <div className="absolute inset-0 bg-stone-900/0 group-hover/player:bg-stone-900/20 flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-all duration-300">
                            <div className="bg-stone-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-md">
                              <Eye className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>點擊放大圖片 (Lightbox)</span>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-300 py-12">
                        <Code className="w-12 h-12 mb-2 stroke-[1.5]" />
                        <span className="text-[11px] font-mono">無媒體檔案</span>
                      </div>
                    )}
                  </div>

                  {/* Media Thumbnails Row */}
                  {mediaItems.length > 1 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto py-2.5 px-1 scrollbar-none">
                      {mediaItems.map((item, idx) => {
                        const isSelected = idx === activeMediaIndex;
                        const isVideo = item.type === 'video';
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveMediaIndex(idx)}
                            className={`relative w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0 transition-all bg-stone-50 flex items-center justify-center cursor-pointer ${
                              isSelected 
                                ? 'border-stone-950 ring-2 ring-stone-950 ring-offset-2 scale-105 shadow-md z-10' 
                                : 'border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            {isVideo ? (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-100 p-1 text-center">
                                <div className="w-6 h-6 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-md animate-pulse">
                                  <svg className="w-3.5 h-3.5 fill-current ml-0.5 text-stone-900" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                                <span className="text-[8px] font-bold mt-1 tracking-tight truncate w-full">影片</span>
                              </div>
                            ) : (
                              <img src={item.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

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

                  {/* Keyboard Shortcuts Hint */}
                  <div className="hidden md:flex items-center space-x-1 text-[10px] text-stone-400 font-mono">
                    <span>鍵盤支援：</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">←</kbd>
                    <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">→</kbd>
                    <span>，</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200">ESC</kbd>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    關閉視窗
                  </button>
                </div>
              </div>
            </div>

            {/* Fullscreen Lightbox Portal Overlay (Suggestion 1) */}
            {isLightboxOpen && activeMedia && activeMedia.type === 'image' && (
              <div 
                onClick={() => setIsLightboxOpen(false)}
                className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-stone-950/95 backdrop-blur-lg p-4 animate-fade-in select-none cursor-zoom-out no-print"
              >
                {/* Close button */}
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all cursor-pointer z-[130] shadow-lg border border-white/10"
                  title="關閉放大"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Lightbox Main Container */}
                <div className="relative max-w-5xl max-h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <img 
                    src={activeMedia.url} 
                    alt={selectedProject.title} 
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/5 animate-scale-in"
                  />
                  
                  {/* Slideshow image counter */}
                  <span className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md text-stone-300 text-[10px] font-mono px-3 py-1 rounded-full border border-stone-800">
                    圖片 {activeMediaIndex + (selectedProject.videoUrl ? 0 : 1)} / {mediaItems.filter(m => m.type === 'image').length}
                  </span>
                </div>

                {/* Next / Previous controllers */}
                {mediaItems.filter(m => m.type === 'image').length > 1 && (
                  <div className="flex items-center space-x-6 mt-6" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        let prevIdx = activeMediaIndex;
                        do {
                          prevIdx = (prevIdx - 1 + mediaItems.length) % mediaItems.length;
                        } while (mediaItems[prevIdx].type !== 'image');
                        setActiveMediaIndex(prevIdx);
                      }}
                      className="w-12 h-12 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-md"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-stone-300 text-xs font-semibold font-mono tracking-wider">
                      投影片導覽
                    </span>
                    <button
                      onClick={() => {
                        let nextIdx = activeMediaIndex;
                        do {
                          nextIdx = (nextIdx + 1) % mediaItems.length;
                        } while (mediaItems[nextIdx].type !== 'image');
                        setActiveMediaIndex(nextIdx);
                      }}
                      className="w-12 h-12 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-md"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>,
          document.body
        );
      })()}
    </div>
  );
};
