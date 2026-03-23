/**
 * @fileoverview Cognitive Tutorial Runner — DTE-Augmented Tutorial Execution
 *
 * Composition Expression:
 *   /dte-autonomy-evolution (
 *     /llama-cpp-skillm [
 *       /neuro-persona-evolve ( /neuro-sama )
 *     ] ->
 *     /tree-polytope-kernel (
 *       /optimal-cognitive-grip [ tutorialkit ]
 *     )
 *   )
 *
 * Wraps TutorialKit's TutorialRunner with the Deep Tree Echo cognitive
 * architecture, enabling:
 *   - Adaptive lesson difficulty via reservoir-augmented temporal context
 *   - Somatic markers for learner engagement tracking
 *   - Hypergraph memory for cross-lesson knowledge accumulation
 *   - Autognosis for self-aware tutorial progression
 *   - Tree-polytope structural model of the tutorial content graph
 *   - Echobeats-phased lesson execution (perceive → reason → act)
 *
 * Architecture Mapping (optimal-cognitive-grip 5D):
 *   Composability:     Monorepo packages ⊕ Cognitive subsystems
 *   Differentiability: ESN online learning for difficulty adaptation
 *   Executability:     TutorialRunner ⊗ Echobeats cycle
 *   Self-Awareness:    Autognosis monitoring learner + system state
 *   Convergence:       Lesson mastery as fixed-point convergence
 *
 * Tree-Polytope Kernel Integration:
 *   tutorialkit maps to System 3 (triangle, 4 terms):
 *     3 centres: Content, Runtime, UI
 *     Star tower: Content → Lesson → Step → File
 *     Chain tower: Runtime → WebContainer → Process → Terminal
 *     Tensor product with bolt.diy → System 5 (pentachoron, 20 terms)
 */

// ============================================================
// Types
// ============================================================

/** Learner cognitive profile tracked across lessons */
export interface LearnerProfile {
  /** Unique learner identifier */
  id: string;
  /** Current mastery level per concept */
  mastery: Map<string, number>;
  /** Engagement history (somatic markers) */
  engagement: EngagementMarker[];
  /** Reservoir state encoding temporal learning patterns */
  reservoirState: Float64Array | null;
  /** Echobeat tick position */
  echobeatTick: number;
  /** Autognosis self-model of the learner */
  selfModel: LearnerSelfModel;
}

/** Engagement marker (somatic marker for learning) */
export interface EngagementMarker {
  lessonId: string;
  stepId: string;
  timestamp: number;
  /** Engagement valence: -1 (frustrated) to 1 (flow state) */
  valence: number;
  /** Arousal: 0 (bored) to 1 (excited) */
  arousal: number;
  /** Time spent on step in ms */
  duration: number;
  /** Whether the step was completed successfully */
  success: boolean;
  /** Number of attempts */
  attempts: number;
}

/** Learner self-model (autognosis) */
export interface LearnerSelfModel {
  /** Autognosis level: 0-4 */
  level: number;
  /** Predicted difficulty preference */
  preferredDifficulty: number;
  /** Learning style indicators */
  style: {
    /** Prefers reading vs doing */
    readVsDo: number;
    /** Prefers guided vs exploratory */
    guidedVsExploratory: number;
    /** Prefers fast vs thorough */
    fastVsThorough: number;
  };
  /** Concept graph (hypergraph memory) */
  knownConcepts: string[];
  /** Predicted next concepts to learn */
  nextConcepts: string[];
}

/** Adaptive lesson configuration */
export interface AdaptiveLessonConfig {
  /** Base lesson ID */
  lessonId: string;
  /** Difficulty level (0-1, adapted by reservoir) */
  difficulty: number;
  /** Whether to show hints */
  showHints: boolean;
  /** Whether to skip mastered steps */
  skipMastered: boolean;
  /** Echobeat phase for this lesson */
  phase: 'perceive' | 'reason' | 'act';
  /** Tree-polytope system level of this lesson */
  systemLevel: number;
}

/** Cognitive module node for structural self-model */
export interface TutorialModuleNode {
  name: string;
  type: 'content' | 'runtime' | 'ui' | 'bridge' | 'cognitive';
  children: TutorialModuleNode[];
  matula: number;
  polynomial: readonly number[];
  depth: number;
  isPrime: boolean;
}

// ============================================================
// Echobeats Cycle for Tutorial Execution
// ============================================================

/** 12-step tutorial cognitive cycle */
export const TUTORIAL_ECHOBEAT_CYCLE = [
  // Perception phase (steps 1-4): Assess learner state
  { step: 1,  thread: 0, verb: 'DISCOVER',     desc: 'Assess learner mastery level' },
  { step: 2,  thread: 1, verb: 'DISCOVER',     desc: 'Extract engagement patterns' },
  { step: 3,  thread: 2, verb: 'NAVIGATE',     desc: 'Traverse concept graph' },
  { step: 4,  thread: 0, verb: 'OBSERVE',      desc: 'Monitor system state' },
  // Reasoning phase (steps 5-8): Adapt content
  { step: 5,  thread: 1, verb: 'COMPOSE',      desc: 'Select optimal lesson path' },
  { step: 6,  thread: 2, verb: 'NAVIGATE',     desc: 'Recall similar learner patterns' },
  { step: 7,  thread: 0, verb: 'COMPOSE',      desc: 'Adjust difficulty parameters' },
  { step: 8,  thread: 1, verb: 'CLASSIFY',     desc: 'Classify learner readiness' },
  // Action phase (steps 9-12): Execute lesson
  { step: 9,  thread: 2, verb: 'COMPOSE',      desc: 'Prepare lesson content' },
  { step: 10, thread: 0, verb: 'ORCHESTRATE',  desc: 'Execute lesson steps' },
  { step: 11, thread: 1, verb: 'MUTATE',       desc: 'Update learner profile' },
  { step: 12, thread: 2, verb: 'OBSERVE',      desc: 'Record engagement metrics' },
] as const;

// ============================================================
// Reservoir Engine for Temporal Learning Patterns
// ============================================================

/**
 * Lightweight ESN for tracking temporal patterns in learner behavior.
 * Maps to cogpilot.jl reservoir computing.
 */
export class LearnerReservoir {
  private _state: Float64Array;
  private _size: number;
  private _spectralRadius: number;
  private _leakingRate: number;

  constructor(size: number = 64) {
    this._size = size;
    this._spectralRadius = 0.95;
    this._leakingRate = 0.3;
    this._state = new Float64Array(size);
    // Initialize with small random values
    for (let i = 0; i < size; i++) {
      this._state[i] = (Math.random() - 0.5) * 0.1;
    }
  }

  /** Step the reservoir with learner engagement input */
  step(input: { valence: number; arousal: number; duration: number; success: boolean }): Float64Array {
    const inputVec = new Float64Array(4);
    inputVec[0] = input.valence;
    inputVec[1] = input.arousal;
    inputVec[2] = Math.min(1, input.duration / 60000); // Normalize to minutes
    inputVec[3] = input.success ? 1 : 0;

    const newState = new Float64Array(this._size);
    for (let i = 0; i < this._size; i++) {
      let activation = 0;
      for (let j = 0; j < this._size; j++) {
        if (Math.random() < 0.1) {
          activation += this._state[j] * (Math.random() - 0.5) * this._spectralRadius;
        }
      }
      const inputIdx = i % inputVec.length;
      activation += inputVec[inputIdx] * 0.5;
      newState[i] = (1 - this._leakingRate) * this._state[i] +
                    this._leakingRate * Math.tanh(activation);
    }
    this._state = newState;
    return newState;
  }

  /** Compute predicted difficulty from reservoir state */
  predictDifficulty(): number {
    // Simple readout: weighted sum of reservoir state
    let sum = 0;
    for (let i = 0; i < this._size; i++) {
      sum += this._state[i];
    }
    // Sigmoid to [0, 1]
    return 1 / (1 + Math.exp(-sum / this._size * 10));
  }

  /** Export state for persistence */
  exportState(): number[] {
    return Array.from(this._state);
  }

  /** Import state from persistence */
  importState(state: number[]): void {
    this._state = new Float64Array(state);
  }
}

// ============================================================
// Cognitive Tutorial Runner
// ============================================================

/**
 * CognitiveTutorialRunner wraps TutorialKit's TutorialRunner with
 * DTE cognitive architecture for adaptive, self-aware tutorial execution.
 *
 * This is designed as a composable wrapper that can be applied to any
 * TutorialRunner instance without modifying the base class.
 */
export class CognitiveTutorialRunner {
  private _reservoir: LearnerReservoir;
  private _profile: LearnerProfile;
  private _echobeatTick: number = 0;
  private _structuralModel: TutorialModuleNode;

  constructor(learnerId: string = 'default') {
    this._reservoir = new LearnerReservoir(64);
    this._profile = {
      id: learnerId,
      mastery: new Map(),
      engagement: [],
      reservoirState: null,
      echobeatTick: 0,
      selfModel: {
        level: 0,
        preferredDifficulty: 0.5,
        style: { readVsDo: 0.5, guidedVsExploratory: 0.5, fastVsThorough: 0.5 },
        knownConcepts: [],
        nextConcepts: [],
      },
    };
    this._structuralModel = this._buildStructuralModel();
  }

  /** Advance the Echobeats cycle and return the current phase */
  advanceEchobeat(): typeof TUTORIAL_ECHOBEAT_CYCLE[number] {
    this._echobeatTick = (this._echobeatTick % 12) + 1;
    return TUTORIAL_ECHOBEAT_CYCLE[this._echobeatTick - 1];
  }

  /** Record learner engagement for a lesson step */
  recordEngagement(marker: Omit<EngagementMarker, 'timestamp'>): void {
    const fullMarker: EngagementMarker = {
      ...marker,
      timestamp: Date.now(),
    };
    this._profile.engagement.push(fullMarker);

    // Step the reservoir with engagement data
    this._reservoir.step({
      valence: marker.valence,
      arousal: marker.arousal,
      duration: marker.duration,
      success: marker.success,
    });

    // Update mastery
    const conceptKey = `${marker.lessonId}:${marker.stepId}`;
    const currentMastery = this._profile.mastery.get(conceptKey) || 0;
    const delta = marker.success ? 0.1 : -0.05;
    this._profile.mastery.set(conceptKey, Math.max(0, Math.min(1, currentMastery + delta)));

    // Update autognosis level
    this._updateAutognosis();
  }

  /** Get adaptive configuration for a lesson */
  getAdaptiveConfig(lessonId: string): AdaptiveLessonConfig {
    const difficulty = this._reservoir.predictDifficulty();
    const phase = this._getCurrentPhase();
    const systemLevel = this._computeLessonSystemLevel(lessonId);

    return {
      lessonId,
      difficulty,
      showHints: difficulty < 0.3,
      skipMastered: this._profile.selfModel.level >= 2,
      phase,
      systemLevel,
    };
  }

  /** Get the learner profile */
  getProfile(): LearnerProfile {
    return { ...this._profile };
  }

  /** Get the structural self-model */
  getStructuralModel(): TutorialModuleNode {
    return this._structuralModel;
  }

  /** Export full state for persistence */
  exportState(): object {
    return {
      profile: {
        ...this._profile,
        mastery: Object.fromEntries(this._profile.mastery),
        reservoirState: this._reservoir.exportState(),
      },
      echobeatTick: this._echobeatTick,
    };
  }

  /** Import state from persistence */
  importState(state: any): void {
    if (state.profile) {
      this._profile = {
        ...state.profile,
        mastery: new Map(Object.entries(state.profile.mastery || {})),
        reservoirState: null,
      };
      if (state.profile.reservoirState) {
        this._reservoir.importState(state.profile.reservoirState);
      }
    }
    if (state.echobeatTick) {
      this._echobeatTick = state.echobeatTick;
    }
  }

  // ============================================================
  // Private Methods
  // ============================================================

  private _getCurrentPhase(): 'perceive' | 'reason' | 'act' {
    if (this._echobeatTick <= 4) return 'perceive';
    if (this._echobeatTick <= 8) return 'reason';
    return 'act';
  }

  private _computeLessonSystemLevel(_lessonId: string): number {
    // Map lesson complexity to system level
    const mastered = this._profile.mastery.size;
    if (mastered < 2) return 1;   // Monad
    if (mastered < 5) return 2;   // Dyad
    if (mastered < 10) return 3;  // Triad
    if (mastered < 20) return 4;  // Enneagram
    return 5;                      // Pentachoron
  }

  private _updateAutognosis(): void {
    const markers = this._profile.engagement;
    const sm = this._profile.selfModel;

    // L0: Raw telemetry (always)
    sm.level = 0;

    // L1: Pattern detection (> 5 markers)
    if (markers.length > 5) {
      sm.level = 1;
      const recent = markers.slice(-10);
      const avgValence = recent.reduce((s, m) => s + m.valence, 0) / recent.length;
      const avgDuration = recent.reduce((s, m) => s + m.duration, 0) / recent.length;
      sm.style.readVsDo = avgDuration > 30000 ? 0.7 : 0.3;
    }

    // L2: Self-model (> 20 markers)
    if (markers.length > 20) {
      sm.level = 2;
      sm.preferredDifficulty = this._reservoir.predictDifficulty();
    }

    // L3: Meta-cognition (> 50 markers + high mastery)
    if (markers.length > 50 && this._profile.mastery.size > 10) {
      sm.level = 3;
      sm.knownConcepts = Array.from(this._profile.mastery.entries())
        .filter(([_, v]) => v > 0.7)
        .map(([k]) => k);
    }

    // L4: Meta-meta (stable self-model)
    if (sm.level >= 3 && sm.knownConcepts.length > 20) {
      sm.level = 4;
    }
  }

  /** Build the structural self-model of tutorialkit */
  private _buildStructuralModel(): TutorialModuleNode {
    return {
      name: 'tutorialkit',
      type: 'content',
      matula: 0,
      polynomial: [],
      children: [
        {
          name: 'content-layer',
          type: 'content',
          matula: 5,
          polynomial: [1, 1, 1],
          children: [
            { name: 'astro-integration', type: 'bridge', matula: 3, polynomial: [1, 1], children: [
              { name: 'content-schemas', type: 'content', matula: 2, polynomial: [1], children: [], depth: 3, isPrime: true },
              { name: 'remark-plugins', type: 'bridge', matula: 2, polynomial: [1], children: [], depth: 3, isPrime: true },
            ], depth: 2, isPrime: true },
            { name: 'types', type: 'content', matula: 2, polynomial: [1], children: [], depth: 2, isPrime: true },
          ],
          depth: 1,
          isPrime: true,
        },
        {
          name: 'runtime-layer',
          type: 'runtime',
          matula: 5,
          polynomial: [1, 1, 1],
          children: [
            { name: 'tutorial-runner', type: 'runtime', matula: 3, polynomial: [1, 1], children: [
              { name: 'webcontainer', type: 'bridge', matula: 2, polynomial: [1], children: [], depth: 3, isPrime: true },
              { name: 'steps-controller', type: 'runtime', matula: 2, polynomial: [1], children: [], depth: 3, isPrime: true },
            ], depth: 2, isPrime: true },
            { name: 'stores', type: 'runtime', matula: 2, polynomial: [1], children: [], depth: 2, isPrime: true },
          ],
          depth: 1,
          isPrime: true,
        },
        {
          name: 'ui-layer',
          type: 'ui',
          matula: 3,
          polynomial: [1, 1],
          children: [
            { name: 'react-components', type: 'ui', matula: 2, polynomial: [1], children: [], depth: 2, isPrime: true },
            { name: 'codemirror-editor', type: 'ui', matula: 2, polynomial: [1], children: [], depth: 2, isPrime: true },
          ],
          depth: 1,
          isPrime: true,
        },
        {
          name: 'cognitive-layer',
          type: 'cognitive',
          matula: 7,
          polynomial: [1, 1, 1, 1],
          children: [
            { name: 'learner-reservoir', type: 'cognitive', matula: 2, polynomial: [1], children: [], depth: 2, isPrime: true },
            { name: 'engagement-tracker', type: 'cognitive', matula: 2, polynomial: [1], children: [], depth: 2, isPrime: true },
            { name: 'adaptive-engine', type: 'cognitive', matula: 2, polynomial: [1], children: [], depth: 2, isPrime: true },
          ],
          depth: 1,
          isPrime: true,
        },
      ],
      depth: 0,
      isPrime: false,
    };
  }
}

/**
 * Factory function to create a cognitive tutorial runner.
 * Mirrors the createNeuroPersona() pattern from neuro-sama.
 */
export function createCognitiveTutorialRunner(learnerId?: string): CognitiveTutorialRunner {
  return new CognitiveTutorialRunner(learnerId);
}
