import { z } from "zod"
import { env } from "../config/env"
import { AppError } from "../utils/AppError"

export interface RecipeIngredientInput {
  name: string
  quantity: number
  unit: string
  daysLeft: number
}

export interface GenerateRecipesParams {
  ingredients: RecipeIngredientInput[]
  count: number
  servings: number
  dietary?: string
  mealType: string
}

// revalidate ai output with zod....
const generatedRecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  prepTimeMinutes: z.coerce.number().min(0).default(10),
  cookTimeMinutes: z.coerce.number().min(0).default(15),
  servings: z.coerce.number().min(1).default(2),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.union([z.string(), z.number()]).transform((v) => String(v)).default("")
      })
    )
    .default([]),
  pantryStaples: z.array(z.string()).default([]),
  steps: z.array(z.string().min(1)).min(1),
  tip: z.string().optional()
})

const responseSchema = z.object({ recipes: z.array(generatedRecipeSchema).min(1) })

export type GeneratedRecipe = z.infer<typeof generatedRecipeSchema>

const buildPrompt = (p: GenerateRecipesParams): string => {
  const list = p.ingredients
    .map((i) => `- ${i.name} (${i.quantity} ${i.unit}, expires in ${i.daysLeft} day${i.daysLeft === 1 ? "" : "s"})`)
    .join("\n")

  return `You are a creative zero-waste home chef helping a household use food before it spoils.

INGREDIENTS THAT ARE EXPIRING SOON (the ONLY ingredients you may use):
${list}

STRICT RULES:
- Create exactly ${p.count} different recipe(s) for ${p.servings} serving(s). Meal type: ${p.mealType}.${
    p.dietary ? `\n- Dietary requirement: ${p.dietary}. Respect it, and skip any listed ingredient that violates it.` : ""
  }
- Use ONLY the ingredients listed above. You do NOT have to use all of them in every recipe, but prioritise the ones expiring soonest.
- The ONLY extra items allowed are basic pantry staples: salt, pepper, water, cooking oil, sugar. List any staple you use in "pantryStaples".
- Do NOT invent or add any other ingredient (no spices, sauces, flour, rice, etc. unless they are in the list above).
- Keep the steps short, clear and practical.

Respond with JSON ONLY, no markdown, in exactly this shape:
{
  "recipes": [
    {
      "title": "string",
      "description": "one appetising sentence",
      "prepTimeMinutes": number,
      "cookTimeMinutes": number,
      "servings": number,
      "ingredients": [{ "name": "ingredient name exactly as listed above", "quantity": "amount to use, e.g. 2 pcs" }],
      "pantryStaples": ["salt", "..."],
      "steps": ["Step 1 ...", "Step 2 ..."],
      "tip": "one short tip about storing leftovers or reducing waste"
    }
  ]
}`
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
  promptFeedback?: { blockReason?: string }
}

const callModel = async (model: string, prompt: string): Promise<{ status: number; body: GeminiResponse | null }> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
    }),
    signal: AbortSignal.timeout(45_000)
  })

  const body = (await response.json().catch(() => null)) as GeminiResponse | null
  return { status: response.status, body }
}

const extractJson = (text: string): unknown => {
  //ai strip json fence
  const cleaned = text.replace(/```json|```/gi, "").trim()
  return JSON.parse(cleaned)
}

export const generateRecipes = async (params: GenerateRecipesParams): Promise<GeneratedRecipe[]> => {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(503, "AI recipe generator is not configured api key miss..!")
  }

  const prompt = buildPrompt(params)
  const models = [env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL].filter(
    (m, i, all) => m && all.indexOf(m) === i
  )

  let lastStatus = 0
  for (const model of models) {
    let result
    try {
      result = await callModel(model, prompt)
    } catch (err) {
      console.error(`Gemini request failed (${model}):`, err)
      lastStatus = 504
      continue //network err
    }

    lastStatus = result.status
    if (result.status === 429) {
      throw new AppError(429, "Ai API quota reached. Please try again later..!")
    }
    if (result.status === 400 || result.status === 401 || result.status === 403) {
      throw new AppError(502, "Ai rejected the request. Check AI_API_KEY and Ai_MODEL..!")
    }
    if (result.status !== 200 || !result.body) {
      continue //fallback
    }

    const text = result.body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
    if (!text) {
      throw new AppError(502, "Ai returned an empty answer. Please try again..!")
    }

    try {
      return responseSchema.parse(extractJson(text)).recipes
    } catch (err) {
      console.error("Could not parse Gemini output:", err, text.slice(0, 500))
      throw new AppError(502, "Gemini returned an unexpected format. Please try again..!")
    }
  }

  throw new AppError(502, `Gemini is currently unavailable (status ${lastStatus}). Please try again later..!`)
}
