import React, { useState, useRef } from "react";
import { 
  Flame, 
  Droplet, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Check, 
  Settings, 
  Calendar, 
  Award,
  ChevronRight,
  User,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileJson,
  Eye,
  EyeOff,
  Share,
  Smartphone,
  X
} from "lucide-react";
import { Meal, WaterLog, WorkoutSession, DailyGoals } from "../types";
import { formatTurkishDate } from "../presets";
import { motion, AnimatePresence } from "motion/react";

interface DashboardTabProps {
  goals: DailyGoals;
  setGoals: (goals: DailyGoals) => void;
  meals: Meal[];
  waterLogs: WaterLog[];
  workoutHistory: WorkoutSession[];
  onAddWater: (amountMl: number) => void;
  onClearWater: () => void;
}

export default function DashboardTab({
  goals,
  setGoals,
  meals,
  waterLogs,
  workoutHistory,
  onAddWater,
  onClearWater
}: DashboardTabProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showIosPwaBanner, setShowIosPwaBanner] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem("fittrack_hide_ios_pwa");
      if (dismissed === "true") return false;
      const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      const isStandalone = (window.navigator as any).standalone === true;
      // Show on iOS if not standalone, or let users preview it on other platforms
      return isIos ? !isStandalone : true; 
    } catch (e) {
      return true;
    }
  });
  const [calorieInput, setCalorieInput] = useState(goals.calories);
  const [proteinInput, setProteinInput] = useState(goals.protein);
  const [carbsInput, setCarbsInput] = useState(goals.carbs);
  const [fatInput, setFatInput] = useState(goals.fat);
  const [waterInput, setWaterInput] = useState(goals.water);

  // Math Calculations
  const totalCaloriesCons = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProteinCons = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbsCons = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFatCons = meals.reduce((sum, m) => sum + m.fat, 0);
  const totalWaterCons = waterLogs.reduce((sum, w) => sum + w.amountMl, 0);

  // Percentages with capping at 100%
  const calPercent = Math.min(Math.round((totalCaloriesCons / goals.calories) * 100), 100);
  const proteinPercent = Math.min(Math.round((totalProteinCons / goals.protein) * 100), 100);
  const carbsPercent = Math.min(Math.round((totalCarbsCons / goals.carbs) * 100), 100);
  const fatPercent = Math.min(Math.round((totalFatCons / goals.fat) * 100), 100);
  const waterPercent = Math.min(Math.round((totalWaterCons / goals.water) * 100), 100);

  const caloriesRemaining = Math.max(goals.calories - totalCaloriesCons, 0);

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    setGoals({
      calories: Number(calorieInput) || 2000,
      protein: Number(proteinInput) || 130,
      carbs: Number(carbsInput) || 220,
      fat: Number(fatInput) || 65,
      water: Number(waterInput) || 2000,
    });
    setShowConfig(false);
  };

  const activeWorkoutCount = workoutHistory.length;
  const totalCompletedVolume = workoutHistory.reduce((sum, s) => {
    const sVol = s.exercises.reduce((exSUm, ex) => {
      return exSUm + ex.sets.reduce((setSum, set) => setSum + ((set.weight * set.reps) || 0), 0);
    }, 0);
    return sum + (s.report?.workoutVolumeKg || sVol);
  }, 0);

  // --- Interactive Line Chart States & Data Prep ---
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showCalorieLine, setShowCalorieLine] = useState(true);
  const [showIntensityLine, setShowIntensityLine] = useState(true);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    // Auto-clear after 4 seconds
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4000);
  };

  const getDayNameTurkish = (date: Date) => {
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    return days[date.getDay()];
  };

  const getShortDayNameTurkish = (date: Date) => {
    const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    return days[date.getDay()];
  };

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Find meals logged on this date
    const dayMeals = meals.filter(m => {
      const mDate = m.timestamp.split("T")[0];
      return mDate === dateStr;
    });
    
    // Calorie sum
    let calories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
    
    // Find workouts on this date
    const dayWorkouts = workoutHistory.filter(w => {
      const wDate = w.date.split("T")[0];
      return wDate === dateStr;
    });
    
    let intensity = 0;
    let workoutName = "";
    if (dayWorkouts.length > 0) {
      intensity = dayWorkouts[0].report?.intensityScore || 80;
      workoutName = dayWorkouts[0].exercises.map(e => e.name).slice(0, 2).join(", ");
    }
    
    const isToday = index === 6;
    const isYesterday = index === 5;
    
    let isRealData = true;
    if (!isToday && !isYesterday && calories === 0 && intensity === 0) {
      isRealData = false;
      const baselines = [
        { calories: Math.round(goals.calories * 0.94), intensity: 75, name: "Bench Press, Lat Pulldown" }, 
        { calories: Math.round(goals.calories * 1.05), intensity: 0, name: "" },  
        { calories: Math.round(goals.calories * 0.82), intensity: 85, name: "Squat, Leg Press" },  
        { calories: Math.round(goals.calories * 0.98), intensity: 0, name: "" },  
        { calories: Math.round(goals.calories * 1.15), intensity: 80, name: "Overhead Press, Lateral Raise" }   
      ];
      calories = baselines[index]?.calories || 0;
      intensity = baselines[index]?.intensity || 0;
      workoutName = baselines[index]?.name || "";
    } else if (isToday && calories === 0) {
      calories = totalCaloriesCons;
      if (workoutHistory.length > 0 && workoutHistory[0].date.split("T")[0] === dateStr) {
        intensity = workoutHistory[0].report?.intensityScore || 80;
        workoutName = workoutHistory[0].exercises.map(e => e.name).slice(0, 2).join(", ");
      }
    }
    
    return {
      date,
      dateLabel: date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      dayName: getShortDayNameTurkish(date),
      dayFull: getDayNameTurkish(date),
      calories,
      intensity,
      workoutName,
      isRealData
    };
  });

  const width = 600;
  const height = 240;
  const paddingX = 55;
  const paddingY = 35;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const maxCal = Math.max(...chartData.map(d => d.calories), goals.calories, 2000);

  const caloriePoints = chartData.map((d, i) => ({
    x: paddingX + (i * chartWidth) / 6,
    y: height - paddingY - (d.calories / maxCal) * chartHeight,
    val: d.calories,
    day: d
  }));

  const intensityPoints = chartData.map((d, i) => ({
    x: paddingX + (i * chartWidth) / 6,
    y: height - paddingY - (d.intensity / 100) * chartHeight,
    val: d.intensity,
    day: d
  }));

  const getPathD = (points: {x: number, y: number}[]) => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
  };

  const getAreaD = (points: {x: number, y: number}[]) => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const linePath = getPathD(points);
    return `${linePath} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;
  };

  // iOS-compatible touchscreen touch gesture tracking to allow dragging or scrubbing over chart bars
  const handleTouch = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    
    // Safety calculate the X point relative to the layout dimension
    const relativeX = touch.clientX - rect.left;
    const svgWidth = rect.width;
    const percentX = relativeX / svgWidth;
    const svgX = percentX * width;
    
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < 7; i++) {
      const dayX = paddingX + (i * chartWidth) / 6;
      const distance = Math.abs(svgX - dayX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    if (closestIndex >= 0 && closestIndex < 7) {
      setHoveredIndex(closestIndex);
    }
  };

  const handleTouchEnd = () => {
    setHoveredIndex(null);
  };

  // --- Export Functions ---
  const handleExportCSV = (csvContent: string, fileName: string) => {
    try {
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.target = "_blank"; // iOS Safari safe backup anchor properties
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast("Dosya başarıyla indirildi!");
    } catch (err) {
      triggerToast("İndirme sırasında bir sorun oluştu.");
    }
  };

  const handleExportMealsCSV = () => {
    if (meals.length === 0) {
      triggerToast("Dışarı aktarılacak öğün kaydı bulunmamaktadır.");
      return;
    }
    let csv = "Tarih,Öğün Adı,Kalori (kcal),Protein (g),Karbonhidrat (g),Yağ (g),Malzemeler,Açıklama,Sağlık İpuçları\n";
    meals.forEach(m => {
      const dateStr = formatTurkishDate(m.timestamp);
      const ingredientsStr = m.ingredients ? `"${m.ingredients.join("; ")}"` : "";
      const desc = m.description ? `"${m.description.replace(/"/g, '""')}"` : "";
      const tip = m.healthTips ? `"${m.healthTips.replace(/"/g, '""')}"` : "";
      csv += `${dateStr},"${m.name.replace(/"/g, '""')}",${m.calories},${m.protein},${m.carbs},${m.fat},${ingredientsStr},${desc},${tip}\n`;
    });
    handleExportCSV(csv, `fittrack_yemek_listesi_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportWorkoutsCSV = () => {
    if (workoutHistory.length === 0) {
      triggerToast("Dışarı aktarılacak antrenman kaydı bulunmamaktadır.");
      return;
    }
    let csv = "Tarih,Toplam Hacim (kg),Yoğunluk Skoru (%),Hedeflenen Kaslar,Süpervizör Özet,Form İpuçları,İyileşme Tavsiyesi\n";
    workoutHistory.forEach(w => {
      const dateStr = formatTurkishDate(w.date);
      const vol = w.report?.workoutVolumeKg || 0;
      const intensity = w.report?.intensityScore || 0;
      const muscles = w.report?.muscleGroupsTargeted ? `"${w.report.muscleGroupsTargeted.join("; ")}"` : "";
      const summary = w.report?.overallSummary ? `"${w.report.overallSummary.replace(/"/g, '""')}"` : "";
      const safety = w.report?.formAndSafetyTips ? `"${w.report.formAndSafetyTips.replace(/"/g, '""')}"` : "";
      const recovery = w.report?.nutritionRecoveryAdvice ? `"${w.report.nutritionRecoveryAdvice.replace(/"/g, '""')}"` : "";
      csv += `${dateStr},${vol},${intensity},${muscles},${summary},${safety},${recovery}\n`;
    });
    handleExportCSV(csv, `fittrack_antrenman_listesi_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportDataJson = () => {
    try {
      const exportPayload = {
        app: "FitTrack AI",
        exportDate: new Date().toISOString(),
        userGoals: goals,
        meals,
        waterLogs,
        workoutHistory
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fittrack_veri_yedegi_${new Date().toISOString().split("T")[0]}.json`;
      a.target = "_blank"; // iOS Safari safe backup anchor properties
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast("FitTrack verileri cihazınıza yedeklendi!");
    } catch (err) {
      triggerToast("Yedekleme dosyası oluşturulamadı.");
    }
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* iOS PWA Installation Helper */}
      <AnimatePresence>
        {showIosPwaBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 shadow-sm relative overflow-hidden"
          >
            <button
              onClick={() => {
                localStorage.setItem("fittrack_hide_ios_pwa", "true");
                setShowIosPwaBanner(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-white/50 cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-12 h-12 bg-white rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm self-start">
                <Smartphone className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2 flex-grow">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  FitTrack AI'ı Ana Ekranınıza Yükleyin! 📱
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  FitTrack AI'ı iPhone veya iPad'inize yükleyerek tarayıcı çubuğu olmadan tam ekran, çok daha hızlı ve tıpkı yerel bir mobil uygulama gibi kullanabilirsiniz.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-600 font-medium">
                  <div className="bg-white/60 backdrop-blur border border-indigo-100/40 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0">1</span>
                    <p>Uygulamayı iPhone'unuzun kendi <strong>Safari</strong> tarayıcısında açtığınızdan emin olun.</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur border border-indigo-100/40 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0">2</span>
                    <p>Safari'nin alt menüsündeki <span className="inline-flex items-center gap-0.5 bg-slate-150 px-1 py-0.5 rounded border border-slate-200 text-slate-800"><Share className="w-3 h-3" /> Paylaş</span> simgesine tıklayın.</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur border border-indigo-100/40 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0">3</span>
                    <p>Açılan listeden <strong className="text-indigo-700">"Ana Ekrana Ekle"</strong> (Add to Home Screen) tuşuna basın ve sağ üstten ekleyin.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    onClick={() => {
                      localStorage.setItem("fittrack_hide_ios_pwa", "true");
                      setShowIosPwaBanner(false);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] uppercase tracking-wide px-4 py-2 rounded-lg transition shadow-sm hover:shadow cursor-pointer"
                  >
                    Kılavuzu Kapat
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target Progress Cards Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Calorie Summary */}
        <div id="card-calories-status" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" /> Günlük Kalori Dengesi
            </h3>
            <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2.5 py-1 rounded-full">
              %{calPercent} Tamamlandı
            </span>
          </div>

          <div className="my-2 flex justify-between items-baseline">
            <div>
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                {totalCaloriesCons} <span className="text-base font-normal text-slate-400">kcal</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Hedef: {goals.calories} kcal
              </div>
            </div>
            
            <div className="text-right">
              {caloriesRemaining > 0 ? (
                <>
                  <div className="text-2xl font-bold text-indigo-600 font-mono">
                    {caloriesRemaining}
                  </div>
                  <div className="text-xs text-slate-400">Kalan İhtiyaç</div>
                </>
              ) : (
                <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Check className="w-4 h-4" /> Hedefe Ulaşıldı
                </div>
              )}
            </div>
          </div>

          {/* Calorie Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-4">
            <motion.div 
              className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${calPercent}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Macros Breakdown */}
        <div id="card-macros-status" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Makro İlerlemesi
            </h3>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> Hedefleri Düzenle
            </button>
          </div>

          <div className="space-y-3">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Protein (Kas Yapıtaşı)</span>
                <span className="font-mono">{totalProteinCons}g / {goals.protein}g</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-emerald-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${proteinPercent}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Karbonhidrat (Enerji)</span>
                <span className="font-mono">{totalCarbsCons}g / {goals.carbs}g</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-blue-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${carbsPercent}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Yağ (Hormonal Sağlık)</span>
                <span className="font-mono">{totalFatCons}g / {goals.fat}g</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-amber-400 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${fatPercent}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Water Intake Dashboard */}
        <div id="card-water-status" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-blue-500" /> Sıvı Alımı (Su)
            </h3>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              %{waterPercent}
            </span>
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="relative w-12 h-16 bg-slate-100 border border-slate-200 rounded-b-xl rounded-t-sm overflow-hidden flex items-end">
              <motion.div 
                className="bg-gradient-to-t from-blue-400 to-teal-400 w-full" 
                style={{ height: `${waterPercent}%` }}
                layout
              />
              <div className="absolute inset-x-0 bottom-4 text-center text-[10px] font-bold text-slate-700 font-mono">
                {totalWaterCons} ml
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="text-xs text-slate-500">
                Lütfen su içtiğinizde hızlıca kaydedin. Günlük ideal sıvı alım hedefinize ulaşmak kas toparlanmasını hızlandırır.
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button 
                  onClick={() => onAddWater(250)}
                  className="text-xs font-bold px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-md transition border border-slate-200 cursor-pointer"
                >
                  +250 ml
                </button>
                <button 
                  onClick={() => onAddWater(500)}
                  className="text-xs font-bold px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-md transition border border-slate-200 cursor-pointer"
                >
                  +500 ml
                </button>
                <button 
                  onClick={onClearWater}
                  title="Sıfırla"
                  className="p-1 text-slate-400 hover:text-red-500 bg-slate-100 rounded-md border border-slate-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 text-right mt-1">Hedef: {goals.water} ml</div>
        </div>
      </div>

      {/* Expandable Goals Setting Modal / Box */}
      <AnimatePresence>
        {showConfig && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 overflow-hidden shadow-inner"
          >
            <form onSubmit={handleSaveGoals} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                  <Settings className="w-4 h-4 text-indigo-500" /> Günlük Beslenme & Kalori Hedeflerini Ayarlayın
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowConfig(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Kapat
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Kalori (kcal)</label>
                  <input 
                    type="number" 
                    value={calorieInput}
                    onChange={(e) => setCalorieInput(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Protein (g)</label>
                  <input 
                    type="number"
                    value={proteinInput}
                    onChange={(e) => setProteinInput(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Karbonhidrat (g)</label>
                  <input 
                    type="number"
                    value={carbsInput}
                    onChange={(e) => setCarbsInput(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Yağ (g)</label>
                  <input 
                    type="number"
                    value={fatInput}
                    onChange={(e) => setFatInput(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Su Hedefi (ml)</label>
                  <input 
                    type="number"
                    value={waterInput}
                    onChange={(e) => setWaterInput(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setCalorieInput(goals.calories);
                    setProteinInput(goals.protein);
                    setCarbsInput(goals.carbs);
                    setFatInput(goals.fat);
                    setWaterInput(goals.water);
                    setShowConfig(false);
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold text-white transition shadow-sm cursor-pointer"
                >
                  Değişiklikleri Uygula
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upgraded Dual-Axis Interactive Line Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm md:text-base">
                  <Activity className="w-5 h-5 text-indigo-500" /> Haftalık Analiz & Performans Grafiği
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Son 7 günlük kalori girdileri ve antrenman yoğunluğunun karşılaştırmalı görünümü</p>
              </div>

              {/* Dynamic Interactive Layer Toggles */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCalorieLine(!showCalorieLine)}
                  className={`flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg font-bold border transition cursor-pointer select-none ${
                    showCalorieLine 
                      ? "bg-orange-50 border-orange-250 text-orange-700" 
                      : "bg-slate-50 border-slate-200 text-slate-450 line-through"
                  }`}
                  title="Kalori eğrisini göster/gizle"
                >
                  {showCalorieLine ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Kalori Alımı
                </button>
                <button
                  type="button"
                  onClick={() => setShowIntensityLine(!showIntensityLine)}
                  className={`flex items-center gap-1 text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg font-bold border transition cursor-pointer select-none ${
                    showIntensityLine 
                      ? "bg-indigo-50 border-indigo-250 text-indigo-700" 
                      : "bg-slate-50 border-slate-200 text-slate-450 line-through"
                  }`}
                  title="Antrenman yoğunluk eğrisini göster/gizle"
                >
                  {showIntensityLine ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Yoğunluk (%)
                </button>
              </div>
            </div>

            {/* Graphic Subtitle / Legend indicators with metrics */}
            <div className="flex items-center justify-between text-[11px] text-slate-450 border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-orange-500 rounded-full inline-block"></span>
                  Sol Eksen: Kalori (kcal)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-500 rounded-full inline-block"></span>
                  Sağ Eksen: Yoğunluk (%)
                </span>
              </div>
              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-500">ETKİLEŞİMLİ</span>
            </div>

            {/* Custom Interactive SVG Line Plot */}
            <div ref={chartContainerRef} className="relative w-full overflow-hidden" id="interactive-dual-axis-line-chart">
              <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-auto overflow-visible select-none"
                onTouchStart={handleTouch}
                onTouchMove={handleTouch}
                onTouchEnd={handleTouchEnd}
              >
                {/* Embedded Grid style defs for gradient strokes */}
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.00" />
                  </linearGradient>
                  <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <g stroke="#f1f5f9" strokeWidth="1">
                  <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} />
                  <line x1={paddingX} y1={paddingY + chartHeight / 2} x2={width - paddingX} y2={paddingY + chartHeight / 2} />
                  <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} />
                  
                  {/* Vertical lines for days */}
                  {chartData.map((_, i) => {
                    const x = paddingX + (i * chartWidth) / 6;
                    return (
                      <line 
                        key={`grid-x-${i}`}
                        x1={x} 
                        y1={paddingY} 
                        x2={x} 
                        y2={height - paddingY} 
                        stroke="#f8fafc"
                      />
                    );
                  })}
                </g>

                {/* Left Y Axis Calories (Tick labels) */}
                <g fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="end" className="font-mono">
                  <text x={paddingX - 8} y={paddingY + 4}>{maxCal} kcal</text>
                  <text x={paddingX - 8} y={paddingY + (chartHeight / 2) + 4}>{Math.round(maxCal / 2)}</text>
                  <text x={paddingX - 8} y={height - paddingY + 4}>0</text>
                </g>

                {/* Right Y Axis Workout Intensity % (Tick labels) */}
                <g fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="start" className="font-mono">
                  <text x={width - paddingX + 8} y={paddingY + 4}>100%</text>
                  <text x={width - paddingX + 8} y={paddingY + (chartHeight / 2) + 4}>50%</text>
                  <text x={width - paddingX + 8} y={height - paddingY + 4}>0%</text>
                </g>

                {/* Target Calorie Horizontal Benchmark Line */}
                {showCalorieLine && (
                  <g>
                    <line 
                      x1={paddingX} 
                      y1={height - paddingY - (goals.calories / maxCal) * chartHeight} 
                      x2={width - paddingX} 
                      y2={height - paddingY - (goals.calories / maxCal) * chartHeight}
                      stroke="#ea580c"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                      opacity="0.45"
                    />
                    <text 
                      x={width - paddingX - 4} 
                      y={height - paddingY - (goals.calories / maxCal) * chartHeight - 6}
                      fill="#ea580c"
                      fontSize="8"
                      fontWeight="700"
                      textAnchor="end"
                      className="font-sans"
                    >
                      HEDEF: {goals.calories} kcal
                    </text>
                  </g>
                )}

                {/* Active Hover vertical guide bar */}
                {hoveredIndex !== null && (
                  <line
                    x1={paddingX + (hoveredIndex * chartWidth) / 6}
                    y1={paddingY}
                    x2={paddingX + (hoveredIndex * chartWidth) / 6}
                    y2={height - paddingY}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Calorie Curve & Filled Area */}
                {showCalorieLine && (
                  <g>
                    {/* Glow Area under path */}
                    <path
                      d={getAreaD(caloriePoints)}
                      fill="url(#calGrad)"
                    />
                    {/* Main stroke line */}
                    <path
                      d={getPathD(caloriePoints)}
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}

                {/* Intensity Curve & Filled Area */}
                {showIntensityLine && (
                  <g>
                    {/* Glow Area under path */}
                    <path
                      d={getAreaD(intensityPoints)}
                      fill="url(#intGrad)"
                    />
                    {/* Main stroke line */}
                    <path
                      d={getPathD(intensityPoints)}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}

                {/* Data point indicators */}
                {chartData.map((day, idx) => {
                  const x = paddingX + (idx * chartWidth) / 6;
                  const yCal = height - paddingY - (day.calories / maxCal) * chartHeight;
                  const yInt = height - paddingY - (day.intensity / 100) * chartHeight;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g key={`points-${idx}`}>
                      {/* Calories Circle */}
                      {showCalorieLine && (
                        <g>
                          <circle
                            cx={x}
                            cy={yCal}
                            r={isHovered ? 6 : 4}
                            fill="#ffffff"
                            stroke="#ea580c"
                            strokeWidth={isHovered ? 3 : 2}
                            className="transition-all duration-150"
                          />
                          {isHovered && (
                            <circle
                              cx={x}
                              cy={yCal}
                              r={10}
                              fill="#ea580c"
                              fillOpacity="0.2"
                              className="animate-pulse"
                            />
                          )}
                        </g>
                      )}

                      {/* Intensity Circle */}
                      {showIntensityLine && (
                        <g>
                          <circle
                            cx={x}
                            cy={yInt}
                            r={isHovered ? 6 : 4}
                            fill="#ffffff"
                            stroke="#4f46e5"
                            strokeWidth={isHovered ? 3 : 2}
                            className="transition-all duration-150"
                          />
                          {isHovered && (
                            <circle
                              cx={x}
                              cy={yInt}
                              r={10}
                              fill="#4f46e5"
                              fillOpacity="0.2"
                              className="animate-pulse"
                            />
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* X Axis labels (Turkish days name) */}
                <g fill="#64748b" fontSize="10" fontWeight="700" textAnchor="middle">
                  {chartData.map((day, idx) => {
                    const x = paddingX + (idx * chartWidth) / 6;
                    const isSelected = hoveredIndex === idx;
                    return (
                      <text 
                        key={`x-label-${idx}`}
                        x={x} 
                        y={height - paddingY + 20}
                        fill={isSelected ? "#4f46e5" : "#64748b"}
                        className="transition-all duration-150"
                      >
                        {day.dayName}
                      </text>
                    );
                  })}
                </g>

                {/* Hover Trigger hitboxes overlay */}
                {chartData.map((_, idx) => {
                  const x = paddingX + (idx * chartWidth) / 6;
                  const hitWidth = chartWidth / 6;
                  return (
                    <rect
                      key={`hitbox-${idx}`}
                      x={x - hitWidth / 2}
                      y={paddingY}
                      width={hitWidth}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Floating detailed hover tooltip overlay */}
              <AnimatePresence>
                {hoveredIndex !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute -top-[52px] sm:-top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-sm z-40 w-[240px] pointer-events-none"
                    style={{
                      left: `${100 * (paddingX + (hoveredIndex * chartWidth) / 6) / width}%`
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                      <span className="font-extrabold text-[11px] text-indigo-400 font-sans tracking-wide">
                        {chartData[hoveredIndex].dayFull.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono tracking-tight font-bold">
                        {chartData[hoveredIndex].dateLabel}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-100">
                      {showCalorieLine && (
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1 text-slate-400 font-medium">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Kalori:
                          </span>
                          <span className="font-mono font-bold">
                            {chartData[hoveredIndex].calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                          </span>
                        </div>
                      )}

                      {showIntensityLine && (
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1 text-slate-400 font-medium">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Yoğunluk:
                          </span>
                          <span className="font-mono font-bold text-indigo-300">
                            %{chartData[hoveredIndex].intensity}
                          </span>
                        </div>
                      )}

                      {/* Display targets / achievements info */}
                      {showCalorieLine && (
                        <div className="text-[11px] border-t border-white/5 pt-1.5 mt-1 text-slate-400 font-sans">
                          {chartData[hoveredIndex].calories >= goals.calories ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                              ✓ Kalori hedefi aşıldı (+{chartData[hoveredIndex].calories - goals.calories} kcal)
                            </span>
                          ) : (
                            <span>Hedefe kalan: <strong className="text-indigo-200 font-medium">{goals.calories - chartData[hoveredIndex].calories} kcal</strong></span>
                          )}
                        </div>
                      )}

                      {/* Workout Info if tracked */}
                      {chartData[hoveredIndex].workoutName && (
                        <div className="text-[10px] bg-indigo-950/40 p-1.5 rounded border border-indigo-900/30 text-indigo-200 mt-1">
                          <span className="text-slate-300 font-semibold">Egzersizler:</span> {chartData[hoveredIndex].workoutName}
                        </div>
                      )}

                      {/* Real vs Sim info */}
                      {!chartData[hoveredIndex].isRealData && (
                        <div className="text-[9px] text-slate-500 text-center italic mt-1 bg-white/5 py-0.5 rounded">
                          Girdi yapılmamış gün, örnek şablon gösteriliyor
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick interactive note */}
          <div className="text-[10px] text-slate-400 font-medium mt-4 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>Grafik etkileşimlidir. Günlerin üzerine gelerek detayları görebilir, sağ üstten katmanları filtreleyebilirsiniz.</span>
          </div>
        </div>

        {/* Workout quick status / Mini stats */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Award className="w-5 h-5 text-indigo-500" /> Haftalık Antrenman Karnesi
            </h3>
            <p className="text-xs text-slate-400">Kas geliştirme ve toparlanma veri özetleri</p>
          </div>

          <div className="space-y-4 my-6">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">BU HAFTAKİ ANTRENMANLAR</div>
                  <div className="text-lg font-bold text-slate-800">{activeWorkoutCount} Antrenman</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400">TOPLAM KALDIRILAN TONAJA/VOLUME</div>
                  <div className="text-lg font-bold text-slate-800 font-mono">
                    {totalCompletedVolume.toLocaleString("tr-TR")} <span className="text-xs font-normal text-slate-400">kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-slate-50">
            {workoutHistory.length > 0 ? (
              <div className="text-xs text-indigo-600 font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Son AI Raporu Başarıyla Kaydedildi
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Henüz antrenman raporu yok. Antrenmanlarınızı kaydettikten sonra yapay zekadan anında verimli yönlendirme raporları alacaksınız.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Universal Data Management & Exporters Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100/80 shadow-sm" id="data-export-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-sm md:text-base">
              <Download className="w-5 h-5 text-indigo-600" /> Akıllı Veri Yönetimi & Yerel Arşivleme
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Dilediğiniz zaman tüm geçmiş yemek, su ve antrenman günlüklerinizi cihazınıza güvenli bir formatta indirin.</p>
          </div>
          
          <div className="flex self-start sm:self-auto items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded border border-emerald-150 shadow-sm">
            %100 Çevrimdışı & Güvenli
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* JSON Full Backup */}
          <div className="border border-slate-100 hover:border-slate-200 hover:shadow-sm bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between transition duration-250 group">
            <div className="mb-4">
              <div className="w-9 h-9 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg mb-3 group-hover:bg-indigo-100 transition duration-200">
                <FileJson className="w-5 h-5 font-bold" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-700">Tüm Verileri Yedekle (JSON)</h4>
              <p className="text-[11px] text-slate-400 mt-1 lines-clamp-3 leading-relaxed">
                Kullanıcı hedeflerinizi, tüm detaylı yemek tariflerinizi, su loglarınızı ve AI antrenör analizlerini içeren tam yedek dosyasını geri yüklemeye uyumlu olarak indirir.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportDataJson}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer hover:shadow"
            >
              <Download className="w-4 h-4" /> Tüm Verileri İndir (.json)
            </button>
          </div>

          {/* Meals Tabular CSV */}
          <div className="border border-slate-100 hover:border-slate-200 hover:shadow-sm bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between transition duration-250 group">
            <div className="mb-4">
              <div className="w-9 h-9 bg-orange-50 text-orange-600 flex items-center justify-center rounded-lg mb-3 group-hover:bg-orange-100 transition duration-200">
                <FileSpreadsheet className="w-5 h-5 font-bold" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-700">Öğün & Kalori Listesi (CSV)</h4>
              <p className="text-[11px] text-slate-400 mt-1 lines-clamp-3 leading-relaxed">
                Kaydettiğiniz tüm yemekleri, kalorileri, protein/karb/yağ makrolarını ve içerik malzemelerini Excel veya Google E-Tablolar'da açılmaya uygun tablo formatında indirir.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportMealsCSV}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer hover:shadow"
            >
              <Download className="w-4 h-4" /> Yemek Günlüğü İndir (.csv)
            </button>
          </div>

          {/* Workouts Details CSV */}
          <div className="border border-slate-100 hover:border-slate-200 hover:shadow-sm bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between transition duration-250 group">
            <div className="mb-4">
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg mb-3 group-hover:bg-emerald-100 transition duration-200">
                <FileSpreadsheet className="w-5 h-5 font-bold" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-700">Antrenman & AI Koç Günlüğü (CSV)</h4>
              <p className="text-[11px] text-slate-400 mt-1 lines-clamp-3 leading-relaxed">
                Antrenman seanslarınızı, toplam kaldırılan tonajları, yorucu kas gruplarını ve koçun sunduğu form, yenilenme tüyolarını rapor tablosu olarak arşivler.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportWorkoutsCSV}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer hover:shadow"
            >
              <Download className="w-4 h-4" /> Antrenman Listesi İndir (.csv)
            </button>
          </div>

        </div>
      </div>

      {/* Active Workouts Last Log Feedback Quick View */}
      {workoutHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-indigo-100/70 shadow-sm bg-gradient-to-r from-white via-indigo-50/10 to-indigo-50/20">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center rounded-xl shadow-md mt-0.5">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                  Son Antrenman AI Koç Değerlendirmesi
                </span>
                <h4 className="font-bold text-slate-800 mt-1 mb-1.5 flex items-center gap-1">
                  Yoğunluk Skoru: <span className="text-indigo-600 font-mono">%{workoutHistory[0].report?.intensityScore || 80}</span>
                </h4>
                <p className="text-sm text-slate-600 italic">
                  &ldquo;{workoutHistory[0].report?.motivationQuote || "Kas hücresi seviyesinde yırtıklar yaratarak büyüme sürecini fırlattın! Harika bir odaklanma!"}&rdquo;
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mt-1 font-mono">
              <Calendar className="w-3 h-3" /> {formatTurkishDate(workoutHistory[0].date)}
            </span>
          </div>
        </div>
      )}

      {/* Floating Animated iOS High-Fidelity Alert Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: -20, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-2.5 max-w-[90vw] md:w-auto"
            style={{ pointerEvents: "none" }}
          >
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-slate-100 pr-1">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
