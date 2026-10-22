// The "shapes" of data in the app.
// AiAnswer is what the AI must send back. If its reply doesn't match,
// we treat the answer as broken and show "Unsure" instead of crashing.
// Diagnosis is what the server sends to the screen after the safety rules run.

import { z } from "zod";

export const AiAnswerSchema = z.object({
  image_ok: z.boolean(),
  causes: z.array(
    z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      checks: z.array(z.string()),
    }),
  ),
  treatment_type: z.string(),
  safety_note: z.string(),
  unsure_reason: z.string().optional().default(""),
});

export type AiAnswer = z.infer<typeof AiAnswerSchema>;

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type Cause = {
  name: string;
  confidence: number;
  level: ConfidenceLevel;
  checks: string[];
};

export type Diagnosis =
  | {
      status: "ok";
      causes: Cause[];
      treatmentType: string;
      safetyNote: string;
      labelLine: string;
      warnings: string[];
      demo: boolean;
    }
  | {
      status: "unsure";
      reason: string;
      nextSteps: string[];
      warnings: string[];
      demo: boolean;
    }
  | {
      status: "error";
      message: string;
    };
