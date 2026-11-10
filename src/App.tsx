/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  INITIAL_STATE,
  stepSimulation,
  SystemState,
} from './simulation/engine';
import { PowerCircuitView } from './components/PowerCircuitView';
import { ControlCircuitView } from './components/ControlCircuitView';
import { ExerciseExplanationView } from './components/ExerciseExplanationView';
import { TimingDiagramView, HistoryPoint } from './components/TimingDiagramView';
import { InteractiveQuiz } from './components/InteractiveQuiz';
import { OriginalDocumentModal } from './components/OriginalDocumentModal';
import { LogoUploadModal } from './components/LogoUploadModal';
import { soundManager } from './utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Volume2,
  VolumeX,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  Flame,
  User,
  Camera,
  Columns,
  Rows,
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<SystemState>(INITIAL_STATE);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [activeView, setActiveView] = useState<'schematics' | 'solution' | 'timing' | 'quiz'>('schematics');
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'stacked' | 'grid'>('stacked'); // 'stacked' par défaut comme sur la capture d'écran

  // Logo personnalisé de DA DAVID (sauvegardé dans localStorage)
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('user_logo_dadavid');
    } catch {
      return null;
    }
  });

  // Sauvegarde du logo
  const handleSaveLogo = (newLogoUrl: string | null) => {
    setCustomLogo(newLogoUrl);
    try {
      if (newLogoUrl) {
        localStorage.setItem('user_logo_dadavid', newLogoUrl);
      } else {
        localStorage.removeItem('user_logo_dadavid');
      }
    } catch {
      // localStorage indisponible
    }
  };

  // Historique temporel pour le chronogramme
  const [history, setHistory] = useState<HistoryPoint[]>([
    {
      time: 0,
      s1: 0,
      pos1C: 0,
      pos2C: 0,
      s1S0: 1,
      s1S1: 0,
      s2S1: 0,
      yv14_1: 0,
      ka1: 0,
      yv12_1: 0,
      yv12_0: 0,
    },
  ]);

  const simTimeRef = useRef<number>(0);
  const prevStateRef = useRef<SystemState>(INITIAL_STATE);
  const buttonS1Ref = useRef<boolean>(false);

  // Bascule audio
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  // Sons sur fronts montants
  useEffect(() => {
    const prev = prevStateRef.current;
    if (!isMuted) {
      if (!prev.relayKA1 && state.relayKA1) {
        soundManager.playRelayClick();
      }
      if (!prev.coilYV14_1 && state.coilYV14_1) {
        soundManager.playAirExhaust();
      }
      if (!prev.coilYV12_0 && state.coilYV12_0) {
        soundManager.playAirExhaust();
      }
      if (!prev.coilYV12_1 && state.coilYV12_1) {
        soundManager.playAirExhaust();
      }
    }
    prevStateRef.current = state;
  }, [state, isMuted]);

  // Boucle de simulation temps réel
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaSec = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (isRunning && !isManualMode) {
        setState((prev) => {
          const next = stepSimulation(
            prev,
            buttonS1Ref.current,
            deltaSec,
            speedMultiplier
          );

          simTimeRef.current += deltaSec * speedMultiplier;

          // Enregistrement historique chronogramme
          setHistory((prevHist) => {
            const newPt: HistoryPoint = {
              time: Math.round(simTimeRef.current * 10) / 10,
              s1: next.buttonS1 ? 1 : 0,
              pos1C: next.pos1C,
              pos2C: next.pos2C,
              s1S0: next.sensor1S0 ? 1 : 0,
              s1S1: next.sensor1S1 ? 1 : 0,
              s2S1: next.sensor2S1 ? 1 : 0,
              yv14_1: next.coilYV14_1 ? 1 : 0,
              ka1: next.relayKA1 ? 1 : 0,
              yv12_1: next.coilYV12_1 ? 1 : 0,
              yv12_0: next.coilYV12_0 ? 1 : 0,
            };
            return [...prevHist.slice(-240), newPt];
          });

          return next;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, speedMultiplier, isManualMode]);

  // Bouton poussoir S1
  const handlePressS1 = () => {
    buttonS1Ref.current = true;
    setState((prev) => ({ ...prev, buttonS1: true }));
    soundManager.playButtonClick();
  };

  const handleReleaseS1 = () => {
    buttonS1Ref.current = false;
    setState((prev) => ({ ...prev, buttonS1: false }));
  };

  const handleTriggerPulseS1 = () => {
    handlePressS1();
    setTimeout(() => {
      handleReleaseS1();
    }, 450);
  };

  const handleReset = () => {
    buttonS1Ref.current = false;
    setState(INITIAL_STATE);
    simTimeRef.current = 0;
    setHistory([
      {
        time: 0,
        s1: 0,
        pos1C: 0,
        pos2C: 0,
        s1S0: 1,
        s1S1: 0,
        s2S1: 0,
        yv14_1: 0,
        ka1: 0,
        yv12_1: 0,
        yv12_0: 0,
      },
    ]);
  };

  const handleStepOnce = () => {
    setState((prev) => {
      const next = stepSimulation(prev, buttonS1Ref.current, 0.15, 1.0);
      return next;
    });
  };

  const handleTogglePneumatic = () => {
    setState((prev) => ({
      ...prev,
      powerPneumatic: !prev.powerPneumatic,
    }));
  };

  const handleToggleElectric = () => {
    setState((prev) => ({
      ...prev,
      powerElectric: !prev.powerElectric,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ================================================================= */}
      {/* EN-TÊTE PRINCIPAL AVEC LOGO & NOM "DA DAVID"                       */}
      {/* ================================================================= */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo cliquable de DA DAVID et Titre */}
          <div className="flex items-center gap-3">
            {/* Logo DA DAVID personnalisable */}
            <div
              onClick={() => setIsLogoModalOpen(true)}
              className="relative group cursor-pointer"
              title="Cliquer pour insérer ou changer votre logo (DA DAVID)"
            >
              {customLogo ? (
                <img
                  src={customLogo}
                  alt="Logo DA DAVID"
                  className="w-11 h-11 rounded-xl object-cover border-2 border-indigo-400 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 text-white flex flex-col items-center justify-center font-black shadow-lg shadow-indigo-500/20 border-2 border-indigo-400/60 group-hover:scale-105 transition-all">
                  <span className="text-sm tracking-tight leading-none">DD</span>
                  <span className="text-[7px] font-bold tracking-widest uppercase opacity-90 mt-0.5">LOGO</span>
                </div>
              )}
              {/* Overlay caméra au survol */}
              <div className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Camera className="w-4 h-4 text-indigo-300" />
              </div>
            </div>

            {/* Titre & Signature DA DAVID */}
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Simulateur d'Automatismes
                </h1>
                {/* Badge Nom DA DAVID */}
                <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-gradient-to-r from-amber-500/25 to-amber-600/20 border border-amber-400/50 text-amber-300 flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>DA DAVID</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  Exercice 1C+ 2C+ 1C- 2C-
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Figure 1 (Circuit de puissance) &amp; Figure 2 (Circuit de commande à relais)
              </p>
            </div>
          </div>

          {/* Outils & Vues */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Onglets de navigation principale */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveView('schematics')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'schematics'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Schémas</span>
              </button>

              <button
                onClick={() => setActiveView('solution')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'solution'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Correction Q a &amp; b</span>
              </button>

              <button
                onClick={() => setActiveView('timing')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'timing'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Chronogramme</span>
              </button>

              <button
                onClick={() => setActiveView('quiz')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'quiz'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Quiz</span>
              </button>
            </div>

            {/* Bouton pour changer de logo */}
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5"
              title="Insérer votre propre image ou logo personnel (DA DAVID)"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mon Logo</span>
            </button>

            {/* Bouton sujet original */}
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5"
              title="Voir l'énoncé scanné d'origine (DOC-20261107-WA0005.pdf)"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sujet</span>
            </button>

            {/* Son toggle */}
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-lg border transition-all ${
                isMuted
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
              title={isMuted ? 'Activer les sons réels (relais et échappement)' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* BARRE DE CONTRÔLE PRINCIPALE DE LA SIMULATION                     */}
      {/* ================================================================= */}
      <section className="bg-slate-900 border-b border-slate-800/80 px-4 py-2.5 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* BOUTON S1 ET COMMANDES DE LECTURE */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* BOUTON PRINCIPAL S1 (RESPONSIVE SANS RETOUR À LA LIGNE ANORMAL) */}
            <button
              onClick={handleTriggerPulseS1}
              onMouseDown={handlePressS1}
              onMouseUp={handleReleaseS1}
              onTouchStart={handlePressS1}
              onTouchEnd={handleReleaseS1}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-lg transition-all flex items-center gap-2 shrink-0 select-none ${
                state.buttonS1
                  ? 'bg-amber-400 text-slate-950 shadow-amber-500/40 ring-4 ring-amber-500/30 scale-95'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 hover:scale-[1.01]'
              }`}
              title="Cliquez pour envoyer une impulsion ou maintenez enfoncé"
            >
              <Flame className="w-4 h-4 text-slate-950 fill-slate-950 shrink-0" />
              <span className="whitespace-nowrap">
                {state.buttonS1 ? 'S1 ACTIONNÉ !' : 'Appuyer sur S1 (Départ Cycle)'}
              </span>
            </button>

            {/* Commandes Play / Pause / Pas à pas / Reset */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 shrink-0">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                  isRunning
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={isRunning ? 'Mettre en pause' : 'Reprendre la simulation'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={handleStepOnce}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Avancer d'un pas (Mode pas à pas)"
              >
                <StepForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Remettre les vérins et relais à la position initiale (Repos)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Vitesse */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs shrink-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Vitesse</span>
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] transition-all ${
                    speedMultiplier === spd
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Bascule de disposition : Côte à côte / Empilé */}
            {activeView === 'schematics' && (
              <div className="hidden sm:flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setLayoutMode('stacked')}
                  className={`p-1.5 rounded-lg transition-all ${
                    layoutMode === 'stacked'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Disposition empilée (Figure 1 en haut, Figure 2 en bas)"
                >
                  <Rows className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    layoutMode === 'grid'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Disposition côte à côte (2 colonnes)"
                >
                  <Columns className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* BANDEAU D'ÉTAT SÉQUENTIEL & CAPTEURS VISIBLES À 100% */}
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl flex items-center justify-between gap-3 shadow-inner">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block truncate">
                {state.currentPhase === 'REST'
                  ? 'État Initial (Repos)'
                  : state.currentPhase === 'STEP_1_SORTIE_1C'
                  ? 'Phase 1 : Sortie 1C (1C+)'
                  : state.currentPhase === 'STEP_2_SORTIE_2C'
                  ? 'Phase 2 : Sortie 2C (2C+)'
                  : state.currentPhase === 'STEP_3_RENTREE_1C'
                  ? 'Phase 3 : Rentrée 1C (1C-)'
                  : 'Phase 4 : Rentrée 2C (2C-)'}
              </span>
              <p className="text-[11px] text-slate-300 truncate" title={state.phaseDescription}>
                {state.phaseDescription}
              </p>
            </div>

            {/* Badges des 3 capteurs toujours visibles ensemble */}
            <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
              <span
                className={`px-1.5 py-0.5 rounded font-bold border ${
                  state.sensor1S0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="Capteur 1S0 (1C rentré)"
              >
                1S0:{state.sensor1S0 ? '1' : '0'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold border ${
                  state.sensor1S1
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="Capteur 1S1 (1C sorti)"
              >
                1S1:{state.sensor1S1 ? '1' : '0'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold border ${
                  state.sensor2S1
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="Capteur 2S1 (2C sorti)"
              >
                2S1:{state.sensor2S1 ? '1' : '0'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* ZONE CENTRALE : CONTENU INTERACTIF                                */}
      {/* ================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* VUE 1 : SCHÉMAS INTERACTIFS SYNCHRONISÉS (FIGURE 1 & FIGURE 2) */}
        {activeView === 'schematics' && (
          <div
            className={`flex-1 ${
              layoutMode === 'stacked'
                ? 'flex flex-col gap-5'
                : 'grid grid-cols-1 lg:grid-cols-2 gap-4'
            }`}
          >
            {/* Figure 1 (Puissance pneumatique) */}
            <div className="flex flex-col">
              <PowerCircuitView
                state={state}
                onTogglePneumatic={handleTogglePneumatic}
              />
            </div>

            {/* Figure 2 (Commande électrique ladder) */}
            <div className="flex flex-col">
              <ControlCircuitView
                state={state}
                onPressS1={handlePressS1}
                onReleaseS1={handleReleaseS1}
                onToggleElectric={handleToggleElectric}
              />
            </div>
          </div>
        )}

        {/* VUE 2 : CORRECTION DÉTAILLÉE DE L'EXERCICE (QUESTIONS a & b) */}
        {activeView === 'solution' && (
          <div className="flex-1">
            <ExerciseExplanationView state={state} />
          </div>
        )}

        {/* VUE 3 : CHRONOGRAMME TEMPS RÉEL DES SIGNAUX */}
        {activeView === 'timing' && (
          <div className="flex-1">
            <TimingDiagramView
              history={history}
              currentState={state}
              onClearHistory={() => setHistory([])}
            />
          </div>
        )}

        {/* VUE 4 : QUIZ D'ÉVALUATION ET DE DÉPANNAGE */}
        {activeView === 'quiz' && (
          <div className="flex-1">
            <InteractiveQuiz />
          </div>
        )}

        {/* TABLEAU RÉCAPITULATIF DES ÉTATS LOGIQUES */}
        {activeView === 'schematics' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Moniteur des organes :
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold">Vérin 1C :</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.round(state.pos1C * 100)}%
                </span>
                <span className="text-[10px] text-slate-500">
                  ({state.pos1C <= 0.05 ? 'Rentrée' : state.pos1C >= 0.95 ? 'Sortie' : 'Course'})
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold">Distributeur 1D :</span>
                <span className="font-mono text-amber-300 font-bold">
                  Case {state.valve1DState}
                </span>
                <span className="text-[10px] text-slate-500">
                  ({state.valve1DState === '14' ? '1→4 Sortie' : '1→2 Rentrée'})
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold">Vérin 2C :</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.round(state.pos2C * 100)}%
                </span>
                <span className="text-[10px] text-slate-500">
                  ({state.pos2C <= 0.05 ? 'Rentrée (Ressort)' : state.pos2C >= 0.95 ? 'Sortie' : 'Course'})
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold">Distributeur 2D :</span>
                <span className="font-mono text-amber-300 font-bold">
                  {state.valve2DState === '12' ? 'Activé (1→2)' : 'Repos (Échappement)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-bold">Relais KA1 :</span>
                <span
                  className={`font-mono font-bold px-1.5 rounded ${
                    state.relayKA1
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-500'
                  }`}
                >
                  {state.relayKA1 ? 'EXCITÉ (Maintien ON)' : 'REPOS'}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER AVEC SIGNATURE DE DA DAVID */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 px-4 py-2.5 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span>Application développée pour</span>
          <strong className="text-amber-300 font-bold">DA DAVID</strong>
          <span className="text-slate-600">•</span>
          <span>Automatismes Électropneumatiques</span>
        </div>
        <div className="text-slate-500 text-[11px] mt-1 sm:mt-0">
          Cycle séquentiel 1C+ → 2C+ → 1C- → 2C-
        </div>
      </footer>

      {/* MODAL DU DOCUMENT ORIGINAL SCANNE */}
      <OriginalDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />

      {/* MODAL GESTION DU LOGO DE DA DAVID */}
      <LogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogo={customLogo}
        onSaveLogo={handleSaveLogo}
      />
    </div>
  );
}
