/**
 * @fileoverview CognitiveLearner — Adaptive Tutorial Learning with L5 Reservoir
 *
 * Extends the tutorialkit cognitive-runner with Level 5 online learning:
 *   - Tracks learner state through an ESN reservoir
 *   - Adapts tutorial difficulty via RLS feedback
 *   - Self-modifies pacing parameters through ENACTION
 *   - Runs a simplified 4-step Echobeats cycle for tutorial flow
 *
 * Tutorial Echobeats Mapping:
 *   Step 1-3: PERCEIVE — Present content, gather learner input
 *   Step 4-6: REFLECT  — Assess understanding, identify gaps
 *   Step 7-9: PLAN     — Select next content, adjust difficulty
 *   Step 10-12: ACT    — Execute tutorial step, provide feedback
 *
 * This module is the tutorialkit counterpart to bolt.diy's
 * AutonomyLifecycleCoordinator, creating a System 5 composition:
 *   bolt.diy (System 4) ⊗ tutorialkit (System 3) = System 5 (20 terms)
 *
 * cogpy Mapping: cogpilot.jl (Julia-inspired adaptive control)
 */

// ============================================================
// Learner Reservoir — Simplified ESN for Tutorial Tracking
// ============================================================

export interface LearnerReservoirConfig {
  units: number;
  inputDim: number;
  leakingRate: number;
  spectralRadius: number;
}

const DEFAULT_LEARNER_CONFIG: LearnerReservoirConfig = {
  units: 64,
  inputDim: 16,
  leakingRate: 0.2,
  spectralRadius: 0.9,
};

export class LearnerReservoir {
  private config: LearnerReservoirConfig;
  private state: Float64Array;
  private W: Float64Array;
  private Win: Float64Array;
  private tick: number = 0;

  constructor(config: Partial<LearnerReservoirConfig> = {}) {
    this.config = { ...DEFAULT_LEARNER_CONFIG, ...config };
    const { units, inputDim } = this.config;

    this.state = new Float64Array(units);
    this.W = new Float64Array(units * units);
    this.Win = new Float64Array(units * inputDim);

    // Initialize sparse random weights
    const rng = (seed: number) => {
      let s = seed;
      return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    };
    const r = rng(42);

    for (let i = 0; i < units * inputDim; i++) {
      this.Win[i] = (r() - 0.5) * 0.5;
    }
    for (let i = 0; i < units; i++) {
      for (let j = 0; j < units; j++) {
        if (r() > 0.85) {
          this.W[i * units + j] = (r() - 0.5) * this.config.spectralRadius;
        }
      }
    }
  }

  step(input: number[]): Float64Array {
    const { units, inputDim, leakingRate } = this.config;
    const u = new Float64Array(Math.min(inputDim, input.length));
    for (let i = 0; i < u.length; i++) u[i] = input[i];

    const Winu = new Float64Array(units);
    for (let i = 0; i < units; i++) {
      let sum = 0;
      for (let j = 0; j < u.length; j++) {
        sum += this.Win[i * inputDim + j] * u[j];
      }
      Winu[i] = sum;
    }

    const Wx = new Float64Array(units);
    for (let i = 0; i < units; i++) {
      let sum = 0;
      for (let j = 0; j < units; j++) {
        sum += this.W[i * units + j] * this.state[j];
      }
      Wx[i] = sum;
    }

    for (let i = 0; i < units; i++) {
      this.state[i] = (1 - leakingRate) * this.state[i] +
                       leakingRate * Math.tanh(Wx[i] + Winu[i]);
    }

    this.tick++;
    return new Float64Array(this.state);
  }

  getState(): Float64Array { return new Float64Array(this.state); }
  getTick(): number { return this.tick; }
}

// ============================================================
// Learner Engagement Tracker
// ============================================================

export interface EngagementMetrics {
  /** Time spent on current step (ms) */
  timeOnStep: number;
  /** Number of attempts on current challenge */
  attempts: number;
  /** Correctness rate (0-1) */
  correctnessRate: number;
  /** Code modification frequency */
  codeModFrequency: number;
  /** Help request count */
  helpRequests: number;
  /** Estimated comprehension (0-1) */
  comprehension: number;
  /** Frustration indicator (0-1) */
  frustration: number;
  /** Flow state indicator (0-1) */
  flowState: number;
}

export class EngagementTracker {
  private stepStartTime: number = Date.now();
  private attempts: number = 0;
  private correctCount: number = 0;
  private totalCount: number = 0;
  private codeEdits: number[] = []; // timestamps
  private helpRequests: number = 0;

  recordAttempt(correct: boolean): void {
    this.attempts++;
    this.totalCount++;
    if (correct) this.correctCount++;
  }

  recordCodeEdit(): void {
    this.codeEdits.push(Date.now());
    // Keep only last 60 seconds of edits
    const cutoff = Date.now() - 60000;
    this.codeEdits = this.codeEdits.filter((t) => t > cutoff);
  }

  recordHelpRequest(): void {
    this.helpRequests++;
  }

  advanceStep(): void {
    this.stepStartTime = Date.now();
    this.attempts = 0;
    this.helpRequests = 0;
  }

  getMetrics(): EngagementMetrics {
    const timeOnStep = Date.now() - this.stepStartTime;
    const correctnessRate = this.totalCount > 0 ? this.correctCount / this.totalCount : 0.5;
    const codeModFrequency = this.codeEdits.length; // edits per minute

    // Estimate comprehension from correctness and speed
    const speedFactor = Math.min(1, 30000 / Math.max(1, timeOnStep)); // Faster = better
    const comprehension = 0.6 * correctnessRate + 0.3 * speedFactor + 0.1 * (1 - this.helpRequests / 5);

    // Estimate frustration from attempts and help requests
    const frustration = Math.min(1, (this.attempts - 1) * 0.2 + this.helpRequests * 0.15);

    // Flow state: high engagement + low frustration + moderate challenge
    const flowState = Math.max(0, comprehension * (1 - frustration) * Math.min(1, codeModFrequency / 3));

    return {
      timeOnStep,
      attempts: this.attempts,
      correctnessRate,
      codeModFrequency,
      helpRequests: this.helpRequests,
      comprehension: Math.max(0, Math.min(1, comprehension)),
      frustration: Math.max(0, Math.min(1, frustration)),
      flowState: Math.max(0, Math.min(1, flowState)),
    };
  }

  /** Encode metrics as a fixed-length input vector for the reservoir */
  encodeForReservoir(): number[] {
    const m = this.getMetrics();
    return [
      m.timeOnStep / 120000,     // Normalize to ~2 min
      m.attempts / 10,            // Normalize to ~10 attempts
      m.correctnessRate,
      m.codeModFrequency / 10,
      m.helpRequests / 5,
      m.comprehension,
      m.frustration,
      m.flowState,
      // Pad to inputDim
      0, 0, 0, 0, 0, 0, 0, 0,
    ];
  }
}

// ============================================================
// RLS Readout for Difficulty Adaptation
// ============================================================

export interface DifficultyRecommendation {
  /** Recommended difficulty level (0-1) */
  difficulty: number;
  /** Recommended pacing (0=slow, 0.5=normal, 1=fast) */
  pacing: number;
  /** Recommended hint level (0=none, 1=full) */
  hintLevel: number;
  /** Confidence in recommendation */
  confidence: number;
}

export class AdaptiveReadout {
  private weights: Float64Array;
  private pMatrix: Float64Array;
  private reservoirDim: number;
  private outputDim: number = 3; // difficulty, pacing, hintLevel
  private forgettingFactor: number = 0.99;
  private totalUpdates: number = 0;

  constructor(reservoirDim: number = 64) {
    this.reservoirDim = reservoirDim;
    this.weights = new Float64Array(this.outputDim * reservoirDim);
    this.pMatrix = new Float64Array(reservoirDim * reservoirDim);

    // Initialize
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = (Math.random() - 0.5) * 0.01;
    }
    for (let i = 0; i < reservoirDim; i++) {
      this.pMatrix[i * reservoirDim + i] = 100.0;
    }
  }

  /** Predict difficulty recommendation from reservoir state */
  predict(state: Float64Array): DifficultyRecommendation {
    const output = new Float64Array(this.outputDim);
    for (let o = 0; o < this.outputDim; o++) {
      let sum = 0;
      for (let d = 0; d < this.reservoirDim; d++) {
        sum += state[d] * this.weights[o * this.reservoirDim + d];
      }
      output[o] = 1 / (1 + Math.exp(-sum)); // Sigmoid to [0,1]
    }

    let mag = 0;
    for (let i = 0; i < output.length; i++) mag += output[i] ** 2;

    return {
      difficulty: output[0],
      pacing: output[1],
      hintLevel: output[2],
      confidence: Math.min(1, this.totalUpdates / 10) * Math.sqrt(mag / this.outputDim),
    };
  }

  /** RLS update from learner feedback */
  update(state: Float64Array, target: [number, number, number], reward: number): void {
    const D = this.reservoirDim;
    const O = this.outputDim;

    // Compute P * x
    const Px = new Float64Array(D);
    for (let i = 0; i < D; i++) {
      let sum = 0;
      for (let j = 0; j < D; j++) sum += this.pMatrix[i * D + j] * state[j];
      Px[i] = sum;
    }

    // Denominator: λ + x^T P x
    let xPx = 0;
    for (let i = 0; i < D; i++) xPx += state[i] * Px[i];
    const denom = this.forgettingFactor + xPx;

    // Kalman gain
    const K = new Float64Array(D);
    for (let i = 0; i < D; i++) K[i] = Px[i] / denom;

    // Prediction error and weight update
    for (let o = 0; o < O; o++) {
      let pred = 0;
      for (let d = 0; d < D; d++) pred += this.weights[o * D + d] * state[d];
      const error = target[o] - pred;
      for (let d = 0; d < D; d++) {
        this.weights[o * D + d] += reward * K[d] * error;
      }
    }

    // Update P matrix
    for (let i = 0; i < D; i++) {
      for (let j = 0; j < D; j++) {
        this.pMatrix[i * D + j] =
          (this.pMatrix[i * D + j] - K[i] * Px[j]) / this.forgettingFactor;
      }
    }

    this.totalUpdates++;
  }
}

// ============================================================
// Cognitive Learner — Main Integration
// ============================================================

export interface CognitiveLearnerConfig {
  reservoirUnits: number;
  inputDim: number;
  echobeatIntervalMs: number;
}

const DEFAULT_CL_CONFIG: CognitiveLearnerConfig = {
  reservoirUnits: 64,
  inputDim: 16,
  echobeatIntervalMs: 5000,
};

export class CognitiveLearner {
  private config: CognitiveLearnerConfig;
  private reservoir: LearnerReservoir;
  private readout: AdaptiveReadout;
  private tracker: EngagementTracker;
  private currentDifficulty: number = 0.5;
  private echobeatStep: number = 0;
  private echobeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<CognitiveLearnerConfig> = {}) {
    this.config = { ...DEFAULT_CL_CONFIG, ...config };
    this.reservoir = new LearnerReservoir({
      units: this.config.reservoirUnits,
      inputDim: this.config.inputDim,
    });
    this.readout = new AdaptiveReadout(this.config.reservoirUnits);
    this.tracker = new EngagementTracker();
  }

  start(): void {
    this.echobeatTimer = setInterval(() => this.echobeatTick(), this.config.echobeatIntervalMs);
  }

  stop(): void {
    if (this.echobeatTimer) {
      clearInterval(this.echobeatTimer);
      this.echobeatTimer = null;
    }
  }

  /** Record a learner interaction and get updated recommendation */
  recordInteraction(correct: boolean): DifficultyRecommendation {
    this.tracker.recordAttempt(correct);
    const input = this.tracker.encodeForReservoir();
    const state = this.reservoir.step(input);
    const recommendation = this.readout.predict(state);

    // Self-evaluate and provide feedback
    const metrics = this.tracker.getMetrics();
    const targetDifficulty = metrics.flowState > 0.5 ? this.currentDifficulty + 0.05 : this.currentDifficulty - 0.05;
    const targetPacing = metrics.frustration < 0.3 ? 0.6 : 0.3;
    const targetHint = metrics.comprehension < 0.4 ? 0.8 : 0.2;
    const reward = correct ? 0.8 : -0.3;

    this.readout.update(state, [
      Math.max(0, Math.min(1, targetDifficulty)),
      targetPacing,
      targetHint,
    ], reward);

    this.currentDifficulty = recommendation.difficulty;
    return recommendation;
  }

  recordCodeEdit(): void { this.tracker.recordCodeEdit(); }
  recordHelpRequest(): void { this.tracker.recordHelpRequest(); }
  advanceStep(): void { this.tracker.advanceStep(); }

  getEngagement(): EngagementMetrics { return this.tracker.getMetrics(); }
  getDifficulty(): number { return this.currentDifficulty; }

  private echobeatTick(): void {
    this.echobeatStep = (this.echobeatStep + 1) % 12;
    // Simplified 4-phase tutorial cycle
    const phases = ['present', 'assess', 'adapt', 'execute'];
    const phase = phases[Math.floor(this.echobeatStep / 3)];

    // Auto-step the reservoir with current engagement
    const input = this.tracker.encodeForReservoir();
    this.reservoir.step(input);
  }
}
