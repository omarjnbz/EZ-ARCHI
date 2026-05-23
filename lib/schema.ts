export type ContractFields = {
  civilite: string;
  nom_prenom: string;
  cin: string;
  adresse: string;
  province: string;
  commune: string;
  titre_foncier: string;
  superficie_terrain: string;
  superficie_: string;
  superficie_plancher: string;
  montant_estime_travaux: string;
  prix_m: string;
  taux_honoraires: string;
  montant_honoraires: string;
  montant_TVA: string;
  honoraires_TTC: string;
  honoraires_TTC_lettres: string;
  adresse_project: string;
};

export const EMPTY_FIELDS: ContractFields = {
  civilite: "",
  nom_prenom: "",
  cin: "",
  adresse: "",
  province: "",
  commune: "",
  titre_foncier: "",
  superficie_terrain: "",
  superficie_: "",
  superficie_plancher: "",
  montant_estime_travaux: "",
  prix_m: "",
  taux_honoraires: "",
  montant_honoraires: "",
  montant_TVA: "",
  honoraires_TTC: "",
  honoraires_TTC_lettres: "",
  adresse_project: "",
};

export const FIELD_LABELS: Record<keyof ContractFields, string> = {
  civilite: "Civilité",
  nom_prenom: "Nom & prénom",
  cin: "CIN",
  adresse: "Adresse",
  province: "Province",
  commune: "Commune",
  titre_foncier: "Titre foncier",
  superficie_terrain: "Superficie terrain",
  superficie_: "Superficie",
  superficie_plancher: "Superficie plancher",
  montant_estime_travaux: "Coût estimé travaux",
  prix_m: "Prix au m²",
  taux_honoraires: "Taux honoraires (%)",
  montant_honoraires: "Montant honoraires HT",
  montant_TVA: "Montant TVA",
  honoraires_TTC: "Honoraires TTC",
  honoraires_TTC_lettres: "Honoraires TTC (lettres)",
  adresse_project: "Adresse du projet",
};

export const FIELD_GROUPS: { title: string; keys: (keyof ContractFields)[] }[] = [
  {
    title: "Maître d'ouvrage",
    keys: ["civilite", "nom_prenom", "cin", "adresse"],
  },
  {
    title: "Localisation projet",
    keys: ["adresse_project", "commune", "province", "titre_foncier"],
  },
  {
    title: "Superficies",
    keys: ["superficie_terrain", "superficie_plancher", "superficie_"],
  },
  {
    title: "Honoraires",
    keys: [
      "montant_estime_travaux",
      "prix_m",
      "taux_honoraires",
      "montant_honoraires",
      "montant_TVA",
      "honoraires_TTC",
      "honoraires_TTC_lettres",
    ],
  },
];

export function computeFinancials(input: Partial<ContractFields>): Partial<ContractFields> {
  const cost = parseFloat((input.montant_estime_travaux || "").replace(/[^\d.]/g, ""));
  const rate = parseFloat((input.taux_honoraires || "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(cost) || !Number.isFinite(rate)) return {};
  const ht = cost * (rate / 100);
  const tva = ht * 0.2;
  const ttc = ht + tva;
  return {
    montant_honoraires: formatMAD(ht),
    montant_TVA: formatMAD(tva),
    honoraires_TTC: formatMAD(ttc),
    honoraires_TTC_lettres: amountToWordsFR(ttc),
  };
}

export function formatMAD(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + " MAD";
}

const UNITS = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const TEENS = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

function hundredsToWordsFR(n: number): string {
  if (n === 0) return "";
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (t === 7 || t === 9) {
      return TENS[t] + "-" + TEENS[u];
    }
    return TENS[t] + (u ? "-" + UNITS[u] : "");
  }
  const h = Math.floor(n / 100);
  const r = n % 100;
  const hWord = h === 1 ? "cent" : UNITS[h] + " cent" + (r === 0 ? "s" : "");
  return r === 0 ? hWord : hWord + " " + hundredsToWordsFR(r);
}

export function amountToWordsFR(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const whole = Math.floor(rounded);
  const cents = Math.round((rounded - whole) * 100);
  const inWords = (num: number): string => {
    if (num === 0) return "zéro";
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = "";
    if (thousands > 0) {
      result = thousands === 1 ? "mille" : hundredsToWordsFR(thousands) + " mille";
    }
    if (remainder > 0) {
      result += (result ? " " : "") + hundredsToWordsFR(remainder);
    }
    return result;
  };
  const main = inWords(whole) + " dirhams";
  const dec = cents > 0 ? " et " + inWords(cents) + " centimes" : "";
  return (main + dec).replace(/\s+/g, " ").trim();
}
