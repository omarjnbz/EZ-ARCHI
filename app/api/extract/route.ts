import { NextRequest, NextResponse } from "next/server";
import { callResponses, fileToDataUrl } from "@/lib/azure-openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXTRACTION_SYSTEM = `Tu es un assistant pour Omar Dadouche, architecte au Maroc (cabinet LEGACY ARCHITECTS).
Tu reçois plusieurs documents administratifs marocains : CIN (recto/verso), certificat de propriété (شهادة الملكية), calcul de contenances, etc.
Extrais les champs demandés et retourne UN OBJET JSON STRICT, sans texte explicatif, sans markdown.

Schéma exigé :
{
  "civilite": "Mr" | "Mme",
  "nom_prenom": "string (en majuscules, prénom NOM)",
  "cin": "string",
  "adresse": "string (adresse personnelle du maître d'ouvrage)",
  "province": "string (ex: Khémisset)",
  "commune": "string (ex: Tiflet)",
  "titre_foncier": "string (ex: 31846/16)",
  "superficie_terrain": "string (ex: 533 m² ou 5a 33ca)"
}

Règles :
- Si une info n'est pas trouvée, mets une chaîne vide "".
- Pour nom_prenom : utiliser le format romanisé de la CIN.
- Pour superficie_terrain : préfère la forme métrique en m² si elle est disponible, sinon la forme cadastrale.
- Réponds UNIQUEMENT avec l'objet JSON.`;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const content: any[] = [
      {
        type: "input_text",
        text: "Voici les documents du client. Extrais les champs selon le schéma.",
      },
    ];

    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      const mime = f.type || (f.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      if (mime.startsWith("image/")) {
        content.push({
          type: "input_image",
          image_url: fileToDataUrl(buf, mime),
          detail: "high",
        });
      } else if (mime === "application/pdf") {
        // Try sending as input_file first; if model doesn't support, fall back to text
        try {
          const pdfParse = (await import("pdf-parse")).default;
          const parsed = await pdfParse(buf);
          content.push({
            type: "input_text",
            text: `\n--- Contenu extrait du PDF "${f.name}" ---\n${parsed.text}\n--- fin PDF ---\n`,
          });
        } catch (e) {
          content.push({
            type: "input_file",
            filename: f.name,
            file_data: fileToDataUrl(buf, mime),
          });
        }
      }
    }

    const { text } = await callResponses(
      [{ role: "user", content }],
      { responseFormat: "json", instructions: EXTRACTION_SYSTEM }
    );

    let fields: Record<string, string> = {};
    try {
      fields = JSON.parse(text);
    } catch {
      // Try to find a JSON block in the response
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try { fields = JSON.parse(m[0]); } catch {}
      }
    }

    return NextResponse.json({ fields, raw: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
