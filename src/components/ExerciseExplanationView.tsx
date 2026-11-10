/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, ChevronRight, BookOpen, Layers, Lightbulb, Play } from 'lucide-react';
import { SystemState } from '../simulation/engine';

interface ExerciseExplanationProps {
  state: SystemState;
  onSetStep?: (phaseIndex: number) => void;
}

export const ExerciseExplanationView: React.FC<ExerciseExplanationProps> = ({
  state,
  onSetStep,
}) => {
  const [activeTab, setActiveTab] = useState<'a' | 'b' | 'grafcet'>('a');
  const [selectedStep, setSelectedStep] = useState<number>(0);

  const stepsDetails = [
    {
      title: 'Étape 0 : Position initiale / Repos',
      subtitle: 'Alimentation sous tension, avant appui sur S1',
      details: [
        'Énergie pneumatique (6 bars) et électrique (L1-N) activées.',
        '1C est rentré : capteur 1S0 est actionné (état 1). Le contact NO 1S0 (branche 1) est fermé, et le contact NF 1S0 (branche 2) est ouvert !',
        '2C est rentré par son ressort : capteur 2S1 inactif (état 0).',
        'Le bouton S1 est au repos (ouvert). Aucune bobine n\'est alimentée.',
      ],
      tags: ['1S0 = 1', '1S1 = 0', '2S1 = 0', 'KA1 = 0'],
    },
    {
      title: 'Étape 1 : Impulsion sur S1 -> Sortie de 1C (1C+)',
      subtitle: 'Branche 1 conductrice, basculement de 1D',
      details: [
        'L\'opérateur appuie sur le bouton S1 (contact S1 fermé).',
        'Comme 1C est rentré (1S0 = 1), le contact NO 1S0 est fermé : la branche 1 conduit le courant.',
        'La bobine YV14.1 est excitée et pilote le distributeur 5/2 bistable 1D.',
        '1D commute en case 14 (orifice 1 relié à 4, orifice 2 à 3 échappement).',
        'L\'air comprimé entre dans la chambre arrière de 1C : la tige de 1C sort vers l\'avant.',
        'Dès que 1C quitte sa position arrière, 1S0 retombe à 0 (le contact NF 1S0 en branche 2 se referme, préparant l\'étape suivante).',
        'Distributeur 1D étant BISTABLE, il garde sa position 14 même si l\'impulsion sur S1 se termine !',
      ],
      tags: ['YV14.1 = 1', '1D case 14', '1C sort (1C+)', '1S0 devient 0'],
    },
    {
      title: 'Étape 2 : Fin de course 1S1 -> Enclenchement KA1 & Sortie de 2C (2C+)',
      subtitle: 'Branche 2 active, auto-maintien de KA1 et pilotage de 2D',
      details: [
        'Le vérin 1C arrive en fin de course sortie : il actionne le capteur 1S1 (1S1 = 1).',
        'Dans la branche 2, le contact NO 1S1 se ferme.',
        'Comme 1C n\'est plus à l\'arrière (1S0 = 0), le contact NF 1S0 est fermé (passant).',
        'Le courant alimente la bobine du relais KA1 (bornes A1-A2).',
        'Le relais KA1 s\'enclenche et ferme instantanément ses deux contacts NO :',
        '1) Contact KA1 de maintien (en parallèle avec 1S1) : assure l\'auto-maintien de KA1.',
        '2) Contact KA1 de la branche 3 : alimente la bobine YV12.1.',
        'YV12.1 pilote le distributeur 3/2 monostable 2D qui commute en position 12 (1 relié à 2).',
        'L\'air comprimé remplit 2C et pousse le piston en comprimant le ressort de rappel : 2C sort !',
      ],
      tags: ['1S1 = 1', 'KA1 excité', 'Auto-maintien ON', 'YV12.1 = 1', '2C sort (2C+)'],
    },
    {
      title: 'Étape 3 : Fin de course 2S1 -> Rentrée de 1C (1C-)',
      subtitle: 'Branche 4 active, basculement de 1D en case 12',
      details: [
        'Le vérin 2C arrive en fin de course sortie : il actionne le capteur 2S1 (2S1 = 1).',
        'Dans la branche 4, le contact NO 2S1 se ferme.',
        'La bobine YV12.0 est excitée !',
        'YV12.0 fait basculer le distributeur 5/2 bistable 1D vers la case 12 (1 relié à 2, 4 relié à 5 échappement).',
        'L\'air comprimé arrive dans la chambre avant de 1C, tandis que la chambre arrière s\'échappe : le vérin 1C rentre (1C-).',
        'Important : Dès que 1C quitte 1S1 (1S1 retombe à 0), le relais KA1 RESTE ALIMENTÉ grâce à son contact d\'auto-maintien ! Le vérin 2C reste donc bien maintenu sorti pendant que 1C recule.',
      ],
      tags: ['2S1 = 1', 'YV12.0 = 1', '1D case 12', '1C rentre (1C-)', 'KA1 maintenu'],
    },
    {
      title: 'Étape 4 : Fin de course 1S0 -> Coupure de KA1 & Rentrée de 2C (2C-)',
      subtitle: 'Ouverture du contact NF 1S0, désarmement de KA1 et rappel par ressort',
      details: [
        'Le vérin 1C arrive en fin de course rentrée : il actionne de nouveau le capteur 1S0 (1S0 = 1).',
        'Dans la branche 2, le contact NORMALEMENT FERMÉ (NF) 1S0 est alors ACTIONNÉ : il S\'OUVRE !',
        'L\'ouverture de ce contact NF coupe immédiatement l\'alimentation de la bobine du relais KA1.',
        'L\'auto-maintien est brisé : le relais KA1 retombe au repos (désexcité).',
        'Dans la branche 3, le contact NO KA1 s\'ouvre, ce qui désexcite la bobine YV12.1.',
        'Le distributeur 2D étant MONOSTABLE à rappel par ressort, son ressort mécanique le ramène en position repos (chambre de 2C reliée à l\'échappement 3).',
        'La chambre de 2C étant à l\'air libre, le ressort interne du vérin 2C repousse le piston : 2C rentre (2C-) !',
        'En rentrant, 2C quitte 2S1 (2S1 = 0), ce qui coupe la bobine YV12.0 dans la branche 4.',
      ],
      tags: ['1S0 = 1', 'Contact NF 1S0 ouvert', 'KA1 coupé', '2D rappel ressort', '2C rentre (2C-)'],
    },
    {
      title: 'Retour au repos : Fin de cycle',
      subtitle: 'Les deux vérins sont rentrés, prêts pour une nouvelle pièce / nouveau cycle',
      details: [
        '1C est rentré (1S0 = 1).',
        '2C est rentré (2S1 = 0).',
        'Toutes les bobines électriques (YV14.1, YV12.0, YV12.1, KA1) sont hors tension.',
        'Le cycle séquentiel complet réalisé est : 1C+ -> 2C+ -> 1C- -> 2C-.',
        'Le système attend un nouvel appui sur S1 pour redémarrer.',
      ],
      tags: ['Repos', 'Cycle 1C+ 2C+ 1C- 2C- terminé', 'Attente S1'],
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-750 rounded-xl p-5 shadow-xl flex flex-col h-full">
      {/* Onglets Questions de l'exercice */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            Correction Détaillée de l'Exercice
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('a')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'a'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Question a)
          </button>
          <button
            onClick={() => setActiveTab('b')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'b'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Question b) (Déroulement)
          </button>
          <button
            onClick={() => setActiveTab('grafcet')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'grafcet'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Synthèse &amp; GRAFCET
          </button>
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* ============================================================== */}
        {/* ONGLET QUESTION a)                                             */}
        {/* ============================================================== */}
        {activeTab === 'a' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                Énoncé Question a)
              </span>
              <p className="text-sm font-medium text-slate-200 italic">
                « Dans sa position de départ, quand on alimente en énergie (électricité et air comprimé), quel est l'état (0 ou 1 c'est-à-dire activé ou inactivé) des 3 capteurs 1S0, 1S1 et 2S1 ? »
              </p>
            </div>

            {/* Cartes réponses claires avec statut en temps réel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Capteur 1S0 */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">Capteur 1S0</span>
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-500 text-slate-950">
                    ÉTAT 1 (ACTIVÉ)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Le vérin double effet <strong>1C</strong> est dessiné en position rentrée (position initiale de repos). Son piston actionne physiquement le capteur fin de course <strong>1S0</strong>.
                </p>
                <div className="mt-3 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>En simulation : 1S0 = {state.sensor1S0 ? '1 (Actif)' : '0 (Inactif)'}</span>
                </div>
              </div>

              {/* Capteur 1S1 */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">Capteur 1S1</span>
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-slate-700 text-slate-300">
                    ÉTAT 0 (INACTIVÉ)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Le vérin <strong>1C</strong> n'étant pas sorti, il n'atteint pas l'extrémité avant où est situé le capteur <strong>1S1</strong>. Le capteur reste donc au repos.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-700 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>En simulation : 1S1 = {state.sensor1S1 ? '1 (Actif)' : '0 (Inactif)'}</span>
                </div>
              </div>

              {/* Capteur 2S1 */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">Capteur 2S1</span>
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-slate-700 text-slate-300">
                    ÉTAT 0 (INACTIVÉ)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Le vérin simple effet <strong>2C</strong> est maintenu en position rentrée par son ressort interne. Le capteur de fin de course sortie <strong>2S1</strong> n'est pas touché.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-700 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>En simulation : 2S1 = {state.sensor2S1 ? '1 (Actif)' : '0 (Inactif)'}</span>
                </div>
              </div>
            </div>

            {/* Note pédagogique importante pour la suite */}
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-200 leading-relaxed">
                <strong className="text-white">Impact direct sur le circuit de commande :</strong>
                <p className="mt-1">
                  Puisque <strong>1S0 = 1</strong> au départ, son contact NO dans la branche 1 est <em>déjà fermé</em> (autorisant le départ cycle sur appui de S1), tandis que son contact NF dans la branche 2 est <em>ouvert</em> (empêchant toute excitation indésirable de KA1).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ONGLET QUESTION b) : DÉROULEMENT SÉQUENTIEL                     */}
        {/* ============================================================== */}
        {activeTab === 'b' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                Énoncé Question b)
              </span>
              <p className="text-sm font-medium text-slate-200 italic">
                « On appuie sur S1 : décrivez, en détail, ce qui va se passer au niveau de chaque élément du montage (distributeurs, vérins, relais, ...). »
              </p>
            </div>

            {/* Sélecteur d'étape pas à pas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {stepsDetails.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedStep(idx)}
                  className={`p-2.5 rounded-lg text-left transition-all border ${
                    selectedStep === idx
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-bold block opacity-75">Étape {idx}</span>
                  <span className="text-xs font-semibold block truncate">
                    {idx === 0 ? 'Repos' : idx === 1 ? '1C+' : idx === 2 ? '2C+' : idx === 3 ? '1C-' : idx === 4 ? '2C-' : 'Fin'}
                  </span>
                </button>
              ))}
            </div>

            {/* Fiche détaillée de l'étape sélectionnée */}
            <div className="p-5 rounded-xl bg-slate-850/90 border border-slate-750 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{stepsDetails[selectedStep].title}</span>
                  </h3>
                  <p className="text-xs text-indigo-300 mt-0.5">
                    {stepsDetails[selectedStep].subtitle}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {stepsDetails[selectedStep].tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-900 border border-slate-700 text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Liste détaillée des actions */}
              <ol className="space-y-2 text-xs text-slate-300 leading-relaxed list-decimal list-inside">
                {stepsDetails[selectedStep].details.map((point, index) => (
                  <li key={index} className="pl-1">
                    <span>{point}</span>
                  </li>
                ))}
              </ol>

              {/* Navigation précédente / suivante */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-750 text-xs">
                <button
                  disabled={selectedStep === 0}
                  onClick={() => setSelectedStep((s) => Math.max(0, s - 1))}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  ← Étape précédente
                </button>
                <span className="text-slate-400 font-medium">
                  {selectedStep + 1} / {stepsDetails.length}
                </span>
                <button
                  disabled={selectedStep === stepsDetails.length - 1}
                  onClick={() => setSelectedStep((s) => Math.min(stepsDetails.length - 1, s + 1))}
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                >
                  <span>Étape suivante</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ONGLET SYNTHÈSE & GRAFCET                                      */}
        {/* ============================================================== */}
        {activeTab === 'grafcet' && (
          <div className="space-y-4">
            {/* Représentation du GRAFCET équivalent */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                GRAFCET du Cycle d'Automatismes
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                La séquence d'action exécutée par ce schéma de commande est un cycle séquentiel sans branchement conditionnel :
              </p>

              {/* Diagramme séquentiel linéaire */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800">
                {/* Étape 0 */}
                <div className="text-center p-3 rounded-lg bg-slate-800 border border-slate-700 min-w-[100px]">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-400 flex items-center justify-center mx-auto mb-1 text-[11px] font-bold text-white">
                    0
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 block">Attente</span>
                  <span className="text-[10px] text-slate-400">Repos</span>
                </div>

                <div className="text-center text-indigo-400 text-xs font-mono">
                  S1 · 1S0 →
                </div>

                {/* Étape 1 */}
                <div className="text-center p-3 rounded-lg bg-slate-800 border border-slate-700 min-w-[100px]">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-1 text-[11px] font-bold text-white">
                    1
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 block">1C+</span>
                  <span className="text-[10px] text-slate-400">YV14.1</span>
                </div>

                <div className="text-center text-indigo-400 text-xs font-mono">
                  1S1 →
                </div>

                {/* Étape 2 */}
                <div className="text-center p-3 rounded-lg bg-slate-800 border border-slate-700 min-w-[100px]">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-1 text-[11px] font-bold text-white">
                    2
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 block">2C+</span>
                  <span className="text-[10px] text-slate-400">KA1 / YV12.1</span>
                </div>

                <div className="text-center text-indigo-400 text-xs font-mono">
                  2S1 →
                </div>

                {/* Étape 3 */}
                <div className="text-center p-3 rounded-lg bg-slate-800 border border-slate-700 min-w-[100px]">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-1 text-[11px] font-bold text-white">
                    3
                  </div>
                  <span className="text-[11px] font-bold text-cyan-400 block">1C-</span>
                  <span className="text-[10px] text-slate-400">YV12.0</span>
                </div>

                <div className="text-center text-indigo-400 text-xs font-mono">
                  1S0 →
                </div>

                {/* Étape 4 */}
                <div className="text-center p-3 rounded-lg bg-slate-800 border border-slate-750 min-w-[100px]">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-1 text-[11px] font-bold text-white">
                    4
                  </div>
                  <span className="text-[11px] font-bold text-cyan-400 block">2C-</span>
                  <span className="text-[10px] text-slate-400">Ressort</span>
                </div>
              </div>
            </div>

            {/* Points clés technologiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Pourquoi 1D est bistable et 2D monostable ?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>1D (5/2 bistable) :</strong> Possède deux bobines (YV14.1 et YV12.0). Il n'a besoin que d'une simple <em>impulsion</em> pour basculer et mémorise pneumatiquement sa position.<br />
                  <strong>2D (3/2 monostable) :</strong> N'a qu'une seule bobine (YV12.1) et un ressort de rappel. Il doit être alimenté en continu par le relais KA1 pour maintenir 2C sorti. Dès la coupure de KA1, le ressort ramène automatiquement 2D et 2C rentre !
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  Rôle fondamental du contact NF 1S0
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Le relais KA1 est verrouillé par son contact d'auto-maintien. Sans le contact Normally Closed (NF) de 1S0 dans la branche 2, KA1 resterait enclenché indéfiniment. Lorsque 1C termine sa rentrée et heurte 1S0, l'ouverture de ce contact NF coupe KA1, ce qui permet à 2C de rentrer.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
