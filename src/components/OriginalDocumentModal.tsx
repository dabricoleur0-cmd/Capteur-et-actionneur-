/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, RotateCw, ZoomIn, ZoomOut, FileText, Maximize2 } from 'lucide-react';

interface OriginalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OriginalDocumentModal: React.FC<OriginalDocumentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [rotation, setRotation] = useState<number>(90); // 90° car l'image d'origine est orientée horizontalement
  const [zoom, setZoom] = useState<number>(1);

  if (!isOpen) return null;

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, z - 0.25));
  const handleReset = () => {
    setRotation(90);
    setZoom(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Document Source de l'Exercice (CamScanner)</h3>
              <p className="text-xs text-slate-400">DOC-20261107-WA0005.pdf • Schémas de puissance et commande originaux</p>
            </div>
          </div>

          {/* Outils de vue */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Pivoter de 90°"
            >
              <RotateCw className="w-4 h-4" />
              <span>Pivoter ({rotation}°)</span>
            </button>
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-400">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Réinitialiser
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps image avec défilement et zoom */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60 relative">
          <div
            className="transition-transform duration-200 origin-center"
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom})`,
            }}
          >
            <img
              src="/assets/aistudio/Screenshot_20261110-200813_ae9129c8.png"
              alt="Exercice d'automatismes original"
              className="max-w-[70vw] max-h-[70vh] object-contain rounded-lg shadow-xl border border-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
