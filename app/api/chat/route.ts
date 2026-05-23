import { NextRequest, NextResponse } from "next/server";
import { callResponses } from "@/lib/azure-openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Tu es le copilote AI d'EZ-ARCHI, intégré au générateur de contrats d'architecte.
Tu aides Omar Dadouche (LEGACY ARCHITECTS, Rabat) à finaliser un contrat type unifié d'architecte (Conseil National de l'Ordre des Architectes).

Tu connais l'état actuel des champs extraits du dossier client. Tu peux :
- Vérifier la cohérence (ex: la superficie de terrain correspond au titre foncier)
- Proposer des valeurs pour les honoraires selon les barèmes habituels
- Reformuler une adresse, corriger une faute
- Calculer TVA (20%) et TTC
- Convertir un montant en lettres françaises

Quand tu suggères de modifier un ou plusieurs champs, termine TOUJOURS ta réponse par un bloc JSON encadré ainsi :
\`\`\`patch
{"champ1": "nouvelle valeur", "champ2": "..."}
\`\`\`
Les clés autorisées : civilite, nom_prenom, cin, adresse, province, commune, titre_foncier, superficie_terrain, superficie_, superficie_plancher, montant_estime_travaux, prix_m, taux_honoraires, montant_honoraires, montant_TVA, honoraires_TTC, honoraires_TTC_lettres, adresse_project.

Si rien à modifier, ne mets pas de bloc patch. Sois concis, professionnel, francophone.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, fields } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      fields: Record<string, string>;
    };

    const contextLine = `État actuel des champs :\n\`\`\`json\n${JSON.stringify(fields, null, 2)}\n\`\`\``;

    const input = [
      {
        role: "user" as const,
        content: [{ type: "input_text" as const, text: contextLine }],
      },
      ...messages.map((m) => ({
        role: m.role,
        content: [{ type: "input_text" as const, text: m.content }],
      })),
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
