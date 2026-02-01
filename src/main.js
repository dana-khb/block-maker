import './style.css'

// Variable registry - stores all available variables for expressions
const variables = {}

// Update variable registry with measurement values
function updateVariables() {
  // Get raw measurement inputs (these are always plain numbers in cm)
  const measurementIds = ['hip', 'waistToHip', 'waistToKnee', 'waistToAnkle', 'crotchDepth', 'waist', 'hemline']

  measurementIds.forEach(id => {
    const input = document.getElementById(id)
    if (input) {
      const val = parseFloat(input.value) || 0
      variables[id] = val                    // cm value
      variables[id + '_px'] = val * 10       // px value (1cm = 10px)
    }
  })

  // Calculate derived variables that depend on measurements
  // These need to evaluate expressions for hip_ease and x_center_offset
  const hip_px = variables.hip_px || 0
  const hip_ease = evaluateExpression(document.getElementById('hip_ease')?.value || '0')
  const x_center_offset = evaluateExpression(document.getElementById('x_center_offset')?.value || '0')

  const frameWidth = (hip_px / 2) + hip_ease
  variables.frameWidth = frameWidth
  variables.X_center = frameWidth / 2 + x_center_offset
}

// Expression parser - evaluates expressions with variables and basic math
function evaluateExpression(expr, contextVars = {}) {
  if (typeof expr === 'number') return expr
  if (typeof expr !== 'string') return 0

  // Trim whitespace
  expr = expr.trim()

  // If it's just a number, return it
  if (/^-?\d+\.?\d*$/.test(expr)) {
    return parseFloat(expr)
  }

  // Merge context variables with global variables
  const allVars = { ...variables, ...contextVars }

  // Replace variable names with their values (longer names first to avoid partial matches)
  const varNames = Object.keys(allVars).sort((a, b) => b.length - a.length)
  let evalExpr = expr

  for (const varName of varNames) {
    // Use word boundary matching to avoid partial replacements
    const regex = new RegExp(`\\b${varName}\\b`, 'g')
    evalExpr = evalExpr.replace(regex, allVars[varName])
  }

  // Validate: only allow numbers, operators, parentheses, spaces, and decimal points
  if (!/^[\d\s+\-*/().]+$/.test(evalExpr)) {
    console.warn('Invalid expression:', expr, '-> evaluated to:', evalExpr)
    return 0
  }

  try {
    // Use Function constructor for safe evaluation (no access to global scope)
    const result = new Function(`return (${evalExpr})`)()
    return isNaN(result) ? 0 : result
  } catch (e) {
    console.warn('Expression evaluation error:', expr, e)
    return 0
  }
}

// Get input value - now supports expressions
function getExprValue(id) {
  const input = document.getElementById(id)
  if (!input) return 0
  return evaluateExpression(input.value)
}

// Update computed value display for an input
function updateComputedDisplay(input) {
  let computedSpan = input.nextElementSibling
  if (!computedSpan || !computedSpan.classList.contains('computed-value')) {
    // Create span if it doesn't exist
    computedSpan = document.createElement('span')
    computedSpan.className = 'computed-value'
    input.parentElement.appendChild(computedSpan)
  }

  const value = evaluateExpression(input.value)
  const isExpression = !/^-?\d+\.?\d*$/.test(input.value.trim())
  if (isExpression && !isNaN(value)) {
    computedSpan.textContent = `= ${value.toFixed(2)}`
    computedSpan.style.display = 'inline'
  } else {
    computedSpan.style.display = 'none'
  }
}

// Default curve values for reset functionality
const DEFAULT_CURVES = {
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

// Get input value helper (for plain number inputs like measurements)
function getVal(id) {
  return parseFloat(document.getElementById(id).value) || 0
}

// Get all inputs from the form
function getAllInputs() {
  return {
    // Measurements (cm)
    measurements: {
      hip: getVal('hip'),
      waistToHip: getVal('waistToHip'),
      waistToKnee: getVal('waistToKnee'),
      waistToAnkle: getVal('waistToAnkle'),
      crotchDepth: getVal('crotchDepth'),
      waist: getVal('waist'),
      hemline: getVal('hemline')
    },
    // Ease variables (px) - support expressions
    ease: {
      hip_ease: getExprValue('hip_ease'),
      x_center_offset: getExprValue('x_center_offset'),
      crotch_ease: getExprValue('crotch_ease'),
      front_crotch_extension: getExprValue('front_crotch_extension'),
      back_crotch_extension: getExprValue('back_crotch_extension'),
      front_rise_x: getExprValue('front_rise_x'),
      front_rise_y: getExprValue('front_rise_y'),
      back_rise: getExprValue('back_rise'),
      back_waist_offset: getExprValue('back_waist_offset'),
      front_hem_ease: getExprValue('front_hem_ease'),
      back_hem_ease: getExprValue('back_hem_ease'),
      front_knee_ease: getExprValue('front_knee_ease'),
      back_knee_ease: getExprValue('back_knee_ease'),
      sideseam_hip_ease: getExprValue('sideseam_hip_ease'),
      back_inseam_hip_offset_x: getExprValue('back_inseam_hip_offset_x'),
      back_inseam_hip_offset_y: getExprValue('back_inseam_hip_offset_y'),
      back_sideseam_thigh_offset_x: getExprValue('back_sideseam_thigh_offset_x'),
      back_sideseam_thigh_offset_y: getExprValue('back_sideseam_thigh_offset_y')
    },
    // Bezier curve variables
    curves: {
      // Crotch curves
      front_crotch_h_tension: getVal('front_crotch_h_tension'),
      front_crotch_v_tension: getVal('front_crotch_v_tension'),
      back_crotch_h_tension: getVal('back_crotch_h_tension'),
      back_crotch_v_tension: getVal('back_crotch_v_tension'),
      // Front waistline
      front_waist_CP2_ratio_x: getVal('front_waist_CP2_ratio_x'),
      front_waist_CP2_ratio_y: getVal('front_waist_CP2_ratio_y'),
      front_waist_P3_ratio_x: getVal('front_waist_P3_ratio_x'),
      front_waist_CP3_ratio_x: getVal('front_waist_CP3_ratio_x'),
      front_waist_CP3_ratio_y: getVal('front_waist_CP3_ratio_y'),
      // Back waistline
      back_waist_CP2_ratio_x: getVal('back_waist_CP2_ratio_x'),
      back_waist_CP2_ratio_y: getVal('back_waist_CP2_ratio_y'),
      back_waist_P3_ratio_x: getVal('back_waist_P3_ratio_x'),
      back_waist_P3_ratio_y: getVal('back_waist_P3_ratio_y'),
      back_waist_CP3_ratio_x: getVal('back_waist_CP3_ratio_x'),
      back_waist_CP3_ratio_y: getVal('back_waist_CP3_ratio_y'),
      // Front inseam
      front_inseam_CP1_ratio_x: getVal('front_inseam_CP1_ratio_x'),
      front_inseam_CP1_ratio_y: getVal('front_inseam_CP1_ratio_y'),
      front_inseam_CP2_ratio_x: getVal('front_inseam_CP2_ratio_x'),
      front_inseam_CP2_ratio_y: getVal('front_inseam_CP2_ratio_y'),
      // Front sideseam
      front_side_seg1_CP1_ratio_x: getVal('front_side_seg1_CP1_ratio_x'),
      front_side_seg1_CP1_ratio_y: getVal('front_side_seg1_CP1_ratio_y'),
      front_side_seg1_CP2_ratio_x: getVal('front_side_seg1_CP2_ratio_x'),
      front_side_seg1_CP2_ratio_y: getVal('front_side_seg1_CP2_ratio_y'),
      front_side_seg2_CP1_ratio_x: getVal('front_side_seg2_CP1_ratio_x'),
      front_side_seg2_CP1_ratio_y: getVal('front_side_seg2_CP1_ratio_y'),
      front_side_seg2_CP2_ratio_x: getVal('front_side_seg2_CP2_ratio_x'),
      front_side_seg2_CP2_ratio_y: getVal('front_side_seg2_CP2_ratio_y'),
      // Back inseam
      back_inseam_seg1_CP1_ratio_x: getVal('back_inseam_seg1_CP1_ratio_x'),
      back_inseam_seg1_CP1_ratio_y: getVal('back_inseam_seg1_CP1_ratio_y'),
      back_inseam_seg1_CP2_ratio_x: getVal('back_inseam_seg1_CP2_ratio_x'),
      back_inseam_seg1_CP2_ratio_y: getVal('back_inseam_seg1_CP2_ratio_y'),
      back_inseam_seg2_CP1_ratio_x: getVal('back_inseam_seg2_CP1_ratio_x'),
      back_inseam_seg2_CP1_ratio_y: getVal('back_inseam_seg2_CP1_ratio_y'),
      back_inseam_seg2_CP2_ratio_x: getVal('back_inseam_seg2_CP2_ratio_x'),
      back_inseam_seg2_CP2_ratio_y: getVal('back_inseam_seg2_CP2_ratio_y'),
      // Back sideseam
      back_side_seg1_CP2_ratio_x: getVal('back_side_seg1_CP2_ratio_x'),
      back_side_seg1_CP2_ratio_y: getVal('back_side_seg1_CP2_ratio_y'),
      back_side_seg2_CP1_ratio_x: getVal('back_side_seg2_CP1_ratio_x'),
      back_side_seg2_CP1_ratio_y: getVal('back_side_seg2_CP1_ratio_y')
    }
  }
}

function calculatePattern(inputs) {
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

  // Step 3: Calculate SVG Bounds
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

function generateSVG(calc) {
  const { ease, curves } = calc

  const dottedStyle = 'stroke="#b2b2b2" stroke-width="1" stroke-dasharray="1,1"'
  const solidStyle = 'stroke="black" stroke-width="2"'
  const curveStyle = 'stroke="black" stroke-width="2" fill="none"'
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
     width="${calc.viewBox_width}" height="${calc.viewBox_height}"
     viewBox="${calc.viewBox_x} ${calc.viewBox_y} ${calc.viewBox_width} ${calc.viewBox_height}">

  <!-- Frame Definition -->
  <g id="frame">
    <line x1="${calc.X0}" y1="${calc.Y0}" x2="${calc.X0}" y2="${calc.frameHeight}" ${dottedStyle}/>
    <line x1="${calc.X0}" y1="${calc.Y0}" x2="${calc.frameWidth}" y2="${calc.Y0}" ${dottedStyle}/>
  </g>

  <!-- Horizontal Construction Lines -->
  <g id="Hip">
    <line x1="0" y1="${calc.Y_hip}" x2="${calc.frameWidth}" y2="${calc.Y_hip}" ${dottedStyle}/>
  </g>

  <g id="Crotch">
    <line x1="0" y1="${calc.Y_crotch}" x2="${calc.frameWidth}" y2="${calc.Y_crotch}" ${dottedStyle}/>
  </g>

  <g id="Knee">
    <line x1="0" y1="${calc.Y_knee}" x2="${calc.frameWidth}" y2="${calc.Y_knee}" ${dottedStyle}/>
  </g>

  <g id="midrise">
    <line x1="0" y1="${calc.Y_midrise}" x2="${calc.frameWidth}" y2="${calc.Y_midrise}" ${dottedStyle}/>
  </g>

  <g id="vertical_edge">
    <line x1="${calc.frameWidth}" y1="0" x2="${calc.frameWidth}" y2="${calc.Y_crotch}" ${dottedStyle}/>
  </g>

  <!-- Center Division -->
  <g id="center_line">
    <line x1="${calc.X_center}" y1="${calc.Y_length}" x2="${calc.X_center}" y2="${calc.Y_waist}" ${dottedStyle}/>
    <text x="${calc.X_center / 2}" y="${calc.Y_hip - 5}" font-size="11" opacity="0.5" text-anchor="middle">FRONT</text>
    <text x="${calc.X_center + (calc.frameWidth - calc.X_center) / 2}" y="${calc.Y_hip - 5}" font-size="11" opacity="0.5" text-anchor="middle">BACK</text>
  </g>

  <!-- Crotch Extensions -->
  <g id="crotch_extension">
    <line x1="${calc.FrontCrotchPoint}" y1="${calc.Y_crotch}" x2="${calc.BackCrotchPoint}" y2="${calc.Y_crotch}" ${dottedStyle}/>
  </g>

  <!-- Front Center (Diagonal + Curve) -->
  <g id="front_center_curve">
    <line x1="0" y1="${calc.Y_hip}" x2="${calc.front_waist_anchor_x}" y2="${calc.front_waist_anchor_y}" ${solidStyle}/>
    <path d="M ${calc.FrontCrotchPoint},${calc.Y_crotch} C ${front_CP1_x},${front_CP1_y} ${front_CP2_curve_x},${front_CP2_curve_y} 0,${calc.Y_hip}" ${interactiveCurve('crotch')}/>
  </g>

  <!-- Back Center (Diagonal + Curve) -->
  <g id="back_center_curve">
    <line x1="${calc.frameWidth}" y1="${calc.Y_hip}" x2="${calc.frameWidth - ease.back_waist_offset}" y2="0" ${solidStyle}/>
    <line x1="${calc.frameWidth - ease.back_waist_offset}" y1="0" x2="${back_diag_end_x}" y2="${calc.back_waist_rise}" ${solidStyle}/>
    <path d="M ${calc.BackCrotchPoint},${calc.Y_crotch} C ${back_CP1_x},${back_CP1_y} ${back_CP2_curve_x},${back_CP2_curve_y} ${calc.frameWidth},${calc.Y_hip}" ${interactiveCurve('crotch')}/>
  </g>

  <!-- Front Waistline -->
  <g id="front_waistline">
    <path d="M ${calc.front_waist_anchor_x},${calc.front_waist_anchor_y} C ${calc.front_waist_anchor_x},${calc.front_waist_anchor_y} ${front_CP2_x},${front_CP2_y} ${front_P3_x},${front_P3_y} C ${front_CP3_x},${front_CP3_y} ${calc.front_waist_end_x},0 ${calc.front_waist_end_x},0" ${interactiveCurve('front_waist')}/>
    <line x1="${calc.front_waist_end_x}" y1="0" x2="${calc.X_center}" y2="${calc.Y_hip}" ${dottedStyle}/>
  </g>

  <!-- Back Waistline -->
  <g id="back_waistline">
    <path d="M ${calc.back_waist_start_x},${calc.back_waist_rise} C ${calc.back_waist_start_x},${calc.back_waist_rise} ${back_CP2_x},${back_CP2_y} ${back_P3_x},${back_P3_y} C ${back_CP3_x},${back_CP3_y} ${calc.back_waist_end_x},0 ${calc.back_waist_end_x},0" ${interactiveCurve('back_waist')}/>
    <line x1="${calc.back_waist_end_x}" y1="0" x2="${calc.X_center}" y2="${calc.Y_hip}" ${dottedStyle}/>
  </g>

  <!-- Creaselines -->
  <g id="creaselines">
    <line x1="${calc.front_crease_x}" y1="${calc.front_crease_y}" x2="${calc.front_crease_x}" y2="${calc.Y_length}" ${dottedStyle}/>
    <line x1="${calc.back_crease_x}" y1="${calc.back_crease_y}" x2="${calc.back_crease_x}" y2="${calc.Y_length}" ${dottedStyle}/>
  </g>

  <!-- Hemline -->
  <g id="hemline">
    <line x1="${calc.front_crease_x}" y1="${calc.Y_length}" x2="${calc.front_crease_x - calc.FrontHem/2}" y2="${calc.Y_length}" ${solidStyle}/>
    <line x1="${calc.front_crease_x}" y1="${calc.Y_length}" x2="${calc.front_crease_x + calc.FrontHem/2}" y2="${calc.Y_length}" ${solidStyle}/>
    <line x1="${calc.back_crease_x}" y1="${calc.Y_length}" x2="${calc.back_crease_x + calc.BackHem/2}" y2="${calc.Y_length}" ${solidStyle}/>
    <line x1="${calc.back_crease_x}" y1="${calc.Y_length}" x2="${calc.back_crease_x - calc.BackHem/2}" y2="${calc.Y_length}" ${solidStyle}/>
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

</svg>`

  return svg
}

function updatePattern() {
  // Update variable registry first (measurements must be evaluated before expressions)
  updateVariables()

  // Update all computed value displays
  document.querySelectorAll('.input-panel input[type="text"]').forEach(input => {
    updateComputedDisplay(input)
  })

  const inputs = getAllInputs()
  const calc = calculatePattern(inputs)
  const svg = generateSVG(calc)
  document.getElementById('pattern-container').innerHTML = svg
}

// Tab switching
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn')
  const tabContents = document.querySelectorAll('.tab-content')

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab

      // Remove active from all
      tabBtns.forEach(b => b.classList.remove('active'))
      tabContents.forEach(c => c.classList.remove('active'))

      // Add active to clicked
      btn.classList.add('active')
      document.getElementById(`${tabId}-tab`).classList.add('active')
    })
  })
}

// Reset section to default values
function resetSection(section) {
  const defaults = DEFAULT_CURVES[section]
  if (!defaults) return

  for (const [id, value] of Object.entries(defaults)) {
    const input = document.getElementById(id)
    if (input) {
      input.value = value
    }
  }
  updatePattern()
}

// Setup reset buttons
function setupResetButtons() {
  const resetBtns = document.querySelectorAll('.reset-btn')
  resetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section
      resetSection(section)
    })
  })
}

// Highlight input groups for a curve section
function highlightSection(section) {
  const inputGroups = document.querySelectorAll(`[data-curve-section="${section}"]`)
  inputGroups.forEach(group => group.classList.add('highlighted'))
}

// Remove highlight from all input groups
function clearHighlights() {
  const highlighted = document.querySelectorAll('.input-group.highlighted')
  highlighted.forEach(group => group.classList.remove('highlighted'))
}

// Setup hover highlighting on SVG curves
function setupCurveHoverHighlighting() {
  const container = document.getElementById('pattern-container')

  container.addEventListener('mouseover', (e) => {
    const curve = e.target.closest('.interactive-curve')
    if (curve) {
      const section = curve.dataset.curveSection
      if (section) {
        // Switch to curves tab if not active
        const curvesTab = document.getElementById('curves-tab')
        if (!curvesTab.classList.contains('active')) {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
          document.querySelector('[data-tab="curves"]').classList.add('active')
          curvesTab.classList.add('active')
        }
        highlightSection(section)

        // Scroll the first highlighted input into view
        const firstHighlighted = document.querySelector(`[data-curve-section="${section}"]`)
        if (firstHighlighted) {
          firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  })

  container.addEventListener('mouseout', (e) => {
    const curve = e.target.closest('.interactive-curve')
    if (curve) {
      clearHighlights()
    }
  })
}

// Highlight SVG elements when input is focused
function highlightSvgElements(targetIds) {
  const container = document.getElementById('pattern-container')
  const svg = container.querySelector('svg')
  if (!svg) return

  targetIds.forEach(id => {
    const group = svg.getElementById(id)
    if (group) {
      group.classList.add('svg-highlighted')
    }
  })
}

// Clear SVG element highlights
function clearSvgHighlights() {
  const highlighted = document.querySelectorAll('#pattern-container svg g.svg-highlighted')
  highlighted.forEach(group => group.classList.remove('svg-highlighted'))
}

// Setup input focus highlighting
function setupInputFocusHighlighting() {
  const inputs = document.querySelectorAll('.input-panel input[data-svg-target]')

  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      const targets = input.dataset.svgTarget
      if (targets) {
        const targetIds = targets.split(',').map(t => t.trim())
        highlightSvgElements(targetIds)
      }
    })

    input.addEventListener('blur', () => {
      clearSvgHighlights()
    })
  })
}

// Track last focused expression input for variable insertion
let lastFocusedInput = null

// Setup variable tag clicks to insert variables into inputs
function setupVariableTagClicks() {
  const varTags = document.querySelectorAll('.variables-list .var-tag')

  varTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const varName = tag.dataset.var
      if (lastFocusedInput && varName) {
        // Insert variable at cursor position or append
        const input = lastFocusedInput
        const start = input.selectionStart
        const end = input.selectionEnd
        const value = input.value

        input.value = value.substring(0, start) + varName + value.substring(end)
        input.focus()

        // Set cursor position after inserted variable
        const newPos = start + varName.length
        input.setSelectionRange(newPos, newPos)

        updatePattern()
      }
    })
  })

  // Track last focused expression input
  document.querySelectorAll('#ease-tab input[type="text"]').forEach(input => {
    input.addEventListener('focus', () => {
      lastFocusedInput = input
    })
  })
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Setup tabs
  setupTabs()

  // Setup reset buttons
  setupResetButtons()

  // Initialize variables before first pattern generation
  updateVariables()

  // Generate initial pattern
  updatePattern()

  // Setup curve hover highlighting
  setupCurveHoverHighlighting()

  // Setup input focus highlighting
  setupInputFocusHighlighting()

  // Setup variable tag clicks
  setupVariableTagClicks()

  // Add event listeners for real-time updates on ALL inputs
  const inputs = document.querySelectorAll('.input-panel input')
  inputs.forEach(input => {
    input.addEventListener('input', updatePattern)
  })

  // Generate button
  document.getElementById('generate-btn').addEventListener('click', updatePattern)
})
