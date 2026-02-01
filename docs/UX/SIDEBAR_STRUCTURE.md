# Sidebar Structure Architecture

> **Status**: Implemented
> **Focus**: Semantic Structure & Component Hierarchy

---

## Concept

The Sidebar uses a **Configuration-Driven** approach. The entire structure is defined in a JSON-like config object, which the Sidebar component renders dynamically.

This ensures:
1. **Consistency**: All items follow the same strict structure.
2. **Scalability**: Adding items is a one-line config change.
3. **Decoupling**: UI logic (React) is separated from Content (Config).

---

## 1. Mapping: Figma to Components

| Figma Element | React Component | Semantic HTML |
|---------------|-----------------|---------------|
| **Container** | `<Sidebar>` | `<nav>` |
| **Top Area** | `<SidebarHeader>` | `<div>` |
| **Primary Nav** | Dynamic Loop | `<ul>` |
| **Nav Item (Leaf)** | `<SidebarItem>` | `<li>` + `<a>` |
| **Nav Section** | `<SidebarSection>` | `<li>` + `<button>` + `<ul>` |
| **Sub Item** | `<SidebarItem>` | `<li>` + `<a>` (nested) |
| **Bottom Area** | `<SidebarFooter>` | `<div>` |
| **Toggle** | `<SidebarToggle>` | `<button>` |

---

## 2. Component Logic

### `<Sidebar>` (Root)
- **Role**: Controller
- **State**: Provides `useSidebarState` context
- **Responsibility**: Renders Header, Footer, and Iterates over Config

### `<SidebarSection>` (Parent)
- **Props**: `item`, `isOpen`, `isCollapsed`
- **Logic**:
  - Renders a trigger `<button>` (Accordion Header)
  - Renders nested `<ul>` if open AND NOT collapsed
  - **Critical Rule**: Submenus are **unmounted** when sidebar is collapsed.

### `<SidebarItem>` (Leaf)
- **Props**: `label`, `icon`, `href`
- **Logic**:
  - Renders `Link` (next/link)
  - Handles active state styling
  - Hides `label` text when collapsed (conditional rendering)

---

## 3. Configuration Model

Located in: `apps/web/src/navigation/sidebar.config.ts`

```typescript
interface NavItem {
  id: string;        // Unique key
  label: string;     // Display text
  iconKey: string;   // Icon identifier
  href?: string;     // Link target (Leaf only)
  children?: NavItem[]; // Nested items (Section only)
}
```

---

## 4. Accessibility Strategy

Strict adherence to [WAI-ARIA Structure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/):

1. **Active/Current Page**:
   - `aria-current="page"` (TODO: Add to `SidebarItem` logic)
   
2. **Expand/Collapse**:
   - `aria-expanded="true/false"` on Section Buttons
   - `aria-controls="submenu-id"` pointing to the nested list
   
3. **Semantic Lists**:
   - Nothing is a `div` that should be a `li`.
   - Nested structure: `<ul> <li> <button/> <ul> <li>...`

---

## 5. Notes on "No-CSS" Implementation

To satisfy the "Structure Only" requirement without CSS hiding:
- **Text Labels**: We use conditional React rendering `{!isCollapsed && <span>{label}</span>}`.
- **Submenus**: We strictly do not render the `<ul>` if collapsed.

In a real styling phase, CSS might handle some of this (e.g., opacity transitions), but removing them from the DOM is safer for the strict sidebar requirements (no submenus allowed).
