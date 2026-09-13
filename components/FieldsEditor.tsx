"use client";

import { useLang } from "./LanguageProvider";
import {
  FIELD_GROUPS,
  FIELD_SOURCES,
  type ContractFields,
  type Source,
} from "@/lib/schema";

type Props = {
  fields: ContractFields;
  onChange: (patch: Partial<ContractFields>) => void;
  justFilled: Set<string>;
  extractedOnce: boolean;
};

const GROUP_KEY = {
  "Maître d'ouvrage": "groupOwner",
  "Localisation projet": "groupProject",
  Superficies: "groupSurface",
  Honoraires: "groupFees",
} as const;

export default function FieldsEditor({ fields, onChange, justFilled, extractedOnce }: Props) {
  const { t } = useLang();
  const totalCount = Object.keys(fields).length;
  const filledCount = Object.values(fields).filter((v) => v && v.length).length;
  const missingCount = totalCount - filledCount;
  const completion = (filledCount / totalCount) * 100;

  return (
    <div className="max-w-3xl mx-auto px-10 py-10 space-y-10">
      <div className="space-y-4">
        <div className="text-[11px] uppercase tracking-[0.12em] text-subink font-medium">
          {t("editorEyebrow")}
        </div>
        <h1 className="display text-5xl tracking-tight">{t("editorTitle")}</h1>
        <p className="text-[15px] text-subink max-w-2xl leading-relaxed">{t("editorSubtitle")}</p>

        <div className="flex items-center gap-4 pt-2">
          <div className="h-1.5 w-48 rounded-full bg-soft overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-[#4ba1ff] rounded-full transition-all duration-700 ease-spring"
              style={{ width: `${completion}%` }}
            />
          </div>
          <span className="text-[12px] mono text-ink font-medium">
            {filledCount}/{totalCount}
          </span>
          <span className="text-[12px] text-subink">
            · {filledCount} {t("summaryFilled")}
            {missingCount > 0 ? `, ${missingCount} ${t("summaryToFill")}` : ""}
          </span>
        </div>
      </div>

      {FIELD_GROUPS.map((group) => {
        const groupKey = GROUP_KEY[group.title as keyof typeof GROUP_KEY] || "groupOwner";
        return (
          <section key={group.title} className="space-y-4">
            <h2 className="display text-xl border-b border-line/70 pb-2">{t(groupKey)}</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {group.keys.map((k) => (
                <FieldRow
                  key={k}
                  fieldKey={k}
                  value={fields[k] || ""}
                  onChange={(v) => onChange({ [k]: v })}
                  highlight={justFilled.has(k)}
                  showMissing={extractedOnce && !(fields[k] && fields[k]!.length)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="pt-6 border-t border-line/60 text-[12px] text-subink leading-relaxed">
        💡 {t("editorTip")}
      </div>
    </div>
  );
}

function FieldRow({
  fieldKey,
  value,
  onChange,
  highlight,
  showMissing,
}: {
  fieldKey: keyof ContractFields;
  value: string;
  onChange: (v: string) => void;
  highlight: boolean;
  showMissing: boolean;
}) {
  const { t, lang } = useLang();
  const isLong =
    fieldKey === "adresse" ||
    fieldKey === "adresse_project" ||
    fieldKey === "honoraires_TTC_lettres";
  const labelKey = `label_${fieldKey}` as const;
  const sources = FIELD_SOURCES[fieldKey];

  return (
    <div className={isLong ? "col-span-2" : ""}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] uppercase tracking-[0.1em] text-subink font-medium">
          {t(labelKey as any)}
        </label>
        <div className="flex items-center gap-1">
          {value ? (
            sources.map((s) => <SourceChip key={s} source={s} />)
          ) : showMissing ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {t("badgeMissing")}
            </span>
          ) : (
            sources.map((s) => <SourceChip key={s} source={s} muted />)
          )}
        </div>
      </div>
      <div className={highlight ? "glow-fill rounded-xl" : ""}>
        {isLong ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            className={[
              "w-full bg-white border rounded-xl px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-4 focus:ring-accent/15 resize-none transition-all duration-300",
              highlight ? "border-success" : value ? "border-line" : showMissing ? "border-amber-300" : "border-line",
              "focus:border-accent",
            ].join(" ")}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={[
              "w-full bg-white border rounded-xl px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-4 focus:ring-accent/15 transition-all duration-300",
              highlight ? "border-success" : value ? "border-line" : showMissing ? "border-amber-300" : "border-line",
              "focus:border-accent",
            ].join(" ")}
          />
        )}
      </div>
    </div>
  );
}

function SourceChip({ source, muted }: { source: Source; muted?: boolean }) {
  const { t } = useLang();
  const key =
    source === "cin"
      ? "sourceCin"
      : source === "tf"
      ? "sourceTf"
      : source === "calcul"
      ? "sourceCalcul"
      : source === "manual"
      ? "sourceManual"
      : "sourceComputed";
  const color =
    source === "cin"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : source === "tf"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : source === "calcul"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : source === "manual"
      ? "bg-slate-50 text-slate-700 border-slate-200"
      : "bg-orange-50 text-orange-700 border-orange-200";
  return (
    <span
      className={[
        "inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border",
        muted ? "opacity-50" : "",
        color,
      ].join(" ")}
    >
      {t(key as any)}
    </span>
  );
}
