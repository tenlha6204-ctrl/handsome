/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FaceAnalysis {
  rating: number;
  breakdown: {
    symmetry: number;
    skinClarity: number;
    proportions: number;
    harmony: number;
  };
  keyFeatures: string[];
  honestCritique: string;
  bestAngle: string;
}
