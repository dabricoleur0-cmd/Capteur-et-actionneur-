/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { SystemState } from '../simulation/engine';

export interface HistoryPoint {
  time: number; // en secondes
  s1: number;
  pos1C: number;
  pos2C: number;
  s1S0: number;
  s1S1: number;
  s2S1: number;
  yv14_1: number;
  ka1: number;
  yv12_1: number;
  yv12_0: number;
}

interface TimingDiagramProps {
  history: HistoryPoint[];
  currentState: SystemState;
  onClearHistory?: () => void;
}

export const TimingDiagramView: React.FC<TimingDiagramProps> = ({
  history,
  currentState,
  onClearHistory,
}) => {
  // Tracé des signaux logiques
  const signals = [
    { id: 's1', label: 'S1 (Départ)', color: '#38bdf8', getValue: (p: HistoryPoint) => p.s1 },
    { id: '1c', label: '1C (Course 1C)', color: '#f59e0b', isAnalog: true, getValue: (p: HistoryPoint) => p.pos1C },
    { id: '1s0', label: '1S0 (1C rentré)', color: '#10b981', getValue: (p: HistoryPoint) => p.s1S0 },
    { id: '1s1', label: '1S1 (1C sorti)', color: '#10b981', getValue: (p: HistoryPoint) => p.s1S1 },
    { id: 'ka1', label: 'KA1 (Relais maintien)', color: '#a855f7', getValue: (p: HistoryPoint) => p.ka1 },
    { id: 'yv12_1', label: 'YV12.1 (Sortie 2C)', color: '#ec4899', getValue: (p: HistoryPoint) => p.yv12_1 },
    { id: '2c', label: '2C (Course 2C)', color: '#f59e0b', isAnalog: true, getValue: (p: HistoryPoint) => p.pos2C },
    { id: '2s1', label: '2S1 (2C sorti)', color: '#10b981', getValue: (p: HistoryPoint) => p.s2S1 },
    { id: 'yv12_0', label: 'YV12.0 (Rentrée 1C)', color: '#ec4899', getValue: (p: HistoryPoint) => p.yv12_0 },
  ];

  const maxPoints = 240; // Fenêtre temporelle glissante
  const displayPoints = history.slice(-maxPoints);

  return (
    <div className="bg-slate-900 border border-slate-750 rounded-xl p-4 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Chronogramme Temps Réel des Signaux
            </h2>
            <p className="text-xs text-slate-400">
              Évolution temporelle des entrées, sorties, relais et vérins (1C+ → 2C+ → 1C- → 2C-)
            </p>
          </div>
        </div>

        {onClearHistory && (
          <button
            onClick={onClearHistory}
            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-all"
          >
            Effacer
          </button>
        )}
      </div>

      <div className="flex-1 min-h-[300px] overflow-hidden flex flex-col justify-between py-2">
        {signals.map((sig) => {
          const rowHeight = 28;
          const currentVal = displayPoints.length > 0 ? sig.getValue(displayPoints[displayPoints.length - 1]) : 0;

          // Génération du chemin SVG
          const width = 600;
          let pathD = '';
          if (displayPoints.length > 1) {
            const stepX = width / Math.max(1, maxPoints - 1);
            const startOffset = (maxPoints - displayPoints.length) * stepX;

            pathD = displayPoints.reduce((acc, pt, idx) => {
              const x = startOffset + idx * stepX;
              const val = sig.getValue(pt);
              // Si analogique (position 0 à 1), échelle continue, sinon niveau logique 0 ou 1
              const y = sig.isAnalog
                ? rowHeight - 4 - val * (rowHeight - 8)
                : val > 0.5 ? 4 : rowHeight - 4;
              return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, '');
          }

          return (
            <div key={sig.id} className="flex items-center gap-2 border-b border-slate-800/60 pb-1">
              <div className="w-36 flex items-center justify-between text-xs shrink-0 pr-2">
                <span className="font-semibold text-slate-300 truncate" title={sig.label}>
                  {sig.label}
                </span>
                <span
                  className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded"
                  style={{
                    color: sig.color,
                    backgroundColor: `${sig.color}15`,
                  }}
                >
                  {sig.isAnalog ? `${Math.round(currentVal * 100)}%` : currentVal > 0.5 ? '1' : '0'}
                </span>
              </div>

              {/* Surface d'onde temporelle */}
              <div className="flex-1 h-7 bg-slate-950/70 rounded border border-slate-800/80 relative overflow-hidden">
                <svg viewBox={`0 0 ${width} ${rowHeight}`} className="w-full h-full" preserveAspectRatio="none">
                  {/* Ligne repère 0 */}
                  <line x1="0" y1={rowHeight - 4} x2={width} y2={rowHeight - 4} stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
                  {/* Ligne repère 1 */}
                  <line x1="0" y1="4" x2={width} y2="4" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />

                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={sig.color}
                      strokeWidth={sig.isAnalog ? "2" : "2"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
