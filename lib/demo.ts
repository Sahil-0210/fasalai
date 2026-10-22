// Demo mode: realistic sample answers used when no AI key is set.
// They go through the same safety rules as real AI answers. On purpose, each
// sample contains a dose and a banned pesticide, so you can see the rules
// remove them.
// To see the "Unsure" card in demo mode: type "blurry" in the description,
// or upload a photo whose file name contains "blurry".

import type { Lang } from "./crops";
import type { Product } from "./inventory";
import type { AiAnswer } from "./schema";

type Sample = Omit<AiAnswer, "image_ok" | "unsure_reason" | "products">;

const SAMPLE: Record<Lang, Sample> = {
  en: {
    causes: [
      { name: "Fungal leaf spot", confidence: 0.78, checks: ["Brown spots with rings, mostly on older lower leaves", "Spots spread faster after rain or heavy dew"] },
      { name: "Bacterial leaf spot", confidence: 0.5, checks: ["Spots look wet or oily, with a yellow halo", "Spots are angular, limited by leaf veins"] },
      { name: "Sucking pest damage", confidence: 0.3, checks: ["Tiny insects under the leaf (shake over white paper)", "Leaves curl or have silvery streaks"] },
    ],
    treatment_type: "Fungicide (protective or systemic). Remove badly infected leaves. Spray 2 ml per litre of hexaconazole.",
    safety_note: "Wear gloves and a mask while spraying. Some shops still suggest monocrotophos. Respect the waiting period before harvest.",
  },
  hi: {
    causes: [
      { name: "फफूंद पत्ती धब्बा", confidence: 0.78, checks: ["निचली पुरानी पत्तियों पर छल्लों वाले भूरे धब्बे", "बारिश या ओस के बाद धब्बे तेज़ी से फैलते हैं"] },
      { name: "जीवाणु पत्ती धब्बा", confidence: 0.5, checks: ["धब्बे गीले या तैलीय दिखते हैं, चारों ओर पीला घेरा", "धब्बे कोणीय, पत्ती की नसों तक सीमित"] },
      { name: "रस चूसक कीटों का नुकसान", confidence: 0.3, checks: ["पत्ती के नीचे छोटे कीड़े (सफ़ेद कागज़ पर झाड़ें)", "पत्तियाँ मुड़ती हैं या चाँदी जैसी धारियाँ"] },
    ],
    treatment_type: "फफूंदनाशक (सुरक्षात्मक या सिस्टमिक)। बुरी तरह संक्रमित पत्तियाँ हटाएँ। हेक्साकोनाज़ोल 2 मिली प्रति लीटर छिड़कें।",
    safety_note: "छिड़काव करते समय दस्ताने और मास्क पहनें। कुछ दुकानें अभी भी मोनोक्रोटोफॉस बताती हैं। तुड़ाई से पहले प्रतीक्षा अवधि का पालन करें।",
  },
  mr: {
    causes: [
      { name: "बुरशीजन्य पानावरील ठिपके", confidence: 0.78, checks: ["खालच्या जुन्या पानांवर वर्तुळे असलेले तपकिरी ठिपके", "पाऊस किंवा दव पडल्यानंतर ठिपके वेगाने पसरतात"] },
      { name: "जिवाणूजन्य पानावरील ठिपके", confidence: 0.5, checks: ["ठिपके ओलसर किंवा तेलकट दिसतात, भोवती पिवळे वलय", "ठिपके कोनाकृती, पानाच्या शिरांपर्यंत मर्यादित"] },
      { name: "रस शोषणाऱ्या किडींचे नुकसान", confidence: 0.3, checks: ["पानाच्या खाली लहान किडे (पांढऱ्या कागदावर झटका)", "पाने वळतात किंवा चंदेरी रेषा दिसतात"] },
    ],
    treatment_type: "बुरशीनाशक (संरक्षक किंवा आंतरप्रवाही). जास्त बाधित पाने काढून टाका. हेक्साकोनाझोल 2 मिली प्रति लीटर फवारा.",
    safety_note: "फवारणी करताना हातमोजे आणि मास्क घाला. काही दुकाने अजूनही मोनोक्रोटोफॉस सुचवतात. काढणीपूर्वीचा प्रतीक्षा कालावधी पाळा.",
  },
};

const UNSURE_REASON: Record<Lang, string> = {
  en: "The photo is too blurry to see the leaf clearly.",
  hi: "फोटो इतनी धुंधली है कि पत्ती साफ़ नहीं दिख रही।",
  mr: "फोटो इतका धूसर आहे की पान स्पष्ट दिसत नाही.",
};

const WHY: Record<Lang, string> = {
  en: "Matches the treatment type for the most likely cause. Use 2 ml per litre.",
  hi: "सबसे संभावित कारण के उपचार प्रकार से मेल खाता है।",
  mr: "सर्वात संभाव्य कारणाच्या उपचार प्रकाराशी जुळते.",
};

type DemoInput = { lang: Lang; text: string; fileName: string; shop: Product[] };

export async function getDemoAnswer({ lang, text, fileName, shop }: DemoInput): Promise<AiAnswer> {
  // A short pause so the "Checking…" state is visible, like a real AI call.
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (/blurry|unsure|धुंधल|धूसर/i.test(`${text} ${fileName}`)) {
    return { image_ok: false, causes: [], treatment_type: "", safety_note: "", unsure_reason: UNSURE_REASON[lang], products: [] };
  }

  // Demo picks: fungicides and bio products from the shop (the real AI chooses properly).
  const products = shop
    .filter((p) => p.kind === "fungicide" || p.kind === "bio")
    .slice(0, 3)
    .map((p) => ({ id: p.id, why: WHY[lang] }));

  return { image_ok: true, unsure_reason: "", products, ...SAMPLE[lang] };
}
