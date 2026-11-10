/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { X, Upload, Image, Trash2, Check, Sparkles } from 'lucide-react';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: string | null;
  onSaveLogo: (logoUrl: string | null) => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogo,
  onSaveLogo,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo);
  const [urlInput, setUrlInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("L'image est trop volumineuse (taille maximale : 5 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPreviewUrl(result);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Erreur lors de la lecture de l'image.");
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    setErrorMsg(null);
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput);
      setPreviewUrl(urlInput.trim());
    } catch {
      setErrorMsg('Veuillez entrer une URL valide (ex: https://...).');
    }
  };

  const handleConfirm = () => {
    onSaveLogo(previewUrl);
    onClose();
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setUrlInput('');
    onSaveLogo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Logo Personnel de DA DAVID</h3>
              <p className="text-xs text-slate-400">Personnalisez le logo affiché dans l'en-tête</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-4">
          {/* Aperçu du logo */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Aperçu en direct
            </span>
            <div className="relative group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Aperçu Logo DA DAVID"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-400 shadow-xl shadow-indigo-500/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex flex-col items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/20 border-2 border-indigo-400/50">
                  <span>DD</span>
                  <span className="text-[8px] font-bold tracking-widest uppercase opacity-80">DA DAVID</span>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 mt-2">
              {previewUrl ? 'Image personnalisée active' : 'Logo par défaut (Initiales DA DAVID)'}
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Option 1 : Importer depuis l'ordinateur / téléphone */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              1. Importer une image depuis votre appareil
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Choisir un fichier image (PNG, JPG, WebP, SVG)</span>
            </button>
          </div>

          {/* Option 2 : Ou saisir une URL */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              2. Ou entrer l'URL d'une image
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://exemple.com/mon-logo.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-all"
              >
                Charger
              </button>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/60">
          {previewUrl ? (
            <button
              onClick={handleRemove}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-all py-1.5 px-2.5 rounded-lg hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer le logo</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Valider le logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
