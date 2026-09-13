import { NextRequest, NextResponse } from "next/server";
import { fillContract } from "@/lib/docx-fill";
import { computeFinancials, type ContractFields } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const fieldsRaw = form.get("fields");
    const body = JSON.parse(typeof fieldsRaw === "string" ? fieldsRaw : "{}") as Partial<ContractFields>;

    const merged: Partial<ContractFields> = {
      ...body,
      ...computeFinancials(body),
    };

    if (!merged.superficie_) merged.superficie_ = merged.superficie_terrain || "";
    if (!merged.adresse_project)
      merged.adresse_project = [merged.commune, merged.province].filter(Boolean).join(", ");

    const templateFile = form.get("template");
    let templateBuffer: Buffer | undefined;
    if (templateFile instanceof File) {
      templateBuffer = Buffer.from(await templateFile.arrayBuffer());
    }

    let docx: Buffer;
    try {
      docx = fillContract(merged, templateBuffer);
    } catch (e: any) {
      if (templateBuffer) {
        return NextResponse.json(
          { error: "invalid_template" },
          { status: 400 }
        );
      }
      throw e;
    }
    const filename = `contrat-${(merged.nom_prenom || "client").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.docx`;

    return new NextResponse(new Uint8Array(docx), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
