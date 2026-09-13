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
  supportedFields: Set<string> | null;
};

const GROUP_KEY = {
  "Maître d'ouvrage": "groupOwner",
  "Localisation projet": "groupProject",
  Superficies: "groupSurface",
  Honoraires: "groupFees",
} as const;

export default function FieldsEditor({ fields, onChange, justFilled, extractedOnce, supportedFields }: Props) {
  const { t } = useLang();
  const totalCount = Object.keys(fields).length;
  const filledCount = Object.values(fields).filter((v) => v && v.length).length;
  const missingCount = totalCount - filledCount;
  const completion = (filledCount / totalCount) * 100;
  const supportedCount = supportedFields
    ? Object.keys(fields).filter((k) => supportedFields.has(k)).length
    : null;

  return (
    <div className="max-w-4xl mx-auto px-10 py-10 space-y-10">
      <div className="space-y-4">
        <div className="text-[11px] uppercase tracking-[0.12em] text-subink font-medium">
          {t("editorEyebrow")}
        </div>
        <h1 className="display text-5xl tracking-tight">{t("editorTitle")}</h1>
        <p className="text-[15px] text-subink max-w-2xl leading-relaxed">{t("editorSubtitle")}</p>

        <div className="flex items-center gap-4 pt-2">
          <div className="h-1.5 w-48 rounded-full bg-soft overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700 ease-spring"
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
        {supportedCount !== null && supportedCount < totalCount && (
          <div className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-fg)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning-fg)] shrink-0" />
            {supportedCount}/{totalCount} {t("summarySupported")}
          </div>
        )}
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
                  supported={supportedFields === null ? null : supportedFields.has(k)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="pt-6 border-t border-line/60 text-[12px] text-subink leading-relaxed">
        {t("editorTip")}
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
  supported,
}: {
  fieldKey: keyof ContractFields;
  value: string;
  onChange: (v: string) => void;
  highlight: boolean;
  showMissing: boolean;
  supported: boolean | null;
}) {
  const { t, lang } = useLang();
  const isLong =
    fieldKey === "adresse" ||
    fieldKey === "adresse_project" ||
    fieldKey === "honoraires_TTC_lettres";
  const labelKey = `label_${fieldKey}` as const;
  const sources = FIELD_SOURCES[fieldKey];
  const unsupported = supported === false;

  return (
    <div className={isLong ? "col-span-2" : ""}>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <label className="text-[11px] uppercase tracking-[0.1em] text-subink font-medium truncate">
            {t(labelKey as any)}
          </label>
          {unsupported && (
            <span
              title={t("fieldUnusedHint")}
              className="shrink-0 inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-fg)]"
            >
              {t("fieldUnusedBadge")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {value ? (
            sources.map((s) => <SourceChip key={s} source={s} />)
          ) : showMissing ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-fg)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning-fg)]" />
              {t("badgeMissing")}
            </span>
          ) : (
            sources.map((s) => <SourceChip key={s} source={s} muted />)
          )}
        </div>
      </div>
      <div className={[highlight ? "glow-fill rounded-lg" : "", unsupported ? "opacity-50" : ""].join(" ")}>
        {isLong ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            title={unsupported ? t("fieldUnusedHint") : undefined}
            className={[
              "w-full bg-canvas border rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none transition-all duration-200",
              highlight ? "border-success" : value ? "border-line" : showMissing ? "border-[var(--warning-border)]" : "border-line",
              "focus:border-accent",
            ].join(" ")}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            title={unsupported ? t("fieldUnusedHint") : undefined}
            className={[
              "w-full bg-canvas border rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200",
              highlight ? "border-success" : value ? "border-line" : showMissing ? "border-[var(--warning-border)]" : "border-line",
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
      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25"
      : source === "tf"
      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/25"
      : source === "calcul"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25"
      : source === "manual"
      ? "bg-soft text-subink border-line"
      : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/25";
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
