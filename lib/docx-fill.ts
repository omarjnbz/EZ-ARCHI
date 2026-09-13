import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import type { ContractFields } from "./schema";

const TEMPLATE_PATH = path.join(process.cwd(), "templates", "contract-template.docx");

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * REF placeholders in the template are Word MERGEFIELDs:
 *   <w:r>…<w:fldChar w:fldCharType="begin"/>…</w:r>
 *   <w:r>…<w:instrText> REF </w:instrText>…</w:r>
 *   <w:r>…<w:instrText>civilite</w:instrText>…</w:r>
 *   <w:r>…<w:fldChar w:fldCharType="separate"/>…</w:r>
 *   <w:r>…<w:t>cached display value</w:t>…</w:r>
 *   <w:r>…<w:fldChar w:fldCharType="end"/>…</w:r>
 *
 * We find every begin…end block, extract the field name from the instrText
 * segments, and replace the whole block with a single styled run carrying the
 * value from `fields`.
 */
function replaceFields(xml: string, fields: Partial<ContractFields>): string {
  // Tempered greedy: the run containing `begin` (and `end`) is bounded by
  // its own </w:r>, so the regex cannot swallow earlier <w:r> nodes from
  // elsewhere in the document.
  const runBegin = String.raw`<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:fldChar\b[^>]*w:fldCharType="begin"[^>]*\/>(?:(?!<\/w:r>)[\s\S])*?<\/w:r>`;
  const runEnd = String.raw`<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:fldChar\b[^>]*w:fldCharType="end"[^>]*\/>(?:(?!<\/w:r>)[\s\S])*?<\/w:r>`;
  const fieldRe = new RegExp(`${runBegin}[\\s\\S]*?${runEnd}`, "g");

  return xml.replace(fieldRe, (full: string) => {
    const instrs = [...full.matchAll(/<w:instrText[^>]*>([^<]*)<\/w:instrText>/g)]
      .map((m) => m[1])
      .join("");
    const m = instrs.match(/REF\s+([a-zA-Z_]+)/);
    if (!m) return full;
    const key = m[1];
    const value = (fields as Record<string, string>)[key] ?? "";
    return `<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r>`;
  });
}

/**
 * Word also has a second, more compact way to encode a REF field:
 *   <w:fldSimple w:instr=" REF key ">…cached display run(s)…</w:fldSimple>
 * (as opposed to the begin/instrText/separate/end run sequence above). Word
 * uses whichever form was in effect when the field was inserted/last edited,
 * so a template can and does mix both for the same field name in different
 * spots.
 */
function replaceSimpleFields(xml: string, fields: Partial<ContractFields>): string {
  return xml.replace(
    /<w:fldSimple\b[^>]*w:instr="([^"]*)"[^>]*>[\s\S]*?<\/w:fldSimple>/g,
    (full, instr: string) => {
      const m = instr.match(/REF\s+([a-zA-Z_]+)/);
      if (!m) return full;
      const value = (fields as Record<string, string>)[m[1]] ?? "";
      return `<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r>`;
    }
  );
}

/**
 * Word Bookmarks (<w:bookmarkStart w:name="key"/>…<w:bookmarkEnd/>) are a second
 * placeholder convention used in this template (and the simplest one for a
 * template author to add in Word: Insert > Bookmark, name it like a field key).
 * Every bookmarked span found is treated as a merge slot: known keys are filled,
 * unknown/unmapped bookmark names are blanked rather than left as whatever
 * static text they wrapped — this template ships with several bookmarks that
 * still contain a previous real client's data (name, CIN, address, land title…)
 * left over from the original sample fill, which must never leak into a new
 * client's contract.
 */
const BOOKMARK_ALIASES: Record<string, string> = {
  prix_m2: "prix_m",
  adresse_projet: "adresse_project",
  taux_honoraires_2: "taux_honoraires",
  taux_honoraires_lettres_2: "taux_honoraires_lettres",
  nom_du_projet_2: "nom_du_projet",
};

function replaceBookmarkFields(xml: string, fields: Partial<ContractFields>): string {
  const startRe = /<w:bookmarkStart w:id="(\d+)" w:name="([a-zA-Z_][a-zA-Z0-9_]*)"\/>/g;
  let result = "";
  let cursor = 0;
  let m: RegExpExecArray | null;

  while ((m = startRe.exec(xml))) {
    const [full, id, name] = m;
    const endTag = `<w:bookmarkEnd w:id="${id}"/>`;
    const endIdx = xml.indexOf(endTag, m.index + full.length);
    if (endIdx === -1) continue; // unmatched bookmark, leave as-is

    const key = BOOKMARK_ALIASES[name] || name;
    const value = (fields as Record<string, string>)[key] ?? "";

    result += xml.slice(cursor, m.index + full.length);
    result += `<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r>`;
    cursor = endIdx;
  }
  result += xml.slice(cursor);
  return result;
}

/**
 * Also handle the rare case where "REF key" appears as plain text inside a
 * single <w:t> (no field code). This catches placeholders that may have been
 * pasted as text in some sections.
 */
function replacePlainRefText(xml: string, fields: Partial<ContractFields>): string {
  return xml.replace(/(<w:t[^>]*>)([^<]*REF\s+[a-zA-Z_]+[^<]*)(<\/w:t>)/g, (_, open, inner: string, close) => {
    const replaced = inner.replace(/REF\s+([a-zA-Z_]+)/g, (_2, key) => {
      const v = (fields as Record<string, string>)[key];
      return v ? escapeXml(v) : "";
    });
    return open + replaced + close;
  });
}

export function fillContract(fields: Partial<ContractFields>, templateBuffer?: Buffer): Buffer {
  const buf = templateBuffer ?? fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(buf);

  const candidates = [
    "word/document.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/header3.xml",
    "word/footer1.xml",
    "word/footer2.xml",
    "word/footer3.xml",
  ];

  for (const fileName of candidates) {
    const file = zip.file(fileName);
    if (!file) continue;
    let xml = file.asText();
    xml = replaceBookmarkFields(xml, fields);
    xml = replaceFields(xml, fields);
    xml = replaceSimpleFields(xml, fields);
    xml = replacePlainRefText(xml, fields);
    zip.file(fileName, xml);
  }

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
