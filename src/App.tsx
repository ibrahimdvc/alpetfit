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
  BookOpen
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

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "calorie" | "workout">("dashboard");

  // Core application states loaded from localStorage or using fallback defaults
  const [goals, setGoals] = useState<DailyGoals>(() => {
    const saved = localStorage.getItem("fittrack_goals");
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });

  const [meals, setMeals] = useState<Meal[]>(() => {
    const saved = localStorage.getItem("fittrack_meals");
    return saved ? JSON.parse(saved) : INITIAL_MEALS;
  });

  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem("fittrack_water");
    return saved ? JSON.parse(saved) : INITIAL_WATER;
  });

  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>(() => {
    const saved = localStorage.getItem("fittrack_workout_history");
    return saved ? JSON.parse(saved) : INITIAL_WORKOUT_HISTORY;
  });

  // State persistence
  useEffect(() => {
    localStorage.setItem("fittrack_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("fittrack_meals", JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem("fittrack_water", JSON.stringify(waterLogs));
  }, [waterLogs]);

  useEffect(() => {
    localStorage.setItem("fittrack_workout_history", JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  // Quick Action methods
  const handleAddMeal = (newMeal: Meal) => {
    setMeals([newMeal, ...meals]);
  };

  const handleRemoveMeal = (mealId: string) => {
    setMeals(meals.filter(m => m.id !== mealId));
  };

  const handleAddWater = (amountMl: number) => {
    const newWater: WaterLog = {
      id: "w-" + Date.now(),
      amountMl,
      timestamp: new Date().toISOString()
    };
    setWaterLogs([newWater, ...waterLogs]);
  };

  const handleClearWater = () => {
    setWaterLogs([]);
  };

  const handleAddWorkoutSession = (newSession: WorkoutSession) => {
    setWorkoutHistory([newSession, ...workoutHistory]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-32 md:pb-20">
      
      {/* Top Brand Banner */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100/80 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Dumbbell className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 font-sans">FITTRACK AI</h1>
                <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" /> Canlı Asistan
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Yapay Zeka Destekli Akıllı Diş, Kalori ve Antrenör Takip Sistemi</p>
            </div>
          </div>

          {/* Tab selectors & Date label */}
          <div className="flex items-center gap-3 self-end sm:self-auto uppercase">
            {/* Dynamic Clock and Calendar Turkish indicator */}
            <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40 font-mono">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {formatTurkishDate(new Date().toISOString()).split(",")[0]}
            </span>

            {/* Language status */}
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-150 px-2 py-1 rounded">TR MODU</span>
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
