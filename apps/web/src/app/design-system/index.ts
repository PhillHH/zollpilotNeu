/**
 * =============================================================================
 * ZollPilot Design System v1
 * =============================================================================
 * 
 * Zentraler Export für alle Design-System-Komponenten.
 * 
 * VERWENDUNG:
 * 
 * ```tsx
 * import { Button, Card, Badge } from '@/app/design-system';
 * ```
 * 
 * CSS IMPORTS (in layout.tsx oder globals.css):
 * 
 * ```css
 * @import './design-system/tokens.css';
 * @import './design-system/base.css';
 * ```
 */

// Re-export all primitives
export * from './primitives';

// Export types for external use
export type { Step } from './primitives/Stepper';

