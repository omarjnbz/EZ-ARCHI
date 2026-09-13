import { NextRequest, NextResponse } from "next/server";
import { callResponses } from "@/lib/azure-openai";

export const runtime = "nodejs";
export const maxDuration = 60;

function buildSystem(lang: "fr" | "en") {
  const base = `You are the AI copilot for EZ-ARCHI, embedded in an architect contract generator.
You help Omar Dadouche (LEGACY ARCHITECTS, Rabat) finalize a unified architect contract from the Moroccan Conseil National de l'Ordre des Architectes.

You can see the current extracted field state. You can:
- Cross-check consistency (e.g. land area vs title foncier)
- Propose fee rates from typical bareme
- Rephrase an address, fix a typo
- Compute VAT (20%) and TTC
- Convert an amount to written words (FR)

When you propose ANY field edit, end your reply with a code block exactly like this:
\`\`\`patch
{"field1": "new value", "field2": "..."}
\`\`\`
Allowed keys: civilite, nom_prenom, cin, adresse, province, commune, titre_foncier, nom_du_projet, superficie_terrain, superficie_, superficie_plancher, montant_estime_travaux, prix_m, taux_honoraires, taux_honoraires_lettres, montant_honoraires, montant_TVA, honoraires_TTC, honoraires_TTC_lettres, adresse_project.

If nothing to change, omit the patch block. Be concise and professional.`;
  if (lang === "en") return base + "\nRespond in English.";
  return base + "\nRéponds en français.";
}

export async function POST(req: NextRequest) {
  try {
    const { messages, fields, lang } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      fields: Record<string, string>;
      lang?: "fr" | "en";
    };

    const effectiveLang = lang === "en" ? "en" : "fr";
    const SYSTEM = buildSystem(effectiveLang);
    const header =
      effectiveLang === "en"
        ? "Current field state:"
        : "État actuel des champs :";
    const contextLine = `${header}\n\`\`\`json\n${JSON.stringify(fields, null, 2)}\n\`\`\``;

    const input: any[] = [
      {
        role: "user",
        content: [{ type: "input_text", text: contextLine }],
      },
      ...messages.map((m) =>
        m.role === "assistant"
          ? {
              role: "assistant",
              content: [{ type: "output_text", text: m.content }],
            }
          : {
              role: "user",
              content: [{ type: "input_text", text: m.content }],
            }
      ),
    ];

    const { text } = await callResponses(input, { instructions: SYSTEM });

    // Extract patch JSON if present
    let patch: Record<string, string> | null = null;
    const patchMatch = text.match(/```patch\s*([\s\S]*?)```/);
    if (patchMatch) {
      try {
        patch = JSON.parse(patchMatch[1]);
      } catch {}
    }
    const reply = text.replace(/```patch[\s\S]*?```/, "").trim();

    return NextResponse.json({ reply, patch });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
