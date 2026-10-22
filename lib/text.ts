// Every fixed piece of text on the screen, in English and Hindi.
// The AI writes the diagnosis itself; this file holds everything else.

import type { Lang } from "./crops";

const en = {
  tagline: "Crop problem helper for agri-input dealers",
  crop: "Crop",
  language: "Language",
  photo: "Leaf photo",
  photoHint: "Take or upload a clear photo of one affected leaf",
  removePhoto: "Remove photo",
  description: "What did the farmer say?",
  descriptionPlaceholder: "e.g. brown spots on lower leaves, edges drying, spreading for 5 days",
  speak: "🎤 Speak",
  listening: "● Listening… tap to stop",
  diagnose: "Diagnose",
  checking: "Checking…",
  startOver: "Start over",
  demoMode: "Demo mode: sample answer, no AI used",

  likelyCauses: "Likely causes",
  disclaimer: "These are likely causes, not a final diagnosis. Confirm with the farmer before selling.",
  checkToConfirm: "Check this to confirm",
  confidence: { High: "High", Medium: "Medium", Low: "Low" },
  treatmentType: "Typical treatment type",
  safetyNote: "Safety note",
  labelLine: "Read the label for dose. Never use more than the label says.",
  bannedWarning: "A banned or restricted pesticide was mentioned and removed. Do not sell banned products.",
  treatmentFallback: "Choose a product approved for this crop and problem, and follow its label.",
  safetyFallback: "Wear gloves and a mask while spraying. Keep chemicals away from children, food and water.",

  unsureTitle: "Unsure — consult an expert",
  unsureIntro: "FasalAI is not confident enough to suggest causes. Don't guess.",
  whatNext: "What to do next",
  unsureReasonDefault: "The photo or description isn't clear enough to suggest causes safely.",
  unsureReasonTimeout: "The answer took too long. Please try again.",
  unsureReasonBroken: "We couldn't get a clear answer. Please try again.",
  unsureSteps: [
    "Retake the photo in daylight, close to one affected leaf, in focus.",
    "Type what the farmer sees: spots, colour, which part of the plant, how fast it spread.",
    "Show a sample to the local Krishi Vigyan Kendra (KVK) or agriculture officer.",
  ],

  errEmpty: "Add a photo or describe the problem in a few words.",
  errFileType: "Please use a JPG, PNG or WebP photo.",
  errFileTooBig: "This file is too big. Please use a photo under 15 MB.",
  errPhotoRead: "Couldn't read this photo. Please try a different one (JPG or PNG).",
  errBadRequest: "Something was wrong with the form. Please start over.",
  errNetwork: "Couldn't reach FasalAI. Check the internet and try again.",
};

export type Strings = typeof en;

const hi: Strings = {
  tagline: "कृषि-इनपुट डीलरों के लिए फसल समस्या सहायक",
  crop: "फसल",
  language: "भाषा",
  photo: "पत्ती की फोटो",
  photoHint: "प्रभावित पत्ती की साफ़ फोटो लें या अपलोड करें",
  removePhoto: "फोटो हटाएँ",
  description: "किसान ने क्या बताया?",
  descriptionPlaceholder: "जैसे: नीचे की पत्तियों पर भूरे धब्बे, किनारे सूख रहे हैं, 5 दिन से फैल रहा है",
  speak: "🎤 बोलें",
  listening: "● सुन रहे हैं… रोकने के लिए दबाएँ",
  diagnose: "जाँच करें",
  checking: "जाँच हो रही है…",
  startOver: "फिर से शुरू करें",
  demoMode: "डेमो मोड: नमूना जवाब, AI का इस्तेमाल नहीं हुआ",

  likelyCauses: "संभावित कारण",
  disclaimer: "ये संभावित कारण हैं, अंतिम निदान नहीं। बेचने से पहले किसान से पुष्टि करें।",
  checkToConfirm: "पक्का करने के लिए जाँचें",
  confidence: { High: "ज़्यादा भरोसा", Medium: "मध्यम भरोसा", Low: "कम भरोसा" },
  treatmentType: "आम उपचार का प्रकार",
  safetyNote: "सावधानी",
  labelLine: "खुराक के लिए लेबल पढ़ें। लेबल पर लिखी मात्रा से ज़्यादा कभी इस्तेमाल न करें।",
  bannedWarning: "एक प्रतिबंधित कीटनाशक का नाम आया था, उसे हटा दिया गया। प्रतिबंधित उत्पाद न बेचें।",
  treatmentFallback: "इस फसल और समस्या के लिए मान्य उत्पाद चुनें और उसके लेबल का पालन करें।",
  safetyFallback: "छिड़काव करते समय दस्ताने और मास्क पहनें। दवा को बच्चों, खाने और पानी से दूर रखें।",

  unsureTitle: "पक्का नहीं — विशेषज्ञ से सलाह लें",
  unsureIntro: "FasalAI इतना पक्का नहीं है कि कारण बता सके। अंदाज़ा न लगाएँ।",
  whatNext: "आगे क्या करें",
  unsureReasonDefault: "फोटो या विवरण इतना साफ़ नहीं है कि सुरक्षित रूप से कारण बताए जा सकें।",
  unsureReasonTimeout: "जवाब आने में बहुत देर लगी। कृपया दोबारा कोशिश करें।",
  unsureReasonBroken: "साफ़ जवाब नहीं मिल सका। कृपया दोबारा कोशिश करें।",
  unsureSteps: [
    "दिन की रोशनी में, एक प्रभावित पत्ती के पास से, साफ़ फोटो दोबारा लें।",
    "किसान जो देख रहा है वह लिखें: धब्बे, रंग, पौधे का कौन सा हिस्सा, कितनी तेज़ी से फैला।",
    "नमूना पास के कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी को दिखाएँ।",
  ],

  errEmpty: "फोटो जोड़ें या कुछ शब्दों में समस्या लिखें।",
  errFileType: "कृपया JPG, PNG या WebP फोटो इस्तेमाल करें।",
  errFileTooBig: "यह फ़ाइल बहुत बड़ी है। कृपया 15 MB से छोटी फोटो इस्तेमाल करें।",
  errPhotoRead: "यह फोटो पढ़ी नहीं जा सकी। कृपया दूसरी फोटो (JPG या PNG) आज़माएँ।",
  errBadRequest: "फ़ॉर्म में कुछ गड़बड़ थी। कृपया फिर से शुरू करें।",
  errNetwork: "FasalAI से जुड़ नहीं सके। इंटरनेट जाँचें और दोबारा कोशिश करें।",
};

export const TEXT: Record<Lang, Strings> = { en, hi };
