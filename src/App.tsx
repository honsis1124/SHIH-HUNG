import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import {
  db,
  auth,
  testConnection,
  handleFirestoreError,
  OperationType,
  loginWithGoogle
} from './firebase';
import { UserProfile, Education, Experience, Project } from './types';
import { Navbar } from './components/Navbar';
import { ProfileSection } from './components/ProfileSection';
import { EducationSection } from './components/EducationSection';
import { ExperienceSection } from './components/ExperienceSection';
import { ProjectSection } from './components/ProjectSection';
import { ShieldAlert, Briefcase, GraduationCap, LayoutGrid, Heart, Sparkles, Loader2, Mail, Phone, Github, Linkedin, Globe, LogIn, X, ExternalLink } from 'lucide-react';

const OWNER_EMAIL = "h0928060675@gmail.com";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
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

  // Resume State
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Verify Firebase Connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // If owner logs out, disable edit mode
      if (!currentUser || currentUser.email !== OWNER_EMAIL) {
        setIsEditMode(false);
      } else if (currentUser.email === OWNER_EMAIL) {
        // If owner logs in, they are definitely the ownerUid
        setOwnerUid(currentUser.uid);
      }
      setAppReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Resume Data
  const fetchResumeData = async () => {
    setDataLoading(true);
    try {
      let currentOwnerUid = ownerUid;

      // 1. Find profile by owner email if ownerUid is not determined yet
      if (!currentOwnerUid) {
        const q = query(collection(db, 'profiles'), where('email', '==', OWNER_EMAIL));
        const querySnapshot = await getDocs(q).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'profiles');
          throw err;
        });

        if (!querySnapshot.empty) {
          const profileDoc = querySnapshot.docs[0];
          const profileData = profileDoc.data() as UserProfile;
          setProfile(profileData);
          currentOwnerUid = profileDoc.id; // The document ID is the creator's UID
          setOwnerUid(currentOwnerUid);
        } else {
          // If profile is not found and no owner is logged in
          setProfile(null);
          setOwnerUid(null);
          setDataLoading(false);
          return;
        }
      } else {
        // Owner UID is known, fetch profile directly
        const q = query(collection(db, 'profiles'), where('email', '==', OWNER_EMAIL));
        const querySnapshot = await getDocs(q).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'profiles');
          throw err;
        });

        if (!querySnapshot.empty) {
          setProfile(querySnapshot.docs[0].data() as UserProfile);
        }
      }

      // 2. Fetch corresponding Educations, Experiences, and Projects if ownerUid exists
      if (currentOwnerUid) {
        // Fetch Educations
        const eduQuery = query(collection(db, 'educations'), where('userId', '==', currentOwnerUid));
        const eduSnapshot = await getDocs(eduQuery).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'educations');
          throw err;
        });
        const eduList = eduSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Education));
        setEducations(sortResumeItems(eduList));

        // Fetch Experiences
        const expQuery = query(collection(db, 'experiences'), where('userId', '==', currentOwnerUid));
        const expSnapshot = await getDocs(expQuery).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'experiences');
          throw err;
        });
        const expList = expSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Experience));
        setExperiences(sortResumeItems(expList));

        // Fetch Projects
        const projQuery = query(collection(db, 'projects'), where('userId', '==', currentOwnerUid));
        const projSnapshot = await getDocs(projQuery).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'projects');
          throw err;
        });
        const projList = projSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        setProjects(projList);
      }
    } catch (err) {
      console.error("Error fetching portfolio data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const sortResumeItems = <T extends { order?: number; startDate: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      const orderA = a.order ?? 999999;
      const orderB = b.order ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return b.startDate.localeCompare(a.startDate);
    });
  };

  // Trigger fetch when app is ready or owner logs in
  useEffect(() => {
    if (appReady) {
      fetchResumeData();
    }
  }, [appReady, user]);

  // Save / Update Profile
  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, updatedProfile).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `profiles/${user.uid}`);
        throw err;
      });
      setProfile(updatedProfile);
      setOwnerUid(user.uid);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Add Education
  const handleAddEducation = async (newEdu: Omit<Education, 'id'>) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      const nextOrder = educations.length > 0 ? Math.max(...educations.map(e => e.order ?? 0)) + 1 : 0;
      const docRef = await addDoc(collection(db, 'educations'), {
        ...newEdu,
        userId: user.uid,
        order: nextOrder,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'educations');
        throw err;
      });

      setEducations(prev => sortResumeItems([...prev, { id: docRef.id, ...newEdu, userId: user.uid, order: nextOrder }]));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Update Education
  const handleUpdateEducation = async (updatedEdu: Education) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      const docRef = doc(db, 'educations', updatedEdu.id);
      await updateDoc(docRef, {
        school: updatedEdu.school,
        major: updatedEdu.major,
        degree: updatedEdu.degree,
        startDate: updatedEdu.startDate,
        endDate: updatedEdu.endDate,
        description: updatedEdu.description || '',
        order: updatedEdu.order ?? 0,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `educations/${updatedEdu.id}`);
        throw err;
      });

      setEducations(prev => sortResumeItems(prev.map(edu => edu.id === updatedEdu.id ? { ...updatedEdu, userId: user.uid } : edu)));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Delete Education
  const handleDeleteEducation = async (id: string) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      await deleteDoc(doc(db, 'educations', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `educations/${id}`);
        throw err;
      });
      setEducations(prev => prev.filter(edu => edu.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Reorder Education
  const handleReorderEducation = async (reorderedEdus: Education[]) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    setEducations(reorderedEdus);

    try {
      const promises = reorderedEdus.map((edu, index) => {
        const docRef = doc(db, 'educations', edu.id);
        return updateDoc(docRef, { order: index }).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `educations/${edu.id}`);
          throw err;
        });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to update educations order:", err);
      alert("儲存排序失敗，請稍後再試！");
      fetchResumeData();
    }
  };

  // Add Experience
  const handleAddExperience = async (newExp: Omit<Experience, 'id'>) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      const nextOrder = experiences.length > 0 ? Math.max(...experiences.map(e => e.order ?? 0)) + 1 : 0;
      const docRef = await addDoc(collection(db, 'experiences'), {
        ...newExp,
        userId: user.uid,
        order: nextOrder,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'experiences');
        throw err;
      });

      setExperiences(prev => sortResumeItems([...prev, { id: docRef.id, ...newExp, userId: user.uid, order: nextOrder }]));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Update Experience
  const handleUpdateExperience = async (updatedExp: Experience) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      const docRef = doc(db, 'experiences', updatedExp.id);
      await updateDoc(docRef, {
        company: updatedExp.company,
        role: updatedExp.role,
        startDate: updatedExp.startDate,
        endDate: updatedExp.endDate,
        description: updatedExp.description || '',
        order: updatedExp.order ?? 0,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `experiences/${updatedExp.id}`);
        throw err;
      });

      setExperiences(prev => sortResumeItems(prev.map(exp => exp.id === updatedExp.id ? { ...updatedExp, userId: user.uid } : exp)));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Delete Experience
  const handleDeleteExperience = async (id: string) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      await deleteDoc(doc(db, 'experiences', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `experiences/${id}`);
        throw err;
      });
      setExperiences(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Reorder Experience
  const handleReorderExperience = async (reorderedExps: Experience[]) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    setExperiences(reorderedExps);

    try {
      const promises = reorderedExps.map((exp, index) => {
        const docRef = doc(db, 'experiences', exp.id);
        return updateDoc(docRef, { order: index }).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `experiences/${exp.id}`);
          throw err;
        });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to update experiences order:", err);
      alert("儲存排序失敗，請稍後再試！");
      fetchResumeData();
    }
  };

  // Add Project
  const handleAddProject = async (newProj: Omit<Project, 'id'>) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...newProj,
        userId: user.uid,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'projects');
        throw err;
      });

      setProjects(prev => [...prev, { id: docRef.id, ...newProj, userId: user.uid }]);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Update Project
  const handleUpdateProject = async (updatedProj: Project) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      const docRef = doc(db, 'projects', updatedProj.id);
      await updateDoc(docRef, {
        title: updatedProj.title,
        description: updatedProj.description,
        image: updatedProj.image || '',
        link: updatedProj.link || '',
        techStack: updatedProj.techStack || '',
        order: updatedProj.order || 0,
        extraImages: updatedProj.extraImages || [],
        videoUrl: updatedProj.videoUrl || '',
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `projects/${updatedProj.id}`);
        throw err;
      });

      setProjects(prev => prev.map(proj => proj.id === updatedProj.id ? { ...updatedProj, userId: user.uid } : proj));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Delete Project
  const handleDeleteProject = async (id: string) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      await deleteDoc(doc(db, 'projects', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
        throw err;
      });
      setProjects(prev => prev.filter(proj => proj.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Show dynamic loader when initializing
  if (!appReady) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs text-stone-500 font-medium font-mono tracking-wider">系統正在與 Firebase 同步，請稍候...</p>
      </div>
    );
  }

  const isOwner = user?.email === OWNER_EMAIL;

  return (
    <div className="min-h-screen bg-[#faf9f5] pb-24 flex flex-col font-sans selection:bg-stone-900 selection:text-white transition-colors duration-500">
      {/* Navbar navigation controls */}
      <Navbar
        user={user}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        ownerEmail={OWNER_EMAIL}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Unauthenticated / Empty database warning if no profile is initialized */}
        {!profile && !dataLoading && (
          <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-start space-x-3.5">
              <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {isOwner ? '歡迎！請初始化您的個人簡歷' : '作品集資料尚未初始化'}
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 max-w-2xl leading-relaxed">
                  {isOwner
                    ? '資料庫中目前沒有本網站的個人簡歷。請在上方登入您的擁有者 Google 帳號後，進入「後台管理」並填寫個人檔案資訊。點選儲存後即可完成初始化！'
                    : `履歷擁有者 (${OWNER_EMAIL}) 尚未初始化此網站的資料庫。如果您是擁有者，請點擊右上方登入按鈕。`}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="mt-3.5 inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>前往後台管理初始化</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit mode warning badge */}
        {isEditMode && isOwner && (
          <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center space-x-2 text-stone-800 text-xs font-semibold">
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-ping" />
              <span>後台管理模式已啟用。您現在可以直接新增、編輯或刪除各項學經歷與作品展示。</span>
            </div>
            <button
              onClick={() => setIsEditMode(false)}
              className="text-xs text-stone-800 hover:text-stone-950 font-bold transition-colors cursor-pointer"
            >
              切換前台預覽
            </button>
          </div>
        )}

        {/* Database Loading Spinner */}
        {dataLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-stone-800 animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500 font-semibold font-mono tracking-wide">Loading dynamic portfolio content...</p>
          </div>
        ) : (
          <div className="animate-fade-in space-y-12">
            {(profile || isEditMode) && (
              <div className="space-y-8 lg:space-y-12">
                
                {/* Top Grid: Profile (Left) and Education + Experience (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  {/* Left Column (Top-Left): Profile Section */}
                  <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
                    <ProfileSection
                      profile={profile}
                      onSave={handleSaveProfile}
                      isEditMode={isEditMode}
                    />
                  </div>

                  {/* Right Column (Top-Right: Education, Bottom-Right: Experience) */}
                  <div className="lg:col-span-7 space-y-8">
                    <EducationSection
                      educations={educations}
                      isEditMode={isEditMode}
                      onAdd={handleAddEducation}
                      onUpdate={handleUpdateEducation}
                      onDelete={handleDeleteEducation}
                      onReorder={handleReorderEducation}
                    />

                    <ExperienceSection
                      experiences={experiences}
                      isEditMode={isEditMode}
                      onAdd={handleAddExperience}
                      onUpdate={handleUpdateExperience}
                      onDelete={handleDeleteExperience}
                      onReorder={handleReorderExperience}
                    />
                  </div>
                </div>

                {/* Bottom Section (Spans across full width): Projects Showcase */}
                <div className="w-full">
                  <ProjectSection
                    projects={projects}
                    isEditMode={isEditMode}
                    onAdd={handleAddProject}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDeleteProject}
                  />
                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer id="app-footer" className="mt-24 border-t border-stone-200 bg-stone-50/70 py-12 md:py-16 text-stone-600 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            
            {/* Left side: branding & login */}
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <div className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                  R
                </div>
                <span className="font-display font-bold text-sm text-stone-900 tracking-tight">
                  Bespoke Resume Portfolio
                </span>
              </div>
              <p className="text-xs text-stone-400 max-w-sm">
                歡迎來到蕭勢弘的個人網頁，內含個人履歷與作品展示。
              </p>
              
              {/* Login Button in Footer */}
              {!user && (
                <div className="pt-2">
                  <button
                    id="footer-login-btn"
                    onClick={handleLoginClick}
                    className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-400" />
                    <span>本人登入</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right side: contact details (email, phone, github, website) */}
            <div className="flex flex-col items-center md:items-end gap-4">
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 font-bold">
                Contact & Connections
              </span>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3 text-xs">
                {profile?.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center space-x-1.5 text-stone-600 hover:text-stone-950 hover:underline transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{profile.email}</span>
                  </a>
                )}
                {profile?.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center space-x-1.5 text-stone-600 hover:text-stone-950 hover:underline transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile?.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 text-stone-600 hover:text-stone-950 hover:underline transition-colors"
                  >
                    <Github className="w-3.5 h-3.5 text-stone-400" />
                    <span>GitHub</span>
                  </a>
                )}
                {profile?.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 text-stone-600 hover:text-stone-950 hover:underline transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-stone-400" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 text-stone-600 hover:text-stone-950 hover:underline transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-stone-400" />
                    <span>個人網頁</span>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </footer>

      {/* 登入障礙排除指引 Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/45 backdrop-blur-md animate-fade-in select-text">
          <div className="relative w-full max-w-xl bg-white border border-stone-200 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-800">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Google 登入障礙排除指引</h3>
                <p className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">Owner Sign-In Troubleshooting</p>
              </div>
            </div>

            {/* Error Message details */}
            {errorMsg && (
              <div className="bg-red-500/5 border border-red-100 rounded-xl p-4 mb-6 text-left text-xs text-stone-700">
                <h4 className="text-xs font-bold text-red-800 mb-1">系統偵測到以下狀況：</h4>
                <p className="text-xs text-stone-600 leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-5 text-xs text-stone-700 text-left">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 text-[10px] font-mono border border-stone-200">1</span>
                  <span>您是否正位於 AI Studio 預覽畫面中？</span>
                </div>
                <p className="leading-relaxed text-stone-600 pl-7 mb-3">
                  由於瀏覽器的 iframe 沙盒安全限制，跨域登入彈窗無法直接在預覽窗格中將憑證回傳至內部網頁。
                </p>
                <div className="pl-7">
                  <button
                    onClick={() => {
                      window.open(window.location.href, '_blank');
                      setShowHelpModal(false);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>在新分頁開啟本網頁以進行登入</span>
                  </button>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 text-[10px] font-mono border border-stone-200">2</span>
                  <span>您在 GitHub Pages 上看到空白或無法登入？</span>
                </div>
                <div className="leading-relaxed text-stone-600 pl-7 space-y-1.5">
                  <p>
                    請確保已將您的 GitHub Pages 網域設定為 Firebase 的 **「授權網域」**：
                  </p>
                  <ol className="list-decimal pl-4 font-mono text-[11px] text-stone-800 space-y-1">
                    <li>開啟您的 <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-amber-800 underline hover:text-amber-950 inline-flex items-center space-x-0.5"><span>Firebase Console</span><ExternalLink className="w-2.5 h-2.5" /></a></li>
                    <li>進入 <strong>Authentication &gt; Settings &gt; Authorized domains</strong></li>
                    <li>點擊「新增網域」，輸入：<code className="bg-white px-1.5 py-0.5 rounded text-stone-800 text-[10px] border border-stone-200">h0928060675.github.io</code></li>
                  </ol>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <div className="flex items-center space-x-2 text-stone-900 font-bold mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 text-[10px] font-mono border border-stone-200">3</span>
                  <span>瀏覽器封鎖了第三方 Cookie / 彈窗？</span>
                </div>
                <p className="leading-relaxed text-stone-600 pl-7">
                  若瀏覽器阻擋第三方 Cookie（例如無痕模式），登入後彈窗會自動關閉且維持未登入。請允許 Cookie 後再重試。
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
