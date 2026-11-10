/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_STATE,
  computeElectricalState,
  stepSimulation,
  determinePhase,
  SystemState,
} from './engine';

test('Question a) : État initial des capteurs 1S0, 1S1 et 2S1 au repos', () => {
  // Dans sa position de départ, vérins rentrés :
  assert.equal(INITIAL_STATE.sensor1S0, true, '1S0 doit être activé (1) car 1C est rentré');
  assert.equal(INITIAL_STATE.sensor1S1, false, '1S1 doit être inactif (0) car 1C n\'est pas sorti');
  assert.equal(INITIAL_STATE.sensor2S1, false, '2S1 doit être inactif (0) car 2C n\'est pas sorti');
  assert.equal(INITIAL_STATE.pos1C, 0);
  assert.equal(INITIAL_STATE.pos2C, 0);
  assert.equal(INITIAL_STATE.currentPhase, 'REST');
});

test('Branche 1 : Appui sur S1 active YV14.1 seulement si 1S0 est actif', () => {
  // Avec 1S0 actif et S1 pressé
  const elecWithS1 = computeElectricalState(INITIAL_STATE, true, false);
  assert.equal(elecWithS1.branch1Active, true);
  assert.equal(elecWithS1.coilYV14_1, true);

  // Si 1C était déjà sorti (1S0 = false), appuyer sur S1 ne fait rien
  const state1COut: SystemState = {
    ...INITIAL_STATE,
    pos1C: 0.5,
    sensor1S0: false,
  };
  const elecWithout1S0 = computeElectricalState(state1COut, true, false);
  assert.equal(elecWithout1S0.branch1Active, false);
  assert.equal(elecWithout1S0.coilYV14_1, false);
});

test('Branche 2 : Auto-maintien de KA1 et coupure par le contact NF 1S0', () => {
  // Quand 1C arrive en fin de course sortie (1S1 = 1, 1S0 = 0)
  const stateAt1S1: SystemState = {
    ...INITIAL_STATE,
    pos1C: 1.0,
    sensor1S0: false,
    sensor1S1: true,
  };

  const elecAt1S1 = computeElectricalState(stateAt1S1, false, false);
  assert.equal(elecAt1S1.relayKA1, true, 'KA1 doit s\'enclencher à l\'atteinte de 1S1');

  // Quand 1C quitte 1S1 pour rentrer (1S1 devient false), mais 1S0 n'est pas encore touché
  const stateInBetween: SystemState = {
    ...INITIAL_STATE,
    pos1C: 0.5,
    sensor1S0: false,
    sensor1S1: false,
  };
  // KA1 était précédemment à true
  const elecHolding = computeElectricalState(stateInBetween, false, true);
  assert.equal(elecHolding.relayKA1, true, 'KA1 doit rester auto-maintenu');
  assert.equal(elecHolding.coilYV12_1, true, 'YV12.1 doit rester alimenté par KA1');

  // Quand 1C arrive en fin de course rentrée (1S0 = true)
  const stateBackAt1S0: SystemState = {
    ...INITIAL_STATE,
    pos1C: 0.0,
    sensor1S0: true,
    sensor1S1: false,
  };
  const elecCut = computeElectricalState(stateBackAt1S0, false, true);
  assert.equal(elecCut.relayKA1, false, 'Le contact NF 1S0 s\'ouvre et doit couper l\'auto-maintien de KA1');
  assert.equal(elecCut.coilYV12_1, false, 'YV12.1 doit se désexciter');
});

test('Simulation complète du cycle séquentiel : 1C+ -> 2C+ -> 1C- -> 2C-', () => {
  let state = { ...INITIAL_STATE };

  // 1. Déclenchement par impulsion sur S1
  state = stepSimulation(state, true, 0.05);
  assert.equal(state.coilYV14_1, true);
  assert.equal(state.valve1DState, '14');

  // Relâchement de S1 (bouton poussoir relâché)
  let maxSteps = 300;
  let hasReached1S1 = false;
  let hasReached2S1 = false;
  let hasReturned1S0 = false;
  let hasReturned2S0 = false;

  for (let i = 0; i < maxSteps; i++) {
    state = stepSimulation(state, false, 0.05, 2.0);

    if (state.sensor1S1 && !hasReached1S1) {
      hasReached1S1 = true;
      assert.equal(state.relayKA1, true, 'KA1 doit s\'enclencher quand 1S1 est atteint');
      assert.equal(state.coilYV12_1, true, 'YV12.1 doit s\'enclencher pour commander 2C+');
    }

    if (state.sensor2S1 && !hasReached2S1) {
      hasReached2S1 = true;
      assert.equal(state.coilYV12_0, true, 'YV12.0 doit s\'enclencher pour commander 1C-');
    }

    if (hasReached2S1 && state.sensor1S0 && !hasReturned1S0) {
      hasReturned1S0 = true;
      assert.equal(state.relayKA1, false, 'KA1 doit être coupé quand 1C revient à 1S0');
      assert.equal(state.coilYV12_1, false, 'YV12.1 doit être coupé');
    }

    if (hasReturned1S0 && state.pos2C <= 0.05) {
      hasReturned2S0 = true;
      break;
    }
  }

  assert.equal(hasReached1S1, true, '1C doit être sorti jusqu\'à 1S1');
  assert.equal(hasReached2S1, true, '2C doit être sorti jusqu\'à 2S1');
  assert.equal(hasReturned1S0, true, '1C doit être rentré jusqu\'à 1S0');
  assert.equal(hasReturned2S0, true, '2C doit être rentré par son ressort');
  assert.equal(state.currentPhase, 'REST', 'Le système doit être revenu au repos');
});
