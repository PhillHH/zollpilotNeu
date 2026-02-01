# UI Widget Library

Reusable Dashboard Components derived from Figma design.

## Components

### OverviewCard
Displays a key metric with a trend indicator and sparkline chart.
- **Usage**: Dashboard top row stats.
- **Props**: `label`, `value`, `trend`, `trendUp`, `icon`, `chartColor`.
- **Figma Ref**: "Overview card"

### ActivityChart
A bar chart demonstrating weekly activity.
- **Usage**: Shows number of declarations per weekday.
- **Styling**: Uses CSS based bars with hover tooltips (no heavy charting lib required for this simplicity).
- **Figma Ref**: "Product views"

### CaseList
A rich list component to display ongoing processes (Cases).
- **Usage**: Main operational list.
- **Features**: 
    - Progress bars
    - Status colors
    - Hover actions (Edit, Message, More)
    - "Thumbnail" placeholders for document types
- **Figma Ref**: "Product table" / "Product Activity"

## Theme Compatibility
These components use the following ZollPilot Design System mappings:
- Backgrounds: `Neutral/01` (#FCFCFC)
- Primary Text: `Neutral/07` (#1A1D1F)
- Secondary Text: `Neutral/04` (#6F767E)
- Primary Action: `#2A85FF`
- Success: `#83BF6E`
