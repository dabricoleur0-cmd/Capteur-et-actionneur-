/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemState } from '../simulation/engine';
import { Wind, Gauge } from 'lucide-react';

interface PowerCircuitProps {
  state: SystemState;
  onTogglePneumatic?: () => void;
}

export const PowerCircuitView: React.FC<PowerCircuitProps> = ({
  state,
  onTogglePneumatic,
}) => {
  // Course totale vérin 1C en pixels : 110px (de x=0 à x=110)
  const stroke1C = 110;
  const piston1X = state.pos1C * stroke1C;

  // Course vérin 2C en pixels : 110px
  const stroke2C = 110;
  const piston2X = state.pos2C * stroke2C;

  const isPressurized = state.powerPneumatic;

  // Vérin 1C :
  // Case 14 : Chambre arrière sous pression (rouge), chambre avant à l'échappement (bleu)
  // Case 12 : Chambre avant sous pression (rouge), chambre arrière à l'échappement (bleu)
  const chamber1CRearPressurized = isPressurized && state.valve1DState === '14';
  const chamber1CFrontPressurized = isPressurized && state.valve1DState === '12';

  // Vérin 2C :
  // Case 12 : Chambre sous pression (rouge)
  // Case 0 : Chambre à l'échappement (bleu / ressort)
  const chamber2CPressurized = isPressurized && state.valve2DState === '12';

  return (
    <div className="bg-slate-900 border border-slate-750 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* En-tête du panneau */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Figure 1 : Circuit de Puissance Pneumatique
            </h2>
            <p className="text-xs text-slate-400">
              Vérins 1C (double effet) &amp; 2C (simple effet rappel ressort) + Distributeurs 1D &amp; 2D
            </p>
          </div>
        </div>

        {/* Contrôle de la source pneumatique */}
        <button
          onClick={onTogglePneumatic}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            state.powerPneumatic
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
          }`}
          title="Ouvrir ou fermer l'alimentation générale en air comprimé (P = 6 bar)"
        >
          <Gauge className="w-4 h-4" />
          <span>Air Comprimé : {state.powerPneumatic ? '6.0 bar (ON)' : '0.0 bar (OFF)'}</span>
        </button>
      </div>

      {/* Surface SVG interactive du schéma de puissance */}
      <div className="flex-1 min-h-[380px] relative overflow-hidden flex items-center justify-center p-1">
        <svg
          viewBox="0 0 740 390"
          className="w-full h-full max-h-[420px] select-none"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
        >
          <defs>
            <linearGradient id="cylinderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="pistonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="rodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            <linearGradient id="pressurizedAirGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="exhaustAirGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
            </linearGradient>

            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ============================================================== */}
          {/* VÉRIN 1C (DOUBLE EFFET)                                       */}
          {/* ============================================================== */}
          <g transform="translate(60, 10)">
            {/* Badge de titre avec fond opaque pour éviter toute superposition */}
            <rect x="0" y="2" width="160" height="20" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="80" y="16" className="fill-slate-200 text-xs font-bold" textAnchor="middle">
              1C (Vérin double effet)
            </text>

            {/* Capteurs de fin de course 1S0 et 1S1 */}
            {/* 1S0 (Position rentrée) */}
            <g transform="translate(16, 28)">
              <rect
                x="-14"
                y="0"
                width="28"
                height="15"
                rx="3"
                className={`transition-colors duration-200 stroke ${
                  state.sensor1S0
                    ? 'fill-emerald-500/20 stroke-emerald-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="1.5"
              />
              <circle
                cx="0"
                cy="7.5"
                r="3.5"
                className={`transition-all ${
                  state.sensor1S0 ? 'fill-emerald-400' : 'fill-slate-600'
                }`}
                filter={state.sensor1S0 ? 'url(#glowGreen)' : undefined}
              />
              <text x="0" y="-3" className={`text-[10px] font-bold ${state.sensor1S0 ? 'fill-emerald-400' : 'fill-slate-400'}`} textAnchor="middle">
                1S0 {state.sensor1S0 ? '(1)' : '(0)'}
              </text>
              <line x1="0" y1="15" x2="0" y2="22" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2,2" />
            </g>

            {/* 1S1 (Position sortie) */}
            <g transform="translate(134, 28)">
              <rect
                x="-14"
                y="0"
                width="28"
                height="15"
                rx="3"
                className={`transition-colors duration-200 stroke ${
                  state.sensor1S1
                    ? 'fill-emerald-500/20 stroke-emerald-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="1.5"
              />
              <circle
                cx="0"
                cy="7.5"
                r="3.5"
                className={`transition-all ${
                  state.sensor1S1 ? 'fill-emerald-400' : 'fill-slate-600'
                }`}
                filter={state.sensor1S1 ? 'url(#glowGreen)' : undefined}
              />
              <text x="0" y="-3" className={`text-[10px] font-bold ${state.sensor1S1 ? 'fill-emerald-400' : 'fill-slate-400'}`} textAnchor="middle">
                1S1 {state.sensor1S1 ? '(1)' : '(0)'}
              </text>
              <line x1="0" y1="15" x2="0" y2="22" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2,2" />
            </g>

            {/* Corps du vérin 1C (Cylindre) à y = 50 */}
            <rect
              x="0"
              y="50"
              width="150"
              height="44"
              rx="3"
              fill="url(#cylinderGrad)"
              stroke="#475569"
              strokeWidth="2"
            />

            {/* Chambre arrière (gauche) */}
            <rect
              x="2"
              y="52"
              width={Math.max(2, piston1X)}
              height="40"
              fill={chamber1CRearPressurized ? 'url(#pressurizedAirGrad)' : 'url(#exhaustAirGrad)'}
              className="transition-all duration-75"
            />

            {/* Chambre avant (droite) */}
            <rect
              x={2 + piston1X + 16}
              y="52"
              width={Math.max(2, 148 - (2 + piston1X + 16))}
              height="40"
              fill={chamber1CFrontPressurized ? 'url(#pressurizedAirGrad)' : 'url(#exhaustAirGrad)'}
              className="transition-all duration-75"
            />

            {/* Tige de vérin 1C */}
            <rect
              x={2 + piston1X + 16}
              y="68"
              width="95"
              height="10"
              rx="2"
              fill="url(#rodGrad)"
              stroke="#64748b"
              strokeWidth="1"
            />

            {/* Tête de piston avec aimant */}
            <rect
              x={2 + piston1X}
              y="53"
              width="16"
              height="38"
              rx="2"
              fill="url(#pistonGrad)"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />
            <rect
              x={2 + piston1X + 4}
              y="57"
              width="8"
              height="30"
              rx="1"
              fill="#fbbf24"
              opacity="0.9"
            />

            {/* Nez de tige */}
            <rect
              x={2 + piston1X + 16 + 92}
              y="65"
              width="12"
              height="16"
              rx="2"
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <circle cx={2 + piston1X + 16 + 98} cy="73" r="3" fill="#1e293b" />

            {/* Orifices d'alimentation vérin 1C à y = 94 */}
            <rect x="11" y="94" width="10" height="7" fill="#64748b" stroke="#334155" strokeWidth="1" />
            <rect x="129" y="94" width="10" height="7" fill="#64748b" stroke="#334155" strokeWidth="1" />
          </g>

          {/* ============================================================== */}
          {/* VÉRIN 2C (SIMPLE EFFET AVEC RESSORT)                           */}
          {/* ============================================================== */}
          <g transform="translate(470, 10)">
            <rect x="0" y="2" width="180" height="20" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="90" y="16" className="fill-slate-200 text-xs font-bold" textAnchor="middle">
              2C (Vérin simple effet à ressort)
            </text>

            {/* Capteur 2S1 (Position sortie vérin 2C) */}
            <g transform="translate(134, 28)">
              <rect
                x="-14"
                y="0"
                width="28"
                height="15"
                rx="3"
                className={`transition-colors duration-200 stroke ${
                  state.sensor2S1
                    ? 'fill-emerald-500/20 stroke-emerald-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="1.5"
              />
              <circle
                cx="0"
                cy="7.5"
                r="3.5"
                className={`transition-all ${
                  state.sensor2S1 ? 'fill-emerald-400' : 'fill-slate-600'
                }`}
                filter={state.sensor2S1 ? 'url(#glowGreen)' : undefined}
              />
              <text x="0" y="-3" className={`text-[10px] font-bold ${state.sensor2S1 ? 'fill-emerald-400' : 'fill-slate-400'}`} textAnchor="middle">
                2S1 {state.sensor2S1 ? '(1)' : '(0)'}
              </text>
              <line x1="0" y1="15" x2="0" y2="22" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2,2" />
            </g>

            {/* Corps du vérin 2C */}
            <rect
              x="0"
              y="50"
              width="150"
              height="44"
              rx="3"
              fill="url(#cylinderGrad)"
              stroke="#475569"
              strokeWidth="2"
            />

            {/* Chambre arrière */}
            <rect
              x="2"
              y="52"
              width={Math.max(2, piston2X)}
              height="40"
              fill={chamber2CPressurized ? 'url(#pressurizedAirGrad)' : 'url(#exhaustAirGrad)'}
              className="transition-all duration-75"
            />

            {/* Ressort de rappel dans la chambre avant */}
            <g>
              {(() => {
                const springStartX = 2 + piston2X + 16;
                const springEndX = 146;
                const springLength = Math.max(10, springEndX - springStartX);
                const coils = 6;
                const dx = springLength / (coils * 2);
                let pathStr = `M ${springStartX} 72`;
                for (let i = 0; i < coils; i++) {
                  pathStr += ` L ${springStartX + (2 * i + 0.5) * dx} 58 L ${springStartX + (2 * i + 1.5) * dx} 86`;
                }
                pathStr += ` L ${springEndX} 72`;
                return (
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })()}
            </g>

            {/* Tige de vérin 2C */}
            <rect
              x={2 + piston2X + 16}
              y="68"
              width="95"
              height="10"
              rx="2"
              fill="url(#rodGrad)"
              stroke="#64748b"
              strokeWidth="1"
            />

            {/* Piston 2C */}
            <rect
              x={2 + piston2X}
              y="53"
              width="16"
              height="38"
              rx="2"
              fill="url(#pistonGrad)"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />
            <rect
              x={2 + piston2X + 4}
              y="57"
              width="8"
              height="30"
              rx="1"
              fill="#fbbf24"
              opacity="0.9"
            />

            {/* Nez de tige 2C */}
            <rect
              x={2 + piston2X + 16 + 92}
              y="65"
              width="12"
              height="16"
              rx="2"
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <circle cx={2 + piston2X + 16 + 98} cy="73" r="3" fill="#1e293b" />

            {/* Orifice arrière d'alimentation vérin 2C */}
            <rect x="11" y="94" width="10" height="7" fill="#64748b" stroke="#334155" strokeWidth="1" />
            <circle cx="138" cy="94" r="3" fill="#475569" />
          </g>

          {/* ============================================================== */}
          {/* DISTRIBUTEUR 1D (5/2 BISTABLE)                                 */}
          {/* ============================================================== */}
          <g transform="translate(60, 185)">
            {/* Badge de titre placé entre les deux conduites verticales */}
            <rect x="36" y="-24" width="148" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="110" y="-11" className="fill-cyan-300 text-[11px] font-bold" textAnchor="middle">
              1D (Distributeur 5/2 bistable)
            </text>

            {/* Solénoïde gauche YV14.1 */}
            <g transform="translate(-32, 0)">
              <rect
                x="0"
                y="0"
                width="32"
                height="46"
                rx="3"
                className={`transition-colors duration-150 stroke ${
                  state.coilYV14_1
                    ? 'fill-amber-500/25 stroke-amber-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="1.5"
              />
              <line x1="0" y1="0" x2="32" y2="46" stroke={state.coilYV14_1 ? '#f59e0b' : '#64748b'} strokeWidth="1.5" />
              <text x="16" y="27" className={`text-[9px] font-extrabold ${state.coilYV14_1 ? 'fill-amber-300' : 'fill-slate-400'}`} textAnchor="middle">
                YV14.1
              </text>
              <text x="16" y="58" className={`text-[9px] font-bold ${state.coilYV14_1 ? 'fill-amber-400' : 'fill-slate-500'}`} textAnchor="middle">
                {state.coilYV14_1 ? 'EXCITÉE' : 'repos'}
              </text>
            </g>

            {/* Solénoïde droit YV12.0 */}
            <g transform="translate(150, 0)">
              <rect
                x="0"
                y="0"
                width="32"
                height="46"
                rx="3"
                className={`transition-colors duration-150 stroke ${
                  state.coilYV12_0
                    ? 'fill-amber-500/25 stroke-amber-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="1.5"
              />
              <line x1="0" y1="46" x2="32" y2="0" stroke={state.coilYV12_0 ? '#f59e0b' : '#64748b'} strokeWidth="1.5" />
              <text x="16" y="27" className={`text-[9px] font-extrabold ${state.coilYV12_0 ? 'fill-amber-300' : 'fill-slate-400'}`} textAnchor="middle">
                YV12.0
              </text>
              <text x="16" y="58" className={`text-[9px] font-bold ${state.coilYV12_0 ? 'fill-amber-400' : 'fill-slate-500'}`} textAnchor="middle">
                {state.coilYV12_0 ? 'EXCITÉE' : 'repos'}
              </text>
            </g>

            {/* Case 14 (gauche, sortie 1C) : 1->4, 2->3 */}
            <rect
              x="0"
              y="0"
              width="75"
              height="46"
              className={`transition-all duration-200 stroke ${
                state.valve1DState === '14'
                  ? 'fill-slate-800 stroke-cyan-400 stroke-[2px]'
                  : 'fill-slate-850 stroke-slate-700 opacity-60'
              }`}
            />
            <g opacity={state.valve1DState === '14' ? 1 : 0.6}>
              <line x1="37" y1="38" x2="16" y2="8" stroke={state.valve1DState === '14' && isPressurized ? '#ef4444' : '#94a3b8'} strokeWidth="2" />
              <polygon points="13,14 16,7 22,11" fill={state.valve1DState === '14' && isPressurized ? '#ef4444' : '#94a3b8'} />
              <line x1="56" y1="8" x2="56" y2="38" stroke="#38bdf8" strokeWidth="2" />
              <polygon points="52,32 56,39 60,32" fill="#38bdf8" />
            </g>

            {/* Case 12 (droite, rentrée 1C) : 1->2, 4->5 */}
            <rect
              x="75"
              y="0"
              width="75"
              height="46"
              className={`transition-all duration-200 stroke ${
                state.valve1DState === '12'
                  ? 'fill-slate-800 stroke-cyan-400 stroke-[2px]'
                  : 'fill-slate-850 stroke-slate-700 opacity-60'
              }`}
            />
            <g opacity={state.valve1DState === '12' ? 1 : 0.6}>
              <line x1="112" y1="38" x2="134" y2="8" stroke={state.valve1DState === '12' && isPressurized ? '#ef4444' : '#94a3b8'} strokeWidth="2" />
              <polygon points="128,12 135,7 137,15" fill={state.valve1DState === '12' && isPressurized ? '#ef4444' : '#94a3b8'} />
              <line x1="93" y1="8" x2="93" y2="38" stroke="#38bdf8" strokeWidth="2" />
              <polygon points="89,32 93,39 97,32" fill="#38bdf8" />
            </g>

            {/* Orifices ISO */}
            <text x="16" y="-4" className="fill-slate-300 text-[10px] font-bold" textAnchor="middle">4</text>
            <text x="134" y="-4" className="fill-slate-300 text-[10px] font-bold" textAnchor="middle">2</text>
            <text x="75" y="58" className="fill-slate-300 text-[10px] font-bold" textAnchor="middle">1 (P)</text>
            <text x="37" y="58" className="fill-slate-400 text-[9px]" textAnchor="middle">5 (éch)</text>
            <text x="112" y="58" className="fill-slate-400 text-[9px]" textAnchor="middle">3 (éch)</text>

            <polygon points="33,62 41,62 37,68" fill="#64748b" />
            <polygon points="108,62 116,62 112,68" fill="#64748b" />
          </g>

          {/* Tuyauteries directes entre distributeur 1D et vérin 1C (ne traversent aucun texte) */}
          {/* Ligne 4 -> Chambre arrière vérin 1C */}
          <line
            x1="76"
            y1="185"
            x2="76"
            y2="101"
            stroke={chamber1CRearPressurized ? '#ef4444' : '#38bdf8'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Ligne 2 -> Chambre avant vérin 1C */}
          <line
            x1="194"
            y1="185"
            x2="194"
            y2="101"
            stroke={chamber1CFrontPressurized ? '#ef4444' : '#38bdf8'}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* ============================================================== */}
          {/* DISTRIBUTEUR 2D (3/2 MONOSTABLE AVEC RESSORT)                  */}
          {/* ============================================================== */}
          <g transform="translate(480, 185)">
            <rect x="0" y="-24" width="155" height="18" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="78" y="-11" className="fill-cyan-300 text-[11px] font-bold" textAnchor="middle">
              2D (Distributeur 3/2 monostable)
            </text>

            {/* Solénoïde gauche YV12.1 */}
            <g transform="translate(-32, 0)">
              <rect
                x="0"
                y="0"
                width="32"
                height="46"
                rx="3"
                className={`transition-colors duration-150 stroke ${
                  state.coilYV12_1
                    ? 'fill-amber-500/25 stroke-amber-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="1.5"
              />
              <line x1="0" y1="0" x2="32" y2="46" stroke={state.coilYV12_1 ? '#f59e0b' : '#64748b'} strokeWidth="1.5" />
              <text x="16" y="27" className={`text-[9px] font-extrabold ${state.coilYV12_1 ? 'fill-amber-300' : 'fill-slate-400'}`} textAnchor="middle">
                YV12.1
              </text>
              <text x="16" y="58" className={`text-[9px] font-bold ${state.coilYV12_1 ? 'fill-amber-400' : 'fill-slate-500'}`} textAnchor="middle">
                {state.coilYV12_1 ? 'EXCITÉE' : 'repos'}
              </text>
            </g>

            {/* Ressort de rappel mécanique */}
            <g transform="translate(120, 0)">
              <path
                d="M 2 23 L 6 12 L 14 34 L 22 12 L 30 34 L 34 23"
                fill="none"
                stroke={state.valve2DState === '0' ? '#38bdf8' : '#94a3b8'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="18" y="58" className="fill-slate-400 text-[9px] font-medium" textAnchor="middle">
                Ressort
              </text>
            </g>

            {/* Case activée (gauche) : 1 -> 2 */}
            <rect
              x="0"
              y="0"
              width="60"
              height="46"
              className={`transition-all duration-200 stroke ${
                state.valve2DState === '12'
                  ? 'fill-slate-800 stroke-cyan-400 stroke-[2px]'
                  : 'fill-slate-850 stroke-slate-700 opacity-60'
              }`}
            />
            <g opacity={state.valve2DState === '12' ? 1 : 0.6}>
              <line x1="18" y1="38" x2="42" y2="8" stroke={state.valve2DState === '12' && isPressurized ? '#ef4444' : '#94a3b8'} strokeWidth="2" />
              <polygon points="36,12 42,7 44,15" fill={state.valve2DState === '12' && isPressurized ? '#ef4444' : '#94a3b8'} />
            </g>

            {/* Case repos (droite) : 2 -> 3 */}
            <rect
              x="60"
              y="0"
              width="60"
              height="46"
              className={`transition-all duration-200 stroke ${
                state.valve2DState === '0'
                  ? 'fill-slate-800 stroke-cyan-400 stroke-[2px]'
                  : 'fill-slate-850 stroke-slate-700 opacity-60'
              }`}
            />
            <g opacity={state.valve2DState === '0' ? 1 : 0.6}>
              <line x1="78" y1="8" x2="78" y2="38" stroke="#38bdf8" strokeWidth="2" />
              <polygon points="74,32 78,39 82,32" fill="#38bdf8" />
              <line x1="94" y1="38" x2="106" y2="38" stroke="#94a3b8" strokeWidth="2" />
              <line x1="100" y1="38" x2="100" y2="30" stroke="#94a3b8" strokeWidth="2" />
            </g>

            {/* Orifices 2D */}
            <text x="42" y="-4" className="fill-slate-300 text-[10px] font-bold" textAnchor="middle">2</text>
            <text x="18" y="58" className="fill-slate-300 text-[10px] font-bold" textAnchor="middle">1 (P)</text>
            <text x="78" y="58" className="fill-slate-400 text-[9px]" textAnchor="middle">3 (éch)</text>

            <polygon points="74,62 82,62 78,68" fill="#64748b" />
          </g>

          {/* Tuyauterie 2D (orifice 2) vers vérin 2C (orifice arrière) */}
          <path
            d="M 522 185 L 522 140 L 481 140 L 481 101"
            fill="none"
            stroke={chamber2CPressurized ? '#ef4444' : '#38bdf8'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ============================================================== */}
          {/* LIGNE PRINCIPALE D'AIR COMPRIMÉ (COLLECTEUR 1 - 6 BAR)         */}
          {/* ============================================================== */}
          <g transform="translate(0, 310)">
            <line
              x1="70"
              y1="0"
              x2="680"
              y2="0"
              stroke={isPressurized ? '#ef4444' : '#64748b'}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Piquage vers 1D (port 1) */}
            <line
              x1="135"
              y1="0"
              x2="135"
              y2="-79"
              stroke={isPressurized ? '#ef4444' : '#64748b'}
              strokeWidth="3"
            />
            <circle cx="135" cy="0" r="4" fill={isPressurized ? '#ef4444' : '#64748b'} />

            {/* Piquage vers 2D (port 1) */}
            <line
              x1="498"
              y1="0"
              x2="498"
              y2="-79"
              stroke={isPressurized ? '#ef4444' : '#64748b'}
              strokeWidth="3"
            />
            <circle cx="498" cy="0" r="4" fill={isPressurized ? '#ef4444' : '#64748b'} />

            {/* Source d'alimentation avec triangle compresseur */}
            <g transform="translate(70, 0)">
              <polygon
                points="-16,-10 0,0 -16,10"
                fill={isPressurized ? '#ef4444' : '#64748b'}
                stroke="#1e293b"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="0" r="3.5" fill="#f8fafc" />
              <text x="-20" y="4" className={`text-[10px] font-black ${isPressurized ? 'fill-red-400' : 'fill-slate-500'}`} textAnchor="end">
                P (6 bar)
              </text>
            </g>
          </g>

          {/* Légende en bas */}
          <g transform="translate(60, 355)">
            <circle cx="8" cy="8" r="5" fill="#ef4444" />
            <text x="20" y="12" className="fill-slate-300 text-[11px] font-medium">Pression d'air comprimé (6 bars)</text>

            <circle cx="240" cy="8" r="5" fill="#38bdf8" />
            <text x="252" y="12" className="fill-slate-300 text-[11px] font-medium">Échappement / Pression atmosphérique</text>

            <circle cx="490" cy="8" r="5" fill="#10b981" />
            <text x="502" y="12" className="fill-slate-300 text-[11px] font-medium">Capteur activé (1S0, 1S1, 2S1)</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
