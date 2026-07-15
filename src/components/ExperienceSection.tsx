import React, { useState } from 'react';
import { Experience } from '../types';
import { Briefcase, Plus, Trash2, Edit2, Calendar, Check, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

interface ExperienceSectionProps {
  experiences: Experience[];
  isEditMode: boolean;
  onAdd: (exp: Omit<Experience, 'id'>) => Promise<void>;
  onUpdate: (exp: Experience) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (reordered: Experience[]) => Promise<void>;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  isEditMode,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setCompany('');
    setRole('');
    setStartDate('');
    setEndDate('');
    setDescription('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role || !startDate || !endDate) {
      alert('請填寫必填欄位 (公司名稱、職務、工作起迄時間)');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        company,
        role,
        startDate,
        endDate,
        description,
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

  const handleEditClick = (exp: Experience) => {
    setEditingId(exp.id);
    setCompany(exp.company);
    setRole(exp.role);
    setStartDate(exp.startDate);
    setEndDate(exp.endDate);
    setDescription(exp.description || '');
  };

  const handleUpdateSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!company || !role || !startDate || !endDate) {
      alert('請填寫必填欄位 (公司名稱、職務、工作起迄時間)');
      return;
    }

    setLoading(true);
    try {
      const existingExp = experiences.find(exp => exp.id === id);
      await onUpdate({
        id,
        company,
        role,
        startDate,
        endDate,
        description,
        userId: '', // preserved in parent
        order: existingExp?.order ?? 0,
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
    if (!window.confirm('確定要刪除這筆工作經歷資料嗎？')) return;
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

  // Drag and drop handlers
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const updated = [...experiences];
    const draggedItem = updated[draggedIdx];
    updated.splice(draggedIdx, 1);
    updated.splice(index, 0, draggedItem);

    setDraggedIdx(index);
    onReorder(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...experiences];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onReorder(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === experiences.length - 1) return;
    const updated = [...experiences];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onReorder(updated);
  };

  return (
    <div id="experience-container" className="bg-white border border-stone-200/80 rounded-3xl rounded-tr-none rounded-bl-[60px] shadow-[8px_8px_0px_rgba(28,25,23,0.03)] p-6 sm:p-8 mb-8 transition-all hover:shadow-[12px_12px_0px_rgba(28,25,23,0.05)] hover:border-stone-300/80">
      <div className="flex items-start justify-between mb-8 pb-4 border-b border-stone-200/80">
        <div className="flex items-start space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 mt-0.5">
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-stone-900 tracking-tight">工作經歷</h2>
            {isEditMode && experiences.length > 1 && (
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">（可按住拖曳或使用右側按鈕調整自訂排序）</p>
            )}
          </div>
        </div>
        {isEditMode && !isAdding && !editingId && (
          <button
            id="add-exp-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center space-x-1.5 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增經歷</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-stone-50/60 border border-stone-200 rounded-2xl p-5 mb-8 space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-stone-900 tracking-wide uppercase font-mono flex items-center space-x-1.5">
            <span>新增工作經歷資料</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">公司名稱 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value.slice(0, 100))}
                placeholder="例如: 美商谷歌股份有限公司"
                className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">職務/角色 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value.slice(0, 100))}
                placeholder="例如: 資深前端工程師"
                className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">任職開始年月 <span className="text-red-500">*</span></label>
              <input
                type="month"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">任職結束年月 <span className="text-red-500">*</span></label>
              <input
                type="month"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">工作內容說明 (選填)</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              placeholder="可填寫工作職責、主導的專案、所使用的技術棧 (React / Node / Go...)、達成的具體量化成果等..."
              className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all resize-y"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
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
              <span>{loading ? '儲存中...' : '確認新增'}</span>
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-6">
        {experiences.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-6 font-mono">尚未新增工作經歷資料。</p>
        ) : (
          <div className="relative border-l border-stone-200 pl-6 ml-4 space-y-8 py-2">
            {experiences.map((exp, index) => {
              const isEditingThis = editingId === exp.id;

              if (isEditingThis) {
                return (
                  <form
                    key={exp.id}
                    onSubmit={(e) => handleUpdateSubmit(e, exp.id)}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4 animate-fade-in"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">公司名稱 <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value.slice(0, 100))}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">職務/角色 <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={role}
                          onChange={(e) => setRole(e.target.value.slice(0, 100))}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">任職開始年月 <span className="text-red-500">*</span></label>
                        <input
                          type="month"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">任職結束年月 <span className="text-red-500">*</span></label>
                        <input
                          type="month"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">說明 (選填)</label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                        className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all resize-y"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-stone-200">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setEditingId(null);
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
                        <span>{loading ? '儲存中...' : '確認修改'}</span>
                      </button>
                    </div>
                  </form>
                );
              }

              const isDraggingThis = draggedIdx === index;

              return (
                <div
                  key={exp.id}
                  draggable={isEditMode && !editingId}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative flex flex-col sm:flex-row sm:items-start p-4 rounded-xl transition-all border border-transparent select-none ${
                    isEditMode && !editingId 
                      ? 'cursor-grab active:cursor-grabbing hover:bg-stone-50/75 hover:border-stone-200/50' 
                      : 'hover:bg-stone-50 hover:border-stone-200/50'
                  } ${isDraggingThis ? 'opacity-30 border-dashed border-stone-300 bg-stone-100/50' : ''}`}
                >
                  {/* Absolute Timeline Node Dot */}
                  <div className="absolute -left-[31px] top-6 w-3 h-3 rounded-full bg-emerald-700 border-2 border-white ring-4 ring-emerald-700/15 group-hover:scale-125 group-hover:bg-emerald-800 transition-all duration-300" />

                  {/* Info block */}
                  <div className="flex-1 space-y-1.5 pr-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <h4 className="text-base font-bold text-stone-900 font-display group-hover:text-emerald-800 transition-colors">{exp.company}</h4>
                      </div>
                      <div className="flex items-center text-xs text-stone-500 font-mono">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-stone-400" />
                        <span>{exp.startDate} ~ {exp.endDate}</span>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-emerald-800 font-mono tracking-wide uppercase">{exp.role}</p>

                    {exp.description && (
                      <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap pt-1 max-w-3xl">
                        {exp.description}
                      </p>
                    )}
                  </div>

                  {/* Action and Reordering buttons */}
                  {isEditMode && (
                    <div className="absolute right-4 top-4 flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white p-1 rounded-lg border border-stone-200 shadow-sm z-10">
                      {experiences.length > 1 && (
                        <div className="flex items-center border-r border-stone-100 pr-1 mr-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                            className={`p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            title="上移"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === experiences.length - 1}
                            onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                            className={`p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors ${index === experiences.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            title="下移"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        {experiences.length > 1 && (
                          <div 
                            className="p-1 text-stone-400 cursor-grab active:cursor-grabbing hover:bg-stone-50 rounded"
                            title="按住拖曳調整順序"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <button
                          id={`edit-exp-btn-${exp.id}`}
                          onClick={(e) => { e.stopPropagation(); handleEditClick(exp); }}
                          className="p-1.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                          title="編輯"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-exp-btn-${exp.id}`}
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(exp.id); }}
                          className="p-1.5 rounded text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="刪除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
