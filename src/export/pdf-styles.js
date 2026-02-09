/**
 * PDF Tiling Stylesheet
 *
 * All visual styling for the tiled PDF output lives here.
 * Edit these values to change colors, weights, fonts, spacing, etc.
 * Dimensions are in mm unless noted otherwise.
 */

// ── Font ────────────────────────────────────────────────────────────────────
export const font = {
  family: 'Outfit',
  regularFile: '/fonts/Outfit-Regular.ttf',
  boldFile: '/fonts/Outfit-Bold.ttf',
}

// ── Page info (top-left corner) ─────────────────────────────────────────────
export const pageInfo = {
  x: 5,
  y: 6,
  lineSpacing: 4,
  title: {
    fontSize: 10,
    fontStyle: 'bold',
    color: [80, 80, 80],
  },
  subtitle: {
    fontSize: 7,
    fontStyle: 'normal',
    color: [130, 130, 130],
  },
}

// ── Alignment marks (dashed lines on internal edges) ────────────────────────
export const alignmentMarks = {
  offset: 20,               // 2cm from paper edge
  lineWidth: 0.2,
  lineColor: [190, 190, 190],
  dashPattern: [5, 3],
  label: {
    fontSize: 7,
    fontStyle: 'normal',
    color: [190, 190, 190],
    gap: 1.5,               // mm between line and label text
  },
}

// ── Assembly helpers (bottom-left, tells user which pages to align) ─────────
export const assemblyHelpers = {
  x: 5,
  yFromBottom: 8,
  lineSpacing: 3.5,
  fontSize: 7,
  fontStyle: 'normal',
  color: [130, 130, 130],
}

// ── Bottom-center edge label (e.g. "Align edge ↑") ─────────────────────────
export const edgeLabel = {
  fontSize: 7,
  fontStyle: 'normal',
  color: [190, 190, 190],
  yFromBottom: 5,
}

// ── Scale verification (page 1 only) ────────────────────────────────────────
export const scaleVerification = {
  x: 15,                    // mm from left edge
  y: 25,                    // mm from top edge
  squareSize: 30,           // 3cm square
  lineWidth: 0.4,
  lineColor: [0, 0, 0],
  capLength: 4,             // end cap length in mm
  dimension: {
    fontSize: 8,
    fontStyle: 'normal',
    color: [0, 0, 0],
    label: '3.0 cm',
    gap: 2,                 // mm from bar to label
  },
  title: {
    text: 'SCALE VERIFICATION',
    fontSize: 8,
    fontStyle: 'bold',
    color: [0, 0, 0],
    gap: 5,                 // mm below square
  },
  subtitle: {
    text: 'Measure between end caps',
    fontSize: 7,
    fontStyle: 'normal',
    color: [100, 100, 100],
    gap: 4,                 // mm below title
  },
}
