import React, { useState } from 'react';
import { Education } from '../types';
import { GraduationCap, Plus, Trash2, Edit2, Calendar, Check } from 'lucide-react';

interface EducationSectionProps {
  educations: Education[];
  isEditMode: boolean;
  onAdd: (edu: Omit<Education, 'id'>) => Promise<void>;
  onUpdate: (edu: Education) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  educations,
  isEditMode,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [degree, setDegree] = useState('學士');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const degreesList = ['博士', '碩士', '學士', '副學士', '大專', '高中職', '其他'];

  const resetForm = () => {
    setSchool('');
    setMajor('');
    setDegree('學士');
    setStartDate('');
    setEndDate('');
    setDescription('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !major || !startDate || !endDate) {
      alert('請填寫必填欄位 (學校、科系、入學與畢業時間)');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        school,
        major,
        degree,
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

  const handleEditClick = (edu: Education) => {
    setEditingId(edu.id);
    setSchool(edu.school);
    setMajor(edu.major);
    setDegree(edu.degree);
    setStartDate(edu.startDate);
    setEndDate(edu.endDate);
    setDescription(edu.description || '');
  };

  const handleUpdateSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!school || !major || !startDate || !endDate) {
      alert('請填寫必填欄位 (學校、科系、入學與畢業時間)');
      return;
    }

    setLoading(true);
    try {
      await onUpdate({
        id,
        school,
        major,
        degree,
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
    if (!window.confirm('確定要刪除這筆學歷資料嗎？')) return;
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
    <div id="education-container" className="bg-white border border-stone-200/80 rounded-3xl rounded-tr-none rounded-bl-[60px] shadow-[8px_8px_0px_rgba(28,25,23,0.03)] p-6 sm:p-8 mb-8 transition-all hover:shadow-[12px_12px_0px_rgba(28,25,23,0.05)] hover:border-stone-300/80">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200/80">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <GraduationCap className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-lg font-display font-bold text-stone-900 tracking-tight">學歷背景</h2>
        </div>
        {isEditMode && !isAdding && !editingId && (
          <button
            id="add-edu-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center space-x-1.5 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增學歷</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-stone-50/60 border border-stone-200 rounded-2xl p-5 mb-8 space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-stone-900 tracking-wide uppercase font-mono flex items-center space-x-1.5">
            <span>新增學歷資料</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">學校名稱 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value.slice(0, 100))}
                placeholder="例如: 國立台灣大學"
                className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">主修科系 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value.slice(0, 100))}
                placeholder="例如: 資訊工程學系"
                className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">學位 <span className="text-red-500">*</span></label>
              <select
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
              >
                {degreesList.map((deg) => (
                  <option key={deg} value={deg} className="bg-white text-stone-900">{deg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">入學年月 <span className="text-red-500">*</span></label>
              <input
                type="month"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">畢業年月 (或預計畢業) <span className="text-red-500">*</span></label>
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
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">學經歷說明 / 書卷獎 / 專題研究 (選填)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              placeholder="可填寫在校主修亮點、書卷獎、專題論文、社團職務、交換學生經歷等..."
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
        {educations.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-6 font-mono">尚未新增學歷背景資料。</p>
        ) : (
          <div className="relative border-l border-stone-200 pl-6 ml-4 space-y-8 py-2">
            {educations.map((edu) => {
              const isEditingThis = editingId === edu.id;

              if (isEditingThis) {
                return (
                  <form
                    key={edu.id}
                    onSubmit={(e) => handleUpdateSubmit(e, edu.id)}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4 animate-fade-in"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">學校名稱 <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={school}
                          onChange={(e) => setSchool(e.target.value.slice(0, 100))}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">主修科系 <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={major}
                          onChange={(e) => setMajor(e.target.value.slice(0, 100))}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">學位 <span className="text-red-500">*</span></label>
                        <select
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                        >
                          {degreesList.map((deg) => (
                            <option key={deg} value={deg} className="bg-white text-stone-900">{deg}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">入學年月 <span className="text-red-500">*</span></label>
                        <input
                          type="month"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:ring-1 focus:ring-stone-800/20 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">畢業年月 <span className="text-red-500">*</span></label>
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
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
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
                  key={edu.id}
                  className="group relative flex flex-col sm:flex-row sm:items-start p-4 rounded-xl hover:bg-stone-50 transition-all border border-transparent hover:border-stone-200/50"
                >
                  {/* Absolute Timeline Node Dot */}
                  <div className="absolute -left-[31px] top-6 w-3 h-3 rounded-full bg-amber-600 border-2 border-white ring-4 ring-amber-600/15 group-hover:scale-125 group-hover:bg-amber-700 transition-all duration-300" />

                  {/* Details */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-stone-900 font-display group-hover:text-amber-800 transition-colors">{edu.school}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 border border-amber-200/50 text-amber-900 font-mono">
                          {edu.degree}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-stone-500 font-mono">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-stone-400" />
                        <span>{edu.startDate} ~ {edu.endDate}</span>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-amber-800 font-mono tracking-wide uppercase">{edu.major}</p>

                    {edu.description && (
                      <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap pt-1 max-w-3xl">
                        {edu.description}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  {isEditMode && (
                    <div className="absolute right-4 top-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-lg border border-stone-200">
                      <button
                        id={`edit-edu-btn-${edu.id}`}
                        onClick={() => handleEditClick(edu)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="編輯"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-edu-btn-${edu.id}`}
                        onClick={() => handleDeleteClick(edu.id)}
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
