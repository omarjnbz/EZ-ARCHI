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

export function fillContract(fields: Partial<ContractFields>): Buffer {
  const buf = fs.readFileSync(TEMPLATE_PATH);
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
    xml = replaceFields(xml, fields);
    xml = replacePlainRefText(xml, fields);
    zip.file(fileName, xml);
  }

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
