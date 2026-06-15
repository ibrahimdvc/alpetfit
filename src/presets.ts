import { ExercisePreset, DailyGoals, Meal, WaterLog, WorkoutSession } from "./types";

export const EXERCISE_PRESETS: ExercisePreset[] = [
  { name: "Bench Press", category: "Göğüs" },
  { name: "Incline Dumbbell Press", category: "Göğüs" },
  { name: "Dumbbell Fly", category: "Göğüs" },
  { name: "Squat (Back Squat)", category: "Bacak" },
  { name: "Leg Press", category: "Bacak" },
  { name: "Leg Extension", category: "Bacak" },
  { name: "Lying Leg Curl", category: "Bacak" },
  { name: "Deadlift", category: "Sırt / Arka Zincir" },
  { name: "Lat Pulldown", category: "Sırt" },
  { name: "Seated Cable Row", category: "Sırt" },
  { name: "Pull-up (Barfiks)", category: "Sırt" },
  { name: "Overhead Barbell Press", category: "Omuz" },
  { name: "Lateral Raise", category: "Omuz" },
  { name: "Seated Dumbbell Press", category: "Omuz" },
  { name: "Barbell Bicep Curl", category: "Kollar" },
  { name: "Hammer Curl", category: "Kollar" },
  { name: "Tricep Rope Pushdown", category: "Kollar" },
  { name: "Tricep Overhead Extension", category: "Kollar" },
  { name: "Plank", category: "Karın" },
  { name: "Hanging Leg Raise", category: "Karın" }
];

export const DEFAULT_GOALS: DailyGoals = {
  calories: 2200,
  protein: 140,
  carbs: 250,
  fat: 70,
  water: 2500
};

// Turkish months & date utils
export const formatTurkishDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return formatter.format(date);
};

export const INITIAL_MEALS: Meal[] = [
  {
    id: "m-1",
    name: "Yulaf Lapası ve Muz",
    calories: 420,
    protein: 14,
    carbs: 72,
    fat: 8,
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
    ingredients: ["Yulaf Ezmesi (50g)", "Yarım Muz", "Yağsız Süt (200ml)", "Fıstık Ezmesi (1 tatlı kaşığı)"],
    description: "Yulaf ve sağlıklı meyve karbonhidratları ile güne zinde başlamak için mükemmel bir kahvaltı seçeneği.",
    healthTips: "Protein miktarını artırmak için içerisine yarım ölçek whey protein tozu ekleyebilirsiniz."
  },
  {
    id: "m-2",
    name: "Izgara Tavuk ve Pilav",
    calories: 650,
    protein: 48,
    carbs: 70,
    fat: 15,
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), // 6 hours ago
    ingredients: ["Tavuk Göğsü (200g)", "Esmer Pirinç Pilavı (150g)", "Zeytinyağı (1 yemek kaşığı)"],
    description: "Yüksek proteinli, orta karbonhidratlı klasik bir sporcu öğünü.",
    healthTips: "Yemek öncesi lif alımını desteklemek için tabağın yanına yeşil salata ekleyebilirsiniz."
  }
];

export const INITIAL_WATER: WaterLog[] = [
  { id: "w-1", timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), amountMl: 500 },
  { id: "w-2", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), amountMl: 330 },
  { id: "w-3", timestamp: new Date(Date.now() - 30 * 60000).toISOString(), amountMl: 500 }
];

export const INITIAL_WORKOUT_HISTORY: WorkoutSession[] = [
  {
    id: "s-1",
    date: new Date(Date.now() - 24 * 3600000).toISOString(), // Yesterday
    exercises: [
      {
        id: "e-1",
        name: "Bench Press",
        sets: [
          { weight: 60, reps: 10 },
          { weight: 70, reps: 8 },
          { weight: 70, reps: 6 }
        ],
        feeling: "medium",
        notes: "Son sette form biraz zorlandı ama tamamlandı."
      },
      {
        id: "e-2",
        name: "Lat Pulldown",
        sets: [
          { weight: 45, reps: 12 },
          { weight: 50, reps: 10 },
          { weight: 55, reps: 8 }
        ],
        feeling: "easy",
        notes: "Sırt kaslarında harika pompalama hissi."
      }
    ],
    report: {
      workoutVolumeKg: 2840,
      muscleGroupsTargeted: ["Göğüs", "Sırt", "Ön Omuz"],
      intensityScore: 82,
      overallSummary: "Dün uyguladığınız göğüs-sırt hibrit antrenmanı, kas aktivasyonu açısından son derece verimli geçmiştir. Bench press'te kaldırılan maksimum ağırlık ve toplam hacim eşiği hedeflenmiştir.",
      strengthProgressAdvise: "Lat pulldown egzersizinde 12 tekrarı rahat çıkardığınız için bir sonraki sır antrenmanında başlangıç ağırlığını 50kg seviyesine çekerek progresif yükleme yapabilirsiniz.",
      formAndSafetyTips: "Bench press son setinde formun zorlandığından bahsetmiştiniz. Dirsekleri aşırı yana açmamaya ve barı göğsün tam ortasına kontrollü indirmeye odaklanın.",
      nutritionRecoveryAdvice: "Fiziksel hasarı onarmak için antrenman sonrasında tükettiğiniz tavuk pilav öğünü doğru bir tercihti. Recovery sürecini optimize etmek için bol su tüketimine devam edin.",
      motivationQuote: "Sihir, başladığın yer ile devam ettiğin yer arasındaki tutarlılıkta saklıdır. Harika gidiyorsun!"
    }
  }
];
