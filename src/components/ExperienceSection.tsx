import React, { useState } from 'react';
import { Experience } from '../types';
import { Briefcase, Plus, Trash2, Edit2, Calendar, Check } from 'lucide-react';

interface ExperienceSectionProps {
  experiences: Experience[];
  isEditMode: boolean;
  onAdd: (exp: Omit<Experience, 'id'>) => Promise<void>;
  onUpdate: (exp: Experience) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  isEditMode,
  onAdd,
  onUpdate,
  onDelete,
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
      await onUpdate({
        id,
        company,
        role,
        startDate,
        endDate,
        description,
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

  return (
    <div id="experience-container" className="bg-white border border-stone-200/80 rounded-3xl rounded-tl-[60px] rounded-br-none shadow-[8px_8px_0px_rgba(28,25,23,0.03)] p-6 sm:p-8 mb-8 transition-all hover:shadow-[12px_12px_0px_rgba(28,25,23,0.05)] hover:border-stone-300/80">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200/80">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-lg font-display font-bold text-stone-900 tracking-tight">工作經歷</h2>
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
          <h3 className="text-xs font-bold text-stone-900 tracking-wide uppercase font-mono">新增工作經歷</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">公司名稱 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value.slice(0, 100))}
                placeholder="例如: 台灣積體電路 (TSMC)"
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
                placeholder="例如: 資深研發工程師"
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
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">任職結束年月 (若仍在職，請選當前或預計月) <span className="text-red-500">*</span></label>
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
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">工作內容與專案表現 (選填)</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              placeholder="說明您在職期間的核心職責、參與的重要專案、使用的技術工具以及量化的具體成果表現..."
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
            {experiences.map((exp) => {
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

              return (
                <div
                  key={exp.id}
                  className="group relative flex flex-col sm:flex-row sm:items-start p-4 rounded-xl hover:bg-stone-50 transition-all border border-transparent hover:border-stone-200/50"
                >
                  {/* Absolute Timeline Node Dot */}
                  <div className="absolute -left-[31px] top-6 w-3 h-3 rounded-full bg-emerald-700 border-2 border-white ring-4 ring-emerald-700/15 group-hover:scale-125 group-hover:bg-emerald-800 transition-all duration-300" />

                  {/* Info block */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
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

                  {/* Edit operations */}
                  {isEditMode && (
                    <div className="absolute right-4 top-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-lg border border-stone-200">
                      <button
                        id={`edit-exp-btn-${exp.id}`}
                        onClick={() => handleEditClick(exp)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="編輯"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-exp-btn-${exp.id}`}
                        onClick={() => handleDeleteClick(exp.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
