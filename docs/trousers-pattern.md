## Rendering Rule

**CRITICAL: All measurements below are in centimeters (cm). When rendering the SVG, convert to pixels using: 1cm = 10px**

**IMPORTANT: Perform ALL calculations in pixels (px) after converting input measurements.**

---

## SVG Style Definitions

Define these styles in the SVG `<defs>` section or as CSS classes. All pattern elements reference these named styles.

```xml
<defs>
  <style>
    /* Outer pattern lines - waistlines, seams, hemlines, crotch curves */
    .pattern-line {
      stroke: black;
      stroke-width: 2;
      fill: none;
    }

    /* Construction lines - frame, guides, creaselines */
    .construction-line {
      stroke: #b2b2b2;
      stroke-width: 1;
      stroke-dasharray: 1,1;
      fill: none;
    }

    /* Pattern labels */
    .pattern-label {
      font-size: 11px;
      opacity: 0.5;
      text-anchor: middle;
    }

    /* Marker points */
    .marker-point {
      fill: magenta;
    }
  </style>
</defs>
```

### Style Reference

| Style Name | Usage |
|------------|-------|
| `pattern-line` | Waistlines, center diagonals, crotch curves, inseams, sideseams, hemlines |
| `construction-line` | Frame edges, hip/crotch/knee lines, center division, creaselines, extension lines |
| `pattern-label` | FRONT/BACK text labels |
| `marker-point` | Knee position markers |

---

## Input Measurements (all in cm)

Hip: 100

Waist to Hip: 20

Waist to Knee: 58

Waist to Ankle: 100

Crotch Depth: 26

Waist: 76

Hemline Circumference: 46

---

## Ease Variables (all in px unless noted)

These variables control the fit and comfort of the garment. Adjust these to change how loose or fitted the pattern is.

```
# Frame & Overall Fit
hip_ease = 20                    # Added to half-hip width (2cm total = 4cm full circumference ease)
crotch_ease = 15                 # Added below body crotch depth (1.5cm extra length)
x_center_offset=0

# Crotch Extensions (these are the full extension values, not additions)
front_crotch_extension = hip_px / 16    # Front crotch extension from center
back_crotch_extension = hip_px / 8      # Back crotch extension from frame edge

# Rise Adjustments
front_rise_x = 5                 # Front waist anchor horizontal offset (0.5cm)
front_rise_y = 10                # Front waist anchor vertical offset (1cm below waist)
back_rise = 25                   # Back waist rises above waistline (2.5cm) - stored as positive, used as negative
back_waist_offset = 40           # Back diagonal horizontal offset from frame edge (4cm)

# Hem Distribution
front_hem_ease = -10             # Front hem narrower than half circumference (-1cm)
back_hem_ease = 10               # Back hem wider than half circumference (+1cm)

# Knee Adjustments
front_knee_ease = 10             # Knee line inward adjustment from construction line (1cm)
back_knee_ease = 10              # Additional width for back knee (1cm more than front)

# Sideseam Shaping
sideseam_hip_ease = 1            # Sideseam peak outward from center (0.1cm)

# Back Inseam Shaping
back_inseam_hip_offset_x = 1.543   # Back inseam hip point X offset from center
back_inseam_hip_offset_y = 0.141   # Back inseam hip point Y offset below hip line

# Back Sideseam Shaping
back_sideseam_thigh_offset_x = 17.964   # Mid-thigh point X offset from knee
back_sideseam_thigh_offset_y = 178.229  # Mid-thigh point Y offset above knee

```

---

## Bezier Curve Variables

These variables control the shape of all curved lines in the pattern. Values are tension ratios (0.0 to 1.0+).

### Crotch Curve Tensions

```
# Front crotch curve (from crotch point to hip)
front_crotch_h_tension = 0.7     # Horizontal pull toward center
front_crotch_v_tension = 0.75    # Vertical pull toward hip

# Back crotch curve (from crotch point to hip)
back_crotch_h_tension = 0.8      # Horizontal pull toward frame edge
back_crotch_v_tension = 0.85     # Vertical pull toward hip

```

### Front Waistline Curve Ratios

```
# Control points expressed as ratios of waist_length
front_waist_CP2_ratio_x = 0.446
front_waist_CP2_ratio_y = 0.019
front_waist_P3_ratio_x = 0.639    # Intermediate point
front_waist_CP3_ratio_x = 0.831
front_waist_CP3_ratio_y = -0.019

```

### Back Waistline Curve Ratios

```
# Control points expressed as ratios of waist_length (negative X = leftward)
back_waist_CP2_ratio_x = -0.295
back_waist_CP2_ratio_y = 0.077
back_waist_P3_ratio_x = -0.489    # Intermediate point X
back_waist_P3_ratio_y = 0.103     # Intermediate point Y
back_waist_CP3_ratio_x = -0.683
back_waist_CP3_ratio_y = 0.127

```

### Front Inseam Curve Ratios

```
# Curve from knee to crotch point
front_inseam_CP1_ratio_x = 0.1    # First control point X progress
front_inseam_CP1_ratio_y = 0.3    # First control point Y progress
front_inseam_CP2_ratio_x = 0.404  # Second control point X progress
front_inseam_CP2_ratio_y = 0.504  # Second control point Y progress

```

### Front Sideseam Curve Ratios

```
# Segment 1: Knee to hip peak
front_side_seg1_CP1_ratio_x = 0.32
front_side_seg1_CP1_ratio_y = 0.33
front_side_seg1_CP2_ratio_x = 1.11
front_side_seg1_CP2_ratio_y = 0.754

# Segment 2: Hip peak to waist
front_side_seg2_CP1_ratio_x = 0.052
front_side_seg2_CP1_ratio_y = 0.4
front_side_seg2_CP2_ratio_x = 0.569
front_side_seg2_CP2_ratio_y = 0.714

```

### Back Inseam Curve Ratios

```
# Segment 1: Knee to hip area
back_inseam_seg1_CP1_ratio_x = 0.355
back_inseam_seg1_CP1_ratio_y = 0.261
back_inseam_seg1_CP2_ratio_x = 1.052
back_inseam_seg1_CP2_ratio_y = 0.826

# Segment 2: Hip to waist
back_inseam_seg2_CP1_ratio_x = 0.098
back_inseam_seg2_CP1_ratio_y = 0.283
back_inseam_seg2_CP2_ratio_x = 0.708
back_inseam_seg2_CP2_ratio_y = 0.784

```

### Back Sideseam Curve Ratios

```
# Segment 1: Knee to mid-thigh
back_side_seg1_CP2_ratio_x = 0.415
back_side_seg1_CP2_ratio_y = 0.665

# Segment 2: Mid-thigh to crotch
back_side_seg2_CP1_ratio_x = 0.306
back_side_seg2_CP1_ratio_y = 0.407

```

---

## Step 1: Convert ALL measurements to pixels

```
hip_px = Hip × 10
waistToHip_px = Waist to Hip × 10
waistToKnee_px = Waist to Knee × 10
waistToAnkle_px = Waist to Ankle × 10
crotchDepth_px = Crotch Depth × 10
waist_px = Waist × 10
hemlineCircumference_px = Hemline Circumference × 10

```

---

## Step 2: Calculate Variables (all in px)

```
# Frame dimensions (using ease variables)
frameWidth = (hip_px / 2) + hip_ease
frameHeight = waistToAnkle_px

X0 = 0
Y0 = 0
X_center = frameWidth / 2 + x_center_offset

# Vertical positions (using ease variables)
Y_waist = 0
Y_hip = waistToHip_px
Y_crotch = crotchDepth_px + crotch_ease
Y_midrise = Y_crotch/2
Y_knee = waistToKnee_px
Y_length = waistToAnkle_px

# Crotch extensions (using ease variables directly)
FrontCrotchPoint = X0 - front_crotch_extension
BackCrotchPoint = frameWidth + back_crotch_extension

# Label styling
label_offset = 5
label_font_size = 11
label_opacity = 0.5

```

**Rise coordinates (using ease variables):**

```
front_waist_anchor_x = front_rise_x
front_waist_anchor_y = front_rise_y
back_waist_rise = -back_rise    # Negative because it's above Y=0

```

**Note:** `front_waist_anchor` is the fixed waist anchor point for ALL front waist calculations.

---

## Step 3: Calculate SVG Bounds

**CRITICAL: The viewBox dimensions MUST exactly match the width/height attributes to prevent scaling distortion.**

```
min_x = FrontCrotchPoint
max_x = BackCrotchPoint
min_y = back_waist_rise
max_y = Y_length

padding = 10

viewBox_x = min_x - padding
viewBox_y = min_y - padding
viewBox_width = (max_x - min_x) + (2 × padding)
viewBox_height = (max_y - min_y) + (2 × padding)

```

**IMPORTANT - ViewBox Coordinate System:**

This template uses **negative coordinate preservation** (Option A). The viewBox MUST start at the actual minimum coordinates:

- `viewBox_x` will be negative (includes FrontCrotchPoint extending left of origin)
- `viewBox_y` will be negative (includes back_waist_rise above Y=0)
- Do NOT translate coordinates to (0,0)
- Do NOT use viewBox="0 0 ..." unless you translate ALL coordinates first

**SVG tag - CRITICAL: width/height MUST match viewBox dimensions:**

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="[viewBox_width]" height="[viewBox_height]"
     viewBox="[viewBox_x] [viewBox_y] [viewBox_width] [viewBox_height]">

```

**Example calculation verification:**

```
If viewBox = "-70 -35 670 1005"
Then width MUST = "670" and height MUST = "1005"
NOT width="800" height="1000" - this causes scaling distortion!

```

---

# Pattern Construction Steps

## Styling Guide

**Pattern lines (`class="pattern-line"`):**

- Waistlines
- Front center diagonal
- Front and back crotch curves
- Back center diagonals
- All seam lines (inseam, sideseam) from hem to waist
- Hemlines

**Construction lines (`class="construction-line"`):**

- Frame lines
- Horizontal construction lines (hip, crotch, knee)
- Center division line
- Vertical edge guide
- Crotch extension line
- Creaselines
- Diagonal construction guides
- Waist to hip dotted guides
- Knee extension line

---

## 1. Frame Definition

**Group:** `<g id="frame">`

**Vertical left edge:**

```
Start: (X0, Y0)
End: (X0, frameHeight)
Style: class="construction-line"

```

**Horizontal top edge:**

```
Start: (X0, Y0)
End: (frameWidth, Y0)
Style: class="construction-line"

```

---

## 2. Horizontal Construction Lines

**Hip line - Group:** `<g id="Hip">`

```
Start: (0, Y_hip)
End: (frameWidth, Y_hip)
Style: class="construction-line"

```

**Crotch line - Group:** `<g id="Crotch">`

```
Start: (0, Y_crotch)
End: (frameWidth, Y_crotch)
Style: class="construction-line"

```

**Knee line - Group:** `<g id="Knee">`

```
Start: (0, Y_knee)
End: (frameWidth, Y_knee)
Style: class="construction-line"

```

**Vertical edge guide - Group:** `<g id="vertical_edge">`

```
Start: (frameWidth, 0)
End: (frameWidth, Y_anke)
Style: class="construction-line"

```

**midrise guide - Group:** `<g id="midrise">`

```
Start: (0, Y_crotchguide)
End: (frameWidth, Y_crotchguide)
Style: class="construction-line"

```

---

## 3. Center Division

**Group:** `<g id="center_line">`

**Center line:**

```
Start: (X_center, Y_ankle)
End: (X_center, Y_waist)
Style: class="construction-line"

```

**FRONT label:**

```xml
<text x="[X_center / 2]"
      y="[Y_hip - label_offset]"
      class="pattern-label">FRONT</text>

```

**BACK label:**

```xml
<text x="[X_center + (frameWidth - X_center) / 2]"
      y="[Y_hip - label_offset]"
      class="pattern-label">BACK</text>

```

---

## 4. Crotch Extensions

**Group:** `<g id="crotch_extension">`

```
Start: (FrontCrotchPoint, Y_crotch)
End: (BackCrotchPoint, Y_crotch)
Style: class="construction-line"

```

---

## 5. Front Center (Diagonal + Curve)

**Group:** `<g id="front_center_curve">`

**Front diagonal:**

```
Start: (0, Y_hip)
End: (front_waist_anchor_x, front_waist_anchor_y)
Style: class="pattern-line"

```

**Front crotch curve - Cubic Bézier (using bezier variables):**

```
P0 = (FrontCrotchPoint, Y_crotch)

CP1_x = P0_x + front_crotch_h_tension × (X0 - P0_x)
CP1_y = Y_crotch
CP1 = (CP1_x, CP1_y)

CP2_x = 0
CP2_y = Y_crotch - front_crotch_v_tension × (Y_crotch - Y_hip)
CP2 = (CP2_x, CP2_y)

P1 = (0, Y_hip)

Path: M [P0_x],[P0_y] C [CP1_x],[CP1_y] [CP2_x],[CP2_y] [P1_x],[P1_y]
Style: class="pattern-line"

```

---

## 6. Back Center (Diagonal + Curve)

**Group:** `<g id="back_center_curve">`

**Back diagonal segment 1 (using ease variables):**

```
Start: (frameWidth, Y_hip)
End: (frameWidth - back_waist_offset, 0)
Style: class="pattern-line"

```

**Back diagonal segment 2:**

```
slope = Y_hip / back_waist_offset
end_x = (frameWidth - back_waist_offset) - (back_rise / slope)

Start: (frameWidth - back_waist_offset, 0)
End: (end_x, back_waist_rise)
Style: class="pattern-line"

```

**Note on back diagonal:** The two segments form one continuous straight line. The formula `back_rise / slope` = `back_rise × back_waist_offset / Y_hip` ensures the same slope continues from hip level through waist to the rise point.

**Back crotch curve - Cubic Bézier (using bezier variables):**

```
P0 = (BackCrotchPoint, Y_crotch)

CP1_x = P0_x + back_crotch_h_tension × (frameWidth - P0_x)
CP1_y = Y_crotch
CP1 = (CP1_x, CP1_y)

CP2_x = frameWidth
CP2_y = Y_crotch - back_crotch_v_tension × (Y_crotch - Y_hip)
CP2 = (CP2_x, CP2_y)

P1 = (frameWidth, Y_hip)

Path: M [P0_x],[P0_y] C [CP1_x],[CP1_y] [CP2_x],[CP2_y] [P1_x],[P1_y]
Style: class="pattern-line"

```

---

## 7. Waistlines

waist_length = waist_px / 4

**CRITICAL:** All waistline control points are expressed as **ratios of waist_length** to ensure proper scaling across all sizes.

### Front Waistline

**Group:** `<g id="front_waistline">`

**Calculate front_waist_end_x:**

```
front_waist_end_x = front_waist_anchor_x + √((waist_length)² - (front_waist_anchor_y)²)

```

**Front waistline (curved, using bezier variables):**

```
P0 = (front_waist_anchor_x, front_waist_anchor_y)
CP1 = (front_waist_anchor_x, front_waist_anchor_y)  # coincident for right angle

# Calculate control points using bezier ratios
CP2_x = front_waist_anchor_x + (front_waist_CP2_ratio_x × waist_length)
CP2_y = front_waist_anchor_y + (front_waist_CP2_ratio_y × waist_length)

P3_intermediate_x = front_waist_anchor_x + (front_waist_P3_ratio_x × waist_length)
P3_intermediate_y = front_waist_anchor_y

CP3_x = front_waist_anchor_x + (front_waist_CP3_ratio_x × waist_length)
CP3_y = front_waist_anchor_y + (front_waist_CP3_ratio_y × waist_length)

P1 = (front_waist_end_x, 0)

Path: M [P0_x],[P0_y] C [CP1_x],[CP1_y] [CP2_x],[CP2_y] [P3_x],[P3_y] C [CP3_x],[CP3_y] [P1_x],[P1_y]
Style: class="pattern-line"

```

**Front waistline to hip (dotted):**

```
Start: (front_waist_end_x, 0)
End: (X_center, Y_hip)
Style: class="construction-line"

```

### Back Waistline

**Group:** `<g id="back_waistline">`

**Calculate back_waist_start_x (using ease variables):**

```
back_waist_start_x = frameWidth - back_waist_offset - (back_rise × back_waist_offset / Y_hip)

```

**Calculate back_waist_end_x:**

```
back_waist_end_x = back_waist_start_x - √((waist_length)² - (back_rise)²)

```

**Back waistline (curved, using bezier variables):**

```
P0 = (back_waist_start_x, back_waist_rise)
CP1 = (back_waist_start_x, back_waist_rise)  # coincident for right angle

# Calculate control points using bezier ratios
CP2_x = back_waist_start_x + (back_waist_CP2_ratio_x × waist_length)
CP2_y = back_waist_rise + (back_waist_CP2_ratio_y × waist_length)

P3_intermediate_x = back_waist_start_x + (back_waist_P3_ratio_x × waist_length)
P3_intermediate_y = back_waist_rise + (back_waist_P3_ratio_y × waist_length)

CP3_x = back_waist_start_x + (back_waist_CP3_ratio_x × waist_length)
CP3_y = back_waist_rise + (back_waist_CP3_ratio_y × waist_length)

P1 = (back_waist_end_x, 0)

Path: M [P0_x],[P0_y] C [CP1_x],[CP1_y] [CP2_x],[CP2_y] [P3_x],[P3_y] C [CP3_x],[CP3_y] [P1_x],[P1_y]
Style: class="pattern-line"

```

**Back waistline to hip (dotted):**

```
Start: (back_waist_end_x, 0)
End: (X_center, Y_hip)
Style: class="construction-line"

```

---

## 8. Creaselines

**Group:** `<g id="creaselines">`

D = (X_center - FrontCrotchPoint) / 2

### Front Creaseline

**Calculate front_crease_x:**

```
front_crease_x = (FrontCrotchPoint + X_center) / 2

```

**Calculate front_crease_y (intersection with front waistline):**

```
slope = (0 - front_waist_anchor_y) / (front_waist_end_x - front_waist_anchor_x)
front_crease_y = front_waist_anchor_y + slope × (front_crease_x - front_waist_anchor_x)

```

**Front creaseline:**

```
Start: (front_crease_x, front_crease_y)
End: (front_crease_x, Y_length)
Style: class="construction-line"

```

### Back Creaseline

**Calculate back_crease_x:**

```
back_crease_x = X_center + D

```

**Calculate back_crease_y (intersection with back waistline):**

```
slope = (0 - back_waist_rise) / (back_waist_end_x - back_waist_start_x)
back_crease_y = back_waist_rise + slope × (back_crease_x - back_waist_start_x)

```

**Back creaseline:**

```
Start: (back_crease_x, back_crease_y)
End: (back_crease_x, Y_length)
Style: class="construction-line"

```

---

## 9. Hemline

**Group:** `<g id="hemline">`

**Using ease variables:**

```
FrontHem = (hemlineCircumference_px / 2) + front_hem_ease
BackHem = (hemlineCircumference_px / 2) + back_hem_ease

```

### Front Hemlines

**Front hem left:**

```
Start: (front_crease_x, Y_length)
End: (front_crease_x - FrontHem/2, Y_length)
Style: class="pattern-line"

```

**Front hem right:**

```
Start: (front_crease_x, Y_length)
End: (front_crease_x + FrontHem/2, Y_length)
Style: class="pattern-line"

```

### Back Hemlines

**Back hem right:**

```
Start: (back_crease_x, Y_length)
End: (back_crease_x + BackHem/2, Y_length)
Style: class="pattern-line"

```

**Back hem left:**

```
Start: (back_crease_x, Y_length)
End: (back_crease_x - BackHem/2, Y_length)
Style: class="pattern-line"

```

---

## 10. Front Inseam

**Group:** `<g id="front_inseam">`

**Calculate knee_seam_x:**

```
hem_left_x = front_crease_x - (FrontHem / 2)
slope = (Y_crotch - Y_length) / (FrontCrotchPoint - hem_left_x)
knee_seam_x = hem_left_x + (Y_knee - Y_length) / slope

```

**Calculate knee_line (using ease variables):**

```
knee_line = front_crease_x - knee_seam_x - front_knee_ease

```

**Diagonal construction line:**

```
Start: (hem_left_x, Y_length)
End: (FrontCrotchPoint, Y_crotch)
Style: class="construction-line"

```

### Front Inseam Straight Section

**Straight line from hem to knee:**

```
Start: (hem_left_x, Y_length)
End: (front_crease_x - knee_line, Y_knee)
Style: class="pattern-line"

```

### Front Inseam Curved Section

**Cubic Bézier from knee to crotch (using bezier variables):**

```
P0 = (front_crease_x - knee_line, Y_knee)

CP1_x = P0_x + front_inseam_CP1_ratio_x × (FrontCrotchPoint - P0_x)
CP1_y = Y_knee - front_inseam_CP1_ratio_y × (Y_knee - Y_crotch)
CP1 = (CP1_x, CP1_y)

CP2_x = P0_x + front_inseam_CP2_ratio_x × (FrontCrotchPoint - P0_x)
CP2_y = Y_knee - front_inseam_CP2_ratio_y × (Y_knee - Y_crotch)
CP2 = (CP2_x, CP2_y)

P1 = (FrontCrotchPoint, Y_crotch)

Path: M [P0_x],[P0_y] C [CP1_x],[CP1_y] [CP2_x],[CP2_y] [P1_x],[P1_y]
Style: class="pattern-line"

```

### Extend Y_knee Line

**Knee extension line:**

```
Start: (0, Y_knee)
End: (knee_seam_x, Y_knee)
Style: class="construction-line"

```

---

## 11. Front Sideseam

**Group:** `<g id="front_sideseam">`

**Uses knee_line from Front Inseam calculation above**

### Front Sideseam Straight Section (Hem to Knee)

**Straight line from hem to knee:**

```
Start: (front_crease_x + FrontHem/2, Y_length)
End: (front_crease_x + knee_line, Y_knee)
Style: class="pattern-line"

```

### Front Sideseam Curved Section (Knee to Waist)

**CRITICAL: Curve must NOT go inward above Y_crotch, only above Y_hip**

**Calculate key points (using ease variables):**

```
sideseam_knee_x = front_crease_x + knee_line
sideseam_knee_y = Y_knee

peak_x = X_center + sideseam_hip_ease
peak_y = Y_hip

waist_end_x = front_waist_end_x
waist_end_y = 0

```

**Segment 1: Knee to Peak (using bezier variables):**

```
P0 = (sideseam_knee_x, sideseam_knee_y)

CP1_x = sideseam_knee_x + front_side_seg1_CP1_ratio_x × (peak_x - sideseam_knee_x)
CP1_y = sideseam_knee_y - front_side_seg1_CP1_ratio_y × (sideseam_knee_y - peak_y)

CP2_x = sideseam_knee_x + front_side_seg1_CP2_ratio_x × (peak_x - sideseam_knee_x)
CP2_y = sideseam_knee_y - front_side_seg1_CP2_ratio_y × (sideseam_knee_y - peak_y)

P1 = (peak_x, peak_y)

```

**Segment 2: Peak to Waist (using bezier variables):**

```
P0 = (peak_x, peak_y)

CP1_x = peak_x - front_side_seg2_CP1_ratio_x × (peak_x - waist_end_x)
CP1_y = peak_y - front_side_seg2_CP1_ratio_y × (peak_y - waist_end_y)

CP2_x = peak_x - front_side_seg2_CP2_ratio_x × (peak_x - waist_end_x)
CP2_y = peak_y - front_side_seg2_CP2_ratio_y × (peak_y - waist_end_y)

P1 = (waist_end_x, waist_end_y)

Path: M [P0_seg1_x],[P0_seg1_y] C [CP1_seg1_x],[CP1_seg1_y] [CP2_seg1_x],[CP2_seg1_y] [P1_seg1_x],[P1_seg1_y] C [CP1_seg2_x],[CP1_seg2_y] [CP2_seg2_x],[CP2_seg2_y] [P1_seg2_x],[P1_seg2_y]
Style: class="pattern-line"

```

---

## 12. Back Seam Markers

**Group:** `<g id="back_seam_markers">`

**Calculate back seam knee points (using ease variables):**

```
back_hem_left_x = back_crease_x - (BackHem / 2)
back_hem_right_x = back_crease_x + (BackHem / 2)

back_inseam_knee_x = back_crease_x - (knee_line + back_knee_ease)
back_sideseam_knee_x = back_crease_x + (knee_line + back_knee_ease)

```

**Diagonal construction line (back inseam):**

```
Start: (back_hem_left_x, Y_length)
End: (back_inseam_knee_x, Y_knee)
Style: class="construction-line"

```

**Diagonal construction line (back sideseam):**

```
Start: (back_hem_right_x, Y_length)
End: (back_sideseam_knee_x, Y_knee)
Style: class="construction-line"

```

**Back inseam knee marker:**

```
Center: (back_inseam_knee_x, Y_knee)
Radius: 2
Style: class="marker-point"

```

**Back sideseam knee marker:**

```
Center: (back_sideseam_knee_x, Y_knee)
Radius: 2
Style: class="marker-point"

```

---

## 13. Back Inseam

**Group:** `<g id="back_inseam">`

**Calculate back hem and knee points (using ease variables):**

```
back_hem_left_x = back_crease_x - (BackHem / 2)
back_inseam_knee_x = back_crease_x - (knee_line + back_knee_ease)

```

### Back Inseam Straight Section

**Straight line from hem to knee:**

```
Start: (back_hem_left_x, Y_length)
End: (back_inseam_knee_x, Y_knee)
Style: class="pattern-line"

```

### Back Inseam Curved Section

**Two-segment curve from knee to waist (using ease and bezier variables):**

**Segment 1: Knee to hip area**

```
P0 = (back_inseam_knee_x, Y_knee)

hip_peak_x = X_center + back_inseam_hip_offset_x
hip_peak_y = Y_hip + back_inseam_hip_offset_y

CP1_x = P0_x - back_inseam_seg1_CP1_ratio_x × (P0_x - hip_peak_x)
CP1_y = P0_y - back_inseam_seg1_CP1_ratio_y × (P0_y - hip_peak_y)

CP2_x = P0_x - back_inseam_seg1_CP2_ratio_x × (P0_x - hip_peak_x)
CP2_y = P0_y - back_inseam_seg1_CP2_ratio_y × (P0_y - hip_peak_y)

P1 = (hip_peak_x, hip_peak_y)

```

**Segment 2: Hip to waist**

```
P0 = (hip_peak_x, hip_peak_y)

CP1_x = P0_x + back_inseam_seg2_CP1_ratio_x × (back_waist_end_x - P0_x)
CP1_y = P0_y - back_inseam_seg2_CP1_ratio_y × (P0_y - 0)

CP2_x = P0_x + back_inseam_seg2_CP2_ratio_x × (back_waist_end_x - P0_x)
CP2_y = P0_y - back_inseam_seg2_CP2_ratio_y × (P0_y - 0)

P1 = (back_waist_end_x, 0)

Path: M [P0_seg1_x],[P0_seg1_y] C [CP1_seg1_x],[CP1_seg1_y] [CP2_seg1_x],[CP2_seg1_y] [P1_seg1_x],[P1_seg1_y] C [CP1_seg2_x],[CP1_seg2_y] [CP2_seg2_x],[CP2_seg2_y] [P1_seg2_x],[P1_seg2_y]
Style: class="pattern-line"

```

---

## 14. Back Sideseam

**Group:** `<g id="back_sideseam">`

**Calculate back hem and knee points (using ease variables):**

```
back_hem_right_x = back_crease_x + (BackHem / 2)
back_sideseam_knee_x = back_crease_x + (knee_line + back_knee_ease)

```

### Back Sideseam Straight Section

**Straight line from hem to knee:**

```
Start: (back_hem_right_x, Y_length)
End: (back_sideseam_knee_x, Y_knee)
Style: class="pattern-line"

```

### Back Sideseam Curved Section

**Two-segment curve from knee to crotch (using ease and bezier variables):**

**Calculate mid-thigh point:**

```
mid_thigh_x = back_sideseam_knee_x + back_sideseam_thigh_offset_x
mid_thigh_y = Y_knee - back_sideseam_thigh_offset_y

```

**Segment 1: Knee to mid-thigh**

```
P0 = (back_sideseam_knee_x, Y_knee)

CP1 = (back_sideseam_knee_x, Y_knee)  # coincident with start

CP2_x = P0_x + back_side_seg1_CP2_ratio_x × (mid_thigh_x - P0_x)
CP2_y = P0_y - back_side_seg1_CP2_ratio_y × (P0_y - mid_thigh_y)

P1 = (mid_thigh_x, mid_thigh_y)

```

**Segment 2: Mid-thigh to crotch**

```
P0 = (mid_thigh_x, mid_thigh_y)

CP1_x = P0_x + back_side_seg2_CP1_ratio_x × (BackCrotchPoint - P0_x)
CP1_y = P0_y - back_side_seg2_CP1_ratio_y × (P0_y - Y_crotch)

CP2 = (BackCrotchPoint, Y_crotch)  # coincident with end

P1 = (BackCrotchPoint, Y_crotch)

Path: M [P0_seg1_x],[P0_seg1_y] C [CP1_seg1_x],[CP1_seg1_y] [CP2_seg1_x],[CP2_seg1_y] [P1_seg1_x],[P1_seg1_y] C [CP1_seg2_x],[CP1_seg2_y] [CP2_seg2_x],[CP2_seg2_y] [P1_seg2_x],[P1_seg2_y]
Style: class="pattern-line"

```

---

## Summary of Groups

All elements wrapped in `<g>` tags with IDs:

- frame
- Hip, Crotch, Knee
- vertical_edge
- center_line
- crotch_extension
- front_center_curve
- back_center_curve
- front_waistline
- back_waistline
- creaselines
- hemline
- front_inseam
- front_sideseam
- back_seam_markers
- back_inseam
- back_sideseam

---

## Variable Reference Summary

### Ease Variables (17 total)

| Variable | Default | Description |
|----------|---------|-------------|
| hip_ease | 20 | Frame width addition (2cm) |
| crotch_ease | 15 | Crotch depth addition (1.5cm) |
| x_center_offset | 0 | Center line horizontal offset |
| front_crotch_extension | hip_px / 16 | Front crotch extension |
| back_crotch_extension | hip_px / 8 | Back crotch extension |
| front_rise_x | 5 | Front anchor X (0.5cm) |
| front_rise_y | 10 | Front anchor Y (1cm) |
| back_rise | 25 | Back rise height (2.5cm) |
| back_waist_offset | 40 | Back diagonal offset (4cm) |
| front_hem_ease | -10 | Front hem narrower (-1cm) |
| back_hem_ease | 10 | Back hem wider (+1cm) |
| front_knee_ease | 10 | Front knee adjustment (1cm) |
| back_knee_ease | 10 | Back knee extra (1cm) |
| sideseam_hip_ease | 1 | Sideseam peak offset (0.1cm) |
| back_inseam_hip_offset_x | 1.543 | Back inseam hip X |
| back_inseam_hip_offset_y | 0.141 | Back inseam hip Y |
| back_sideseam_thigh_offset_x | 17.964 | Back sideseam thigh X |
| back_sideseam_thigh_offset_y | 178.229 | Back sideseam thigh Y |

### Bezier Variables (37 total)

| Category | Variables |
|----------|-----------|
| Crotch curves | 4 (front/back h/v tensions) |
| Front waistline | 5 ratios |
| Back waistline | 6 ratios |
| Front inseam | 4 ratios |
| Front sideseam | 8 ratios (2 segments) |
| Back inseam | 8 ratios (2 segments) |
| Back sideseam | 4 ratios (2 segments) |

---

## Version History

**Version:** 3.0 (Parameterized)
**Date:** January 2026

**Changes in v3.0:**
- Added dedicated Ease Variables section with 16 named variables
- Added dedicated Bezier Curve Variables section with 37 named ratios
- Updated all formulas to reference named variables
- Added Variable Reference Summary table

**Previous versions:**
- v2.0: Fixed waistline parameterization and viewBox coordinate system
- v1.0: Initial template

---

**End of Template**
