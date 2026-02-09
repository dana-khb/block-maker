import { jsPDF } from 'jspdf'
import 'svg2pdf.js'
import * as styles from './pdf-styles.js'

/**
 * Loads and registers the Outfit font with a jsPDF document.
 */
async function loadFonts(doc) {
  try {
    const [regularRes, boldRes] = await Promise.all([
      fetch(styles.font.regularFile),
      fetch(styles.font.boldFile),
    ])

    if (!regularRes.ok || !boldRes.ok) throw new Error('Font fetch failed')

    const [regularBuf, boldBuf] = await Promise.all([
      regularRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ])

    // Convert ArrayBuffer to base64 for jsPDF VFS
    const toBase64 = (buf) => {
      const bytes = new Uint8Array(buf)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return btoa(binary)
    }

    doc.addFileToVFS('Outfit-Regular.ttf', toBase64(regularBuf))
    doc.addFont('Outfit-Regular.ttf', styles.font.family, 'normal')

    doc.addFileToVFS('Outfit-Bold.ttf', toBase64(boldBuf))
    doc.addFont('Outfit-Bold.ttf', styles.font.family, 'bold')

    doc.setFont(styles.font.family)
    return true
  } catch (e) {
    console.warn('Could not load Outfit font, falling back to Helvetica:', e)
    return false
  }
}

/**
 * Sets the font style on the document.
 */
function setFont(doc, fontStyle) {
  doc.setFont(styles.font.family, fontStyle)
}

/**
 * Generates a tiled A4 PDF from an SVG pattern element.
 * @param {SVGElement} svgEl - The SVG element to export
 * @returns {Promise<ArrayBuffer>} The PDF as an ArrayBuffer
 */
export async function generateTiledPDF(svgEl) {
  if (!svgEl) {
    throw new Error('No pattern to export. Generate a pattern first.')
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

  // Load custom font
  await loadFonts(doc)

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

      // Draw alignment marks
      drawAlignmentMarks(doc, col, row, tilesH, tilesV, paperW, paperH)

      // Draw page info (top-left)
      drawPageInfo(doc, pageNum, totalPages, col, row)

      // Draw assembly helpers (bottom-left)
      drawAssemblyHelpers(doc, col, row, tilesH, tilesV, paperH)

      // Scale verification square (page 1 only)
      if (pageNum === 1) {
        drawScaleVerification(doc)
      }
    }
  }

  return doc.output('arraybuffer')
}

function drawAlignmentMarks(doc, col, row, tilesH, tilesV, paperW, paperH) {
  const pw = paperW * 10 // mm
  const ph = paperH * 10 // mm
  const s = styles.alignmentMarks

  doc.setDrawColor(...s.lineColor)
  doc.setLineDashPattern(s.dashPattern, 0)
  doc.setLineWidth(s.lineWidth)
  setFont(doc, s.label.fontStyle)
  doc.setFontSize(s.label.fontSize)
  doc.setTextColor(...s.label.color)

  // Left internal edge (col > 0)
  if (col > 0) {
    doc.line(s.offset, 0, s.offset, ph)
    doc.text('Align edge \u2192', s.offset + s.label.gap, ph / 2, { angle: 90 })
  }

  // Right internal edge (col < tilesH - 1)
  if (col < tilesH - 1) {
    doc.line(pw - s.offset, 0, pw - s.offset, ph)
    doc.text('\u2190 Align edge', pw - s.offset - s.label.gap, ph / 2, { angle: 90 })
  }

  // Top internal edge (row > 0)
  if (row > 0) {
    doc.line(0, s.offset, pw, s.offset)
    doc.text('Align edge \u2193', pw / 2, s.offset - s.label.gap, { align: 'center' })
  }

  // Bottom internal edge (row < tilesV - 1)
  if (row < tilesV - 1) {
    doc.line(0, ph - s.offset, pw, ph - s.offset)
    doc.text('Align edge \u2191', pw / 2, ph - s.offset + s.label.gap + 2, { align: 'center' })
  }

  // Reset dash pattern
  doc.setLineDashPattern([], 0)
}

function drawPageInfo(doc, pageNum, totalPages, col, row) {
  const s = styles.pageInfo

  // Title line: "Page X of Y"
  setFont(doc, s.title.fontStyle)
  doc.setFontSize(s.title.fontSize)
  doc.setTextColor(...s.title.color)
  doc.text(`Page ${pageNum} of ${totalPages}`, s.x, s.y)

  // Subtitle line: "Grid: Row R, Col C"
  setFont(doc, s.subtitle.fontStyle)
  doc.setFontSize(s.subtitle.fontSize)
  doc.setTextColor(...s.subtitle.color)
  doc.text(`Grid: Row ${row + 1}, Col ${col + 1}`, s.x, s.y + s.lineSpacing)
}

function drawAssemblyHelpers(doc, col, row, tilesH, tilesV, paperH) {
  const s = styles.assemblyHelpers
  const ph = paperH * 10

  const lines = []

  // Left neighbor
  if (col > 0) {
    const leftPage = row * tilesH + col // col-1 + 1 for 1-indexed
    lines.push(`\u2190 Left: Align with Page ${leftPage}`)
  }

  // Top neighbor
  if (row > 0) {
    const topPage = (row - 1) * tilesH + col + 1
    lines.push(`\u2191 Top: Align with Page ${topPage}`)
  }

  if (lines.length === 0) return

  setFont(doc, s.fontStyle)
  doc.setFontSize(s.fontSize)
  doc.setTextColor(...s.color)

  const baseY = ph - s.yFromBottom
  lines.forEach((line, i) => {
    doc.text(line, s.x, baseY + (i * s.lineSpacing))
  })
}

function drawScaleVerification(doc) {
  const s = styles.scaleVerification
  const size = s.squareSize
  const cap = s.capLength

  // Draw square outline
  doc.setDrawColor(...s.lineColor)
  doc.setLineDashPattern([], 0)
  doc.setLineWidth(s.lineWidth)
  doc.rect(s.x, s.y, size, size)

  // Horizontal measurement bar (top edge) with end caps
  const barTopY = s.y
  doc.line(s.x, barTopY - cap / 2, s.x, barTopY + cap / 2)
  doc.line(s.x + size, barTopY - cap / 2, s.x + size, barTopY + cap / 2)

  // Vertical measurement bar (right edge) with end caps
  const barRightX = s.x + size
  doc.line(barRightX - cap / 2, s.y, barRightX + cap / 2, s.y)
  doc.line(barRightX - cap / 2, s.y + size, barRightX + cap / 2, s.y + size)

  // Horizontal dimension label (above top bar)
  setFont(doc, s.dimension.fontStyle)
  doc.setFontSize(s.dimension.fontSize)
  doc.setTextColor(...s.dimension.color)
  doc.text(s.dimension.label, s.x + size / 2, s.y - s.dimension.gap, { align: 'center' })

  // Vertical dimension label (right of right bar)
  doc.text(s.dimension.label, barRightX + s.dimension.gap + 3, s.y + size / 2, { angle: 90 })

  // Title text below square
  setFont(doc, s.title.fontStyle)
  doc.setFontSize(s.title.fontSize)
  doc.setTextColor(...s.title.color)
  doc.text(s.title.text, s.x, s.y + size + s.title.gap)

  // Subtitle text below title
  setFont(doc, s.subtitle.fontStyle)
  doc.setFontSize(s.subtitle.fontSize)
  doc.setTextColor(...s.subtitle.color)
  doc.text(s.subtitle.text, s.x, s.y + size + s.title.gap + s.subtitle.gap)
}
