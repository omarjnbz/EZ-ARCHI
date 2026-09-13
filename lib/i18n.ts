export type Lang = "fr" | "en";

export const dict = {
  fr: {
    // header
    tagline: "Copilote IA · Architecte",
    legacy: "LEGACY ARCHITECTS · Omar Dadouche",
    downloadCta: "Télécharger le contrat",

    // template manager
    templateTitle: "Modèle de contrat",
    templateHint:
      "Choisissez le modèle utilisé pour générer le contrat. Un modèle personnalisé doit contenir des balises {{nom_du_champ}} (ex : {{nom_prenom}}, {{cin}}, {{titre_foncier}}) à l'endroit voulu dans le document Word.",
    templateDefaultLabel: "Modèle par défaut",
    templateDefaultSub: "LEGACY ARCHITECTS · Contrat type CNOA",
    templateAddCta: "Importer un modèle .docx",
    templateNamePrompt: "Nom de ce modèle",
    templateInvalid: "Ce fichier n'est pas reconnu comme un document Word.",
    templateLegacyDoc:
      "Ce fichier est au format Word 97-2003 (.doc), non pris en charge. Ouvrez-le dans Word (ou Google Docs / LibreOffice, gratuits), puis Fichier → Enregistrer sous → Document Word (.docx), et réimportez cette version.",
    templateFillError:
      "Impossible de générer le contrat avec ce modèle. Vérifiez que le fichier .docx n'est pas corrompu.",
    cancel: "Annuler",
    save: "Enregistrer",

    // upload panel
    uploadTitle: "Documents du client",
    uploadHint: "CIN (recto/verso), certificat de propriété, calcul de contenances…",
    uploadDrop: "Glissez vos fichiers ici",
    uploadOr: "ou cliquez pour parcourir",
    uploadFormats: "PDF · JPG · PNG · jusqu'à 4 documents",
    extractCta: "Extraire avec l'IA",
    extracting: "Lecture en cours",

    // process steps
    stepUpload: "Réception",
    stepRead: "Lecture OCR",
    stepExtract: "Extraction IA",
    stepCompose: "Composition",
    stepReady: "Prêt",
    stepUploadDesc: "Documents reçus",
    stepReadDesc: "Reconnaissance du texte",
    stepExtractDesc: "Identification des champs",
    stepComposeDesc: "Assemblage du contrat",
    stepReadyDesc: "Contrat prêt à télécharger",

    // fields editor
    editorEyebrow: "Contrat type unifié d'architecte · Conseil National de l'Ordre des Architectes",
    editorTitle: "Nouveau contrat",
    editorSubtitle:
      "Les champs sont remplis automatiquement depuis vos documents. Modifiez ce que vous voulez — le contrat final reflètera ces valeurs.",
    editorTip: "Astuce : demandez au copilote de calculer les honoraires, vérifier la cohérence, ou reformuler une adresse.",

    // field groups
    groupOwner: "Maître d'ouvrage",
    groupProject: "Localisation du projet",
    groupSurface: "Superficies",
    groupFees: "Honoraires",

    // field labels
    label_civilite: "Civilité",
    label_nom_prenom: "Nom & prénom",
    label_cin: "N° CIN",
    label_adresse: "Adresse personnelle",
    label_province: "Province",
    label_commune: "Commune",
    label_titre_foncier: "Titre foncier",
    label_nom_du_projet: "Nom du projet",
    label_adresse_project: "Adresse du projet",
    label_superficie_terrain: "Superficie du terrain",
    label_superficie_plancher: "Superficie plancher",
    label_superficie_: "Superficie totale",
    label_montant_estime_travaux: "Coût estimé des travaux",
    label_prix_m: "Prix au m²",
    label_taux_honoraires: "Taux d'honoraires (%)",
    label_taux_honoraires_lettres: "Taux d'honoraires (en lettres)",
    label_montant_honoraires: "Honoraires HT",
    label_montant_TVA: "TVA (20%)",
    label_honoraires_TTC: "Honoraires TTC",
    label_honoraires_TTC_lettres: "Honoraires TTC (en lettres)",

    // copilot
    copilotTitle: "Copilote",
    copilotSubtitle: "Powered by GPT · Azure OpenAI",
    copilotIntro:
      "Bonjour Omar. Dépose les pièces du dossier, je remplis le contrat. Tu peux aussi me demander de calculer les honoraires, vérifier la cohérence, ou reformuler une adresse.",
    copilotPlaceholder: "Posez une question, demandez un calcul…",
    copilotFooter: "Le copilote peut proposer des modifications de champs — elles s'appliquent automatiquement.",

    copilotHowTitle: "Comment utiliser le copilote",
    copilotHowBody:
      "Tape une demande en langage naturel. Le copilote lit tous les champs en cours et peut les corriger pour toi.",
    copilotExamplesTitle: "Essayez :",
    copilotExample1: "Calcule les honoraires à 5% pour 1 200 000 MAD",
    copilotExample2: "Convertis 72 000 dirhams en lettres",
    copilotExample3: "Reformule l'adresse plus proprement",
    copilotExample4: "Vérifie la cohérence avec le titre foncier",

    error: "Erreur",
    networkError: "Erreur réseau.",

    // field status
    summaryFilled: "remplis",
    summaryToFill: "à compléter",
    badgeMissing: "À compléter",
    badgeFrom: "depuis",
    sourceCin: "CIN",
    sourceTf: "Titre foncier",
    sourceCalcul: "Calcul",
    sourceManual: "À saisir",
    sourceComputed: "Calculé",

    // language toggle
    langLabel: "Langue",
  },
  en: {
    // header
    tagline: "AI Copilot · Architect",
    legacy: "LEGACY ARCHITECTS · Omar Dadouche",
    downloadCta: "Download contract",

    // template manager
    templateTitle: "Contract template",
    templateHint:
      "Choose which template generates the contract. A custom template must contain {{field_name}} tags (e.g. {{nom_prenom}}, {{cin}}, {{titre_foncier}}) wherever a value should appear in the Word document.",
    templateDefaultLabel: "Default template",
    templateDefaultSub: "LEGACY ARCHITECTS · CNOA unified contract",
    templateAddCta: "Import a .docx template",
    templateNamePrompt: "Name this template",
    templateInvalid: "This file isn't recognized as a Word document.",
    templateLegacyDoc:
      "This file is in the old Word 97-2003 format (.doc), which isn't supported. Open it in Word (or Google Docs / LibreOffice, both free), then File → Save As → Word Document (.docx), and re-import that version.",
    templateFillError:
      "Couldn't generate the contract with this template. Check that the .docx file isn't corrupted.",
    cancel: "Cancel",
    save: "Save",

    // upload panel
    uploadTitle: "Client documents",
    uploadHint: "ID card (front/back), property certificate, area calculation…",
    uploadDrop: "Drop your files here",
    uploadOr: "or click to browse",
    uploadFormats: "PDF · JPG · PNG · up to 4 documents",
    extractCta: "Extract with AI",
    extracting: "Reading",

    // process steps
    stepUpload: "Intake",
    stepRead: "OCR",
    stepExtract: "AI Extract",
    stepCompose: "Compose",
    stepReady: "Ready",
    stepUploadDesc: "Documents received",
    stepReadDesc: "Recognising text",
    stepExtractDesc: "Identifying fields",
    stepComposeDesc: "Assembling the contract",
    stepReadyDesc: "Contract ready to download",

    // fields editor
    editorEyebrow: "Unified Architect Contract · Conseil National de l'Ordre des Architectes",
    editorTitle: "New contract",
    editorSubtitle:
      "Fields auto-fill from your documents. Edit anything — the final contract will reflect these values.",
    editorTip: "Tip: ask the copilot to compute fees, check consistency, or rephrase an address.",

    // field groups
    groupOwner: "Owner",
    groupProject: "Project location",
    groupSurface: "Areas",
    groupFees: "Fees",

    // field labels
    label_civilite: "Title",
    label_nom_prenom: "Full name",
    label_cin: "ID number",
    label_adresse: "Home address",
    label_province: "Province",
    label_commune: "Commune",
    label_titre_foncier: "Land title",
    label_nom_du_projet: "Project name",
    label_adresse_project: "Project address",
    label_superficie_terrain: "Land area",
    label_superficie_plancher: "Floor area",
    label_superficie_: "Total area",
    label_montant_estime_travaux: "Estimated cost",
    label_prix_m: "Price / m²",
    label_taux_honoraires: "Fee rate (%)",
    label_taux_honoraires_lettres: "Fee rate (in words)",
    label_montant_honoraires: "Fees ex. VAT",
    label_montant_TVA: "VAT (20%)",
    label_honoraires_TTC: "Fees incl. VAT",
    label_honoraires_TTC_lettres: "Fees in words",

    // copilot
    copilotTitle: "Copilot",
    copilotSubtitle: "Powered by GPT · Azure OpenAI",
    copilotIntro:
      "Hi Omar. Drop the client files and I'll fill the contract. You can also ask me to compute fees, check consistency, or rephrase an address.",
    copilotPlaceholder: "Ask a question, request a calculation…",
    copilotFooter: "The copilot can propose field edits — they're applied automatically.",

    copilotHowTitle: "How to use the copilot",
    copilotHowBody:
      "Type a request in plain English. The copilot sees all current fields and can correct them for you.",
    copilotExamplesTitle: "Try:",
    copilotExample1: "Compute fees at 5% for 1,200,000 MAD",
    copilotExample2: "Convert 72,000 dirhams to words",
    copilotExample3: "Rephrase the address more cleanly",
    copilotExample4: "Cross-check against the land title",

    error: "Error",
    networkError: "Network error.",

    // field status
    summaryFilled: "filled",
    summaryToFill: "to fill",
    badgeMissing: "To fill",
    badgeFrom: "from",
    sourceCin: "ID card",
    sourceTf: "Land title",
    sourceCalcul: "Calc.",
    sourceManual: "Manual",
    sourceComputed: "Auto",

    // language toggle
    langLabel: "Language",
  },
} as const;

export type TKey = keyof typeof dict.fr;

export function t(lang: Lang, key: TKey): string {
  return dict[lang][key] ?? dict.fr[key] ?? key;
}
