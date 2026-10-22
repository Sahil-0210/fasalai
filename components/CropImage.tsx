"use client";

// A crop's photo (public/crops/<id>.jpg). If the photo can't load, the emoji shows instead.

import Image from "next/image";
import { useState } from "react";
import { CROPS, type CropId } from "@/lib/crops";

// "fluid" fills the width of its box (as a square); otherwise it is size × size.
type Props = { crop: CropId; size: number; fluid?: boolean; className?: string };

export default function CropImage({ crop, size, fluid = false, className = "" }: Props) {
  const box = fluid ? { width: "100%", aspectRatio: "1 / 1" } : { width: size, height: size };
  const [failed, setFailed] = useState(false);
  const emoji = CROPS.find((c) => c.id === crop)!.emoji;

  if (failed) {
    return (
      <span className={`flex items-center justify-center bg-green-50 ${className}`} style={{ ...box, fontSize: size / 2 }} aria-hidden>
        {emoji}
      </span>
    );
  }
  return (
    <Image
      src={`/crops/${crop}.jpg`}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      style={box}
    />
  );
}
