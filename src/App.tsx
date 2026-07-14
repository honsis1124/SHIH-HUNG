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
  OperationType
} from './firebase';
import { UserProfile, Education, Experience, Project } from './types';
import { Navbar } from './components/Navbar';
import { ProfileSection } from './components/ProfileSection';
import { EducationSection } from './components/EducationSection';
import { ExperienceSection } from './components/ExperienceSection';
import { ProjectSection } from './components/ProjectSection';
import { ShieldAlert, Briefcase, GraduationCap, LayoutGrid, Heart, Sparkles, Loader2 } from 'lucide-react';

const OWNER_EMAIL = "h0928060675@gmail.com";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

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
        setEducations(eduList);

        // Fetch Experiences
        const expQuery = query(collection(db, 'experiences'), where('userId', '==', currentOwnerUid));
        const expSnapshot = await getDocs(expQuery).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'experiences');
          throw err;
        });
        const expList = expSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Experience));
        setExperiences(expList);

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
      const docRef = await addDoc(collection(db, 'educations'), {
        ...newEdu,
        userId: user.uid,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'educations');
        throw err;
      });

      setEducations(prev => [...prev, { id: docRef.id, ...newEdu, userId: user.uid }]);
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
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `educations/${updatedEdu.id}`);
        throw err;
      });

      setEducations(prev => prev.map(edu => edu.id === updatedEdu.id ? { ...updatedEdu, userId: user.uid } : edu));
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

  // Add Experience
  const handleAddExperience = async (newExp: Omit<Experience, 'id'>) => {
    if (!user || user.email !== OWNER_EMAIL) return;

    try {
      const docRef = await addDoc(collection(db, 'experiences'), {
        ...newExp,
        userId: user.uid,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, 'experiences');
        throw err;
      });

      setExperiences(prev => [...prev, { id: docRef.id, ...newExp, userId: user.uid }]);
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
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `experiences/${updatedExp.id}`);
        throw err;
      });

      setExperiences(prev => prev.map(exp => exp.id === updatedExp.id ? { ...updatedExp, userId: user.uid } : exp));
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
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-medium font-mono tracking-wider">系統正在與 Firebase 同步，請稍候...</p>
      </div>
    );
  }

  const isOwner = user?.email === OWNER_EMAIL;

  return (
    <div className="min-h-screen bg-[#0a0f1d] pb-16 flex flex-col font-sans selection:bg-indigo-500/25 selection:text-indigo-200">
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
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex items-start space-x-3.5">
              <ShieldAlert className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-amber-300">
                  {isOwner ? '歡迎！請初始化您的個人簡歷' : '作品集資料尚未初始化'}
                </h3>
                <p className="text-xs text-amber-400/80 mt-1.5 max-w-2xl leading-relaxed">
                  {isOwner
                    ? '資料庫中目前沒有本網站的個人簡歷。請在上方登入您的擁有者 Google 帳號後，進入「後台管理」並填寫個人檔案資訊。點選儲存後即可完成初始化！'
                    : `履歷擁有者 (${OWNER_EMAIL}) 尚未初始化此網站的資料庫。如果您是擁有者，請點擊右上方登入按鈕。`}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="mt-3.5 inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>前往後台管理初始化</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit mode warning badge */}
        {isEditMode && isOwner && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
              <span>後台管理模式已啟用。您現在可以直接新增、編輯或刪除各項學經歷與作品展示。</span>
            </div>
            <button
              onClick={() => setIsEditMode(false)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold font-mono transition-colors cursor-pointer"
            >
              切換前台預覽
            </button>
          </div>
        )}

        {/* Database Loading Spinner */}
        {dataLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-semibold font-mono tracking-wide">Loading dynamic portfolio content...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* 1. Self Introduction Profile Section */}
            {(profile || isEditMode) && (
              <ProfileSection
                profile={profile}
                onSave={handleSaveProfile}
                isEditMode={isEditMode}
              />
            )}

            {/* Render rest sections if profile is present or if we are building it in editor */}
            {(profile || isEditMode) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Main Column - Experience & Education */}
                <div className="lg:col-span-2 space-y-8">
                  {/* 2. Experience Section */}
                  <ExperienceSection
                    experiences={experiences}
                    isEditMode={isEditMode}
                    onAdd={handleAddExperience}
                    onUpdate={handleUpdateExperience}
                    onDelete={handleDeleteExperience}
                  />

                  {/* 3. Education Section */}
                  <EducationSection
                    educations={educations}
                    isEditMode={isEditMode}
                    onAdd={handleAddEducation}
                    onUpdate={handleUpdateEducation}
                    onDelete={handleDeleteEducation}
                  />
                </div>

                {/* Right Column - Project / Portfolio Achievements */}
                <div className="lg:col-span-3">
                  {/* 4. Projects Showcase Section */}
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
      <footer id="app-footer" className="mt-24 border-t border-slate-800/60 py-8 bg-[#0d1124]/30 text-center">
        <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
          個人簡歷與作品展示後台管理系統 · 本服務由 Google Firebase 安全儲存
        </p>
        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-center space-x-1">
          <span className="text-slate-500">Made with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          <span className="text-slate-500">for job applications</span>
        </p>
      </footer>
    </div>
  );
}
