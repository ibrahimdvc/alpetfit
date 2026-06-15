import React, { useState, useRef } from "react";
import { 
  Camera, 
  Plus, 
  Trash2, 
  Sparkles, 
  PlusCircle, 
  Check, 
  Info, 
  AlertCircle, 
  FileImage,
  Flame,
  UtensilsCrossed,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Meal } from "../types";
import { formatTurkishDate } from "../presets";
import { motion, AnimatePresence } from "motion/react";

interface CalorieTabProps {
  meals: Meal[];
  onAddMeal: (meal: Meal) => void;
  onRemoveMeal: (mealId: string) => void;
}

export default function CalorieTab({ meals, onAddMeal, onRemoveMeal }: CalorieTabProps) {
  const [activeSegment, setActiveSegment] = useState<"ai-scan" | "manual">("ai-scan");
  
  // Manual meal form states
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualFormError, setManualFormError] = useState<string | null>(null);

  // AI Text Analyzer states
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [textAnalysisError, setTextAnalysisError] = useState<string | null>(null);

  const handleAutoCalcMacros = async () => {
    if (!manualName.trim()) {
      setTextAnalysisError("Lütfen önce bir yemek veya öğün adı girin.");
      return;
    }

    setIsAnalyzingText(true);
    setTextAnalysisError(null);

    try {
      const response = await fetch("/api/analyze-meal-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealText: manualName }),
      });

      if (!response.ok) {
        throw new Error("Yapay zeka ile değerler hesaplanırken sunucu hatası oluştu.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update manual form fields
      setManualName(data.foodName);
      setManualCalories(data.calories.toString());
      setManualProtein(data.protein.toString());
      setManualCarbs(data.carbs.toString());
      setManualFat(data.fat.toString());
    } catch (err: any) {
      console.error(err);
      setTextAnalysisError(err.message || "Yemek makroları hesaplanamadı. Lütfen daha belirgin bir açıklama yazmayı deneyin.");
    } finally {
      setIsAnalyzingText(false);
    }
  };

  // AI OCR Scan states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: string;
    ingredients: string[];
    description: string;
    healthTips: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Totals Eaten Today
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  // File selection to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;
    
    // Check type
    if (!file.type.startsWith("image/")) {
      setAnalysisError("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP vb.)");
      return;
    }

    setAnalysisError(null);
    setAiResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  // Trigger Gemini API Analysis
  const triggerAiEstimation = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiResult(null);

    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) {
        throw new Error("Sunucu analiz talebine olumsuz yanıt döndü.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Yemek fotoğrafı analiz edilirken bir sorun çıkıt. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save manual meal
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualCalories) {
      setManualFormError("Lütfen en azından yemeğin adını ve kalori miktarını girin.");
      return;
    }
    setManualFormError(null);

    const newMeal: Meal = {
      id: "m-" + Date.now(),
      name: manualName,
      calories: Number(manualCalories),
      protein: Number(manualProtein) || 0,
      carbs: Number(manualCarbs) || 0,
      fat: Number(manualFat) || 0,
      timestamp: new Date().toISOString(),
      description: "Elle girilen öğün kaydı."
    };

    onAddMeal(newMeal);
    
    // Reset Form
    setManualName("");
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
  };

  // Save AI meal into user daily log
  const handleAddAiResult = () => {
    if (!aiResult) return;

    const newMeal: Meal = {
      id: "m-" + Date.now(),
      name: aiResult.foodName,
      calories: aiResult.calories,
      protein: aiResult.protein,
      carbs: aiResult.carbs,
      fat: aiResult.fat,
      timestamp: new Date().toISOString(),
      image: selectedImage || undefined,
      ingredients: aiResult.ingredients,
      description: aiResult.description,
      healthTips: aiResult.healthTips,
      confidence: aiResult.confidence
    };

    onAddMeal(newMeal);

    // Reset AI Scan Segment States to prepare for next
    setSelectedImage(null);
    setAiResult(null);
    setAnalysisError(null);
  };

  return (
    <div id="calorie-tracker-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left panel: Calorie Input (AI Scan vs Manual Mode) */}
      <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 mb-1">
            <UtensilsCrossed className="w-5 h-5 text-indigo-500" /> Yeni Öğün Ekle
          </h2>
          <p className="text-xs text-slate-400">Yemek fotoğrafı çekerek saniyeler içinde kalori hesabı yapın veya elle kaydedin.</p>

          {/* Segment Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl my-4">
            <button
              onClick={() => {
                setActiveSegment("ai-scan");
                setAnalysisError(null);
              }}
              className={`flex-1 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSegment === "ai-scan"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> 
              <span>
                <span className="hidden sm:inline">Yapay Zeka Fotoğraf Tarama</span>
                <span className="sm:hidden">Fotoğraf Tara</span>
              </span>
            </button>
            <button
              onClick={() => {
                setActiveSegment("manual");
                setAnalysisError(null);
              }}
              className={`flex-1 py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSegment === "manual"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                <span className="hidden sm:inline">Manuel Giriş</span>
                <span className="sm:hidden">Manuel</span>
              </span>
            </button>
          </div>

          {/* Content corresponding to selected segment */}
          <AnimatePresence mode="wait">
            {activeSegment === "ai-scan" ? (
              <motion.div
                key="ai-scan-content"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                {/* Drag and drop selection slot */}
                {!selectedImage ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-60 ${
                      isDragOver
                        ? "border-indigo-500 bg-indigo-50/50"
                        : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/40"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl mb-4 shadow-sm">
                      <Camera className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Yemek Fotoğrafını Buraya Bırakın</span>
                    <span className="text-xs text-slate-400 mt-1.5 max-w-sm px-4">
                      Veya bilgisayarınızdan seçmek/fotoğraf çekmek için tıklayın. Gemini yemeğin türünü, porsiyonunu ve besin makrolarını anında hesaplar.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected image preview and actions */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/50 bg-slate-900 max-h-64 flex items-center justify-center">
                      <img
                        src={selectedImage}
                        alt="Yüklenen yemek"
                        className="object-contain w-full max-h-64"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setAiResult(null);
                        }}
                        className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow transition-all cursor-pointer"
                        title="Fotoğrafı Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!aiResult && !isAnalyzing && (
                      <button
                        type="button"
                        onClick={triggerAiEstimation}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition"
                      >
                        <Sparkles className="w-4 h-4" /> Yapay Zeka Kaloriyi Hesaplasın
                      </button>
                    )}

                    {isAnalyzing && (
                      <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                        <span className="text-sm font-bold text-slate-800">Yemek Fotoğrafı İnceleniyor...</span>
                        <span className="text-xs text-slate-400 mt-1 max-w-xs">
                          Gemini 3.5 enstantaneyi çözümlüyor, porsiyon kıyaslaması ve kalori/makro oranlarını derliyor. Lütfen bekleyin.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Error display */}
                {analysisError && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-800">Analiz Başarısız Oldu</h4>
                      <p className="text-xs text-red-600 mt-0.5">{analysisError}</p>
                    </div>
                  </div>
                )}

                {/* AI Parsed Result interactive UI */}
                {aiResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-5 space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          AI Analiz Raporu
                        </span>
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 font-mono">
                          Güven: <span className="text-indigo-600 font-bold">{aiResult.confidence}</span>
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-800 mt-1.5">{aiResult.foodName}</h4>
                    </div>

                    {/* Macros Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-sm font-black text-rose-500 font-mono">{aiResult.calories}</div>
                        <div className="text-[9px] font-bold text-slate-400">kcal</div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-emerald-600 font-mono">{aiResult.protein}g</div>
                        <div className="text-[9px] font-bold text-slate-400">Protein</div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-blue-500 font-mono">{aiResult.carbs}g</div>
                        <div className="text-[9px] font-bold text-slate-400">Karb</div>
                      </div>
                      <div>
                        <div className="text-sm font-black text-amber-500 font-mono">{aiResult.fat}g</div>
                        <div className="text-[9px] font-bold text-slate-400">Yağ</div>
                      </div>
                    </div>

                    {/* Ingredients list */}
                    {aiResult.ingredients && aiResult.ingredients.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-slate-500 block mb-1">Tespit Edilen İçindekiler:</span>
                        <div className="flex flex-wrap gap-1">
                          {aiResult.ingredients.map((ing, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold font-sans">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 space-y-2">
                      <p className="leading-relaxed bg-white p-3 rounded-xl border border-slate-50"><strong className="text-slate-800 font-bold block mb-0.5">Porsiyon Gerekçesi:</strong> {aiResult.description}</p>
                      <p className="leading-relaxed bg-teal-50/50 p-3 rounded-xl border border-teal-100/20 text-teal-800"><strong className="text-teal-900 font-bold block mb-0.5">Sağlık & Pişirme İpucu:</strong> {aiResult.healthTips}</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddAiResult}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl shadow transition text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Öğün Günlüğüme Ekle
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="manual-content"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {/* Manual form */}
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Yemek / Öğün Adı</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Örn: Haşlanmış yumurta ve kepek ekmeği"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:outline-none focus:bg-white text-slate-800"
                      />
                      <button
                        type="button"
                        disabled={isAnalyzingText || !manualName.trim()}
                        onClick={handleAutoCalcMacros}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shrink-0"
                        title="Yapay zeka ile değerleri hesapla"
                      >
                        {isAnalyzingText ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>AI Doldur</span>
                      </button>
                    </div>
                    {textAnalysisError && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" /> {textAnalysisError}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      💡 İpucu: Miktarı yazın (örn: <span className="font-mono bg-slate-100 text-slate-650 px-1 py-0.5 rounded text-[9px]">3 köfte, 1 kase pilav ve salata</span>) ve AI Doldur'a basın.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Kalori (kcal)</label>
                      <input
                        type="number"
                        required
                        placeholder="kCal"
                        value={manualCalories}
                        onChange={(e) => setManualCalories(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        placeholder="Gr"
                        value={manualProtein}
                        onChange={(e) => setManualProtein(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Karbonhidrat (g)</label>
                      <input
                        type="number"
                        placeholder="Gr"
                        value={manualCarbs}
                        onChange={(e) => setManualCarbs(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Yağ (g)</label>
                      <input
                        type="number"
                        placeholder="Gr"
                        value={manualFat}
                        onChange={(e) => setManualFat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:outline-none focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {manualFormError && (
                    <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-xs text-red-600 font-medium">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{manualFormError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Manuel Öğün Ekle
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Informative Help Alert */}
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-xs text-slate-500">
          <div className="flex items-center gap-2 text-indigo-700 font-bold mb-1">
            <Info className="w-4 h-4" /> Kalori Ölçüm Önerileri
          </div>
          Öğünlerinizin doğruluğunu artırmak için yemek görselinde birden fazla bileşen varsa her tabağı ayrı ayrı fotoğraflayabilir ya da ortalama porsiyon ebadını (örn: 'büyük boy tabak', '2 kepçe') belirterek elle girmeyi seçebilirsiniz.
        </div>
      </div>

      {/* Right panel: Eaten logs history list */}
      <div className="lg:col-span-6 flex flex-col justify-between">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm min-h-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Bugün Tüketilenler</h3>
              <p className="text-xs text-slate-400">Gelişim hedefine göre toplam makro dağılımı</p>
            </div>
            
            {/* Tiny Totals badge */}
            <div className="bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-right">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block font-sans">Yenilen Toplam</span>
              <span className="text-sm font-black text-rose-500 font-mono">{totalCalories} <span className="text-[10px] font-medium text-slate-400">kcal</span></span>
            </div>
          </div>

          {/* Miniature totals distribution */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 text-center">
            <div>
              <span className="text-[9px] font-bold text-slate-400 block">PROTEİN</span>
              <span className="font-mono font-bold text-slate-700 text-xs">{totalProtein}g</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block">KARB</span>
              <span className="font-mono font-bold text-slate-700 text-xs">{totalCarbs}g</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block">YAĞ</span>
              <span className="font-mono font-bold text-slate-700 text-xs">{totalFat}g</span>
            </div>
          </div>

          {/* Meals list container */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {meals.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center justify-center">
                  <FileImage className="w-10 h-10 text-slate-300 mb-2.5" />
                  Henüz öğün kaydedilmemiş.<br/>Yukarıdan ilk öğününüzü ekleyerek başlayın.
                </div>
              ) : (
                meals.map((meal) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white hover:bg-slate-50/50 border border-slate-100/80 p-3.5 rounded-xl flex items-center justify-between gap-4 shadow-sm group relative"
                  >
                    <div className="flex items-center gap-3">
                      
                      {/* Optional Image thumbnail or custom visual symbol */}
                      {meal.image ? (
                        <img
                          src={meal.image}
                          alt={meal.name}
                          className="w-11 h-11 object-cover rounded-lg border border-slate-100"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center font-bold">
                          🍽️
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{meal.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block font-mono">
                          {formatTurkishDate(meal.timestamp).split(",")[1]?.trim() || "09:00"}
                        </span>
                        
                        {/* Macronutrient mini tags */}
                        <div className="flex gap-2 pt-1">
                          <span className="text-[10px] font-bold font-mono text-emerald-600">P: {meal.protein}g</span>
                          <span className="text-[10px] font-bold font-mono text-blue-500">C: {meal.carbs}g</span>
                          <span className="text-[10px] font-bold font-mono text-amber-500">Y: {meal.fat}g</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-rose-500 font-mono tracking-tighter">
                        {meal.calories} <span className="text-[9px] font-normal text-slate-400">kcal</span>
                      </span>
                      <button
                        onClick={() => onRemoveMeal(meal.id)}
                        className="p-1 text-slate-300 hover:text-red-500 rounded bg-slate-50 hover:bg-red-50 hover:border-red-100 border border-transparent transition cursor-pointer"
                        title="Öğünü Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
}
