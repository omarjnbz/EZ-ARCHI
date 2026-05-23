import { NextRequest, NextResponse } from "next/server";
import { fillContract } from "@/lib/docx-fill";
import { computeFinancials, type ContractFields } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContractFields>;

    const merged: Partial<ContractFields> = {
      ...body,
      ...computeFinancials(body),
    };

    if (!merged.superficie_) merged.superficie_ = merged.superficie_terrain || "";
    if (!merged.adresse_project)
      merged.adresse_project = [merged.commune, merged.province].filter(Boolean).join(", ");

    const docx = fillContract(merged);
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
