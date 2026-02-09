# PDF Tiling Guide - Pattern Assembly Instructions

## Overview

This guide explains how to generate and assemble tiled PDF patterns for printing on standard paper sizes (A4, Letter, etc.).

**System:** No-trim overlap alignment with 2cm total overlap
**Paper size:** A4 (21cm × 29.7cm)
**Overlap:** 1cm from each paper edge = 2cm total when assembled
**Pattern content:** 19cm × 27.7cm per tile

---

## Generating the Tiled PDF

### Basic Usage

```python
from create_tiled_pdf import create_tiled_pdf

# Generate tiled PDF from SVG pattern
create_tiled_pdf(
    svg_path="pattern.svg",
    output_path="pattern_tiled_a4.pdf"
)
```

### How It Works

1. **Reads SVG pattern** - Analyzes dimensions and content
2. **Calculates grid** - Determines how many tiles needed (e.g., 4×4 = 16 pages)
3. **Generates pages** - Each page shows one tile with:
   - Pattern content (automatically clipped to tile viewport)
   - Alignment marks (gray dashed lines at 2cm from edge)
   - Page info (page number, row, column)
   - Scale verification square (page 1 only, top-left corner)

### Grid Layout

Pages are numbered left-to-right, top-to-bottom:

```
Page 1  | Page 2  | Page 3  | Page 4    (Row 1 - TOP of pattern)
Page 5  | Page 6  | Page 7  | Page 8    (Row 2)
Page 9  | Page 10 | Page 11 | Page 12   (Row 3)
Page 13 | Page 14 | Page 15 | Page 16   (Row 4 - BOTTOM of pattern)
```

- **Page 1** shows top-left (waistline area for trousers)
- **Last page** shows bottom-right (hemline area for trousers)

---

## Printing Instructions

### Step 1: Print Settings

**CRITICAL - Print at 100% / Actual Size:**
- ✅ "Actual Size" or "100%"
- ❌ NOT "Fit to Page"
- ❌ NOT "Scale to Fit"

**Other settings:**
- Paper: A4 (21 × 29.7cm)
- Orientation: Automatic (portrait)
- Quality: Normal (draft quality is fine)

### Step 2: Verify Scale

**On Page 1 ONLY (top-left corner):**
- Find the scale verification square with measurement bars
- Measure between the end caps (crossbars)
- **Horizontal bar:** Should measure exactly 3.0cm
- **Vertical bar:** Should measure exactly 3.0cm

**If measurements are wrong:**
- Your printer scaled the document
- Check print settings: Must be 100% / Actual Size
- Reprint all pages

**Once verified:**
- Continue printing remaining pages
- No need to check scale on every page

---

## Assembly Instructions

### Understanding the Marks

**Gray dashed lines** at 2cm from edge on internal edges only:
- Show where the NEXT page's edge will land
- Only appear on edges that will overlap another page
- NO marks on outer pattern boundaries

**Example Page 6 (middle tile):**
- **Left edge:** Gray line at 2cm from left = "Align edge →"
- **Right edge:** Gray line at 2cm from right = "← Align edge"
- **Top edge:** Gray line at 2cm from top = "Align edge ↓"
- **Bottom edge:** Gray line at 2cm from bottom = "Align edge ↑"

**Example Page 1 (top-left corner):**
- **Left edge:** NO mark (outer pattern boundary)
- **Top edge:** NO mark (outer pattern boundary)
- **Right edge:** Gray line (page 2 will align here)
- **Bottom edge:** Gray line (page 5 will align here)

### Assembly Process

**Method: Edge-to-Mark Alignment**

1. **Start with Page 1** (top-left)
   - This is your reference page
   - Has marks on RIGHT and BOTTOM edges only

2. **Add Page 2** (to the right)
   - Find the gray line on Page 1's RIGHT edge (2cm from right)
   - Place Page 2's LEFT paper edge ON this line
   - Pattern lines should continue seamlessly
   - Tape from behind

3. **Continue Row 1** (pages 3, 4)
   - Each page's left edge aligns to previous page's right mark
   - Build the complete top row

4. **Start Row 2** (Page 5)
   - Find the gray line on Page 1's BOTTOM edge (2cm from bottom)
   - Place Page 5's TOP paper edge ON this line
   - Pattern lines should continue seamlessly
   - Tape from behind

5. **Continue Grid Assembly**
   - Build row by row
   - Each page has marks showing where adjacent pages align
   - Total overlap = 2cm at each seam

### Visual Guide

```
         ← 2cm →
    ┌─────────────────┐
    │ Page 1          │
    │                 │ ← Pattern extends to edge
    │         [MARK]  │ ← Gray line 2cm from right
    │                 │
    └─────────────────┘
         [MARK]          ← Gray line 2cm from bottom
         ↑ 2cm
         
              ┌─────────────────┐
              │ Page 2          │
     Align → [MARK]              │
     edge    │                  │
     here    │                  │
              └─────────────────┘
```

### Tips for Clean Assembly

✅ **DO:**
- Work on a large flat surface
- Align pattern lines first, then check marks
- Tape from behind to keep front clean
- Work systematically (row by row)
- Use the pattern lines as primary alignment guide

❌ **DON'T:**
- Try to align marks to marks (they won't overlap!)
- Cut or trim pages (overlap system doesn't require it)
- Rush - take time to align each seam carefully

---

## Technical Specifications

### Coordinate System

**SVG coordinates:**
- Origin: Top-left
- Y increases downward
- Pattern Y=0 is typically waist level
- Pattern Y=max is hemline

**PDF rendering:**
- Origin: Bottom-left (PDF standard)
- Y-flip applied during rendering
- Clipping ensures only tile content shows
- Each tile viewport: 19cm × 27.7cm usable area

### Overlap System

**Edge margins:**
- 1cm from each paper edge reserved for overlap
- Total overlap when pages meet: 2cm
- Alignment marks at 2cm from edge (full overlap distance)

**Why 2cm?**
- Accounts for printer margins (typically 0.4-0.6cm)
- Provides alignment tolerance
- Pattern lines visible across seam
- No trimming required

### Grid Calculation

```python
# Usable area per tile
usable_width = paper_width - (2 × edge_margin)   # 19cm
usable_height = paper_height - (2 × edge_margin)  # 27.7cm

# Tiles needed
tiles_horizontal = ceil(pattern_width / usable_width)
tiles_vertical = ceil(pattern_height / usable_height)
total_tiles = tiles_horizontal × tiles_vertical
```

### File Structure

```
create_tiled_pdf.py
├── Constants (paper size, margins)
├── SVG parsing functions
├── Coordinate transformation (SVG → PDF)
├── Drawing functions
│   ├── draw_scale_square() - Scale verification
│   ├── draw_overlap_markers() - Alignment guides
│   ├── draw_page_info() - Page numbers
│   └── draw_svg_element() - Pattern rendering
└── Main PDF generation loop
```

---

## Customization Options

### Change Paper Size

```python
# Currently hard-coded to A4
PAPER_FORMAT = A4  # (21cm × 29.7cm)

# For US Letter:
from reportlab.lib.pagesizes import letter
PAPER_FORMAT = letter  # (8.5" × 11")

# For A3:
from reportlab.lib.pagesizes import A3
PAPER_FORMAT = A3  # (29.7cm × 42cm)
```

### Adjust Overlap Amount

```python
# Currently 1cm from each edge (2cm total)
EDGE_MARGIN = 1.0 * cm

# For more overlap (easier alignment):
EDGE_MARGIN = 1.5 * cm  # 3cm total

# For less overlap (more efficient):
EDGE_MARGIN = 0.5 * cm  # 1cm total
```

**Note:** Less overlap means:
- More pattern per page (fewer total pages)
- Less alignment tolerance
- Pattern must be more precisely printed

### Scale Verification Position

```python
# Currently top-left of page 1
scale_x = EDGE_MARGIN + 0.5*cm
scale_y = PAPER_HEIGHT - EDGE_MARGIN - SCALE_SQUARE_SIZE - 0.5*cm

# To move to bottom-right:
scale_x = PAPER_WIDTH - EDGE_MARGIN - SCALE_SQUARE_SIZE - 0.5*cm
scale_y = EDGE_MARGIN + 0.5*cm
```

---

## Troubleshooting

### Pattern Doesn't Align

**Symptom:** Pattern lines don't continue across seams

**Causes:**
1. ❌ Printer scaled pages (not 100%)
   - **Fix:** Verify scale square on page 1, reprint if wrong
2. ❌ Aligning marks to marks instead of edge to mark
   - **Fix:** Align paper EDGE to the mark on previous page
3. ❌ Mixed pages from different print runs
   - **Fix:** Reprint all pages in one session

### Overlap Too Large/Small

**Symptom:** Gap between pages or excessive overlap

**Causes:**
1. ❌ Printer margins different than expected
   - **Fix:** Measure your printer's actual margins, adjust EDGE_MARGIN
2. ❌ Paper edges not aligned to marks
   - **Fix:** Use the gray marks as precise guides

### Pattern Clipped/Missing

**Symptom:** Parts of pattern cut off

**Causes:**
1. ❌ Pattern extends beyond calculated bounds
   - **Fix:** Check SVG viewBox, ensure pattern fits within stated dimensions
2. ❌ Clipping rectangle miscalculated
   - **Fix:** Verify USABLE_WIDTH/HEIGHT calculations

### Scale Overlaps Pattern

**Symptom:** Scale square covers important pattern details

**Causes:**
1. ❌ Pattern extends into top-left corner
   - **Fix:** Move scale square to different corner (see Customization)

---

## Advanced Usage

### Batch Processing

```python
import glob

# Process all SVG files in directory
for svg_file in glob.glob("patterns/*.svg"):
    output_file = svg_file.replace(".svg", "_tiled.pdf")
    create_tiled_pdf(svg_file, output_file)
    print(f"Generated: {output_file}")
```

### Custom Page Info

Modify `draw_page_info()` function to add:
- Pattern name
- Date generated
- Size information
- Assembly instructions

### Pattern-Specific Adjustments

```python
def create_tiled_pdf(svg_path, output_path, pattern_type="trouser"):
    """
    pattern_type: "trouser", "bodice", "sleeve", etc.
    Allows pattern-specific optimizations
    """
    # Adjust scale square position based on pattern type
    if pattern_type == "trouser":
        scale_position = "top-left"  # Waist area usually clear
    elif pattern_type == "bodice":
        scale_position = "bottom-right"  # Armhole area often busy
```

---

## Version History

**Version 2.0** (Current)
- ✅ Fixed Y-coordinate transformation for correct tile positioning
- ✅ Page 1 now shows top-left of pattern (waistline)
- ✅ Alignment marks at 2cm from edge (no mark overlap)
- ✅ Labels inside overlap area
- ✅ Scale square moved to top-left corner
- ✅ Clipping ensures only tile content renders

**Version 1.0**
- Initial implementation
- Basic tiling with overlap
- Y-coordinate issues (pages reversed)

---

## Credits & License

**Created:** January 2026
**Purpose:** Pattern-making tool for garment construction
**License:** MIT (adjust as needed)

For questions or issues, refer to the main pattern generation documentation.

---

**End of Guide**
