import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { fillContract, detectDocFormat } from "@/lib/docx-fill";
import { mergeFieldsForFill, type ContractFields } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const fieldsRaw = form.get("fields");
    const body = JSON.parse(typeof fieldsRaw === "string" ? fieldsRaw : "{}") as Partial<ContractFields>;
    const merged = mergeFieldsForFill(body);

    const templateFile = form.get("template");
    let templateBuffer: Buffer | undefined;
    if (templateFile instanceof File) {
      templateBuffer = Buffer.from(await templateFile.arrayBuffer());
      const format = detectDocFormat(templateBuffer);
      if (format === "legacy-doc") {
        return NextResponse.json({ error: "legacy_doc_format" }, { status: 400 });
      }
      if (format === "unknown") {
        return NextResponse.json({ error: "invalid_template" }, { status: 400 });
      }
    }

    let docx: Buffer;
    try {
      docx = fillContract(merged, templateBuffer);
    } catch (e: any) {
      if (templateBuffer) {
        return NextResponse.json({ error: "invalid_template" }, { status: 400 });
      }
      throw e;
    }

    const { value: html } = await mammoth.convertToHtml({ buffer: docx });
    return NextResponse.json({ html });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
