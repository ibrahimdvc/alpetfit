import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Clock, 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Award,
  BookOpen,
  UserCheck,
  Zap,
  RotateCcw
} from "lucide-react";
import { WorkoutSession, WorkoutExercise, WorkoutSet, WorkoutReport } from "../types";
import { EXERCISE_PRESETS, formatTurkishDate } from "../presets";
import { motion, AnimatePresence } from "motion/react";

interface WorkoutTabProps {
  workoutHistory: WorkoutSession[];
  onAddWorkoutSession: (session: WorkoutSession) => void;
}

export default function WorkoutTab({ workoutHistory, onAddWorkoutSession }: WorkoutTabProps) {
  // Workout Active State
  const [isActive, setIsActive] = useState(false);
  const [activeExercises, setActiveExercises] = useState<WorkoutExercise[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [sessionName, setSessionName] = useState("Günlük Antrenman Seansı");

  // Search Presets state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");

  // Analysis / Reports overlay state
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [lastReport, setLastReport] = useState<WorkoutReport | null>(null);

  // Expanded History Card IDs
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Timer runner
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Pre-compiled Category selection list
  const categories = ["Tümü", "Göğüs", "Sırt", "Bacak", "Omuz", "Kollar", "Karın"];

  const filteredPresets = EXERCISE_PRESETS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tümü" || p.category.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Start new empty training session
  const startNewWorkout = (templateName?: string) => {
    setIsActive(true);
    setTimerSeconds(0);
    setLastReport(null);
    setErrorString(null);

    if (templateName === "Ust") {
      setSessionName("Üst Vücut (Güç Odaklı)");
      setActiveExercises([
        {
          id: "ex-1",
          name: "Bench Press",
          sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }],
          feeling: "medium",
          notes: "Güçlü hissettim."
        },
        {
          id: "ex-2",
          name: "Lat Pulldown",
          sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 10 }],
          feeling: "medium"
        }
      ]);
    } else if (templateName === "Alt") {
      setSessionName("Alt Vücut (Bacak Günü)");
      setActiveExercises([
        {
          id: "ex-1",
          name: "Squat (Back Squat)",
          sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }],
          feeling: "hard",
          notes: "Derin çömelmeye (deep squat) odaklandım."
        },
        {
          id: "ex-2",
          name: "Leg Curl",
          sets: [{ weight: 35, reps: 12 }, { weight: 40, reps: 10 }],
          feeling: "medium"
        }
      ]);
    } else {
      setSessionName("Kişiselleştirilmiş Antrenman");
      setActiveExercises([]);
    }
  };

  // Add exercise to active session
  const handleAddExercise = (name: string) => {
    const newEx: WorkoutExercise = {
      id: "ex-" + Date.now() + Math.random().toString(36).substring(3, 7),
      name,
      sets: [{ weight: 40, reps: 10 }], // Start with 1 default set
      feeling: "medium",
      notes: ""
    };
    setActiveExercises([...activeExercises, newEx]);
    setSearchQuery("");
  };

  // Add custom manual exercise (if not in presets)
  const handleAddCustomExerciseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleAddExercise(searchQuery.trim());
  };

  // Exercise modifications:
  const handleRemoveExercise = (exId: string) => {
    setActiveExercises(activeExercises.filter(e => e.id !== exId));
  };

  // Set modifications:
  const handleAddSet = (exId: string) => {
    setActiveExercises(activeExercises.map(ex => {
      if (ex.id === exId) {
        const lastSet = ex.sets[ex.sets.length - 1] || { weight: 40, reps: 10 };
        return {
          ...ex,
          sets: [...ex.sets, { ...lastSet }] // Inherit values from last set for swift entry!
        };
      }
      return ex;
    }));
  };

  const handleUpdateSet = (exId: string, setIndex: number, fields: Partial<WorkoutSet>) => {
    setActiveExercises(activeExercises.map(ex => {
      if (ex.id === exId) {
        const updatedSets = ex.sets.map((set, idx) => {
          if (idx === setIndex) {
            return { ...set, ...fields };
          }
          return set;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    }));
  };

  const handleRemoveSet = (exId: string, setIndex: number) => {
    setActiveExercises(activeExercises.map(ex => {
      if (ex.id === exId) {
        // Must contain at least 1 set
        if (ex.sets.length <= 1) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((_, idx) => idx !== setIndex)
        };
      }
      return ex;
    }));
  };

  const handleUpdateExerciseMeta = (exId: string, fields: Partial<WorkoutExercise>) => {
    setActiveExercises(activeExercises.map(ex => {
      if (ex.id === exId) {
        return { ...ex, ...fields };
      }
      return ex;
    }));
  };

  // Finish Training & request AI coaching evaluation
  const handleFinishWorkoutSubmit = async () => {
    if (activeExercises.length === 0) {
      setErrorString("Antrenman raporu almak için en az 1 egzersiz yapılmış olmalıdır.");
      return;
    }

    // Filter out potential 0 values just in case
    const cleanedExercises = activeExercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0
      }))
    }));

    setIsFinishing(true);
    setErrorString(null);
    setLastReport(null);

    const workoutPayload = {
      sessionName,
      durationMinutes: Math.round(timerSeconds / 60) || 1,
      exercises: cleanedExercises
    };

    try {
      const response = await fetch("/api/analyze-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutData: workoutPayload })
      });

      if (!response.ok) {
        throw new Error("Antrenman analizi sunucu tarafından işlenemedi.");
      }

      const reportData: WorkoutReport = await response.json();
      if ((reportData as any).error) {
        throw new Error((reportData as any).error);
      }

      // Record Completed Session in logs
      const completedSession: WorkoutSession = {
        id: "session-" + Date.now(),
        date: new Date().toISOString(),
        exercises: cleanedExercises,
        report: reportData
      };

      onAddWorkoutSession(completedSession);
      setLastReport(reportData);
      setIsActive(false); // Close active status

    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || "Antrenman raporlanırken bağlantı sıkıntısı oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div id="workouts-workspace" className="space-y-6">
      
      {/* 1. Active workout board */}
      {!isActive ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl mx-auto shadow-sm">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Antrenman Seansı Başlat</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Egzersizlerinizi set ve tekrar olarak düzenleyin, sonrasında yapay zekanın kaldırdığınız ağırlığa, tekrar sayılarına ve zorlanma durumunuza göre analiz çıkarmasına tanık olun.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => startNewWorkout("Ust")}
              className="py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 transition flex flex-col items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Üst Vücut Taslağı</span>
            </button>
            <button
              onClick={() => startNewWorkout("Alt")}
              className="py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 transition flex flex-col items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Alt Vücut Taslağı</span>
            </button>
            <button
              onClick={() => startNewWorkout()}
              className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white transition flex flex-col items-center gap-2 shadow-sm cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Boş Antrenman Başlat</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active board details */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Dumbbell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="text-lg font-extrabold text-slate-800 bg-transparent hover:bg-slate-50 border-none outline-none focus:bg-slate-100 px-1 rounded transition"
                  />
                  <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" /> {formatTurkishDate(new Date().toISOString()).split(" ")[0]} {formatTurkishDate(new Date().toISOString()).split(" ")[1]}
                  </div>
                </div>
              </div>

              {/* Live stopwatch */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-mono text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> {formatTimer(timerSeconds)}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Antrenmandan çıkmak ve mevcut tüm değişiklikleri silmek istediğinize emin misiniz?")) {
                      setIsActive(false);
                      setActiveExercises([]);
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                >
                  İptal Et
                </button>
              </div>
            </div>

            {/* Added exercises list */}
            <div className="space-y-6" id="active-exercises-panel">
              {activeExercises.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  Henüz egzersiz eklenmemiş.<br />Sağ taraftaki arama panelini kullanarak dilediğiniz egzersizi ekleyin.
                </div>
              ) : (
                activeExercises.map((ex, exIndex) => (
                  <div key={ex.id} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-4 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-extrabold font-mono">
                          EGZERSİZ {exIndex + 1}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-base mt-1">{ex.name}</h3>
                      </div>

                      <button
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition cursor-pointer"
                        title="Egzersizi Listeden Çıkar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Adjustable Sets grid */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 px-2 pb-1">
                        <div className="col-span-2 text-center font-mono">Set</div>
                        <div className="col-span-4">Ağırlık (kg)</div>
                        <div className="col-span-4">Tekrar</div>
                        <div className="col-span-2 text-center">Sil</div>
                      </div>

                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-100/60 shadow-sm">
                          <div className="col-span-2 text-center font-mono font-bold text-slate-400 text-xs">
                            {setIdx + 1}
                          </div>
                          
                          <div className="col-span-4 flex items-center gap-1.5">
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) => handleUpdateSet(ex.id, setIdx, { weight: Number(e.target.value) || 0 })}
                              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-850 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>

                          <div className="col-span-4 flex items-center gap-1.5">
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => handleUpdateSet(ex.id, setIdx, { reps: Number(e.target.value) || 0 })}
                              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>

                          <div className="col-span-2 text-center flex items-center justify-center">
                            {ex.sets.length > 1 ? (
                              <button
                                onClick={() => handleRemoveSet(ex.id, setIdx)}
                                className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                title="Seti Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-300">-</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer options for customizable exercise sets */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleAddSet(ex.id)}
                        className="w-full sm:w-auto text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Yeni Set Ekle
                      </button>

                      {/* Difficulty selector (Feelings) */}
                      <div className="w-full sm:flex-1 flex items-center justify-end gap-2.5">
                        <span className="text-xs text-slate-500 font-semibold shrink-0">Zorluk Derecesi:</span>
                        <div className="flex bg-white rounded-lg p-1 border border-slate-200 gap-1">
                          {(["easy", "medium", "hard"] as const).map((lvl) => {
                            const labels = { easy: "Kolay", medium: "Orta", hard: "Zor" };
                            const colors = { 
                              easy: ex.feeling === "easy" ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-slate-100",
                              medium: ex.feeling === "medium" ? "bg-amber-400 text-white" : "text-slate-500 hover:bg-slate-100",
                              hard: ex.feeling === "hard" ? "bg-red-500 text-white" : "text-slate-500 hover:bg-slate-100"
                            };
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleUpdateExerciseMeta(ex.id, { feeling: lvl })}
                                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${colors[lvl]} cursor-pointer`}
                              >
                                {labels[lvl]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Customizable Coach Notes segment */}
                    <div className="mt-1">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Set Notları / Koç Değerlendirmesi:</label>
                      <input
                        type="text"
                        placeholder="Örn: Form son sette biraz kaydı. Dinlenme süresi 90 saniye tutuldu."
                        value={ex.notes || ""}
                        onChange={(e) => handleUpdateExerciseMeta(ex.id, { notes: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Finish bottom button */}
            {activeExercises.length > 0 && (
              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={handleFinishWorkoutSubmit}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5 text-sm"
                >
                  <Sparkles className="w-4 h-4 shrink-0" /> Antrenmanı Kaydet & AI Raporu Al
                </button>
              </div>
            )}
          </div>

          {/* Right panel: Search Preset exercises to inject */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-500" /> Egzersiz Ekle
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Taslaklardan aratın ya da listenizde yoksa doğrudan elle yeni ekleyin.</p>
              </div>

              {/* Dynamic Categories selector */}
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      selectedCategory === cat 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Input for filter/search */}
              <form onSubmit={handleAddCustomExerciseSubmit} className="relative flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Egzersiz adı aratın ya da yazın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
                />
                
                {searchQuery.trim() && (
                  <button
                    type="submit"
                    className="absolute right-2 text-indigo-600 hover:underline text-[10px] font-bold"
                    title="Özel Egzersiz Girişi Olarak Ekle"
                  >
                    Ekle
                  </button>
                )}
              </form>

              {/* Filtered Result presets */}
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredPresets.map(item => (
                  <button
                    key={item.name}
                    onClick={() => handleAddExercise(item.name)}
                    className="w-full text-left bg-slate-50 hover:bg-indigo-50/50 p-2 rounded-lg border border-slate-150 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 group-hover:text-indigo-700">{item.name}</span>
                      <span className="text-[9px] text-slate-400 block font-semibold">{item.category}</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                ))}

                {filteredPresets.length === 0 && searchQuery.trim() && (
                  <button
                    onClick={() => handleAddExercise(searchQuery.trim())}
                    className="w-full text-center bg-indigo-50/30 text-indigo-700 border border-dashed border-indigo-200 rounded-lg p-3 text-xs font-bold cursor-pointer"
                  >
                    &ldquo;{searchQuery}&rdquo; egzersizini özel olarak eklemek için TIKLA
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/40 text-[10px] text-slate-400 mt-4 leading-relaxed">
              Her set kaldırılan (ağırlık x tekrar) hacmini toplayarak toplam kas yükleme katsayısını (Volume Tonajı) belirleriz. Progresif gelişim bu toplam tonajın verili dinlenme sürelerinde zamanla artması ile elde edilir.
            </div>
          </div>
        </div>
      )}

      {/* 2. Loading Coach Overlay while analyzing */}
      {isFinishing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center space-y-4"
          >
            <RotateCcw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-2" />
            <h3 className="text-lg font-black text-slate-800 flex items-center justify-center gap-1">
              <Sparkles className="w-5 h-5 text-indigo-500" /> AI Koç Antrenmanınızı İnceliyor...
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kaldırılan toplam tonaj hacmi hesaplanıyor. Setler arası yoğunluk değerleri, zorluk geri bildirimleri ve kas yorulma katsayıları Gemini 3.5 tarafından analiz edilerek koç yönlendirmeniz listeleniyor.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl text-left border border-slate-100">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block font-sans">BİLİMSEL NOT</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Antrenman sonrası protein sentezi sürecinin optimize edilmesi için doğru aminoasit toparlanması (recovery) tüyoları birazdan rapor ekranında belirecektir.</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Display errors if they occur */}
      {errorString && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-700 my-4 flex items-start gap-2 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Analiz Alınamadı</span>
            <span>{errorString}</span>
          </div>
        </div>
      )}

      {/* 3. AI Generated Report Modal (Visual pop up after completion) */}
      <AnimatePresence>
        {lastReport && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 border border-slate-100 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] bg-indigo-600 text-white font-black px-2.5 py-1 rounded">TR-ANALYTICS AI</span>
                  <h2 className="text-lg font-black text-slate-800 mt-2">Detaylı Antrenman Analiz Raporu</h2>
                </div>
                <button
                  onClick={() => setLastReport(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                >
                  Raporu Kapat
                </button>
              </div>

              {/* Summary values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">TOPLAM TONAJ hacim</span>
                  <div className="text-xl font-extrabold text-indigo-900 font-mono mt-2">{lastReport.workoutVolumeKg.toLocaleString("tr-TR")} <span className="text-xs font-normal">kg</span></div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">YOĞUNLUK SKORU</span>
                  <div className="text-xl font-extrabold text-indigo-900 font-mono mt-2">%{lastReport.intensityScore}</div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">HEDEF KAS GRUPLARI</span>
                  <div className="text-xs font-bold text-indigo-900 mt-2 truncate">{lastReport.muscleGroupsTargeted.join(", ")}</div>
                </div>
              </div>

              {/* Written analyses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Genel Performans Değerlendirmesi</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{lastReport.overallSummary}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-500" /> Progresif Yükleme Geri Bildirimi</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{lastReport.strengthProgressAdvise}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1"><Check className="w-3.5 h-3.5 text-indigo-500" /> Form ve Güvenlik Uyarıları</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{lastReport.formAndSafetyTips}</p>
                  </div>
                  <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-teal-600" /> Beslenme & Recovery Önerisi</h4>
                    <p className="text-xs text-teal-700 leading-relaxed font-sans">{lastReport.nutritionRecoveryAdvice}</p>
                  </div>
                </div>
              </div>

              {/* Motivational Coach block */}
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl text-white text-center shadow-md">
                <Dumbbell className="w-5 h-5 animate-bounce mx-auto mb-1 text-indigo-200" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">KOÇ MOTİVASYONU</span>
                <p className="text-sm font-medium mt-1 italic">&ldquo;{lastReport.motivationQuote}&ldquo;</p>
              </div>

              <div className="pt-2 border-t border-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLastReport(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Raporu Kaydet ve Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Workout Logs & Coach Reports History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base">Antrenman Geçmişi & AI Analiz Kayıtları</h3>
          <p className="text-xs text-slate-400 mt-0.5">Önceki antrenmanlarınızı ve AI antrenörünüzün her bir seans için verdiği tavsiyeleri inceleyin.</p>
        </div>

        <div className="space-y-3 mt-4">
          {workoutHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              Kayıtlı antrenman seansı bulunmamaktadır.
            </div>
          ) : (
            workoutHistory.map(session => {
              const isExpanded = expandedHistoryId === session.id;
              
              const totalSessionVolume = session.exercises.reduce((acc, ex) => {
                const exV = ex.sets.reduce((setSum, s) => setSum + ((s.weight * s.reps) || 0), 0);
                return acc + exV;
              }, 0);

              return (
                <div key={session.id} className="border border-slate-100 rounded-xl overflow-hidden hover:border-indigo-100 transition-colors">
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedHistoryId(isExpanded ? null : session.id)}
                    className="p-4 bg-slate-50/50 hover:bg-indigo-50/20 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {session.exercises.map(e => e.name).join(", ").slice(0, 60)} {session.exercises.length > 3 ? "..." : ""}
                        </h4>
                        <span className="text-xs text-slate-400 font-semibold font-mono flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" /> {formatTurkishDate(session.date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Hacim</span>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {(session.report?.workoutVolumeKg || totalSessionVolume).toLocaleString("tr-TR")} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Yoğunluk</span>
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          %{session.report?.intensityScore || 80}
                        </span>
                      </div>
                      <div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded workout sets list & report summary */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-white border-t border-slate-100"
                      >
                        <div className="p-4 space-y-4 text-xs text-slate-600">
                          
                          {/* Exercises Details */}
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 block mb-2 font-sans">Yapılan Egzersizler & Setler:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {session.exercises.map((ex, i) => (
                                <div key={i} className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                                  <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-bold text-slate-700 text-xs">{ex.name}</span>
                                    {ex.feeling && (
                                      <span className="text-[9px] font-mono tracking-wider bg-slate-200 text-slate-500 px-1 py-0.5 rounded font-black uppercase">
                                        {ex.feeling === "easy" ? "Kolay" : ex.feeling === "medium" ? "Orta" : "Zor"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono text-slate-400 text-[10px] flex flex-wrap gap-2 mt-1">
                                    {ex.sets.map((set, setI) => (
                                      <span key={setI} className="bg-white px-2 py-0.5 rounded-md border border-slate-200/50">
                                        Set {setI + 1}: <strong className="text-slate-700">{set.weight}kg</strong> x <strong className="text-slate-700">{set.reps}tekrar</strong>
                                      </span>
                                    ))}
                                  </div>
                                  {ex.notes && <p className="text-[10px] text-slate-400 mt-1.5 italic">Not: {ex.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Coach reports snippet */}
                          {session.report && (
                            <div className="bg-indigo-50/20 border border-indigo-100/40 p-3 rounded-xl space-y-2.5">
                              <div>
                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block font-sans">Kayıtlı AI Antrenör Raporu</span>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{session.report.overallSummary}</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                                <div>
                                  <strong className="text-slate-800">Progresif Artış Aşama:</strong>
                                  <p className="text-slate-500 mt-0.5">{session.report.strengthProgressAdvise}</p>
                                </div>
                                <div>
                                  <strong className="text-slate-800">Toparlanma (Recovery):</strong>
                                  <p className="text-slate-500 mt-0.5">{session.report.nutritionRecoveryAdvice}</p>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
