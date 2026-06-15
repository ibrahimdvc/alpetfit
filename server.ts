import expressLib from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = expressLib();
const PORT = 3000;

// Increase request size limits because users upload photos for calorie estimation
app.use(expressLib.json({ limit: "15mb" }));
app.use(expressLib.urlencoded({ limit: "15mb", extended: true }));

// Lazy initializer for GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in the environment. AI features will fallback to default responses.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Check if Gemini is configured/available first, fallback if key missing
function isGeminiEnabled() {
  const key = process.env.GEMINI_API_KEY;
  return key && key !== "MY_GEMINI_API_KEY" && key !== "";
}

// Endpoint 1: Analyze food photo/image for calorie logging
app.post("/api/analyze-food", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Görsel verisi gönderilmedi." });
    }

    // Parse base64
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    if (!isGeminiEnabled()) {
      console.warn("Using mock response for food analysis (no API key)");
      return res.json({
        foodName: "Örnek Sağlıklı Tabak (Demo Modu)",
        calories: 450,
        protein: 28,
        carbs: 45,
        fat: 16,
        confidence: "Orta (Demo)",
        ingredients: [
          "Izgara Tavuk Göğsü (150g)",
          "Haşlanmış Esmer Pirinç (100g)",
          "Karışık Mevsim Salatası",
          "Zeytinyağı (1 tatlı kaşığı)"
        ],
        description: "Yapay zeka anahtarınız yüklü değil, bu sebeple simüle edilmiş bir yemek analizi gösterilmektedir. Lütfen AI Studio Secrets panelinden 'GEMINI_API_KEY' ayarlayın. Gerçek görsel analizi için bu gereklidir.",
        healthTips: "Yemekteki protein oranını artırmak için tavuk miktarını artırabilir ya da salataya bakliyat ekleyebilirsiniz."
      });
    }

    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const promptText = `Lütfen yüklenen bu yemek fotoğrafını detaylıca analiz et. Bu yemeğin Türkçe adını, tahmini porsiyonunu ve toplam kalori (kcal), protein (g), karbonhidrat (g) ile yağ (g) miktarını belirle. Makroların gerçekçi ve birbiriyle tutarlı olmasına dikkat et (1g protein = 4kcal, 1g karbonhidrat = 4kcal, 1g yağ = 9kcal kurallarına yakın olmalı). Yanıtı tamamen Türkçe ver.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "Yemeğin Türkçe adı (örn: Izgara Tavuklu Salata)" },
            calories: { type: Type.INTEGER, description: "Yemeğin tahmini toplam kalori miktarı (kcal)" },
            protein: { type: Type.INTEGER, description: "Tahmini protein miktarı (gram)" },
            carbs: { type: Type.INTEGER, description: "Tahmini karbonhidrat miktarı (gram)" },
            fat: { type: Type.INTEGER, description: "Tahmini yağ miktarı (gram)" },
            confidence: { type: Type.STRING, description: "Tahminin güven derecesi: 'Yüksek', 'Orta' veya 'Düşük'" },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Yemekte tespit edilen ana bileşenler/malzemeler" },
            description: { type: Type.STRING, description: "Kalori tahmininin gerekçesi ve porsiyon analizi (Türkçe)" },
            healthTips: { type: Type.STRING, description: "Bu yemeği daha sağlıklı hale getirmek veya besin dengesini korumak için pratik tavsiyeler (Türkçe)" }
          },
          required: ["foodName", "calories", "protein", "carbs", "fat", "confidence", "ingredients", "description", "healthTips"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Boş yanıt alındı.");
    }

    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Yemek analizi hatası:", error);
    return res.status(500).json({ error: "Yemek görseli analiz edilirken bir hata oluştu: " + error.message });
  }
});

// Endpoint 2: Analyze workout performance and details of exercises
app.post("/api/analyze-workout", async (req, res) => {
  try {
    const { workoutData } = req.body;
    if (!workoutData || !workoutData.exercises || workoutData.exercises.length === 0) {
      return res.status(400).json({ error: "Antrenman verisi bulunamadı." });
    }

    if (!isGeminiEnabled()) {
      console.warn("Using mock response for workout analysis (no API key)");
      // Compute actual local volume for the mock output
      let totalVolume = 0;
      workoutData.exercises.forEach((ex: any) => {
        ex.sets.forEach((set: any) => {
          totalVolume += (Number(set.weight) || 0) * (Number(set.reps) || 0);
        });
      });

      return res.json({
        workoutVolumeKg: totalVolume,
        muscleGroupsTargeted: ["Göğüs", "Triceps", "Omuz"],
        intensityScore: 78,
        overallSummary: `Bu antrenmanı başarıyla tamamladınız! Toplamda ${totalVolume} kg hacim kaldırdınız. Yapay zeka anahtarınız (GEMINI_API_KEY) tanımlı olmadığı için bu simüle edilmiş antrenman raporudur.`,
        strengthProgressAdvise: "Progresif aşırı yükleme sağlamak için bir sonraki antrenmanda setlerinizin sonundaki ağırlığı %2.5 artırmayı veya tekrar sayısını 1 artırmayı deneyin.",
        formAndSafetyTips: "Bench Press yaparken kürek kemiklerinizi (scapula) benche sabitlediğinizden ve dirseklerinizi 45 derecelik açıyla tuttuğunuzdan emin olun.",
        nutritionRecoveryAdvice: "Antrenman sonrasındaki ilk 1-2 saat içinde 25-30g kaliteli protein ve depoları doldurmak için 50g karbonhidrat tüketmenizi öneririz.",
        motivationQuote: "Sınırlarını aşmayan, gerçek sınırlarını asla öğrenemez. Harika iş çıkardın!"
      });
    }

    const ai = getGeminiClient();

    const infoString = JSON.stringify(workoutData, null, 2);

    const promptText = `Aşağıda listelenen antrenman detaylarını (yapılan egzersizler, setler, tekrarlar, kaldırılan ağırlıklar, zorluk dereceleri ve notlar) analiz ederek, sporcu için son derece profesyonel, yapıcı ve bilimsel bir antrenman analiz raporu hazırla. 
    
    Antrenman Verileri:
    ${infoString}

    Lütfen hacmi hesapla (hacim = her set için ağırlık * tekrar toplamı). Yanıtı tamamen Türkçe dilinde ve belirtilen JSON şemasına göre sağla.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workoutVolumeKg: { type: Type.INTEGER, description: "Toplam kaldırılan tonaj/hacim (kg)" },
            muscleGroupsTargeted: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bu antrenmanda en çok çalıştırılan kas grupları (Türkçe)" },
            intensityScore: { type: Type.INTEGER, description: "Antrenman yoğunluk puanı (1-100 arası)" },
            overallSummary: { type: Type.STRING, description: "Antrenmanın genel özeti ve performans değerlendirmesi (Türkçe)" },
            strengthProgressAdvise: { type: Type.STRING, description: "Gelecek antrenmanlar için progresif aşırı yükleme (progressive overload) ve gelişim tavsiyeleri (Türkçe)" },
            formAndSafetyTips: { type: Type.STRING, description: "Egzersiz formları ve sakatlık önleme konusunda geri bildirimler (Türkçe)" },
            nutritionRecoveryAdvice: { type: Type.STRING, description: "Bu antrenmandan sonra alınması gereken protein/karbonhidrat miktarı ve toparlanma (recovery) tavsiyeleri (Türkçe)" },
            motivationQuote: { type: Type.STRING, description: "Kullanıcıyı teşvik edici, motive edici kısa bir cümle" }
          },
          required: ["workoutVolumeKg", "muscleGroupsTargeted", "intensityScore", "overallSummary", "strengthProgressAdvise", "formAndSafetyTips", "nutritionRecoveryAdvice", "motivationQuote"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Boş yanıt alındı.");
    }

    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Antrenman analizi hatası:", error);
    return res.status(500).json({ error: "Antrenman analiz edilirken bir hata oluştu: " + error.message });
  }
});

// Endpoint 3: Analyze meal description (text) for calorie and macro logging
app.post("/api/analyze-meal-text", async (req, res) => {
  try {
    const { mealText } = req.body;
    if (!mealText || mealText.trim() === "") {
      return res.status(400).json({ error: "Yemek açıklaması boş olamaz." });
    }

    if (!isGeminiEnabled()) {
      console.warn("Using mock response for meal text analysis (no API key)");
      
      const textLower = mealText.toLowerCase();
      let mockResult = {
        foodName: mealText,
        calories: 320,
        protein: 15,
        carbs: 35,
        fat: 12
      };

      if (textLower.includes("yumurta") || textLower.includes("omlet")) {
        mockResult = { foodName: "Yumurtalı Kahvaltı (Demo Tarama)", calories: 240, protein: 17, carbs: 2, fat: 18 };
      } else if (textLower.includes("tavuk") || textLower.includes("piliç")) {
        mockResult = { foodName: "Izgara Tavuk Sote (Demo Tarama)", calories: 350, protein: 32, carbs: 4, fat: 12 };
      } else if (textLower.includes("makarna") || textLower.includes("pilav")) {
        mockResult = { foodName: "Karbonhidrat Tabağı (Demo Tarama)", calories: 420, protein: 9, carbs: 70, fat: 5 };
      } else if (textLower.includes("kebap") || textLower.includes("et") || textLower.includes("köfte")) {
        mockResult = { foodName: "Izgara Köfte/Et (Demo Tarama)", calories: 520, protein: 29, carbs: 12, fat: 35 };
      } else if (textLower.includes("salata")) {
        mockResult = { foodName: "Mevsim Salatası (Demo Tarama)", calories: 120, protein: 3, carbs: 12, fat: 8 };
      }

      return res.json({
        ...mockResult,
        isMock: true
      });
    }

    const ai = getGeminiClient();

    const promptText = `Aşağıda girilen yemek/öğün açıklamasını analiz et. Bu öğünün tahmini porsiyonunu değerlendirerek toplam kalori (kcal), protein (g), karbonhidrat (g) ve yağ (g) miktarlarını hesapla. Ayrıca yemek adını daha düzgün/net bir Türkçe isim haline getir.
    
    Yemek Açıklaması: "${mealText}"
    
    Makro besin ve kalori matematiksel olarak birbirine yakın olmalıdır (1g protein = 4kcal, 1g karb = 4kcal, 1g yağ = 9kcal). Tamamen Türkçe yanıt ver.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "Yemeğin netleştirilmiş Türkçe adı (örn: 2 Yumurtalı Omlet)" },
            calories: { type: Type.INTEGER, description: "Yemeğin tahmini toplam kalori miktarı (kcal)" },
            protein: { type: Type.INTEGER, description: "Tahmini protein miktarı (gram)" },
            carbs: { type: Type.INTEGER, description: "Tahmini karbonhidrat miktarı (gram)" },
            fat: { type: Type.INTEGER, description: "Tahmini yağ miktarı (gram)" }
          },
          required: ["foodName", "calories", "protein", "carbs", "fat"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Boş yanıt alındı.");
    }

    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Yemek metin analizi hatası:", error);
    return res.status(500).json({ error: "Yemek analiz edilirken bir hata oluştu: " + error.message });
  }
});


// Serve files in production, compile assets in dev
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(expressLib.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
