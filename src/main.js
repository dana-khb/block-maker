import './style.css'
import { jsPDF } from 'jspdf'
import 'svg2pdf.js'

// ---- Seam Allowance Utility Functions ----

function sampleCubicBezier(p0, cp1, cp2, p3, n = 40) {
  const points = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    const t2 = t * t
    const t3 = t2 * t
    points.push({
      x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p3.y
    })
  }
  return points
}

function segmentsToPolyline(segments, samplesPerCurve = 40) {
  const points = []
  for (const seg of segments) {
    if (seg.type === 'line') {
      if (points.length === 0) points.push(seg.p1)
      points.push(seg.p2)
    } else if (seg.type === 'cubic') {
      const sampled = sampleCubicBezier(seg.p0, seg.cp1, seg.cp2, seg.p3, samplesPerCurve)
      const start = points.length > 0 ? 1 : 0
      for (let i = start; i < sampled.length; i++) points.push(sampled[i])
    }
  }
  return points
}

function lineLineIntersect(a1, a2, b1, b2) {
  const dx1 = a2.x - a1.x, dy1 = a2.y - a1.y
  const dx2 = b2.x - b1.x, dy2 = b2.y - b1.y
  const denom = dx1 * dy2 - dy1 * dx2
  if (Math.abs(denom) < 1e-10) return null
  const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom
  return { x: a1.x + t * dx1, y: a1.y + t * dy1 }
}

function signedArea(points) {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return area / 2
}

function offsetPolygon(points, offset) {
  const N = points.length
  if (N < 3) return points

  const area = signedArea(points)
  const dir = area < 0 ? 1 : -1
  const off = offset * dir

  const offsetEdges = []
  for (let i = 0; i < N; i++) {
    const p1 = points[i]
    const p2 = points[(i + 1) % N]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1e-10) { offsetEdges.push(null); continue }
    const nx = -dy / len * off
    const ny = dx / len * off
    offsetEdges.push({
      p1: { x: p1.x + nx, y: p1.y + ny },
      p2: { x: p2.x + nx, y: p2.y + ny }
    })
  }

  const result = []
  for (let i = 0; i < N; i++) {
    const edgeA = offsetEdges[i]
    const edgeB = offsetEdges[(i + 1) % N]
    if (!edgeA || !edgeB) {
      if (edgeA) result.push(edgeA.p2)
      else if (edgeB) result.push(edgeB.p1)
      continue
    }
    const ix = lineLineIntersect(edgeA.p1, edgeA.p2, edgeB.p1, edgeB.p2)
    if (ix) {
      const mid = { x: (edgeA.p2.x + edgeB.p1.x) / 2, y: (edgeA.p2.y + edgeB.p1.y) / 2 }
      const dx = ix.x - mid.x, dy = ix.y - mid.y
      if (Math.sqrt(dx * dx + dy * dy) > Math.abs(offset) * 3) {
        result.push(edgeA.p2)
        result.push(edgeB.p1)
      } else {
        result.push(ix)
      }
    } else {
      result.push({ x: (edgeA.p2.x + edgeB.p1.x) / 2, y: (edgeA.p2.y + edgeB.p1.y) / 2 })
    }
  }
  return result
}

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

// Build the closed outline of the front piece as an ordered array of segments
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

// Build the closed outline of the back piece as an ordered array of segments
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
  const saToggle = document.getElementById('seam-allowance-toggle')
  const saInput = document.getElementById('seam-allowance-value')
  const saEnabled = saToggle && saToggle.checked
  const saCm = (saEnabled && saInput) ? (parseFloat(saInput.value) || 0) : 0
  const saPx = saCm * 10
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

// ---- Export to Print: Tiled A4 PDF ----

async function exportTiledPDF() {
  // Ensure pattern is current
  updatePattern()

  // Grab the SVG element
  const svgEl = document.querySelector('#pattern-container svg')
  if (!svgEl) {
    alert('No pattern to export. Generate a pattern first.')
    return
  }

  // Read viewBox
  const vb = svgEl.viewBox.baseVal
  const vbX = vb.x
  const vbY = vb.y
  const vbWidth = vb.width
  const vbHeight = vb.height

  // Convert to cm (10 SVG px = 1cm)
  const patternWidthCm = vbWidth / 10
  const patternHeightCm = vbHeight / 10

  // A4 paper dimensions in cm
  const paperW = 21
  const paperH = 29.7
  const edgeMargin = 1 // cm
  const usableW = paperW - 2 * edgeMargin // 19cm
  const usableH = paperH - 2 * edgeMargin // 27.7cm

  // Tile grid
  const tilesH = Math.ceil(patternWidthCm / usableW)
  const tilesV = Math.ceil(patternHeightCm / usableH)

  // SVG usable area in px (10px/cm)
  const usableWpx = usableW * 10 // 190
  const usableHpx = usableH * 10 // 277

  // Scale: 10 SVG units = 1cm on paper. Paper units in jsPDF are mm by default,
  // so 1cm = 10mm. Thus scale = 10mm / 10px = 1 mm/px.
  const scale = 1 // 1mm per SVG px

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const totalPages = tilesH * tilesV

  for (let row = 0; row < tilesV; row++) {
    for (let col = 0; col < tilesH; col++) {
      const pageNum = row * tilesH + col + 1

      // Add new page (first page is created automatically)
      if (pageNum > 1) doc.addPage()

      // SVG region for this tile
      const tileVbX = vbX + col * usableWpx
      const tileVbY = vbY + row * usableHpx
      // Clamp tile viewport to actual pattern extent
      const tileVbW = Math.min(usableWpx, vbX + vbWidth - tileVbX)
      const tileVbH = Math.min(usableHpx, vbY + vbHeight - tileVbY)

      // Clone SVG and set viewBox to this tile's region
      const clonedSvg = svgEl.cloneNode(true)
      clonedSvg.setAttribute('viewBox', `${tileVbX} ${tileVbY} ${tileVbW} ${tileVbH}`)
      clonedSvg.setAttribute('width', `${tileVbW * scale}mm`)
      clonedSvg.setAttribute('height', `${tileVbH * scale}mm`)

      // Render SVG into the PDF at the margin offset
      // edgeMargin in mm = 10
      const marginMm = edgeMargin * 10
      const usableWmm = usableW * 10
      const usableHmm = usableH * 10

      // Set clipping rectangle to usable area
      doc.saveGraphicsState()
      doc.rect(marginMm, marginMm, usableWmm, usableHmm)
      // Note: jsPDF clip via rect + clip path
      // We use the internal API for clipping
      doc.internal.write('W n')

      // Temporarily add cloned SVG to DOM for svg2pdf rendering
      clonedSvg.style.position = 'absolute'
      clonedSvg.style.left = '-9999px'
      document.body.appendChild(clonedSvg)

      try {
        await doc.svg(clonedSvg, {
          x: marginMm,
          y: marginMm,
          width: tileVbW * scale,
          height: tileVbH * scale
        })
      } finally {
        document.body.removeChild(clonedSvg)
      }

      doc.restoreGraphicsState()

      // ---- Draw alignment marks ----
      drawAlignmentMarks(doc, col, row, tilesH, tilesV, paperW, paperH)

      // ---- Draw page info ----
      drawPageInfo(doc, pageNum, totalPages, col, row, paperW, paperH)

      // ---- Scale verification square (page 1 only) ----
      if (pageNum === 1) {
        drawScaleSquare(doc, edgeMargin)
      }
    }
  }

  doc.save('pattern_tiled_a4.pdf')
}

function drawAlignmentMarks(doc, col, row, tilesH, tilesV, paperW, paperH) {
  const pw = paperW * 10 // mm
  const ph = paperH * 10 // mm
  const markOffset = 20 // 2cm = 20mm from edge

  doc.setDrawColor(153, 153, 153) // #999
  doc.setLineDashPattern([2, 2], 0)
  doc.setLineWidth(0.3)
  doc.setFontSize(6)
  doc.setTextColor(153, 153, 153)

  // Left internal edge (col > 0)
  if (col > 0) {
    doc.line(markOffset, 0, markOffset, ph)
    doc.text('Align edge \u2192', markOffset + 1, ph / 2, { angle: 90 })
  }

  // Right internal edge (col < tilesH - 1)
  if (col < tilesH - 1) {
    doc.line(pw - markOffset, 0, pw - markOffset, ph)
    doc.text('\u2190 Align edge', pw - markOffset - 1, ph / 2, { angle: 90 })
  }

  // Top internal edge (row > 0)
  if (row > 0) {
    doc.line(0, markOffset, pw, markOffset)
    doc.text('Align edge \u2193', pw / 2, markOffset + 3)
  }

  // Bottom internal edge (row < tilesV - 1)
  if (row < tilesV - 1) {
    doc.line(0, ph - markOffset, pw, ph - markOffset)
    doc.text('Align edge \u2191', pw / 2, ph - markOffset - 1)
  }

  // Reset dash pattern
  doc.setLineDashPattern([], 0)
}

function drawPageInfo(doc, pageNum, totalPages, col, row, paperW, paperH) {
  const pw = paperW * 10
  const ph = paperH * 10

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Page ${pageNum} of ${totalPages}  (Row ${row + 1}, Col ${col + 1})`, pw / 2, ph - 3, { align: 'center' })
}

function drawScaleSquare(doc, edgeMarginCm) {
  const marginMm = edgeMarginCm * 10
  const startX = marginMm + 5 // 5mm inside usable area
  const startY = marginMm + 5
  const barLen = 30 // 3cm = 30mm
  const capLen = 3  // end cap length in mm

  doc.setDrawColor(0, 0, 0)
  doc.setLineDashPattern([], 0)
  doc.setLineWidth(0.5)

  // Horizontal bar
  doc.line(startX, startY, startX + barLen, startY)
  // End caps (vertical)
  doc.line(startX, startY - capLen / 2, startX, startY + capLen / 2)
  doc.line(startX + barLen, startY - capLen / 2, startX + barLen, startY + capLen / 2)

  // Vertical bar
  doc.line(startX, startY, startX, startY + barLen)
  // End caps (horizontal)
  doc.line(startX - capLen / 2, startY, startX + capLen / 2, startY)
  doc.line(startX - capLen / 2, startY + barLen, startX + capLen / 2, startY + barLen)

  // Labels
  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  doc.text('3cm', startX + barLen / 2, startY - 2, { align: 'center' })
  doc.text('3cm', startX - 3, startY + barLen / 2, { angle: 90 })
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

  // Seam allowance toggle
  const saToggle = document.getElementById('seam-allowance-toggle')
  if (saToggle) saToggle.addEventListener('change', updatePattern)

  // Export to Print button
  document.getElementById('export-btn').addEventListener('click', exportTiledPDF)
})
