/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemState } from '../simulation/engine';
import { Zap, Power } from 'lucide-react';

interface ControlCircuitProps {
  state: SystemState;
  onPressS1: () => void;
  onReleaseS1: () => void;
  onToggleElectric?: () => void;
}

export const ControlCircuitView: React.FC<ControlCircuitProps> = ({
  state,
  onPressS1,
  onReleaseS1,
  onToggleElectric,
}) => {
  const isPowered = state.powerElectric;

  // Calcul des états des segments pour l'animation du courant électrique
  // Branche 1 : S1 + 1S0 (NO) -> YV14.1
  const b1_after_S1 = isPowered && state.buttonS1;
  const b1_after_1S0 = b1_after_S1 && state.sensor1S0; // courant dans YV14.1

  // Branche 2 : (1S1 // KA1) -> après noeud // -> 1S0 (NF) -> KA1
  const b2_branch_1S1 = isPowered && state.sensor1S1;
  const b2_branch_KA1 = isPowered && state.relayKA1;
  const b2_after_parallel = b2_branch_1S1 || b2_branch_KA1;
  // Contact NF de 1S0 : passant si 1S0 est 0 (inactif)
  const contactNF1S0_ferme = !state.sensor1S0;
  const b2_after_1S0_NF = b2_after_parallel && contactNF1S0_ferme; // courant dans KA1 (A1-A2)

  // Branche 3 : KA1 (NO) -> YV12.1
  const b3_after_KA1 = isPowered && state.relayKA1;

  // Branche 4 : 2S1 (NO) -> YV12.0
  const b4_after_2S1 = isPowered && state.sensor2S1;

  // Couleurs électriques
  const activeColor = '#f59e0b'; // Jaune ambré vif électrique
  const inactiveColor = '#475569'; // Gris ardoise éteint

  return (
    <div className="bg-slate-900 border border-slate-750 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              Figure 2 : Circuit de Commande Électrique (Ladder)
            </h2>
            <p className="text-xs text-slate-400">
              Schéma à relais : Bouton S1, contacts fins de course, auto-maintien KA1 &amp; bobines YV
            </p>
          </div>
        </div>

        {/* Bouton d'alimentation électrique */}
        <button
          onClick={onToggleElectric}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isPowered
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
          }`}
          title="Mettre sous tension ou couper la commande électrique L1-N"
        >
          <Power className="w-4 h-4" />
          <span>Tension L1-N : {isPowered ? '24V DC (ON)' : '0V (OFF)'}</span>
        </button>
      </div>

      {/* Surface SVG interactive du circuit de commande */}
      <div className="flex-1 min-h-[360px] relative overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox="0 0 740 370"
          className="w-full h-full max-h-[380px] select-none"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
        >
          <defs>
            <filter id="glowElectric" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <style>
              {`
                @keyframes dashElectric {
                  to {
                    stroke-dashoffset: -20;
                  }
                }
                .flowing-wire {
                  stroke-dasharray: 6, 4;
                  animation: dashElectric 0.5s linear infinite;
                }
              `}
            </style>
          </defs>

          {/* ============================================================== */}
          {/* LIGNES PRINCIPALES DE POLARITÉ : L1 (HAUT) ET N (BAS)          */}
          {/* ============================================================== */}
          {/* Ligne L1 (+24V ou Phase) */}
          <g>
            <line
              x1="50"
              y1="35"
              x2="690"
              y2="35"
              stroke={isPowered ? activeColor : inactiveColor}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text x="35" y="39" className={`text-sm font-black ${isPowered ? 'fill-amber-400' : 'fill-slate-500'}`} textAnchor="middle">
              L1
            </text>
            {isPowered && (
              <text x="35" y="54" className="fill-amber-500/80 text-[10px] font-bold" textAnchor="middle">
                (+24V)
              </text>
            )}
          </g>

          {/* Ligne N (0V ou Neutre) */}
          <g>
            <line
              x1="50"
              y1="325"
              x2="690"
              y2="325"
              stroke="#64748b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text x="35" y="329" className="text-sm font-black fill-slate-300" textAnchor="middle">
              N
            </text>
            <text x="35" y="344" className="fill-slate-500 text-[10px] font-bold" textAnchor="middle">
              (0V)
            </text>
          </g>

          {/* ============================================================== */}
          {/* BRANCHE 1 : S1 + 1S0 (NO) -> YV14.1 (x = 100)                  */}
          {/* ============================================================== */}
          <g transform="translate(100, 0)">
            {/* Ligne de L1 au bouton S1 */}
            <line
              x1="0"
              y1="35"
              x2="0"
              y2="75"
              stroke={isPowered ? activeColor : inactiveColor}
              strokeWidth="2.5"
              className={isPowered ? 'flowing-wire' : ''}
            />

            {/* Bouton poussoir S1 (interactif avec clic) */}
            <g
              className="cursor-pointer group"
              onMouseDown={onPressS1}
              onMouseUp={onReleaseS1}
              onTouchStart={onPressS1}
              onTouchEnd={onReleaseS1}
            >
              <rect x="-30" y="65" width="60" height="45" fill="transparent" />
              
              <circle cx="0" cy="75" r="3.5" fill={isPowered ? activeColor : inactiveColor} />
              <circle cx="0" cy="110" r="3.5" fill={b1_after_S1 ? activeColor : inactiveColor} />

              {state.buttonS1 ? (
                <line x1="0" y1="75" x2="0" y2="110" stroke={activeColor} strokeWidth="3" filter="url(#glowElectric)" />
              ) : (
                <line x1="0" y1="75" x2="14" y2="95" stroke={inactiveColor} strokeWidth="2.5" />
              )}
              <line
                x1={state.buttonS1 ? '-6' : '8'}
                y1={state.buttonS1 ? '92' : '82'}
                x2={state.buttonS1 ? '6' : '20'}
                y2={state.buttonS1 ? '92' : '82'}
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <text x="-12" y="94" className="fill-slate-200 text-xs font-bold group-hover:fill-amber-300" textAnchor="end">
                S1
              </text>
            </g>

            {/* Liaison entre S1 et 1S0 */}
            <line
              x1="0"
              y1="110"
              x2="0"
              y2="145"
              stroke={b1_after_S1 ? activeColor : inactiveColor}
              strokeWidth="2.5"
              className={b1_after_S1 ? 'flowing-wire' : ''}
            />

            {/* Contact NO de 1S0 (vérin rentré) */}
            <g>
              <circle cx="0" cy="145" r="3.5" fill={b1_after_S1 ? activeColor : inactiveColor} />
              <circle cx="0" cy="180" r="3.5" fill={b1_after_1S0 ? activeColor : inactiveColor} />

              {state.sensor1S0 ? (
                <line x1="0" y1="145" x2="0" y2="180" stroke={b1_after_S1 ? activeColor : '#10b981'} strokeWidth="3" />
              ) : (
                <line x1="0" y1="145" x2="14" y2="165" stroke={inactiveColor} strokeWidth="2.5" />
              )}
              <circle cx={state.sensor1S0 ? '6' : '16'} cy={state.sensor1S0 ? '162' : '155'} r="2.5" fill="#10b981" />
              <text x="-12" y="165" className={`text-xs font-bold ${state.sensor1S0 ? 'fill-emerald-400' : 'fill-slate-400'}`} textAnchor="end">
                1S0
              </text>
              <text x="18" y="165" className="fill-slate-400 text-[9px]">
                {state.sensor1S0 ? '(act.)' : '(ouv.)'}
              </text>
            </g>

            {/* Liaison vers bobine YV14.1 */}
            <line
              x1="0"
              y1="180"
              x2="0"
              y2="230"
              stroke={b1_after_1S0 ? activeColor : inactiveColor}
              strokeWidth="2.5"
              className={b1_after_1S0 ? 'flowing-wire' : ''}
            />

            {/* Bobine YV14.1 */}
            <g transform="translate(-18, 230)">
              <rect
                x="0"
                y="0"
                width="36"
                height="32"
                rx="2"
                className={`transition-colors stroke ${
                  state.coilYV14_1
                    ? 'fill-amber-500/30 stroke-amber-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="2"
                filter={state.coilYV14_1 ? 'url(#glowElectric)' : undefined}
              />
              <line x1="0" y1="0" x2="36" y2="32" stroke={state.coilYV14_1 ? activeColor : '#64748b'} strokeWidth="1.5" />
              <text x="18" y="-6" className={`text-xs font-bold ${state.coilYV14_1 ? 'fill-amber-300' : 'fill-slate-300'}`} textAnchor="middle">
                YV14.1
              </text>
              <text x="18" y="44" className="fill-slate-400 text-[9px]" textAnchor="middle">
                (Électrovanne)
              </text>
            </g>

            {/* Liaison vers rail N */}
            <line
              x1="0"
              y1="262"
              x2="0"
              y2="325"
              stroke={b1_after_1S0 ? activeColor : '#64748b'}
              strokeWidth="2.5"
            />
          </g>

          {/* ============================================================== */}
          {/* BRANCHE 2 : (1S1 // KA1) + 1S0 (NF) -> Bobine KA1 (x = 280)    */}
          {/* ============================================================== */}
          <g transform="translate(280, 0)">
            <line
              x1="0"
              y1="35"
              x2="0"
              y2="55"
              stroke={isPowered ? activeColor : inactiveColor}
              strokeWidth="2.5"
            />
            <circle cx="0" cy="55" r="3.5" fill={isPowered ? activeColor : inactiveColor} />

            {/* Dérivation gauche : contact NO 1S1 (x = -35) */}
            <line x1="0" y1="55" x2="-35" y2="55" stroke={isPowered ? activeColor : inactiveColor} strokeWidth="2.5" />
            <line x1="-35" y1="55" x2="-35" y2="75" stroke={isPowered ? activeColor : inactiveColor} strokeWidth="2.5" />
            <circle cx="-35" cy="75" r="3" fill={isPowered ? activeColor : inactiveColor} />
            <circle cx="-35" cy="110" r="3" fill={b2_branch_1S1 ? activeColor : inactiveColor} />

            {state.sensor1S1 ? (
              <line x1="-35" y1="75" x2="-35" y2="110" stroke={activeColor} strokeWidth="3" />
            ) : (
              <line x1="-35" y1="75" x2="-21" y2="95" stroke={inactiveColor} strokeWidth="2.5" />
            )}
            <text x="-43" y="95" className={`text-xs font-bold ${state.sensor1S1 ? 'fill-emerald-400' : 'fill-slate-400'}`} textAnchor="end">
              1S1
            </text>

            <line x1="-35" y1="110" x2="-35" y2="130" stroke={b2_branch_1S1 ? activeColor : inactiveColor} strokeWidth="2.5" />
            <line x1="-35" y1="130" x2="0" y2="130" stroke={b2_branch_1S1 ? activeColor : inactiveColor} strokeWidth="2.5" />

            {/* Dérivation droite : contact NO KA1 (auto-maintien, x = +35) */}
            <line x1="0" y1="55" x2="35" y2="55" stroke={isPowered ? activeColor : inactiveColor} strokeWidth="2.5" />
            <line x1="35" y1="55" x2="35" y2="75" stroke={isPowered ? activeColor : inactiveColor} strokeWidth="2.5" />
            <circle cx="35" cy="75" r="3" fill={isPowered ? activeColor : inactiveColor} />
            <circle cx="35" cy="110" r="3" fill={b2_branch_KA1 ? activeColor : inactiveColor} />

            {state.relayKA1 ? (
              <line x1="35" y1="75" x2="35" y2="110" stroke={activeColor} strokeWidth="3" />
            ) : (
              <line x1="35" y1="75" x2="49" y2="95" stroke={inactiveColor} strokeWidth="2.5" />
            )}
            <text x="45" y="95" className={`text-xs font-bold ${state.relayKA1 ? 'fill-amber-400' : 'fill-slate-400'}`} textAnchor="start">
              KA1
            </text>

            <line x1="35" y1="110" x2="35" y2="130" stroke={b2_branch_KA1 ? activeColor : inactiveColor} strokeWidth="2.5" />
            <line x1="35" y1="130" x2="0" y2="130" stroke={b2_branch_KA1 ? activeColor : inactiveColor} strokeWidth="2.5" />

            {/* Noeud inférieur */}
            <circle cx="0" cy="130" r="3.5" fill={b2_after_parallel ? activeColor : inactiveColor} />

            <line
              x1="0"
              y1="130"
              x2="0"
              y2="145"
              stroke={b2_after_parallel ? activeColor : inactiveColor}
              strokeWidth="2.5"
            />

            {/* Contact NORMALEMENT FERMÉ (NF) de 1S0 */}
            <g>
              <circle cx="0" cy="145" r="3.5" fill={b2_after_parallel ? activeColor : inactiveColor} />
              <circle cx="0" cy="180" r="3.5" fill={b2_after_1S0_NF ? activeColor : inactiveColor} />

              {contactNF1S0_ferme ? (
                <g>
                  <line x1="0" y1="145" x2="0" y2="180" stroke={b2_after_parallel ? activeColor : '#10b981'} strokeWidth="3" />
                  <line x1="-5" y1="150" x2="5" y2="150" stroke={b2_after_parallel ? activeColor : '#10b981'} strokeWidth="2" />
                </g>
              ) : (
                <g>
                  <line x1="0" y1="145" x2="14" y2="165" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3,2" />
                  <line x1="11" y1="162" x2="17" y2="168" stroke="#ef4444" strokeWidth="2" />
                </g>
              )}
              <text x="-14" y="165" className={`text-xs font-bold ${contactNF1S0_ferme ? 'fill-slate-300' : 'fill-rose-400'}`} textAnchor="end">
                1S0
              </text>
              <text x="24" y="165" className={`text-[10px] font-semibold ${contactNF1S0_ferme ? 'fill-emerald-400' : 'fill-rose-400'}`}>
                {contactNF1S0_ferme ? '(NF fermé)' : '(NF OUVERT)'}
              </text>
            </g>

            {/* Liaison vers bobine relais KA1 */}
            <line
              x1="0"
              y1="180"
              x2="0"
              y2="230"
              stroke={b2_after_1S0_NF ? activeColor : inactiveColor}
              strokeWidth="2.5"
              className={b2_after_1S0_NF ? 'flowing-wire' : ''}
            />

            {/* Bobine Relais KA1 */}
            <g transform="translate(-20, 230)">
              <rect
                x="0"
                y="0"
                width="40"
                height="32"
                rx="2"
                className={`transition-colors stroke ${
                  state.relayKA1
                    ? 'fill-cyan-500/30 stroke-cyan-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="2"
                filter={state.relayKA1 ? 'url(#glowElectric)' : undefined}
              />
              <text x="20" y="20" className={`text-xs font-black ${state.relayKA1 ? 'fill-cyan-300' : 'fill-slate-300'}`} textAnchor="middle">
                KA1
              </text>
              <text x="-6" y="8" className="fill-slate-400 text-[8px]" textAnchor="end">A1</text>
              <text x="-6" y="28" className="fill-slate-400 text-[8px]" textAnchor="end">A2</text>

              <text x="20" y="-6" className={`text-xs font-bold ${state.relayKA1 ? 'fill-cyan-300' : 'fill-slate-300'}`} textAnchor="middle">
                KA1
              </text>
              <text x="20" y="44" className="fill-slate-400 text-[9px]" textAnchor="middle">
                (Relais)
              </text>
            </g>

            <line
              x1="0"
              y1="262"
              x2="0"
              y2="325"
              stroke={b2_after_1S0_NF ? activeColor : '#64748b'}
              strokeWidth="2.5"
            />
          </g>

          {/* ============================================================== */}
          {/* BRANCHE 3 : KA1 (NO) -> YV12.1 (x = 460)                       */}
          {/* ============================================================== */}
          <g transform="translate(460, 0)">
            <line
              x1="0"
              y1="35"
              x2="0"
              y2="145"
              stroke={isPowered ? activeColor : inactiveColor}
              strokeWidth="2.5"
            />

            {/* Contact NO KA1 */}
            <g>
              <circle cx="0" cy="145" r="3.5" fill={isPowered ? activeColor : inactiveColor} />
              <circle cx="0" cy="180" r="3.5" fill={b3_after_KA1 ? activeColor : inactiveColor} />

              {state.relayKA1 ? (
                <line x1="0" y1="145" x2="0" y2="180" stroke={activeColor} strokeWidth="3" />
              ) : (
                <line x1="0" y1="145" x2="14" y2="165" stroke={inactiveColor} strokeWidth="2.5" />
              )}
              <text x="-12" y="165" className={`text-xs font-bold ${state.relayKA1 ? 'fill-cyan-400' : 'fill-slate-400'}`} textAnchor="end">
                KA1
              </text>
              <text x="18" y="165" className="fill-slate-400 text-[9px]">
                {state.relayKA1 ? '(fermé)' : '(ouvert)'}
              </text>
            </g>

            <line
              x1="0"
              y1="180"
              x2="0"
              y2="230"
              stroke={b3_after_KA1 ? activeColor : inactiveColor}
              strokeWidth="2.5"
              className={b3_after_KA1 ? 'flowing-wire' : ''}
            />

            {/* Bobine YV12.1 */}
            <g transform="translate(-18, 230)">
              <rect
                x="0"
                y="0"
                width="36"
                height="32"
                rx="2"
                className={`transition-colors stroke ${
                  state.coilYV12_1
                    ? 'fill-amber-500/30 stroke-amber-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="2"
                filter={state.coilYV12_1 ? 'url(#glowElectric)' : undefined}
              />
              <line x1="0" y1="0" x2="36" y2="32" stroke={state.coilYV12_1 ? activeColor : '#64748b'} strokeWidth="1.5" />
              <text x="18" y="-6" className={`text-xs font-bold ${state.coilYV12_1 ? 'fill-amber-300' : 'fill-slate-300'}`} textAnchor="middle">
                YV12.1
              </text>
            </g>

            <line
              x1="0"
              y1="262"
              x2="0"
              y2="325"
              stroke={b3_after_KA1 ? activeColor : '#64748b'}
              strokeWidth="2.5"
            />
          </g>

          {/* ============================================================== */}
          {/* BRANCHE 4 : 2S1 (NO) -> YV12.0 (x = 620)                       */}
          {/* ============================================================== */}
          <g transform="translate(620, 0)">
            <line
              x1="0"
              y1="35"
              x2="0"
              y2="145"
              stroke={isPowered ? activeColor : inactiveColor}
              strokeWidth="2.5"
            />

            {/* Contact NO de 2S1 */}
            <g>
              <circle cx="0" cy="145" r="3.5" fill={isPowered ? activeColor : inactiveColor} />
              <circle cx="0" cy="180" r="3.5" fill={b4_after_2S1 ? activeColor : inactiveColor} />

              {state.sensor2S1 ? (
                <line x1="0" y1="145" x2="0" y2="180" stroke={activeColor} strokeWidth="3" />
              ) : (
                <line x1="0" y1="145" x2="14" y2="165" stroke={inactiveColor} strokeWidth="2.5" />
              )}
              <circle cx={state.sensor2S1 ? '6' : '16'} cy={state.sensor2S1 ? '162' : '155'} r="2.5" fill="#10b981" />
              <text x="-12" y="165" className={`text-xs font-bold ${state.sensor2S1 ? 'fill-emerald-400' : 'fill-slate-400'}`} textAnchor="end">
                2S1
              </text>
              <text x="18" y="165" className="fill-slate-400 text-[9px]">
                {state.sensor2S1 ? '(act.)' : '(ouv.)'}
              </text>
            </g>

            <line
              x1="0"
              y1="180"
              x2="0"
              y2="230"
              stroke={b4_after_2S1 ? activeColor : inactiveColor}
              strokeWidth="2.5"
              className={b4_after_2S1 ? 'flowing-wire' : ''}
            />

            {/* Bobine YV12.0 */}
            <g transform="translate(-18, 230)">
              <rect
                x="0"
                y="0"
                width="36"
                height="32"
                rx="2"
                className={`transition-colors stroke ${
                  state.coilYV12_0
                    ? 'fill-amber-500/30 stroke-amber-400'
                    : 'fill-slate-800 stroke-slate-600'
                }`}
                strokeWidth="2"
                filter={state.coilYV12_0 ? 'url(#glowElectric)' : undefined}
              />
              <line x1="0" y1="0" x2="36" y2="32" stroke={state.coilYV12_0 ? activeColor : '#64748b'} strokeWidth="1.5" />
              <text x="18" y="-6" className={`text-xs font-bold ${state.coilYV12_0 ? 'fill-amber-300' : 'fill-slate-300'}`} textAnchor="middle">
                YV12.0
              </text>
            </g>

            <line
              x1="0"
              y1="262"
              x2="0"
              y2="325"
              stroke={b4_after_2S1 ? activeColor : '#64748b'}
              strokeWidth="2.5"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
