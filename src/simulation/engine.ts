/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemState {
  // Sources d'énergie
  powerElectric: boolean;   // L1-N sous tension
  powerPneumatic: boolean;  // Air comprimé connecté (6 bars)

  // Commandes opérateur
  buttonS1: boolean;        // Bouton poussoir S1 (contact NO)

  // Positions physiques des vérins (de 0.0 = complètement rentré à 1.0 = complètement sorti)
  pos1C: number;
  pos2C: number;

  // Capteurs de position (fins de course)
  sensor1S0: boolean;       // Détecte 1C rentré (pos1C <= 0.05)
  sensor1S1: boolean;       // Détecte 1C sorti (pos1C >= 0.95)
  sensor2S1: boolean;       // Détecte 2C sorti (pos2C >= 0.95)

  // Rungs / branches électriques et récepteurs
  branch1Active: boolean;   // S1 et 1S0 (NO) conducteurs -> YV14.1
  branch2Active: boolean;   // (1S1 || KA1) et 1S0 (NF) conducteurs -> KA1
  branch3Active: boolean;   // KA1 (NO) conducteur -> YV12.1
  branch4Active: boolean;   // 2S1 (NO) conducteur -> YV12.0

  coilYV14_1: boolean;      // Électrovanne distributeur 1D (Sortie 1C)
  relayKA1: boolean;        // Relais auxiliaire KA1 (A1-A2)
  coilYV12_1: boolean;      // Électrovanne distributeur 2D (Sortie 2C)
  coilYV12_0: boolean;      // Électrovanne distributeur 1D (Rentrée 1C)

  // Distributeurs pneumatiques
  // Distributeur 1D : 5/2 bistable à commande électrique
  valve1DState: '14' | '12'; // '14' = oriente pression vers chambre arrière (1->4, 2->5), '12' = vers chambre avant (1->2, 4->3)
  // Distributeur 2D : 3/2 monostable rappel ressort
  valve2DState: '12' | '0';  // '12' = activé par YV12.1 (1->2), '0' = repos par ressort (2->3 échappement)

  // Étape pédagogique / Grafcet équivalent
  currentPhase: 'REST' | 'STEP_1_SORTIE_1C' | 'STEP_2_SORTIE_2C' | 'STEP_3_RENTREE_1C' | 'STEP_4_RENTREE_2C';
  phaseDescription: string;
}

export const INITIAL_STATE: SystemState = {
  powerElectric: true,
  powerPneumatic: true,
  buttonS1: false,
  pos1C: 0,
  pos2C: 0,
  sensor1S0: true,   // 1C est rentré en position initiale
  sensor1S1: false,
  sensor2S1: false,
  branch1Active: false,
  branch2Active: false,
  branch3Active: false,
  branch4Active: false,
  coilYV14_1: false,
  relayKA1: false,
  coilYV12_1: false,
  coilYV12_0: false,
  valve1DState: '12', // En position repos initiale, vérin 1C rentré
  valve2DState: '0',  // Ressort de rappel au repos
  currentPhase: 'REST',
  phaseDescription: 'Système au repos : 1C et 2C rentrés. 1S0 actionné (1), 1S1 inactif (0), 2S1 inactif (0). Prêt pour S1.',
};

/**
 * Calcule l'état logique électrique instantané (circuit de commande Figure 2).
 */
export function computeElectricalState(
  state: SystemState,
  buttonS1: boolean,
  currentKA1: boolean
): {
  sensor1S0: boolean;
  sensor1S1: boolean;
  sensor2S1: boolean;
  branch1Active: boolean;
  branch2Active: boolean;
  branch3Active: boolean;
  branch4Active: boolean;
  coilYV14_1: boolean;
  relayKA1: boolean;
  coilYV12_1: boolean;
  coilYV12_0: boolean;
} {
  // Les capteurs sont actionnés par les positions physiques
  const sensor1S0 = state.pos1C <= 0.05;
  const sensor1S1 = state.pos1C >= 0.95;
  const sensor2S1 = state.pos2C >= 0.95;

  if (!state.powerElectric) {
    return {
      sensor1S0,
      sensor1S1,
      sensor2S1,
      branch1Active: false,
      branch2Active: false,
      branch3Active: false,
      branch4Active: false,
      coilYV14_1: false,
      relayKA1: false,
      coilYV12_1: false,
      coilYV12_0: false,
    };
  }

  // Branche 1 : Bouton S1 (NO) en série avec 1S0 (contact NO) -> Bobine YV14.1
  const branch1Active = buttonS1 && sensor1S0;
  const coilYV14_1 = branch1Active;

  // Branche 2 : Contact 1S1 (NO) en parallèle avec contact KA1 (auto-maintien),
  // en série avec le contact NORMALEMENT FERMÉ (NF) de 1S0 -> Bobine KA1 (A1-A2).
  // Quand 1S0 est actionné (vérin rentré), le contact NF s'ouvre !
  // Quand 1S0 n'est pas actionné (vérin en course ou sorti), le contact NF est passant (!sensor1S0).
  const contactNF1S0_passant = !sensor1S0;
  const branch2Active = (sensor1S1 || currentKA1) && contactNF1S0_passant;
  const relayKA1 = branch2Active;

  // Branche 3 : Contact KA1 (NO) -> Bobine YV12.1
  const branch3Active = relayKA1;
  const coilYV12_1 = branch3Active;

  // Branche 4 : Contact 2S1 (NO) -> Bobine YV12.0
  const branch4Active = sensor2S1;
  const coilYV12_0 = branch4Active;

  return {
    sensor1S0,
    sensor1S1,
    sensor2S1,
    branch1Active,
    branch2Active,
    branch3Active,
    branch4Active,
    coilYV14_1,
    relayKA1,
    coilYV12_1,
    coilYV12_0,
  };
}

/**
 * Détermine la description pédagogique de l'étape courante.
 */
export function determinePhase(state: SystemState): {
  currentPhase: SystemState['currentPhase'];
  phaseDescription: string;
} {
  if (state.pos1C <= 0.05 && state.pos2C <= 0.05 && !state.relayKA1 && !state.coilYV14_1) {
    return {
      currentPhase: 'REST',
      phaseDescription: 'État initial (Repos) : 1S0 = 1, 1S1 = 0, 2S1 = 0. En attente de l\'appui sur S1.',
    };
  }

  if (state.pos2C <= 0.05 && (!state.sensor1S1 || state.valve1DState === '14') && !state.relayKA1) {
    return {
      currentPhase: 'STEP_1_SORTIE_1C',
      phaseDescription: 'Étape 1 [1C+] : YV14.1 a basculé le distributeur 1D. Le vérin double effet 1C sort vers 1S1.',
    };
  }

  if (state.sensor1S1 && state.relayKA1 && state.pos2C < 0.95 && state.valve1DState === '14') {
    return {
      currentPhase: 'STEP_2_SORTIE_2C',
      phaseDescription: 'Étape 2 [2C+] : 1S1 a excité le relais KA1 (auto-maintien). KA1 alimente YV12.1 : le vérin 2C sort vers 2S1.',
    };
  }

  if (state.valve1DState === '12' && state.pos1C > 0.05) {
    return {
      currentPhase: 'STEP_3_RENTREE_1C',
      phaseDescription: 'Étape 3 [1C-] : 2S1 a activé YV12.0. Le distributeur bistable 1D a basculé : le vérin 1C rentre vers 1S0.',
    };
  }

  if (state.pos1C <= 0.05 && state.pos2C > 0.05) {
    return {
      currentPhase: 'STEP_4_RENTREE_2C',
      phaseDescription: 'Étape 4 [2C-] : 1C a atteint 1S0, ouvrant le contact NF 1S0. KA1 et YV12.1 sont coupés : le ressort de 2C le fait rentrer.',
    };
  }

  return {
    currentPhase: 'STEP_1_SORTIE_1C',
    phaseDescription: 'Cycle en cours...',
  };
}

/**
 * Fait avancer la simulation d'un pas temporel dt (en secondes).
 * Gère l'électropneumatique avec vitesse réaliste des vérins.
 */
export function stepSimulation(
  prevState: SystemState,
  buttonS1: boolean,
  dt: number = 0.033,
  speedMultiplier: number = 1.0
): SystemState {
  const effectiveDt = dt * speedMultiplier;
  const cylinderSpeed1C = 0.8; // temps de course ~1.25s
  const cylinderSpeed2C = 0.9; // temps de course ~1.1s

  // 1. Calcul de l'état électrique
  const elec = computeElectricalState(prevState, buttonS1, prevState.relayKA1);

  // 2. Distributeur 1D (5/2 bistable)
  let nextValve1D = prevState.valve1DState;
  if (prevState.powerPneumatic) {
    if (elec.coilYV14_1 && !elec.coilYV12_0) {
      nextValve1D = '14';
    } else if (elec.coilYV12_0 && !elec.coilYV14_1) {
      nextValve1D = '12';
    }
  }

  // 3. Distributeur 2D (3/2 monostable avec ressort de rappel)
  let nextValve2D: '12' | '0' = '0';
  if (prevState.powerPneumatic && elec.coilYV12_1) {
    nextValve2D = '12';
  } else {
    // Si pas d'air ou pas de tension sur la bobine, le ressort ramène à 0
    nextValve2D = '0';
  }

  // 4. Mouvement physique des vérins
  let nextPos1C = prevState.pos1C;
  let nextPos2C = prevState.pos2C;

  if (prevState.powerPneumatic) {
    // Vérin 1C (double effet)
    if (nextValve1D === '14') {
      nextPos1C = Math.min(1.0, nextPos1C + cylinderSpeed1C * effectiveDt);
    } else if (nextValve1D === '12') {
      nextPos1C = Math.max(0.0, nextPos1C - cylinderSpeed1C * effectiveDt);
    }

    // Vérin 2C (simple effet avec ressort de rappel)
    if (nextValve2D === '12') {
      // Pression pousse contre le ressort
      nextPos2C = Math.min(1.0, nextPos2C + cylinderSpeed2C * effectiveDt);
    } else {
      // Ressort de rappel repousse le piston
      nextPos2C = Math.max(0.0, nextPos2C - cylinderSpeed2C * effectiveDt);
    }
  } else {
    // Sans air comprimé, seul le ressort de 2C peut le ramener à 0 s'il était sorti
    nextPos2C = Math.max(0.0, nextPos2C - cylinderSpeed2C * effectiveDt);
  }

  // 5. Mise à jour des capteurs selon les nouvelles positions
  const nextSensor1S0 = nextPos1C <= 0.05;
  const nextSensor1S1 = nextPos1C >= 0.95;
  const nextSensor2S1 = nextPos2C >= 0.95;

  // 6. Recalcul électrique post-mouvement
  const updatedTempState: SystemState = {
    ...prevState,
    pos1C: nextPos1C,
    pos2C: nextPos2C,
    sensor1S0: nextSensor1S0,
    sensor1S1: nextSensor1S1,
    sensor2S1: nextSensor2S1,
    valve1DState: nextValve1D,
    valve2DState: nextValve2D,
  };

  const finalElec = computeElectricalState(updatedTempState, buttonS1, prevState.relayKA1);

  const partialState: SystemState = {
    ...updatedTempState,
    buttonS1,
    ...finalElec,
  };

  const { currentPhase, phaseDescription } = determinePhase(partialState);

  return {
    ...partialState,
    currentPhase,
    phaseDescription,
  };
}
