import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Droplet, 
  Dumbbell, 
  Activity, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  TrendingUp,
  Award,
  BookOpen,
  LogIn,
  LogOut,
  RefreshCw
} from "lucide-react";
import { DailyGoals, Meal, WaterLog, WorkoutSession } from "./types";
import { 
  DEFAULT_GOALS, 
  INITIAL_MEALS, 
  INITIAL_WATER, 
  INITIAL_WORKOUT_HISTORY, 
  formatTurkishDate 
} from "./presets";
import DashboardTab from "./components/DashboardTab";
import CalorieTab from "./components/CalorieTab";
import WorkoutTab from "./components/WorkoutTab";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { auth, db, signInWithPopup, signOut, googleProvider } from "./firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "calorie" | "workout">("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Core application states loaded from localStorage or using fallback defaults
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS);
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(INITIAL_WATER);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>(INITIAL_WORKOUT_HISTORY);

  // 1. Auth subscription & initial local storage read
  useEffect(() => {
    const savedGoals = localStorage.getItem("fittrack_goals");
    const savedMeals = localStorage.getItem("fittrack_meals");
    const savedWater = localStorage.getItem("fittrack_water");
    const savedWorkout = localStorage.getItem("fittrack_workout_history");

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedMeals) setMeals(JSON.parse(savedMeals));
    if (savedWater) setWaterLogs(JSON.parse(savedWater));
    if (savedWorkout) setWorkoutHistory(JSON.parse(savedWorkout));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  // 2. Cloud synchronization subscriptions
  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    // A. Subscribe to Goals
    const goalsRef = doc(db, "users", userId, "goals", "current");
    const unsubGoals = onSnapshot(goalsRef, (snapshot) => {
      if (snapshot.exists()) {
        setGoals(snapshot.data() as DailyGoals);
      } else {
        setDoc(goalsRef, goals)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${userId}/goals/current`));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/goals/current`);
    });

    // B. Subscribe to Meals
    const mealsRef = collection(db, "users", userId, "meals");
    const unsubMeals = onSnapshot(mealsRef, (snapshot) => {
      const cloudMeals: Meal[] = [];
      snapshot.forEach((doc) => {
        cloudMeals.push(doc.data() as Meal);
      });
      cloudMeals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMeals(cloudMeals);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/meals`);
    });

    // C. Subscribe to Water Logs
    const waterRef = collection(db, "users", userId, "waterLogs");
    const unsubWater = onSnapshot(waterRef, (snapshot) => {
      const cloudWater: WaterLog[] = [];
      snapshot.forEach((doc) => {
        cloudWater.push(doc.data() as WaterLog);
      });
      cloudWater.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setWaterLogs(cloudWater);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/waterLogs`);
    });

    // D. Subscribe to Workouts
    const workoutsRef = collection(db, "users", userId, "workouts");
    const unsubWorkouts = onSnapshot(workoutsRef, (snapshot) => {
      const cloudHistory: WorkoutSession[] = [];
      snapshot.forEach((doc) => {
        cloudHistory.push(doc.data() as WorkoutSession);
      });
      cloudHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWorkoutHistory(cloudHistory);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/workouts`);
    });

    return () => {
      unsubGoals();
      unsubMeals();
      unsubWater();
      unsubWorkouts();
    };
  }, [user]);

  // 3. Keep local storage synced for guest user mode or write update to cloud
  useEffect(() => {
    if (!user) {
      localStorage.setItem("fittrack_goals", JSON.stringify(goals));
    } else {
      setDoc(doc(db, "users", user.uid, "goals", "current"), goals)
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/goals/current`));
    }
  }, [goals, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("fittrack_meals", JSON.stringify(meals));
    }
  }, [meals, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("fittrack_water", JSON.stringify(waterLogs));
    }
  }, [waterLogs, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("fittrack_workout_history", JSON.stringify(workoutHistory));
    }
  }, [workoutHistory, user]);

  // Auth Action handlers
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncLocalDataToCloud(result.user.uid);
      }
    } catch (e) {
      console.error("Giriş Hatası:", e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setGoals(DEFAULT_GOALS);
      setMeals([]);
      setWaterLogs([]);
      setWorkoutHistory([]);
      localStorage.removeItem("fittrack_goals");
      localStorage.removeItem("fittrack_meals");
      localStorage.removeItem("fittrack_water");
      localStorage.removeItem("fittrack_workout_history");
    } catch (e) {
      console.error("Çıkış Hatası:", e);
    }
  };

  const syncLocalDataToCloud = async (userId: string) => {
    try {
      const savedGoalsRaw = localStorage.getItem("fittrack_goals");
      if (savedGoalsRaw) {
        await setDoc(doc(db, "users", userId, "goals", "current"), JSON.parse(savedGoalsRaw));
      }

      const savedMealsRaw = localStorage.getItem("fittrack_meals");
      if (savedMealsRaw) {
        const localMeals: Meal[] = JSON.parse(savedMealsRaw);
        for (const m of localMeals) {
          await setDoc(doc(db, "users", userId, "meals", m.id), m);
        }
      }

      const savedWaterRaw = localStorage.getItem("fittrack_water");
      if (savedWaterRaw) {
        const localWater: WaterLog[] = JSON.parse(savedWaterRaw);
        for (const w of localWater) {
          await setDoc(doc(db, "users", userId, "waterLogs", w.id), w);
        }
      }

      const savedWorkoutsRaw = localStorage.getItem("fittrack_workout_history");
      if (savedWorkoutsRaw) {
        const localWorkouts: WorkoutSession[] = JSON.parse(savedWorkoutsRaw);
        for (const w of localWorkouts) {
          await setDoc(doc(db, "users", userId, "workouts", w.id), w);
        }
      }

      localStorage.removeItem("fittrack_goals");
      localStorage.removeItem("fittrack_meals");
      localStorage.removeItem("fittrack_water");
      localStorage.removeItem("fittrack_workout_history");
    } catch (e) {
      console.error("Error migrating local data to Firestore:", e);
    }
  };

  // Quick Action methods
  const handleAddMeal = async (newMeal: Meal) => {
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "meals", newMeal.id), newMeal);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/meals/${newMeal.id}`);
      }
    } else {
      setMeals([newMeal, ...meals]);
    }
  };

  const handleRemoveMeal = async (mealId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "meals", mealId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/meals/${mealId}`);
      }
    } else {
      setMeals(meals.filter(m => m.id !== mealId));
    }
  };

  const handleAddWater = async (amountMl: number) => {
    const newWater: WaterLog = {
      id: "w-" + Date.now(),
      amountMl,
      timestamp: new Date().toISOString()
    };
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "waterLogs", newWater.id), newWater);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/waterLogs/${newWater.id}`);
      }
    } else {
      setWaterLogs([newWater, ...waterLogs]);
    }
  };

  const handleClearWater = async () => {
    if (user) {
      try {
        const qSnap = await getDocs(collection(db, "users", user.uid, "waterLogs"));
        const promises = qSnap.docs.map(d => deleteDoc(doc(db, "users", user.uid, "waterLogs", d.id)));
        await Promise.all(promises);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/waterLogs`);
      }
    } else {
      setWaterLogs([]);
    }
  };

  const handleAddWorkoutSession = async (newSession: WorkoutSession) => {
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "workouts", newSession.id), newSession);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/workouts/${newSession.id}`);
      }
    } else {
      setWorkoutHistory([newSession, ...workoutHistory]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-32 md:pb-20">
      
      {/* Top Brand Banner - Extremely Compact, Non-Sticky, Safe Area Aware */}
      <header className="bg-white border-b border-slate-100 px-4 pt-[calc(env(safe-area-inset-top,0px)+14px)] pb-3.5 sm:py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <Dumbbell className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-850">FITTRACK AI</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loadingAuth ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
            ) : user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-full pl-1.5 pr-3 py-1 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ""} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[10px]">
                    {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className="font-bold text-slate-700 hidden sm:inline">{user.displayName?.split(" ")[0]}</span>
                <button
                  onClick={handleSignOut}
                  className="ml-1 text-slate-450 hover:text-red-500 transition cursor-pointer p-0.5 rounded-full hover:bg-slate-100"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Giriş</span>
              </button>
            )}
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-150 px-1.5 py-0.5 rounded hidden xs:inline">TR</span>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Modern Segmented Navigation Bar - Desktop screen layout only */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm hidden md:flex max-w-lg mx-auto md:max-w-xl">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>
              <span className="hidden sm:inline">Özet & Grafik</span>
              <span className="sm:hidden">Özet</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("calorie")}
            className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeTab === "calorie"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>
              <span className="hidden sm:inline">Kalori & AI Tarama</span>
              <span className="sm:hidden">AI Kalori</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("workout")}
            className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeTab === "workout"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>
              <span className="hidden sm:inline">Antrenman Planı</span>
              <span className="sm:hidden">Antrenman</span>
            </span>
          </button>
        </div>

        {/* Tab view rendering with animations */}
        <div id="tab-content-render" className="relative">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-tab-view"
                initial={{ opacity: 0, scale: 0.99, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -5 }}
                transition={{ duration: 0.25 }}
              >
                {!user && !loadingAuth && (
                  <div className="mb-6 bg-gradient-to-r from-emerald-50/50 to-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                        <Sparkles className="w-4.5 h-4.5 animate-pulse text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 tracking-tight">Verilerinizi Bulut Hesabınıza Senkronize Edin ☁️</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Şu an verileriniz yerel misafir hafızasında saklanmaktadır. Google ile tek tıkla giriş yaparak tüm kalori, diyet ve antrenman raporlarınızı bulutta otomatik ve güvenle yedekleyebilirsiniz.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignIn}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase px-4 py-2 rounded-xl shadow-md cursor-pointer transition hover:scale-[1.01] shrink-0"
                    >
                      Yedeklemeyi Aktifleştir
                    </button>
                  </div>
                )}
                <DashboardTab
                  goals={goals}
                  setGoals={setGoals}
                  meals={meals}
                  waterLogs={waterLogs}
                  workoutHistory={workoutHistory}
                  onAddWater={handleAddWater}
                  onClearWater={handleClearWater}
                />
              </motion.div>
            )}

            {activeTab === "calorie" && (
              <motion.div
                key="calorie-tab-view"
                initial={{ opacity: 0, scale: 0.99, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -5 }}
                transition={{ duration: 0.25 }}
              >
                <CalorieTab
                  meals={meals}
                  onAddMeal={handleAddMeal}
                  onRemoveMeal={handleRemoveMeal}
                />
              </motion.div>
            )}

            {activeTab === "workout" && (
              <motion.div
                key="workout-tab-view"
                initial={{ opacity: 0, scale: 0.99, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -5 }}
                transition={{ duration: 0.25 }}
              >
                <WorkoutTab
                  workoutHistory={workoutHistory}
                  onAddWorkoutSession={handleAddWorkoutSession}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Mobile-Native Fixed Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100/80 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] md:hidden pb-safe">
        <div className="max-w-md mx-auto px-6 py-2 flex justify-between items-center relative">
          
          {/* Dashboard Button */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition duration-200 relative select-none cursor-pointer text-slate-450 hover:text-slate-800"
          >
            {activeTab === "dashboard" ? (
              <>
                <motion.div
                  layoutId="bottom-active-indicator"
                  className="absolute inset-0 bg-indigo-50/50 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
                <Activity className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
                <span className="text-[10px] font-extrabold text-indigo-700 tracking-tight">Özet</span>
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 text-slate-400 stroke-[1.8]" />
                <span className="text-[10px] font-medium text-slate-500 tracking-tight">Özet</span>
              </>
            )}
          </button>

          {/* Calorie Button */}
          <button
            onClick={() => setActiveTab("calorie")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition duration-200 relative select-none cursor-pointer text-slate-450 hover:text-slate-800"
          >
            {activeTab === "calorie" ? (
              <>
                <motion.div
                  layoutId="bottom-active-indicator"
                  className="absolute inset-0 bg-indigo-50/50 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
                <div className="relative">
                  <Flame className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-indigo-700 tracking-tight">AI Kalori</span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Flame className="w-5 h-5 text-slate-400 stroke-[1.8]" />
                  <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-450"></span>
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 tracking-tight">AI Kalori</span>
              </>
            )}
          </button>

          {/* Workout Plan Button */}
          <button
            onClick={() => setActiveTab("workout")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition duration-200 relative select-none cursor-pointer text-slate-450 hover:text-slate-800"
          >
            {activeTab === "workout" ? (
              <>
                <motion.div
                  layoutId="bottom-active-indicator"
                  className="absolute inset-0 bg-indigo-50/50 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
                <Dumbbell className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
                <span className="text-[10px] font-extrabold text-indigo-700 tracking-tight">Antrenman</span>
              </>
            ) : (
              <>
                <Dumbbell className="w-5 h-5 text-slate-400 stroke-[1.8]" />
                <span className="text-[10px] font-medium text-slate-500 tracking-tight">Antrenman</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Clean Subtle Footer with no telemetry, strict branding */}
      <footer className="mt-16 text-center text-[10px] text-slate-400 max-w-md mx-auto px-4 pb-8 sm:pb-0 whitespace-nowrap">
        <p>© 2026 FitTrack AI - Sağlık Takip Platformu.</p>
        <p className="mt-1 text-slate-350">Çevrimdışı ve Yapay Zeka Desteğiyle Güvendesiniz</p>
      </footer>
    </div>
  );
}
