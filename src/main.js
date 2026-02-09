import './style.css'
import { generateTiledPDF } from './export/tiled-pdf.js'
import { calculatePattern, generateSVG, DEFAULT_CURVES } from './patterns/trousers.js'

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
  // Ease inputs are in cm — convert to px (×10) for internal calculations
  const hip_px = variables.hip_px || 0
  const hip_ease_cm = evaluateExpression(document.getElementById('hip_ease')?.value || '0')
  const x_center_offset_cm = evaluateExpression(document.getElementById('x_center_offset')?.value || '0')

  const frameWidth = (hip_px / 2) + hip_ease_cm * 10
  variables.frameWidth = frameWidth
  variables.X_center = frameWidth / 2 + x_center_offset_cm * 10
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
    // Ease variables (cm input, converted to px: ×10)
    ease: {
      hip_ease: getExprValue('hip_ease') * 10,
      x_center_offset: getExprValue('x_center_offset') * 10,
      crotch_ease: getExprValue('crotch_ease') * 10,
      front_crotch_extension: getExprValue('front_crotch_extension') * 10,
      back_crotch_extension: getExprValue('back_crotch_extension') * 10,
      front_rise_x: getExprValue('front_rise_x') * 10,
      front_rise_y: getExprValue('front_rise_y') * 10,
      back_rise: getExprValue('back_rise') * 10,
      back_waist_offset: getExprValue('back_waist_offset') * 10,
      front_hem_ease: getExprValue('front_hem_ease') * 10,
      back_hem_ease: getExprValue('back_hem_ease') * 10,
      front_knee_ease: getExprValue('front_knee_ease') * 10,
      back_knee_ease: getExprValue('back_knee_ease') * 10,
      sideseam_hip_ease: getExprValue('sideseam_hip_ease') * 10,
      back_inseam_hip_offset_x: getExprValue('back_inseam_hip_offset_x') * 10,
      back_inseam_hip_offset_y: getExprValue('back_inseam_hip_offset_y') * 10,
      back_sideseam_thigh_offset_x: getExprValue('back_sideseam_thigh_offset_x') * 10,
      back_sideseam_thigh_offset_y: getExprValue('back_sideseam_thigh_offset_y') * 10
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


function updatePattern() {
  // Update variable registry first (measurements must be evaluated before expressions)
  updateVariables()

  // Update all computed value displays
  document.querySelectorAll('.input-panel input[type="text"]').forEach(input => {
    updateComputedDisplay(input)
  })

  const inputs = getAllInputs()
  const calc = calculatePattern(inputs)

  // Get seam allowance settings from DOM
  const saToggle = document.getElementById('seam-allowance-toggle')
  const saInput = document.getElementById('seam-allowance-value')
  const saEnabled = saToggle && saToggle.checked
  const saCm = (saEnabled && saInput) ? (parseFloat(saInput.value) || 0) : 0
  const seamAllowancePx = saCm * 10

  const svg = generateSVG(calc, seamAllowancePx)
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

  // Seam allowance toggle
  const saToggle = document.getElementById('seam-allowance-toggle')
  if (saToggle) saToggle.addEventListener('change', updatePattern)

  // Export to Print button - show export modal
  const modal = document.getElementById('export-modal')
  const modalClose = document.getElementById('modal-close')
  const downloadBtn = document.getElementById('download-btn')
  const downloadStatus = document.getElementById('download-status')
  const subscribeForm = document.getElementById('subscribe-form')
  const emailInput = document.getElementById('email-input')
  const subscribeBtn = document.getElementById('subscribe-btn')
  const subscribeStatus = document.getElementById('subscribe-status')

  function showModal() {
    modal.hidden = false
    downloadBtn.disabled = false
    downloadBtn.textContent = 'Download PDF'
    downloadStatus.hidden = true
    emailInput.value = ''
    subscribeStatus.hidden = true
    subscribeBtn.disabled = false
    subscribeBtn.textContent = 'Subscribe'
  }

  function hideModal() {
    modal.hidden = true
  }

  function showStatus(el, message, type) {
    el.textContent = message
    el.className = 'email-status ' + type
    el.hidden = false
  }

  document.getElementById('export-btn').addEventListener('click', () => {
    updatePattern()
    showModal()
  })

  modalClose.addEventListener('click', hideModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal()
  })

  // Download PDF directly
  downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true
    downloadBtn.textContent = 'Generating...'
    showStatus(downloadStatus, 'Generating your PDF...', 'loading')

    try {
      const svgEl = document.querySelector('#pattern-container svg')
      if (!svgEl) {
        showStatus(downloadStatus, 'No pattern to export. Generate a pattern first.', 'error')
        downloadBtn.disabled = false
        downloadBtn.textContent = 'Download PDF'
        return
      }

      const arrayBuffer = await generateTiledPDF(svgEl)
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pattern_tiled_a4.pdf'
      a.click()
      URL.revokeObjectURL(url)

      downloadBtn.textContent = 'Downloaded!'
      downloadStatus.hidden = true

      // Track download event in PostHog
      if (window.posthog) {
        window.posthog.capture('pdf_download')
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      showStatus(downloadStatus, 'Something went wrong. Please try again.', 'error')
      downloadBtn.disabled = false
      downloadBtn.textContent = 'Download PDF'
    }
  })

  // Optional email subscription via Netlify Forms
  subscribeForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = emailInput.value.trim()
    if (!email) return

    subscribeBtn.disabled = true
    subscribeBtn.textContent = 'Sending...'

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'form-name': 'subscribers', email }).toString(),
      })

      if (response.ok) {
        showStatus(subscribeStatus, 'Subscribed! Thanks for signing up.', 'success')
        subscribeBtn.textContent = 'Subscribed!'
      } else {
        throw new Error('Form submission failed')
      }
    } catch (err) {
      console.error('Subscribe error:', err)
      showStatus(subscribeStatus, 'Something went wrong. Try again.', 'error')
      subscribeBtn.disabled = false
      subscribeBtn.textContent = 'Subscribe'
    }
  })
})
