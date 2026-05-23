const ENDPOINT =
  process.env.AZURE_OPENAI_ENDPOINT ||
  "https://bng-sysops-gpt.openai.azure.com/openai/responses?api-version=2025-04-01-preview";
const API_KEY = process.env.AZURE_OPENAI_API_KEY || "";
const MODEL = process.env.AZURE_OPENAI_MODEL || "gpt-5.4-mini";

type ResponsesInput =
  | string
  | Array<{
      role: "user" | "assistant" | "system";
      content: Array<
        | { type: "input_text"; text: string }
        | { type: "input_image"; image_url: string; detail?: "low" | "high" | "auto" }
        | { type: "input_file"; filename: string; file_data: string }
      >;
    }>;

export async function callResponses(input: ResponsesInput, opts?: {
  responseFormat?: "json" | "text";
  instructions?: string;
}) {
  const body: Record<string, unknown> = {
    model: MODEL,
    input,
  };
  if (opts?.instructions) body.instructions = opts.instructions;
  if (opts?.responseFormat === "json") {
    body.text = { format: { type: "json_object" } };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Azure OpenAI ${res.status}: ${raw.slice(0, 500)}`);
  }

  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Azure OpenAI returned non-JSON: " + raw.slice(0, 200));
  }

  const text =
    json.output_text ||
    json.output?.flatMap((o: any) => o.content ?? [])
      ?.map((c: any) => c.text)
      ?.filter(Boolean)
      ?.join("\n") ||
    "";

  return { text, raw: json };
}

export function fileToDataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
