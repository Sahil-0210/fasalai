// Demo mode: realistic sample answers used when no AI key is set.
// They go through the same safety rules as real AI answers. On purpose, each
// sample contains a dose and a banned pesticide, so you can see the rules
// remove them.
// To see the "Unsure" card in demo mode: type "blurry" in the description,
// or upload a photo whose file name contains "blurry".

import type { CropId, Lang } from "./crops";
import type { AiAnswer } from "./schema";

type Sample = Omit<AiAnswer, "image_ok" | "unsure_reason">;

const SAMPLES: Record<Lang, Partial<Record<CropId, Sample>>> = {
  en: {
    tomato: {
      causes: [
        { name: "Early blight", confidence: 0.78, checks: ["Brown spots with rings like a target, mostly on older lower leaves", "Yellowing around the spots and on stems near the soil"] },
        { name: "Late blight", confidence: 0.55, checks: ["Dark, water-soaked patches that spread fast in cool, wet weather", "White fuzzy growth under the leaf in the morning"] },
        { name: "Septoria leaf spot", confidence: 0.3, checks: ["Many small round spots with a grey centre and dark edge", "Tiny black dots inside the spots"] },
      ],
      treatment_type: "Fungicide (protective or systemic). Remove and destroy badly infected lower leaves. Spray 2 ml per litre of hexaconazole.",
      safety_note: "Wear gloves and a mask while spraying. Some shops still suggest monocrotophos. Respect the waiting period before harvest.",
    },
    potato: {
      causes: [
        { name: "Late blight", confidence: 0.8, checks: ["Dark, water-soaked patches on leaf tips and edges", "White fuzzy growth on the underside on humid mornings"] },
        { name: "Early blight", confidence: 0.5, checks: ["Dry brown spots with target-like rings on older leaves", "Spots stay small and dry, not soggy"] },
        { name: "Bacterial wilt", confidence: 0.25, checks: ["Plant wilts in the daytime even when soil is wet", "Cut stem in a glass of water releases milky threads"] },
      ],
      treatment_type: "Fungicide (protective first, systemic if spreading fast). Spray 2.5 g/litre of mancozeb.",
      safety_note: "Wear gloves and a mask. Do not spray before rain. Never mix with endosulfan.",
    },
    rice: {
      causes: [
        { name: "Rice blast", confidence: 0.74, checks: ["Eye-shaped spots with a grey centre and brown edge", "Neck of the grain head turning black and breaking"] },
        { name: "Brown spot", confidence: 0.5, checks: ["Oval brown spots like sesame seeds spread across the leaf", "Many spots on the grain husk too"] },
        { name: "Bacterial leaf blight", confidence: 0.35, checks: ["Yellow-white drying starting at the leaf tip and edges", "Wavy border between the dry and green part"] },
      ],
      treatment_type: "Fungicide for blast. Remove infected straw after harvest. Use 0.6 g per litre of tricyclazole.",
      safety_note: "Wear gloves and a mask. Keep spray away from fish ponds and drinking water. Phorate is sometimes sold for this.",
    },
    chilli: {
      causes: [
        { name: "Leaf curl virus (spread by whitefly)", confidence: 0.72, checks: ["Leaves curl upward and become small and crinkled", "Whiteflies fly up when you shake the plant"] },
        { name: "Thrips damage", confidence: 0.58, checks: ["Leaves curl upward with silvery streaks", "Tap a leaf over white paper: tiny moving yellow insects"] },
        { name: "Mite damage", confidence: 0.35, checks: ["Leaves curl downward, edges boat-shaped", "Very tiny mites under the leaf (use a magnifying glass)"] },
      ],
      treatment_type: "Insecticide to control the insect that spreads the virus (whitefly or thrips). Remove badly affected plants. Mix 1 ml/L of imidacloprid.",
      safety_note: "Wear gloves and a mask. Do not spray during flowering when bees are active. Monocrotophos is banned on vegetables.",
    },
  },
  hi: {
    tomato: {
      causes: [
        { name: "अगेती झुलसा (अर्ली ब्लाइट)", confidence: 0.78, checks: ["निचली पुरानी पत्तियों पर निशाने जैसे छल्लों वाले भूरे धब्बे", "धब्बों के आसपास और मिट्टी के पास तने पर पीलापन"] },
        { name: "पछेती झुलसा (लेट ब्लाइट)", confidence: 0.55, checks: ["ठंडे, गीले मौसम में तेज़ी से फैलने वाले गहरे, पानी जैसे धब्बे", "सुबह पत्ती के नीचे सफ़ेद रुई जैसी परत"] },
        { name: "सेप्टोरिया पत्ती धब्बा", confidence: 0.3, checks: ["स्लेटी बीच और गहरे किनारे वाले कई छोटे गोल धब्बे", "धब्बों के अंदर छोटे काले बिंदु"] },
      ],
      treatment_type: "फफूंदनाशक (सुरक्षात्मक या सिस्टमिक)। बुरी तरह संक्रमित निचली पत्तियाँ तोड़कर नष्ट करें। हेक्साकोनाज़ोल 2 मिली प्रति लीटर छिड़कें।",
      safety_note: "छिड़काव करते समय दस्ताने और मास्क पहनें। कुछ दुकानें अभी भी मोनोक्रोटोफॉस बताती हैं। तुड़ाई से पहले प्रतीक्षा अवधि का पालन करें।",
    },
    potato: {
      causes: [
        { name: "पछेती झुलसा (लेट ब्लाइट)", confidence: 0.8, checks: ["पत्ती के सिरों और किनारों पर गहरे, पानी जैसे धब्बे", "नमी वाली सुबह पत्ती के नीचे सफ़ेद रुई जैसी परत"] },
        { name: "अगेती झुलसा (अर्ली ब्लाइट)", confidence: 0.5, checks: ["पुरानी पत्तियों पर छल्लों वाले सूखे भूरे धब्बे", "धब्बे छोटे और सूखे रहते हैं, गीले नहीं"] },
        { name: "जीवाणु म्लानि (बैक्टीरियल विल्ट)", confidence: 0.25, checks: ["मिट्टी गीली होने पर भी दिन में पौधा मुरझा जाता है", "कटे तने को पानी के गिलास में रखने पर दूधिया धागे निकलते हैं"] },
      ],
      treatment_type: "फफूंदनाशक (पहले सुरक्षात्मक, तेज़ी से फैले तो सिस्टमिक)। मैंकोज़ेब 2.5 ग्राम प्रति लीटर छिड़कें।",
      safety_note: "दस्ताने और मास्क पहनें। बारिश से पहले छिड़काव न करें। एंडोसल्फान के साथ कभी न मिलाएँ।",
    },
    rice: {
      causes: [
        { name: "झोंका रोग (ब्लास्ट)", confidence: 0.74, checks: ["आँख के आकार के धब्बे, बीच में स्लेटी और किनारा भूरा", "बाली की गर्दन काली होकर टूटना"] },
        { name: "भूरा धब्बा", confidence: 0.5, checks: ["पत्ती पर तिल के दाने जैसे अंडाकार भूरे धब्बे", "दाने के छिलके पर भी कई धब्बे"] },
        { name: "जीवाणु पत्ती झुलसा", confidence: 0.35, checks: ["पत्ती के सिरे और किनारों से शुरू होकर पीला-सफ़ेद सूखना", "सूखे और हरे हिस्से के बीच लहरदार किनारा"] },
      ],
      treatment_type: "झोंका रोग के लिए फफूंदनाशक। कटाई के बाद संक्रमित पुआल हटाएँ। ट्राइसाइक्लाज़ोल 0.6 ग्राम प्रति लीटर डालें।",
      safety_note: "दस्ताने और मास्क पहनें। छिड़काव को मछली के तालाब और पीने के पानी से दूर रखें। इसके लिए कभी-कभी फोरेट बेचा जाता है।",
    },
    chilli: {
      causes: [
        { name: "पत्ती मरोड़ वायरस (सफ़ेद मक्खी से फैलता है)", confidence: 0.72, checks: ["पत्तियाँ ऊपर की ओर मुड़कर छोटी और सिकुड़ी हो जाती हैं", "पौधा हिलाने पर सफ़ेद मक्खियाँ उड़ती हैं"] },
        { name: "थ्रिप्स का नुकसान", confidence: 0.58, checks: ["पत्तियाँ ऊपर मुड़ती हैं और चाँदी जैसी धारियाँ दिखती हैं", "सफ़ेद कागज़ पर पत्ती झाड़ें: छोटे पीले कीड़े चलते दिखेंगे"] },
        { name: "माइट (मकड़ी) का नुकसान", confidence: 0.35, checks: ["पत्तियाँ नीचे की ओर मुड़ती हैं, किनारे नाव जैसे", "पत्ती के नीचे बहुत छोटे माइट (आवर्धक लेंस से देखें)"] },
      ],
      treatment_type: "वायरस फैलाने वाले कीट (सफ़ेद मक्खी या थ्रिप्स) के लिए कीटनाशक। बुरी तरह प्रभावित पौधे हटाएँ। इमिडाक्लोप्रिड 1 मिली प्रति लीटर मिलाएँ।",
      safety_note: "दस्ताने और मास्क पहनें। फूल आने पर जब मधुमक्खियाँ सक्रिय हों तब छिड़काव न करें। सब्ज़ियों पर मोनोक्रोटोफॉस प्रतिबंधित है।",
    },
  },
};

const UNSURE_SAMPLE: Record<Lang, AiAnswer> = {
  en: {
    image_ok: false,
    causes: [],
    treatment_type: "",
    safety_note: "",
    unsure_reason: "The photo is too blurry to see the leaf clearly.",
  },
  hi: {
    image_ok: false,
    causes: [],
    treatment_type: "",
    safety_note: "",
    unsure_reason: "फोटो इतनी धुंधली है कि पत्ती साफ़ नहीं दिख रही।",
  },
};

type DemoInput = { crop: CropId; lang: Lang; text: string; fileName: string };

export async function getDemoAnswer({ crop, lang, text, fileName }: DemoInput): Promise<AiAnswer> {
  // A short pause so the "Checking…" state is visible, like a real AI call.
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const wantsUnsure = /blurry|unsure|धुंधल/i.test(`${text} ${fileName}`);
  if (wantsUnsure) return UNSURE_SAMPLE[lang];

  // If you change the crop list, new crops fall back to the tomato sample.
  const sample = SAMPLES[lang][crop] ?? SAMPLES[lang].tomato!;
  return { image_ok: true, unsure_reason: "", ...sample };
}
