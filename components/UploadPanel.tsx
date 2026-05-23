"use client";

import { useRef } from "react";

type Props = {
  files: File[];
  setFiles: (f: File[]) => void;
  onExtract: () => void;
  extracting: boolean;
};

export default function UploadPanel({ files, setFiles, onExtract, extracting }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles([...files, ...dropped]);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles([...files, ...Array.from(e.target.files)]);
  }

  function removeFile(i: number) {
    setFiles(files.filter((_, idx) => idx !== i));
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="serif text-xl">Documents client</h2>
        <p className="text-xs text-muted mt-1">
          CIN (recto/verso), certificat de propriété, calcul de contenances…
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-line bg-white hover:border-ink/30 transition-colors cursor-pointer p-8 text-center"
      >
        <div className="serif text-base text-muted">
          Glissez vos fichiers ici
        </div>
        <div className="text-xs text-muted mt-1">PDF · JPG · PNG</div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          className="hidden"
          onChange={onPick}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-white border border-line px-3 py-2 text-sm fade-in"
            >
              <span className="truncate mr-2" title={f.name}>
                {f.name}
              </span>
              <button
                onClick={() => removeFile(i)}
                className="text-muted hover:text-accent text-xs"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onExtract}
        disabled={!files.length || extracting}
        className="w-full h-10 bg-ink text-paper text-sm tracking-wide hover:bg-accent disabled:bg-line disabled:text-muted disabled:cursor-not-allowed transition-colors"
      >
        {extracting ? (
          <span>
            Extraction <span className="dot" /><span className="dot" /><span className="dot" />
          </span>
        ) : (
          "Extraire les données"
        )}
      </button>

      <div className="pt-4 border-t border-line">
        <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
          Comment ça marche
        </h3>
        <ol className="text-xs text-muted space-y-1.5 leading-relaxed">
          <li>1. Déposez les pièces du dossier client.</li>
          <li>2. L'IA extrait les champs (CIN, TF, superficie, etc.).</li>
          <li>3. Ajustez avec le copilote à droite si besoin.</li>
          <li>4. Téléchargez le contrat prêt à signer.</li>
        </ol>
      </div>
    </div>
  );
}
