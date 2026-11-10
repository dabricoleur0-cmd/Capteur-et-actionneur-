/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, RotateCcw, Award } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Dans la position de départ (au repos, avec alimentation active), quel est l\'état des 3 capteurs ?',
    options: [
      '1S0 = 0, 1S1 = 0, 2S1 = 0',
      '1S0 = 1, 1S1 = 0, 2S1 = 0',
      '1S0 = 1, 1S1 = 1, 2S1 = 1',
      '1S0 = 0, 1S1 = 1, 2S1 = 0',
    ],
    correctIndex: 1,
    explanation: 'Le vérin double effet 1C est au repos en position rentrée : il actionne donc 1S0 (1). Les vérins 1C et 2C ne sont pas sortis, donc 1S1 = 0 et 2S1 = 0.',
  },
  {
    id: 2,
    question: 'Quel est le rôle du contact 1S0 (NF) situé dans la branche 2 du circuit de commande ?',
    options: [
      'Empêcher le vérin 1C de sortir trop vite',
      'Déclencher la sortie du vérin 2C',
      'Ouvrir la branche 2 pour désarmer l\'auto-maintien de KA1 quand 1C est rentré',
      'Réguler la pression de l\'air comprimé',
    ],
    correctIndex: 2,
    explanation: 'Ce contact est Normalement Fermé (NF). Quand 1C termine sa rentrée et heurte 1S0, le contact s\'ouvre, ce qui coupe l\'alimentation de KA1 et permet à 2C de rentrer grâce à son ressort.',
  },
  {
    id: 3,
    question: 'Pourquoi le vérin 2C rentre-t-il dès que le relais KA1 est désexcité ?',
    options: [
      'Car le distributeur 2D et le vérin 2C possèdent des ressorts de rappel mécaniques (monostables)',
      'Car une contre-pression d\'air est envoyée par une seconde bobine',
      'Car la gravité fait retomber le vérin 2C',
      'Car le bouton S1 est relâché',
    ],
    correctIndex: 0,
    explanation: 'Le distributeur 2D est 3/2 monostable avec ressort de rappel, et le vérin 2C est simple effet à ressort. Sans tension sur YV12.1, le ressort ramène 2D à l\'échappement et le ressort de 2C repousse son piston.',
  },
  {
    id: 4,
    question: 'Quelle est la séquence d\'action complète (cycle de fonctionnement) obtenue en appuyant sur S1 ?',
    options: [
      '1C+ → 1C- → 2C+ → 2C-',
      '1C+ → 2C+ → 1C- → 2C-',
      '2C+ → 1C+ → 2C- → 1C-',
      '1C+ et 2C+ en même temps, puis 1C- et 2C- en même temps',
    ],
    correctIndex: 1,
    explanation: 'La séquence séquentielle exacte est : 1C sort (1C+), arrivé sur 1S1 il fait sortir 2C (2C+), arrivé sur 2S1 il fait rentrer 1C (1C-), arrivé sur 1S0 il coupe KA1 et fait rentrer 2C (2C-).',
  },
  {
    id: 5,
    question: 'Pourquoi le distributeur 1D reste-t-il en position 14 même après le relâchement du bouton S1 ?',
    options: [
      'Parce qu\'il est bloqué par un verrou de sécurité',
      'Parce qu\'il est bistable : il mémorise mécaniquement sa dernière position de commutation',
      'Parce que le capteur 1S1 continue d\'alimenter YV14.1',
      'Parce que le relais KA1 le maintient activé',
    ],
    correctIndex: 1,
    explanation: 'Le distributeur 1D est un 5/2 bistable à double commande électropneumatique (YV14.1 pour sortir, YV12.0 pour rentrer). Une courte impulsion électrique suffit à faire basculer le tiroir, qui reste dans cette position jusqu\'à l\'ordre inverse.',
  },
];

export const InteractiveQuiz: React.FC = () => {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (questionId: number, optionIdx: number) => {
    if (showResults) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const handleReset = () => {
    setUserAnswers({});
    setShowResults(false);
  };

  const score = calculateScore();
  const allAnswered = Object.keys(userAnswers).length === QUIZ_QUESTIONS.length;

  return (
    <div className="bg-slate-900 border border-slate-750 rounded-xl p-5 shadow-xl flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Quiz de Compréhension &amp; Dépannage
            </h2>
            <p className="text-xs text-slate-400">
              Vérifiez votre maîtrise des circuits de commande et de puissance de cet exercice
            </p>
          </div>
        </div>

        {showResults && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recommencer</span>
          </button>
        )}
      </div>

      {showResults && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-indigo-600/30 text-indigo-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Résultat de votre évaluation</h3>
              <p className="text-xs text-indigo-200">
                Vous avez obtenu {score} / {QUIZ_QUESTIONS.length} réponses correctes ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}%).
              </p>
            </div>
          </div>
          <span className={`text-base font-black px-3 py-1 rounded-lg ${
            score === QUIZ_QUESTIONS.length ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {score === QUIZ_QUESTIONS.length ? 'Parfait !' : score >= 3 ? 'Bien joué !' : 'À revoir'}
          </span>
        </div>
      )}

      {/* Liste des questions */}
      <div className="space-y-4 flex-1">
        {QUIZ_QUESTIONS.map((q, qIndex) => {
          const selected = userAnswers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div
              key={q.id}
              className={`p-4 rounded-xl border transition-all ${
                showResults
                  ? isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-850 border-slate-750'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold text-slate-200">
                  <span className="text-indigo-400 mr-1.5">Q{qIndex + 1}.</span>
                  {q.question}
                </h3>
                {showResults && (
                  <div>
                    {isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selected === optIdx;
                  const isThisCorrect = optIdx === q.correctIndex;

                  let optClass = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

                  if (showResults) {
                    if (isThisCorrect) {
                      optClass = 'bg-emerald-900/30 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isThisSelected && !isThisCorrect) {
                      optClass = 'bg-rose-900/30 border-rose-500 text-rose-300';
                    } else {
                      optClass = 'bg-slate-900/50 border-slate-800 text-slate-500';
                    }
                  } else if (isThisSelected) {
                    optClass = 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={showResults}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${optClass}`}
                    >
                      <span>{opt}</span>
                      {showResults && isThisCorrect && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase ml-2">Bonne réponse</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explication après validation */}
              {showResults && (
                <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg">
                  <strong className="text-indigo-300">Explication : </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showResults && (
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            disabled={!allAnswered}
            onClick={() => setShowResults(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
          >
            Valider mes réponses ({Object.keys(userAnswers).length}/{QUIZ_QUESTIONS.length})
          </button>
        </div>
      )}
    </div>
  );
};
