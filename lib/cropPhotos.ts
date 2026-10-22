// Credits for the crop photos in public/crops/ (all from Wikimedia Commons,
// openly licensed). Shown in Help → Photo credits. Photos were resized and
// cropped to 320×320.

import type { CropId } from "./crops";

export const CROP_PHOTOS: Record<CropId, { author: string; license: string; source: string }> = {
  soybean: { author: "Harry Rose from South West Rocks, Australia", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Glycine_max_pod_green1_Carol_Rose_(10220460885).jpg" },
  cotton: { author: "Ashish Wankhade Wankash at English Wikipedia", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Cotton_Plant.png" },
  sugarcane: { author: "ruurmo", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Cut_sugarcane.jpg" },
  onion: { author: "Eric Polk", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Red_onion_bulb.jpg" },
  tur: { author: "Forest and Kim Starr", license: "CC BY 3.0 us", source: "https://commons.wikimedia.org/wiki/File:Starr-090602-8777-Cajanus_cajan-leaves_and_pods-Wailuku-Maui_(24594387329).jpg" },
  chana: { author: "Wikimedia Commons contributor", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Cicer_arietinum_HabitusFruits_BotGardBln0906a.jpg" },
  jowar: { author: "Daniel Georg Döhne (user Bugdream)", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Sorghum_bicolor_(Moench).JPG" },
  wheat: { author: "Daniela M.", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Ears_of_wheat.jpg" },
  rice: { author: "Ramesh Kunnappully", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Rice_Panicle.jpg" },
  tomato: { author: "THOR", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Italian_Vine_Tomatoes_(3026014294).jpg" },
  grapes: { author: "Panelxf", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Bunch_Of_Grapes_On_Vine.jpg" },
  pomegranate: { author: "Ivar Leidus", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Pomegranate_fruit_-_whole_and_piece_with_arils.jpg" },
  banana: { author: "abhiriksh", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Banana_bunch_in_a_banana_farm_at_Chinawal.jpg" },
  orange: { author: "Wikimedia Commons contributor", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Ambersweet_oranges.jpg" },
};
