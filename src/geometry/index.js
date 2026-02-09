/**
 * Geometry utilities for pattern generation
 * Shared across all pattern types
 */

/**
 * Sample points along a cubic bezier curve
 */
export function sampleCubicBezier(p0, cp1, cp2, p3, n = 40) {
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

/**
 * Convert an array of line/cubic segments to a polyline of points
 */
export function segmentsToPolyline(segments, samplesPerCurve = 40) {
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

/**
 * Find intersection point of two lines
 */
export function lineLineIntersect(a1, a2, b1, b2) {
  const dx1 = a2.x - a1.x, dy1 = a2.y - a1.y
  const dx2 = b2.x - b1.x, dy2 = b2.y - b1.y
  const denom = dx1 * dy2 - dy1 * dx2
  if (Math.abs(denom) < 1e-10) return null
  const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom
  return { x: a1.x + t * dx1, y: a1.y + t * dy1 }
}

/**
 * Calculate signed area of a polygon (positive = CCW, negative = CW)
 */
export function signedArea(points) {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return area / 2
}

/**
 * Offset a polygon by a given distance (positive = outward for CCW polygons)
 */
export function offsetPolygon(points, offset) {
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
