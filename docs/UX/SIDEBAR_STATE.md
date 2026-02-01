# Sidebar State Architecture

> **Status**: Implemented (Sprint TBD)  
> **Owner**: Frontend Team  
> **Last Updated**: 2026-02-01

---

## Overview

This document describes the state management architecture for the application sidebar. The design prioritizes **scalability**, **testability**, and **clear separation of concerns**.

---

## State Model

### Core State

```typescript
interface SidebarState {
  isCollapsed: boolean;        // Sidebar collapse state
  openSectionId: string | null; // Currently open section (accordion)
}
```

### Design Decisions

#### 1. Single Source of Truth

**Decision**: All sidebar state lives in a single hook (`useSidebarState`).

**Rationale**:
- Prevents state synchronization issues
- Makes testing straightforward
- Clear ownership of state mutations

**Alternatives Considered**:
- Context API: Overkill for component-local state
- Multiple hooks: Risk of state drift

#### 2. Accordion Behavior (One Section Open)

**Decision**: Only one section can be open at a time.

**Rationale**:
- Reduces visual clutter
- Clearer user focus
- Simpler state management (single `openSectionId` instead of `Set<string>`)

**Future Extension**:
If multi-section expansion is needed:
```typescript
interface SidebarState {
  isCollapsed: boolean;
  openSectionIds: Set<string>; // Multiple sections
}
```

#### 3. Collapsed State Closes All Sections

**Decision**: When `isCollapsed = true`, all sections must be closed.

**Rationale**:
- Collapsed sidebar has no space for submenus
- Prevents invalid UI states
- Simplifies rendering logic

**Implementation**:
- `toggleCollapse()` sets `openSectionId = null` when collapsing
- `openSection()` is a no-op when `isCollapsed = true`
- `isSectionOpen()` returns `false` when collapsed

---

## API Design

### Hook Interface

```typescript
interface UseSidebarStateReturn {
  // State
  isCollapsed: boolean;
  openSectionId: string | null;
  
  // Actions
  toggleCollapse: () => void;
  openSection: (id: string) => void;
  closeSection: () => void;
  
  // Queries
  isSectionOpen: (id: string) => boolean;
}
```

### Why This API?

#### Explicit Actions

**Decision**: Separate `openSection()` and `closeSection()` instead of `toggleSection()`.

**Rationale**:
- Clearer intent in calling code
- Easier to test (no toggle ambiguity)
- Supports future use cases (e.g., "close all sections")

**Trade-off**: Slightly more verbose, but more predictable.

#### Query Function (`isSectionOpen`)

**Decision**: Provide a dedicated query function instead of requiring manual checks.

**Rationale**:
- Encapsulates the logic: `openSectionId === id && !isCollapsed`
- Prevents bugs from forgetting the `isCollapsed` check
- Single source of truth for "is this section open?"

---

## Component Architecture

### Component Hierarchy

```
<Sidebar>
  <SidebarToggle />
  <SidebarSection id="section-1">
    <SidebarItem />
    <SidebarItem />
  </SidebarSection>
  <SidebarSection id="section-2">
    <SidebarItem />
  </SidebarSection>
</Sidebar>
```

### Responsibility Separation

| Component | Responsibility |
|-----------|----------------|
| `<Sidebar>` | Container, passes `isCollapsed` to children |
| `<SidebarToggle>` | Triggers `toggleCollapse()` |
| `<SidebarSection>` | Manages section expand/collapse, renders children conditionally |
| `<SidebarItem>` | Leaf node, no state |

### Why This Structure?

**Decision**: State lives in parent, passed down via props (not Context).

**Rationale**:
- Explicit data flow (easier to debug)
- No hidden dependencies
- Components remain testable in isolation

**When to Use Context**:
If the sidebar grows to 5+ levels deep, consider Context to avoid prop drilling.

---

## State Transitions

### Valid State Transitions

```
Initial: { isCollapsed: false, openSectionId: null }

toggleCollapse()
  → { isCollapsed: true, openSectionId: null }

toggleCollapse() (while collapsed)
  → { isCollapsed: false, openSectionId: null }

openSection('section-1') (while expanded)
  → { isCollapsed: false, openSectionId: 'section-1' }

openSection('section-2') (while section-1 is open)
  → { isCollapsed: false, openSectionId: 'section-2' }

openSection('section-1') (while section-1 is open)
  → { isCollapsed: false, openSectionId: null } // Toggle off

closeSection()
  → { isCollapsed: false, openSectionId: null }
```

### Invalid States (Prevented by Design)

```
❌ { isCollapsed: true, openSectionId: 'section-1' }
   → Prevented by: toggleCollapse() sets openSectionId = null
   → Prevented by: openSection() is no-op when collapsed

❌ { isCollapsed: false, openSectionId: 'section-1,section-2' }
   → Prevented by: openSectionId is string | null (not array)
```

---

## Scalability

### Current Limitations

1. **No Persistence**: State resets on page reload
2. **No Multi-Section Expansion**: Only one section at a time
3. **No Nested Sections**: Flat hierarchy only

### Future Extensions

#### 1. Persistence (LocalStorage)

```typescript
function useSidebarState() {
  const [state, setState] = useState<SidebarState>(() => {
    const saved = localStorage.getItem('sidebar-state');
    return saved ? JSON.parse(saved) : { isCollapsed: false, openSectionId: null };
  });

  useEffect(() => {
    localStorage.setItem('sidebar-state', JSON.stringify(state));
  }, [state]);

  // ... rest of hook
}
```

#### 2. Multi-Section Expansion

```typescript
interface SidebarState {
  isCollapsed: boolean;
  openSectionIds: Set<string>; // Changed from string | null
}

function openSection(id: string) {
  setState(prev => ({
    ...prev,
    openSectionIds: new Set([...prev.openSectionIds, id]),
  }));
}
```

#### 3. Nested Sections

```typescript
interface SidebarState {
  isCollapsed: boolean;
  openSectionIds: Set<string>;
  expandedPaths: Map<string, string[]>; // section-id → [parent-id, grandparent-id]
}
```

---

## Testing Strategy

### Unit Tests (Hook)

**Coverage**:
- ✅ Initial state
- ✅ `toggleCollapse()` behavior
- ✅ `openSection()` accordion logic
- ✅ `closeSection()` idempotency
- ✅ `isSectionOpen()` with collapsed state
- ✅ No sections open when collapsed

**Test File**: `apps/web/src/app/hooks/__tests__/useSidebarState.test.ts`

### Integration Tests (Components)

**Future**:
- User clicks toggle → sidebar collapses
- User clicks section → section expands
- User clicks different section → first section closes

---

## Open Questions / Gaps

### 1. Keyboard Navigation

**Question**: Should sections be keyboard-navigable (Tab, Enter, Arrow keys)?

**Impact**: Accessibility compliance (WCAG 2.1)

**Decision Needed**: Sprint TBD

### 2. Animation Timing

**Question**: How long should expand/collapse animations take?

**Current**: No animations (functional only)

**Decision Needed**: UX team to define

### 3. Mobile Behavior

**Question**: Should sidebar be a drawer on mobile?

**Current**: Same behavior on all screen sizes

**Decision Needed**: Responsive design sprint

---

## References

- [React Hooks Best Practices](https://react.dev/reference/react)
- [WCAG 2.1 Navigation](https://www.w3.org/WAI/WCAG21/Understanding/navigation-mechanisms)
- [Accordion Pattern (WAI-ARIA)](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

---

*Last reviewed: 2026-02-01*
