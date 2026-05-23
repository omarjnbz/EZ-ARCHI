# EZ-ARCHI

> AI copilot for Moroccan architects.
> Drop client documents in → get a ready-to-sign architect contract out.

Built for **LEGACY ARCHITECTS** (Omar Dadouche, Rabat). Generates the *Contrat Type Unifié d'Architecte — Construction (secteur privé)* of the Conseil National de l'Ordre des Architectes (version 28 Feb 2024).

## Workflow

1. Upload the client's documents (CIN recto/verso, certificat de propriété, calcul de contenances).
2. AI extracts the 16+ required fields automatically.
3. Adjust manually or via the copilot chat (right panel).
4. Download the finalized `.docx` contract.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind** + custom editorial design system
- **Azure OpenAI** (Responses API, `gpt-5.4-mini` deployment)
- **docxtemplater + PizZip** for filling the existing `.docx` template
- **pdf-parse** for PDF text extraction

## Setup

```bash
npm install
cp .env.example .env       # or use the committed .env
npm run dev                # http://localhost:3000
```

## Environment

| Variable | Description |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | Full Responses API URL incl. `api-version` |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI key |
| `AZURE_OPENAI_MODEL` | Deployment name (e.g. `gpt-5.4-mini`) |

## API

- `POST /api/extract` — multipart upload of files → returns extracted fields
- `POST /api/fill` — JSON of fields → returns filled `.docx`
- `POST /api/chat` — `{messages, fields}` → returns `{reply, patch?}`

## Project structure

```
app/                Next.js routes + API
components/         Workspace, UploadPanel, FieldsEditor, CopilotChat
lib/
  azure-openai.ts   Responses API client
  schema.ts         Field schema + financial computations + amount-to-words FR
  docx-fill.ts      Template merge (handles split runs)
templates/          contract-template.docx (REF placeholders)
samples/            Reference client documents (Abbadi case)
```

## Roadmap

- E-signature
- Client portal (clients upload their own docs)
- Multi-template (lotissement, réhabilitation, syndicat)
- Permis de construire dossier prep
- Honoraires calculator per Ordre's bareme
- Project timeline tracker
- Auto-generated attestations (NE VARIETUR, achèvement, conformité)
