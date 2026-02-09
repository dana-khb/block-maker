/**
 * Trousers Pattern Module
 * Contains all pattern-specific calculations and SVG generation
 */

import { segmentsToPolyline, offsetPolygon } from '../geometry/index.js'

// Default curve values for reset functionality
export const DEFAULT_CURVES = {
  crotch: {
    front_crotch_h_tension: 0.7,
    front_crotch_v_tension: 0.75,
    back_crotch_h_tension: 0.8,
    back_crotch_v_tension: 0.85
  },
  front_waist: {
    front_waist_CP2_ratio_x: 0.446,
    front_waist_CP2_ratio_y: 0.019,
    front_waist_P3_ratio_x: 0.639,
    front_waist_CP3_ratio_x: 0.831,
    front_waist_CP3_ratio_y: -0.019
  },
  back_waist: {
    back_waist_CP2_ratio_x: -0.295,
    back_waist_CP2_ratio_y: 0.077,
    back_waist_P3_ratio_x: -0.489,
    back_waist_P3_ratio_y: 0.103,
    back_waist_CP3_ratio_x: -0.683,
    back_waist_CP3_ratio_y: 0.127
  },
  front_inseam: {
    front_inseam_CP1_ratio_x: 0.1,
    front_inseam_CP1_ratio_y: 0.3,
    front_inseam_CP2_ratio_x: 0.404,
    front_inseam_CP2_ratio_y: 0.504
  },
  front_side: {
    front_side_seg1_CP1_ratio_x: 0.32,
    front_side_seg1_CP1_ratio_y: 0.33,
    front_side_seg1_CP2_ratio_x: 1.11,
    front_side_seg1_CP2_ratio_y: 0.754,
    front_side_seg2_CP1_ratio_x: 0.052,
    front_side_seg2_CP1_ratio_y: 0.4,
    front_side_seg2_CP2_ratio_x: 0.569,
    front_side_seg2_CP2_ratio_y: 0.714
  },
  back_inseam: {
    back_inseam_seg1_CP1_ratio_x: 0.355,
    back_inseam_seg1_CP1_ratio_y: 0.261,
    back_inseam_seg1_CP2_ratio_x: 1.052,
    back_inseam_seg1_CP2_ratio_y: 0.826,
    back_inseam_seg2_CP1_ratio_x: 0.098,
    back_inseam_seg2_CP1_ratio_y: 0.283,
    back_inseam_seg2_CP2_ratio_x: 0.708,
    back_inseam_seg2_CP2_ratio_y: 0.784
  },
  back_side: {
    back_side_seg1_CP2_ratio_x: 0.415,
    back_side_seg1_CP2_ratio_y: 0.665,
    back_side_seg2_CP1_ratio_x: 0.306,
    back_side_seg2_CP1_ratio_y: 0.407
  }
}

/**
 * Calculate all pattern dimensions from input measurements and ease values
 * @param {Object} inputs - { measurements, ease, curves }
 * @returns {Object} Calculated pattern dimensions
 */
export function calculatePattern(inputs) {
  const { measurements, ease, curves } = inputs

  // Step 1: Convert all measurements to pixels (1cm = 10px)
  const hip_px = measurements.hip * 10
  const waistToHip_px = measurements.waistToHip * 10
  const waistToKnee_px = measurements.waistToKnee * 10
  const waistToAnkle_px = measurements.waistToAnkle * 10
  const crotchDepth_px = measurements.crotchDepth * 10
  const waist_px = measurements.waist * 10
  const hemlineCircumference_px = measurements.hemline * 10

  // Step 2: Calculate Variables (using ease variables)
  const frameWidth = (hip_px / 2) + ease.hip_ease
  const frameHeight = waistToAnkle_px

  const X0 = 0
  const Y0 = 0
  const X_center = frameWidth / 2 + ease.x_center_offset

  const Y_waist = 0
  const Y_hip = waistToHip_px
  const Y_crotch = crotchDepth_px + ease.crotch_ease
  const Y_midrise = Y_crotch / 2
  const Y_knee = waistToKnee_px
  const Y_length = waistToAnkle_px

  // Crotch extensions (using ease variables directly)
  const FrontCrotchPoint = X0 - ease.front_crotch_extension
  const BackCrotchPoint = frameWidth + ease.back_crotch_extension

  // Rise coordinates (using ease variables)
  const front_waist_anchor_x = ease.front_rise_x
  const front_waist_anchor_y = ease.front_rise_y
  const back_waist_rise = -ease.back_rise

  // Waistline calculations
  const waist_length = waist_px / 4
  const front_waist_end_x = front_waist_anchor_x + Math.sqrt(Math.pow(waist_length, 2) - Math.pow(front_waist_anchor_y, 2))

  // Back waistline calculations (using ease variables)
  const back_waist_start_x = frameWidth - ease.back_waist_offset - (ease.back_rise * ease.back_waist_offset / Y_hip)
  const back_waist_end_x = back_waist_start_x - Math.sqrt(Math.pow(waist_length, 2) - Math.pow(ease.back_rise, 2))

  // Hemline calculations (using ease variables)
  const FrontHem = (hemlineCircumference_px / 2) + ease.front_hem_ease
  const BackHem = (hemlineCircumference_px / 2) + ease.back_hem_ease

  // Creaseline calculations
  const D = (X_center - FrontCrotchPoint) / 2
  const front_crease_x = (FrontCrotchPoint + X_center) / 2
  const back_crease_x = X_center + D

  // Front crease Y calculation
  const front_slope = (0 - front_waist_anchor_y) / (front_waist_end_x - front_waist_anchor_x)
  const front_crease_y = front_waist_anchor_y + front_slope * (front_crease_x - front_waist_anchor_x)

  // Back crease Y calculation
  const back_slope = (0 - back_waist_rise) / (back_waist_end_x - back_waist_start_x)
  const back_crease_y = back_waist_rise + back_slope * (back_crease_x - back_waist_start_x)

  // Front inseam calculations (using ease variables)
  const hem_left_x = front_crease_x - (FrontHem / 2)
  const inseam_slope = (Y_crotch - Y_length) / (FrontCrotchPoint - hem_left_x)
  const knee_seam_x = hem_left_x + (Y_knee - Y_length) / inseam_slope
  const knee_line = front_crease_x - knee_seam_x - ease.front_knee_ease

  // Step 3: Calculate SVG Bounds (base values; final viewBox computed in generateSVG)
  const min_x = FrontCrotchPoint
  const max_x = BackCrotchPoint
  const min_y = back_waist_rise
  const max_y = Y_length
  const padding = 10

  const viewBox_x = min_x - padding
  const viewBox_y = min_y - padding
  const viewBox_width = (max_x - min_x) + (2 * padding)
  const viewBox_height = (max_y - min_y) + (2 * padding)

  return {
    // Dimensions
    frameWidth, frameHeight, X0, Y0, X_center,
    // Y positions
    Y_waist, Y_hip, Y_crotch, Y_midrise, Y_knee, Y_length,
    // Crotch points
    FrontCrotchPoint, BackCrotchPoint,
    // Fixed coords
    front_waist_anchor_x, front_waist_anchor_y, back_waist_rise,
    // Waistline
    waist_length, front_waist_end_x, back_waist_start_x, back_waist_end_x,
    // Hemline
    FrontHem, BackHem,
    // Creaselines
    D, front_crease_x, front_crease_y, back_crease_x, back_crease_y,
    // Knee
    hem_left_x, knee_seam_x, knee_line,
    // ViewBox
    viewBox_x, viewBox_y, viewBox_width, viewBox_height,
    // Pass through ease and curves
    ease, curves
  }
}

/**
 * Build the closed outline of the front piece as an ordered array of segments
 */
function buildFrontPieceSegments(calc, v) {
  return [
    // Center line up to waist anchor
    { type: 'line', p1: {x: 0, y: calc.Y_hip}, p2: {x: calc.front_waist_anchor_x, y: calc.front_waist_anchor_y} },
    // Front waistline curve seg1
    { type: 'cubic', p0: {x: calc.front_waist_anchor_x, y: calc.front_waist_anchor_y},
      cp1: {x: calc.front_waist_anchor_x, y: calc.front_waist_anchor_y},
      cp2: {x: v.front_CP2_x, y: v.front_CP2_y},
      p3: {x: v.front_P3_x, y: v.front_P3_y} },
    // Front waistline curve seg2
    { type: 'cubic', p0: {x: v.front_P3_x, y: v.front_P3_y},
      cp1: {x: v.front_CP3_x, y: v.front_CP3_y},
      cp2: {x: calc.front_waist_end_x, y: 0},
      p3: {x: calc.front_waist_end_x, y: 0} },
    // Front sideseam curve (reversed: waist → peak)
    { type: 'cubic', p0: {x: calc.front_waist_end_x, y: 0},
      cp1: {x: v.fs_seg2_CP2_x, y: v.fs_seg2_CP2_y},
      cp2: {x: v.fs_seg2_CP1_x, y: v.fs_seg2_CP1_y},
      p3: {x: v.peak_x, y: v.peak_y} },
    // Front sideseam curve (reversed: peak → knee)
    { type: 'cubic', p0: {x: v.peak_x, y: v.peak_y},
      cp1: {x: v.fs_seg1_CP2_x, y: v.fs_seg1_CP2_y},
      cp2: {x: v.fs_seg1_CP1_x, y: v.fs_seg1_CP1_y},
      p3: {x: v.sideseam_knee_x, y: v.sideseam_knee_y} },
    // Front sideseam straight (knee → hem)
    { type: 'line', p1: {x: v.sideseam_knee_x, y: v.sideseam_knee_y}, p2: {x: calc.front_crease_x + calc.FrontHem/2, y: calc.Y_length} },
    // Front hemline (right → left)
    { type: 'line', p1: {x: calc.front_crease_x + calc.FrontHem/2, y: calc.Y_length}, p2: {x: calc.hem_left_x, y: calc.Y_length} },
    // Front inseam straight (hem → knee)
    { type: 'line', p1: {x: calc.hem_left_x, y: calc.Y_length}, p2: {x: v.front_inseam_P0_x, y: v.front_inseam_P0_y} },
    // Front inseam curve (knee → crotch)
    { type: 'cubic', p0: {x: v.front_inseam_P0_x, y: v.front_inseam_P0_y},
      cp1: {x: v.front_inseam_CP1_x, y: v.front_inseam_CP1_y},
      cp2: {x: v.front_inseam_CP2_x, y: v.front_inseam_CP2_y},
      p3: {x: calc.FrontCrotchPoint, y: calc.Y_crotch} },
    // Front crotch curve (crotch → hip)
    { type: 'cubic', p0: {x: calc.FrontCrotchPoint, y: calc.Y_crotch},
      cp1: {x: v.front_CP1_x, y: v.front_CP1_y},
      cp2: {x: v.front_CP2_curve_x, y: v.front_CP2_curve_y},
      p3: {x: 0, y: calc.Y_hip} },
  ]
}

/**
 * Build the closed outline of the back piece as an ordered array of segments
 */
function buildBackPieceSegments(calc, v) {
  return [
    // Center diagonal 1 (hip → top)
    { type: 'line', p1: {x: calc.frameWidth, y: calc.Y_hip}, p2: {x: calc.frameWidth - calc.ease.back_waist_offset, y: 0} },
    // Center diagonal 2 (top → waist rise)
    { type: 'line', p1: {x: calc.frameWidth - calc.ease.back_waist_offset, y: 0}, p2: {x: v.back_diag_end_x, y: calc.back_waist_rise} },
    // Back waistline curve seg1
    { type: 'cubic', p0: {x: v.back_diag_end_x, y: calc.back_waist_rise},
      cp1: {x: v.back_diag_end_x, y: calc.back_waist_rise},
      cp2: {x: v.back_CP2_x, y: v.back_CP2_y},
      p3: {x: v.back_P3_x, y: v.back_P3_y} },
    // Back waistline curve seg2
    { type: 'cubic', p0: {x: v.back_P3_x, y: v.back_P3_y},
      cp1: {x: v.back_CP3_x, y: v.back_CP3_y},
      cp2: {x: calc.back_waist_end_x, y: 0},
      p3: {x: calc.back_waist_end_x, y: 0} },
    // Back inseam curve (reversed seg2: waist → hip_peak)
    { type: 'cubic', p0: {x: calc.back_waist_end_x, y: 0},
      cp1: {x: v.bi_seg2_CP2_x, y: v.bi_seg2_CP2_y},
      cp2: {x: v.bi_seg2_CP1_x, y: v.bi_seg2_CP1_y},
      p3: {x: v.hip_peak_x, y: v.hip_peak_y} },
    // Back inseam curve (reversed seg1: hip_peak → knee)
    { type: 'cubic', p0: {x: v.hip_peak_x, y: v.hip_peak_y},
      cp1: {x: v.bi_seg1_CP2_x, y: v.bi_seg1_CP2_y},
      cp2: {x: v.bi_seg1_CP1_x, y: v.bi_seg1_CP1_y},
      p3: {x: v.back_inseam_knee_x, y: calc.Y_knee} },
    // Back inseam straight (knee → hem)
    { type: 'line', p1: {x: v.back_inseam_knee_x, y: calc.Y_knee}, p2: {x: v.back_hem_left_x, y: calc.Y_length} },
    // Back hemline (left → right)
    { type: 'line', p1: {x: v.back_hem_left_x, y: calc.Y_length}, p2: {x: v.back_hem_right_x, y: calc.Y_length} },
    // Back sideseam straight (hem → knee)
    { type: 'line', p1: {x: v.back_hem_right_x, y: calc.Y_length}, p2: {x: v.back_sideseam_knee_x, y: calc.Y_knee} },
    // Back sideseam curve seg1 (knee → mid_thigh)
    { type: 'cubic', p0: {x: v.back_sideseam_knee_x, y: calc.Y_knee},
      cp1: {x: v.back_sideseam_knee_x, y: calc.Y_knee},
      cp2: {x: v.bs_seg1_CP2_x, y: v.bs_seg1_CP2_y},
      p3: {x: v.mid_thigh_x, y: v.mid_thigh_y} },
    // Back sideseam curve seg2 (mid_thigh → crotch)
    { type: 'cubic', p0: {x: v.mid_thigh_x, y: v.mid_thigh_y},
      cp1: {x: v.bs_seg2_CP1_x, y: v.bs_seg2_CP1_y},
      cp2: {x: calc.BackCrotchPoint, y: calc.Y_crotch},
      p3: {x: calc.BackCrotchPoint, y: calc.Y_crotch} },
    // Back crotch curve (crotch → hip)
    { type: 'cubic', p0: {x: calc.BackCrotchPoint, y: calc.Y_crotch},
      cp1: {x: v.back_CP1_x, y: v.back_CP1_y},
      cp2: {x: v.back_CP2_curve_x, y: v.back_CP2_curve_y},
      p3: {x: calc.frameWidth, y: calc.Y_hip} },
  ]
}

/**
 * Generate SVG markup for the trousers pattern
 * @param {Object} calc - Calculated pattern dimensions from calculatePattern()
 * @param {number} seamAllowancePx - Seam allowance in pixels (0 = disabled)
 * @returns {string} SVG markup
 */
export function generateSVG(calc, seamAllowancePx = 0) {
  const { ease, curves } = calc

  const dottedStyle = 'stroke="#b2b2b2" stroke-width="1" stroke-dasharray="1,1"'
  const solidStyle = 'stroke="black" stroke-width="2"'
  const interactiveCurve = (section) => `class="interactive-curve" data-curve-section="${section}" stroke="black" stroke-width="2" fill="none"`

  // Front waistline control points (using bezier variables)
  const front_CP2_x = calc.front_waist_anchor_x + (curves.front_waist_CP2_ratio_x * calc.waist_length)
  const front_CP2_y = calc.front_waist_anchor_y + (curves.front_waist_CP2_ratio_y * calc.waist_length)
  const front_P3_x = calc.front_waist_anchor_x + (curves.front_waist_P3_ratio_x * calc.waist_length)
  const front_P3_y = calc.front_waist_anchor_y
  const front_CP3_x = calc.front_waist_anchor_x + (curves.front_waist_CP3_ratio_x * calc.waist_length)
  const front_CP3_y = calc.front_waist_anchor_y + (curves.front_waist_CP3_ratio_y * calc.waist_length)

  // Back waistline control points (using bezier variables)
  const back_CP2_x = calc.back_waist_start_x + (curves.back_waist_CP2_ratio_x * calc.waist_length)
  const back_CP2_y = calc.back_waist_rise + (curves.back_waist_CP2_ratio_y * calc.waist_length)
  const back_P3_x = calc.back_waist_start_x + (curves.back_waist_P3_ratio_x * calc.waist_length)
  const back_P3_y = calc.back_waist_rise + (curves.back_waist_P3_ratio_y * calc.waist_length)
  const back_CP3_x = calc.back_waist_start_x + (curves.back_waist_CP3_ratio_x * calc.waist_length)
  const back_CP3_y = calc.back_waist_rise + (curves.back_waist_CP3_ratio_y * calc.waist_length)

  // Front crotch curve control points (using bezier variables)
  const front_CP1_x = calc.FrontCrotchPoint + curves.front_crotch_h_tension * (calc.X0 - calc.FrontCrotchPoint)
  const front_CP1_y = calc.Y_crotch
  const front_CP2_curve_x = 0
  const front_CP2_curve_y = calc.Y_crotch - curves.front_crotch_v_tension * (calc.Y_crotch - calc.Y_hip)

  // Back crotch curve control points (using bezier variables)
  const back_CP1_x = calc.BackCrotchPoint + curves.back_crotch_h_tension * (calc.frameWidth - calc.BackCrotchPoint)
  const back_CP1_y = calc.Y_crotch
  const back_CP2_curve_x = calc.frameWidth
  const back_CP2_curve_y = calc.Y_crotch - curves.back_crotch_v_tension * (calc.Y_crotch - calc.Y_hip)

  // Back diagonal calculations (using ease variables)
  const slope = calc.Y_hip / ease.back_waist_offset
  const back_diag_end_x = (calc.frameWidth - ease.back_waist_offset) - (ease.back_rise / slope)

  // Front inseam curve control points (using bezier variables)
  const front_inseam_P0_x = calc.front_crease_x - calc.knee_line
  const front_inseam_P0_y = calc.Y_knee
  const front_inseam_CP1_x = front_inseam_P0_x + curves.front_inseam_CP1_ratio_x * (calc.FrontCrotchPoint - front_inseam_P0_x)
  const front_inseam_CP1_y = calc.Y_knee - curves.front_inseam_CP1_ratio_y * (calc.Y_knee - calc.Y_crotch)
  const front_inseam_CP2_x = front_inseam_P0_x + curves.front_inseam_CP2_ratio_x * (calc.FrontCrotchPoint - front_inseam_P0_x)
  const front_inseam_CP2_y = calc.Y_knee - curves.front_inseam_CP2_ratio_y * (calc.Y_knee - calc.Y_crotch)

  // Front sideseam calculations (using ease variables)
  const sideseam_knee_x = calc.front_crease_x + calc.knee_line
  const sideseam_knee_y = calc.Y_knee
  const peak_x = calc.X_center + ease.sideseam_hip_ease
  const peak_y = calc.Y_hip

  // Segment 1: Knee to Peak (using bezier variables)
  const fs_seg1_CP1_x = sideseam_knee_x + curves.front_side_seg1_CP1_ratio_x * (peak_x - sideseam_knee_x)
  const fs_seg1_CP1_y = sideseam_knee_y - curves.front_side_seg1_CP1_ratio_y * (sideseam_knee_y - peak_y)
  const fs_seg1_CP2_x = sideseam_knee_x + curves.front_side_seg1_CP2_ratio_x * (peak_x - sideseam_knee_x)
  const fs_seg1_CP2_y = sideseam_knee_y - curves.front_side_seg1_CP2_ratio_y * (sideseam_knee_y - peak_y)

  // Segment 2: Peak to Waist (using bezier variables)
  const fs_seg2_CP1_x = peak_x - curves.front_side_seg2_CP1_ratio_x * (peak_x - calc.front_waist_end_x)
  const fs_seg2_CP1_y = peak_y - curves.front_side_seg2_CP1_ratio_y * (peak_y - 0)
  const fs_seg2_CP2_x = peak_x - curves.front_side_seg2_CP2_ratio_x * (peak_x - calc.front_waist_end_x)
  const fs_seg2_CP2_y = peak_y - curves.front_side_seg2_CP2_ratio_y * (peak_y - 0)

  // Back seam calculations (using ease variables)
  const back_hem_left_x = calc.back_crease_x - (calc.BackHem / 2)
  const back_hem_right_x = calc.back_crease_x + (calc.BackHem / 2)
  const back_inseam_knee_x = calc.back_crease_x - (calc.knee_line + ease.back_knee_ease)
  const back_sideseam_knee_x = calc.back_crease_x + (calc.knee_line + ease.back_knee_ease)

  // Back inseam curve (using ease and bezier variables)
  const hip_peak_x = calc.X_center + ease.back_inseam_hip_offset_x
  const hip_peak_y = calc.Y_hip + ease.back_inseam_hip_offset_y
  const bi_seg1_CP1_x = back_inseam_knee_x - curves.back_inseam_seg1_CP1_ratio_x * (back_inseam_knee_x - hip_peak_x)
  const bi_seg1_CP1_y = calc.Y_knee - curves.back_inseam_seg1_CP1_ratio_y * (calc.Y_knee - hip_peak_y)
  const bi_seg1_CP2_x = back_inseam_knee_x - curves.back_inseam_seg1_CP2_ratio_x * (back_inseam_knee_x - hip_peak_x)
  const bi_seg1_CP2_y = calc.Y_knee - curves.back_inseam_seg1_CP2_ratio_y * (calc.Y_knee - hip_peak_y)

  const bi_seg2_CP1_x = hip_peak_x + curves.back_inseam_seg2_CP1_ratio_x * (calc.back_waist_end_x - hip_peak_x)
  const bi_seg2_CP1_y = hip_peak_y - curves.back_inseam_seg2_CP1_ratio_y * (hip_peak_y - 0)
  const bi_seg2_CP2_x = hip_peak_x + curves.back_inseam_seg2_CP2_ratio_x * (calc.back_waist_end_x - hip_peak_x)
  const bi_seg2_CP2_y = hip_peak_y - curves.back_inseam_seg2_CP2_ratio_y * (hip_peak_y - 0)

  // Back sideseam curve (using ease and bezier variables)
  const mid_thigh_x = back_sideseam_knee_x + ease.back_sideseam_thigh_offset_x
  const mid_thigh_y = calc.Y_knee - ease.back_sideseam_thigh_offset_y
  const bs_seg1_CP2_x = back_sideseam_knee_x + curves.back_side_seg1_CP2_ratio_x * (mid_thigh_x - back_sideseam_knee_x)
  const bs_seg1_CP2_y = calc.Y_knee - curves.back_side_seg1_CP2_ratio_y * (calc.Y_knee - mid_thigh_y)

  const bs_seg2_CP1_x = mid_thigh_x + curves.back_side_seg2_CP1_ratio_x * (calc.BackCrotchPoint - mid_thigh_x)
  const bs_seg2_CP1_y = mid_thigh_y - curves.back_side_seg2_CP1_ratio_y * (mid_thigh_y - calc.Y_crotch)

  // Collect all derived vars for segment builders
  const v = {
    front_CP2_x, front_CP2_y, front_P3_x, front_P3_y, front_CP3_x, front_CP3_y,
    back_CP2_x, back_CP2_y, back_P3_x, back_P3_y, back_CP3_x, back_CP3_y,
    front_CP1_x, front_CP1_y, front_CP2_curve_x, front_CP2_curve_y,
    back_CP1_x, back_CP1_y, back_CP2_curve_x, back_CP2_curve_y,
    back_diag_end_x,
    front_inseam_P0_x, front_inseam_P0_y, front_inseam_CP1_x, front_inseam_CP1_y, front_inseam_CP2_x, front_inseam_CP2_y,
    sideseam_knee_x, sideseam_knee_y, peak_x, peak_y,
    fs_seg1_CP1_x, fs_seg1_CP1_y, fs_seg1_CP2_x, fs_seg1_CP2_y,
    fs_seg2_CP1_x, fs_seg2_CP1_y, fs_seg2_CP2_x, fs_seg2_CP2_y,
    back_hem_left_x, back_hem_right_x, back_inseam_knee_x, back_sideseam_knee_x,
    hip_peak_x, hip_peak_y,
    bi_seg1_CP1_x, bi_seg1_CP1_y, bi_seg1_CP2_x, bi_seg1_CP2_y,
    bi_seg2_CP1_x, bi_seg2_CP1_y, bi_seg2_CP2_x, bi_seg2_CP2_y,
    mid_thigh_x, mid_thigh_y,
    bs_seg1_CP2_x, bs_seg1_CP2_y, bs_seg2_CP1_x, bs_seg2_CP1_y
  }

  // Compute piece outlines (needed for both seam allowance and piece separation)
  const frontSegs = buildFrontPieceSegments(calc, v)
  const backSegs = buildBackPieceSegments(calc, v)
  const frontPoly = segmentsToPolyline(frontSegs)
  const backPoly = segmentsToPolyline(backSegs)

  // Seam allowance
  const saPx = seamAllowancePx
  const toPoints = (pts) => pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

  let frontOffsetPoly = null
  let backOffsetPoly = null
  let seamAllowanceFrontSvg = ''
  let seamAllowanceBackSvg = ''

  if (saPx > 0) {
    frontOffsetPoly = offsetPolygon(frontPoly, saPx)
    backOffsetPoly = offsetPolygon(backPoly, saPx)
    seamAllowanceFrontSvg = `
    <g id="front_seam_allowance" class="seam-allowance">
      <polygon points="${toPoints(frontOffsetPoly)}" fill="none" stroke="#e74c3c" stroke-width="1" stroke-dasharray="4,2"/>
    </g>`
    seamAllowanceBackSvg = `
    <g id="back_seam_allowance" class="seam-allowance">
      <polygon points="${toPoints(backOffsetPoly)}" fill="none" stroke="#e74c3c" stroke-width="1" stroke-dasharray="4,2"/>
    </g>`
  }

  // Calculate piece separation: 2cm gap between outermost edges (including SA if enabled)
  let frontMaxX, backMinX
  if (frontOffsetPoly) {
    frontMaxX = Math.max(...frontOffsetPoly.map(p => p.x))
    backMinX = Math.min(...backOffsetPoly.map(p => p.x))
  } else {
    frontMaxX = Math.max(...frontPoly.map(p => p.x))
    backMinX = Math.min(...backPoly.map(p => p.x))
  }
  const gapPx = 20 // 2cm
  const backShift = Math.max(0, frontMaxX - backMinX + gapPx)

  // Recompute viewBox to account for piece separation
  const padVal = 10 + (saPx > 0 ? saPx : 0)
  const vbX = calc.FrontCrotchPoint - padVal
  const vbY = calc.back_waist_rise - padVal
  const vbWidth = (calc.BackCrotchPoint + backShift - calc.FrontCrotchPoint) + 2 * padVal
  const vbHeight = (calc.Y_length - calc.back_waist_rise) + 2 * padVal

  // Construction line horizontal extent
  const clX1 = calc.FrontCrotchPoint
  const clX2 = calc.BackCrotchPoint + backShift

  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
     width="${vbWidth}" height="${vbHeight}"
     viewBox="${vbX} ${vbY} ${vbWidth} ${vbHeight}">

  ${seamAllowanceFrontSvg}

  <!-- Horizontal Construction Lines -->
  <g id="Hip">
    <line x1="${clX1}" y1="${calc.Y_hip}" x2="${clX2}" y2="${calc.Y_hip}" ${dottedStyle}/>
  </g>
  <g id="Crotch">
    <line x1="${clX1}" y1="${calc.Y_crotch}" x2="${clX2}" y2="${calc.Y_crotch}" ${dottedStyle}/>
  </g>
  <g id="Knee">
    <line x1="${clX1}" y1="${calc.Y_knee}" x2="${clX2}" y2="${calc.Y_knee}" ${dottedStyle}/>
  </g>
  <g id="midrise">
    <line x1="${clX1}" y1="${calc.Y_midrise}" x2="${clX2}" y2="${calc.Y_midrise}" ${dottedStyle}/>
  </g>

  <!-- Front Piece Frame -->
  <g id="frame">
    <line x1="${calc.X0}" y1="${calc.Y0}" x2="${calc.X0}" y2="${calc.frameHeight}" ${dottedStyle}/>
    <line x1="${calc.X0}" y1="${calc.Y0}" x2="${calc.X_center}" y2="${calc.Y0}" ${dottedStyle}/>
  </g>
  <g id="center_line">
    <line x1="${calc.X_center}" y1="${calc.Y_length}" x2="${calc.X_center}" y2="${calc.Y_waist}" ${dottedStyle}/>
    <text x="${calc.X_center / 2}" y="${calc.Y_hip - 5}" font-size="11" opacity="0.5" text-anchor="middle">FRONT</text>
  </g>
  <g id="crotch_extension">
    <line x1="${calc.FrontCrotchPoint}" y1="${calc.Y_crotch}" x2="${calc.X_center}" y2="${calc.Y_crotch}" ${dottedStyle}/>
  </g>
  <g id="creaselines">
    <line x1="${calc.front_crease_x}" y1="${calc.front_crease_y}" x2="${calc.front_crease_x}" y2="${calc.Y_length}" ${dottedStyle}/>
  </g>

  <!-- Front Center (Diagonal + Curve) -->
  <g id="front_center_curve">
    <line x1="0" y1="${calc.Y_hip}" x2="${calc.front_waist_anchor_x}" y2="${calc.front_waist_anchor_y}" ${solidStyle}/>
    <path d="M ${calc.FrontCrotchPoint},${calc.Y_crotch} C ${front_CP1_x},${front_CP1_y} ${front_CP2_curve_x},${front_CP2_curve_y} 0,${calc.Y_hip}" ${interactiveCurve('crotch')}/>
  </g>

  <!-- Front Waistline -->
  <g id="front_waistline">
    <path d="M ${calc.front_waist_anchor_x},${calc.front_waist_anchor_y} C ${calc.front_waist_anchor_x},${calc.front_waist_anchor_y} ${front_CP2_x},${front_CP2_y} ${front_P3_x},${front_P3_y} C ${front_CP3_x},${front_CP3_y} ${calc.front_waist_end_x},0 ${calc.front_waist_end_x},0" ${interactiveCurve('front_waist')}/>
    <line x1="${calc.front_waist_end_x}" y1="0" x2="${calc.X_center}" y2="${calc.Y_hip}" ${dottedStyle}/>
  </g>

  <!-- Front Hemline -->
  <g id="hemline">
    <line x1="${calc.front_crease_x}" y1="${calc.Y_length}" x2="${calc.front_crease_x - calc.FrontHem/2}" y2="${calc.Y_length}" ${solidStyle}/>
    <line x1="${calc.front_crease_x}" y1="${calc.Y_length}" x2="${calc.front_crease_x + calc.FrontHem/2}" y2="${calc.Y_length}" ${solidStyle}/>
  </g>

  <!-- Front Inseam -->
  <g id="front_inseam">
    <line x1="${calc.hem_left_x}" y1="${calc.Y_length}" x2="${calc.FrontCrotchPoint}" y2="${calc.Y_crotch}" ${dottedStyle}/>
    <line x1="${calc.hem_left_x}" y1="${calc.Y_length}" x2="${front_inseam_P0_x}" y2="${calc.Y_knee}" ${solidStyle}/>
    <path d="M ${front_inseam_P0_x},${front_inseam_P0_y} C ${front_inseam_CP1_x},${front_inseam_CP1_y} ${front_inseam_CP2_x},${front_inseam_CP2_y} ${calc.FrontCrotchPoint},${calc.Y_crotch}" ${interactiveCurve('front_inseam')}/>
    <line x1="0" y1="${calc.Y_knee}" x2="${calc.knee_seam_x}" y2="${calc.Y_knee}" ${dottedStyle}/>
  </g>

  <!-- Front Sideseam -->
  <g id="front_sideseam">
    <line x1="${calc.front_crease_x + calc.FrontHem/2}" y1="${calc.Y_length}" x2="${sideseam_knee_x}" y2="${calc.Y_knee}" ${solidStyle}/>
    <path d="M ${sideseam_knee_x},${sideseam_knee_y} C ${fs_seg1_CP1_x},${fs_seg1_CP1_y} ${fs_seg1_CP2_x},${fs_seg1_CP2_y} ${peak_x},${peak_y} C ${fs_seg2_CP1_x},${fs_seg2_CP1_y} ${fs_seg2_CP2_x},${fs_seg2_CP2_y} ${calc.front_waist_end_x},0" ${interactiveCurve('front_side')}/>
  </g>

  <!-- Back Piece (shifted) -->
  <g transform="translate(${backShift}, 0)">
    ${seamAllowanceBackSvg}

    <!-- Back Piece Frame -->
    <g id="vertical_edge">
      <line x1="${calc.frameWidth}" y1="0" x2="${calc.frameWidth}" y2="${calc.Y_crotch}" ${dottedStyle}/>
    </g>
    <g>
      <line x1="${calc.X_center}" y1="0" x2="${calc.frameWidth}" y2="0" ${dottedStyle}/>
    </g>
    <g>
      <line x1="${calc.X_center}" y1="${calc.Y_length}" x2="${calc.X_center}" y2="${calc.Y_waist}" ${dottedStyle}/>
      <text x="${calc.X_center + (calc.frameWidth - calc.X_center) / 2}" y="${calc.Y_hip - 5}" font-size="11" opacity="0.5" text-anchor="middle">BACK</text>
    </g>
    <g>
      <line x1="${calc.X_center}" y1="${calc.Y_crotch}" x2="${calc.BackCrotchPoint}" y2="${calc.Y_crotch}" ${dottedStyle}/>
    </g>
    <g>
      <line x1="${calc.back_crease_x}" y1="${calc.back_crease_y}" x2="${calc.back_crease_x}" y2="${calc.Y_length}" ${dottedStyle}/>
    </g>

    <!-- Back Center (Diagonal + Curve) -->
    <g id="back_center_curve">
      <line x1="${calc.frameWidth}" y1="${calc.Y_hip}" x2="${calc.frameWidth - ease.back_waist_offset}" y2="0" ${solidStyle}/>
      <line x1="${calc.frameWidth - ease.back_waist_offset}" y1="0" x2="${back_diag_end_x}" y2="${calc.back_waist_rise}" ${solidStyle}/>
      <path d="M ${calc.BackCrotchPoint},${calc.Y_crotch} C ${back_CP1_x},${back_CP1_y} ${back_CP2_curve_x},${back_CP2_curve_y} ${calc.frameWidth},${calc.Y_hip}" ${interactiveCurve('crotch')}/>
    </g>

    <!-- Back Waistline -->
    <g id="back_waistline">
      <path d="M ${calc.back_waist_start_x},${calc.back_waist_rise} C ${calc.back_waist_start_x},${calc.back_waist_rise} ${back_CP2_x},${back_CP2_y} ${back_P3_x},${back_P3_y} C ${back_CP3_x},${back_CP3_y} ${calc.back_waist_end_x},0 ${calc.back_waist_end_x},0" ${interactiveCurve('back_waist')}/>
      <line x1="${calc.back_waist_end_x}" y1="0" x2="${calc.X_center}" y2="${calc.Y_hip}" ${dottedStyle}/>
    </g>

    <!-- Back Hemline -->
    <g id="back_hemline">
      <line x1="${calc.back_crease_x}" y1="${calc.Y_length}" x2="${calc.back_crease_x + calc.BackHem/2}" y2="${calc.Y_length}" ${solidStyle}/>
      <line x1="${calc.back_crease_x}" y1="${calc.Y_length}" x2="${calc.back_crease_x - calc.BackHem/2}" y2="${calc.Y_length}" ${solidStyle}/>
    </g>

    <!-- Back Seam Markers -->
    <g id="back_seam_markers">
      <line x1="${back_hem_left_x}" y1="${calc.Y_length}" x2="${back_inseam_knee_x}" y2="${calc.Y_knee}" ${dottedStyle}/>
      <line x1="${back_hem_right_x}" y1="${calc.Y_length}" x2="${back_sideseam_knee_x}" y2="${calc.Y_knee}" ${dottedStyle}/>
      <circle cx="${back_inseam_knee_x}" cy="${calc.Y_knee}" r="2" fill="magenta"/>
      <circle cx="${back_sideseam_knee_x}" cy="${calc.Y_knee}" r="2" fill="magenta"/>
    </g>

    <!-- Back Inseam -->
    <g id="back_inseam">
      <line x1="${back_hem_left_x}" y1="${calc.Y_length}" x2="${back_inseam_knee_x}" y2="${calc.Y_knee}" ${solidStyle}/>
      <path d="M ${back_inseam_knee_x},${calc.Y_knee} C ${bi_seg1_CP1_x},${bi_seg1_CP1_y} ${bi_seg1_CP2_x},${bi_seg1_CP2_y} ${hip_peak_x},${hip_peak_y} C ${bi_seg2_CP1_x},${bi_seg2_CP1_y} ${bi_seg2_CP2_x},${bi_seg2_CP2_y} ${calc.back_waist_end_x},0" ${interactiveCurve('back_inseam')}/>
    </g>

    <!-- Back Sideseam -->
    <g id="back_sideseam">
      <line x1="${back_hem_right_x}" y1="${calc.Y_length}" x2="${back_sideseam_knee_x}" y2="${calc.Y_knee}" ${solidStyle}/>
      <path d="M ${back_sideseam_knee_x},${calc.Y_knee} C ${back_sideseam_knee_x},${calc.Y_knee} ${bs_seg1_CP2_x},${bs_seg1_CP2_y} ${mid_thigh_x},${mid_thigh_y} C ${bs_seg2_CP1_x},${bs_seg2_CP1_y} ${calc.BackCrotchPoint},${calc.Y_crotch} ${calc.BackCrotchPoint},${calc.Y_crotch}" ${interactiveCurve('back_side')}/>
    </g>
  </g>

</svg>`

  return svg
}
