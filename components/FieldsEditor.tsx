"use client";

import { FIELD_GROUPS, FIELD_LABELS, type ContractFields } from "@/lib/schema";

type Props = {
  fields: ContractFields;
  onChange: (patch: Partial<ContractFields>) => void;
};

export default function FieldsEditor({ fields, onChange }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-10 py-10 space-y-10">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-muted">
          Contrat type unifié d'architecte · Conseil National de l'Ordre des Architectes
        </div>
        <h1 className="serif text-4xl">Nouveau contrat</h1>
        <p className="text-sm text-muted">
          Les champs sont remplis automatiquement depuis vos documents. Modifiez ce que vous voulez —
          le contrat final reflètera ces valeurs.
        </p>
      </div>

      {FIELD_GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="serif text-xl border-b border-line pb-2">{group.title}</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {group.keys.map((k) => {
              const isLong =
                k === "adresse" ||
                k === "adresse_project" ||
                k === "honoraires_TTC_lettres";
              return (
                <div key={k} className={isLong ? "col-span-2" : ""}>
                  <label className="block text-xs uppercase tracking-wider text-muted mb-1">
                    {FIELD_LABELS[k]}
                  </label>
                  {isLong ? (
                    <textarea
                      value={fields[k] || ""}
                      onChange={(e) => onChange({ [k]: e.target.value })}
                      rows={2}
                      className="w-full bg-paper border border-line px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
                    />
                  ) : (
                    <input
                      value={fields[k] || ""}
                      onChange={(e) => onChange({ [k]: e.target.value })}
                      className="w-full bg-paper border border-line px-3 py-2 text-sm focus:outline-none focus:border-ink"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="pt-6 border-t border-line text-xs text-muted">
        Astuce : demandez au copilote « calcule les honoraires à 5% pour un coût de 1 200 000 MAD »
        et il remplira automatiquement les champs TVA / TTC / en lettres.
      </div>
    </div>
  );
}
