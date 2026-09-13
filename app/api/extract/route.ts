import { NextRequest, NextResponse } from "next/server";
import { callResponses, fileToDataUrl } from "@/lib/azure-openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXTRACTION_SYSTEM = `Tu assistes Omar Dadouche, architecte au Maroc (LEGACY ARCHITECTS).
Tu reçois plusieurs documents administratifs marocains :
- CIN recto (carte d'identité nationale, côté avec photo et nom romanisé)
- CIN verso (côté avec adresse, parents, sexe M/F, et code MRZ commençant par "IDMAR")
- شهادة الملكية / Certificat de propriété (titre foncier ANCFCC, en arabe + français)
- Calcul de contenances (cadastre, en français)

Tu extrais TOUS les champs disponibles et tu retournes UN OBJET JSON STRICT, sans markdown, sans phrase d'introduction.

Schéma exigé :
{
  "civilite": "Mr" | "Mme",
  "nom_prenom": "string (format CIN romanisé : NOM_DE_FAMILLE PRENOM, ex: EL ABBADI HMIDA)",
  "cin": "string (ex: PZ819283)",
  "adresse": "string (adresse personnelle complète du maître d'ouvrage)",
  "province": "string (ex: Khémisset)",
  "commune": "string (ex: Tiflet)",
  "titre_foncier": "string (numéro complet, ex: 31846/16)",
  "superficie_terrain": "string (PRÉFÉRER la forme métrique en m², ex: '533 m²' plutôt que '5a 33ca')"
}

RÈGLES STRICTES :
1. nom_prenom : convention marocaine = NOM DE FAMILLE en premier, puis PRÉNOM. Sur la CIN, lis exactement le nom en lettres latines au recto. Si tu vois "EL ABBADI" + "HMIDA", écris "EL ABBADI HMIDA". JAMAIS l'inverse.
2. civilite : lis le champ "Sexe" au verso de la CIN. "M" => "Mr". "F" => "Mme". Ne devine PAS depuis le prénom.
3. cin : copie EXACTEMENT le numéro tel qu'il apparaît au recto (ex: PZ819283). Ne l'invente pas. Si tu ne le vois pas clairement, mets "".
4. superficie_terrain : convertis "X a Y ca" en m². "5 a 33 ca" = 533 m². Note le résultat en m².
5. Si une info n'est pas disponible dans les documents fournis, mets la valeur "" (chaîne vide). Ne devine JAMAIS.
6. Toutes les valeurs sont des chaînes de caractères (pas de null, pas de nombre).
7. Réponds UNIQUEMENT avec l'objet JSON, rien d'autre.`;

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
        text:
          "Voici les documents du client (CIN recto/verso, certificat de propriété, calcul de contenances). " +
          "Extrais tous les champs disponibles selon le schéma et réponds en JSON strict, sans texte autour.",
      },
    ];

    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      const mime =
        f.type || (f.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      if (mime.startsWith("image/")) {
        content.push({
          type: "input_image",
          image_url: fileToDataUrl(buf, mime),
          detail: "high",
        });
      } else if (mime === "application/pdf") {
        try {
          const pdfParse = (await import("pdf-parse")).default;
          const parsed = await pdfParse(buf);
          content.push({
            type: "input_text",
            text: `\n--- Texte extrait du PDF "${f.name}" ---\n${parsed.text}\n--- fin PDF ---\n`,
          });
        } catch {
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
