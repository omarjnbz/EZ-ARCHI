import { NextRequest, NextResponse } from "next/server";
import { detectSupportedFields, detectDocFormat } from "@/lib/docx-fill";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const templateFile = form.get("template");

    let buf: Buffer | undefined;
    if (templateFile instanceof File) {
      buf = Buffer.from(await templateFile.arrayBuffer());
      if (detectDocFormat(buf) !== "docx") {
        return NextResponse.json({ fields: [] });
      }
    }

    const fields = Array.from(detectSupportedFields(buf));
    return NextResponse.json({ fields });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
