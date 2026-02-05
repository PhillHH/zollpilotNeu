/**
 * IZA Hero-Flow Status Logic Tests
 *
 * Tests für das neue Statusmodell:
 * - DRAFT → IN_PROCESS → PREPARED → COMPLETED → ARCHIVED
 */

import type { CaseStatus } from "../../../lib/api/client";

describe("IZA Hero-Flow Status Logic", () => {
  describe("Readonly Logic", () => {
    const isReadonly = (status: CaseStatus): boolean => {
      return ["PREPARED", "COMPLETED", "ARCHIVED"].includes(status);
    };

    it("should allow editing in DRAFT status", () => {
      expect(isReadonly("DRAFT")).toBe(false);
    });

    it("should allow editing in IN_PROCESS status", () => {
      expect(isReadonly("IN_PROCESS")).toBe(false);
    });

    it("should be readonly in PREPARED status", () => {
      expect(isReadonly("PREPARED")).toBe(true);
    });

    it("should be readonly in COMPLETED status", () => {
      expect(isReadonly("COMPLETED")).toBe(true);
    });

    it("should be readonly in ARCHIVED status", () => {
      expect(isReadonly("ARCHIVED")).toBe(true);
    });
  });

  describe("Status Transitions", () => {
    const validTransitions: Record<CaseStatus, CaseStatus[]> = {
      DRAFT: ["IN_PROCESS"],
      IN_PROCESS: ["PREPARED"],
      PREPARED: ["IN_PROCESS", "COMPLETED"], // reopen or complete
      COMPLETED: ["ARCHIVED"],
      ARCHIVED: [],
    };

    const canTransition = (from: CaseStatus, to: CaseStatus): boolean => {
      return validTransitions[from]?.includes(to) ?? false;
    };

    it("should allow DRAFT → IN_PROCESS (bind procedure)", () => {
      expect(canTransition("DRAFT", "IN_PROCESS")).toBe(true);
    });

    it("should allow IN_PROCESS → PREPARED (submit)", () => {
      expect(canTransition("IN_PROCESS", "PREPARED")).toBe(true);
    });

    it("should allow PREPARED → IN_PROCESS (reopen)", () => {
      expect(canTransition("PREPARED", "IN_PROCESS")).toBe(true);
    });

    it("should allow PREPARED → COMPLETED (mark complete)", () => {
      expect(canTransition("PREPARED", "COMPLETED")).toBe(true);
    });

    it("should allow COMPLETED → ARCHIVED (archive)", () => {
      expect(canTransition("COMPLETED", "ARCHIVED")).toBe(true);
    });

    it("should NOT allow IN_PROCESS → DRAFT (backwards)", () => {
      expect(canTransition("IN_PROCESS", "DRAFT")).toBe(false);
    });

    it("should NOT allow COMPLETED → IN_PROCESS (no reopen after complete)", () => {
      expect(canTransition("COMPLETED", "IN_PROCESS")).toBe(false);
    });

    it("should NOT allow ARCHIVED → any (final state)", () => {
      expect(canTransition("ARCHIVED", "DRAFT")).toBe(false);
      expect(canTransition("ARCHIVED", "IN_PROCESS")).toBe(false);
      expect(canTransition("ARCHIVED", "PREPARED")).toBe(false);
      expect(canTransition("ARCHIVED", "COMPLETED")).toBe(false);
    });
  });

  describe("Status Labels (German)", () => {
    const getStatusLabel = (status: CaseStatus): string => {
      const labels: Record<CaseStatus, string> = {
        DRAFT: "Entwurf",
        IN_PROCESS: "In Bearbeitung",
        PREPARED: "Vorbereitet",
        COMPLETED: "Erledigt",
        ARCHIVED: "Archiviert",
      };
      return labels[status] ?? status;
    };

    it("should return correct label for DRAFT", () => {
      expect(getStatusLabel("DRAFT")).toBe("Entwurf");
    });

    it("should return correct label for IN_PROCESS", () => {
      expect(getStatusLabel("IN_PROCESS")).toBe("In Bearbeitung");
    });

    it("should return correct label for PREPARED", () => {
      expect(getStatusLabel("PREPARED")).toBe("Vorbereitet");
    });

    it("should return correct label for COMPLETED", () => {
      expect(getStatusLabel("COMPLETED")).toBe("Erledigt");
    });

    it("should return correct label for ARCHIVED", () => {
      expect(getStatusLabel("ARCHIVED")).toBe("Archiviert");
    });
  });

  describe("CTA Text per Status", () => {
    const getCtaText = (status: CaseStatus): string => {
      switch (status) {
        case "DRAFT":
        case "IN_PROCESS":
          return "Weiter ausfüllen";
        case "PREPARED":
          return "Zusammenfassung ansehen";
        case "COMPLETED":
          return "Details ansehen";
        case "ARCHIVED":
          return "Fall ansehen";
        default:
          return "Öffnen";
      }
    };

    it("should show 'Weiter ausfüllen' for DRAFT", () => {
      expect(getCtaText("DRAFT")).toBe("Weiter ausfüllen");
    });

    it("should show 'Weiter ausfüllen' for IN_PROCESS", () => {
      expect(getCtaText("IN_PROCESS")).toBe("Weiter ausfüllen");
    });

    it("should show 'Zusammenfassung ansehen' for PREPARED", () => {
      expect(getCtaText("PREPARED")).toBe("Zusammenfassung ansehen");
    });

    it("should show 'Details ansehen' for COMPLETED", () => {
      expect(getCtaText("COMPLETED")).toBe("Details ansehen");
    });

    it("should show 'Fall ansehen' for ARCHIVED", () => {
      expect(getCtaText("ARCHIVED")).toBe("Fall ansehen");
    });
  });

  describe("PDF Export Eligibility", () => {
    const canExportPdf = (status: CaseStatus): boolean => {
      return ["PREPARED", "COMPLETED"].includes(status);
    };

    it("should NOT allow PDF export in DRAFT", () => {
      expect(canExportPdf("DRAFT")).toBe(false);
    });

    it("should NOT allow PDF export in IN_PROCESS", () => {
      expect(canExportPdf("IN_PROCESS")).toBe(false);
    });

    it("should allow PDF export in PREPARED", () => {
      expect(canExportPdf("PREPARED")).toBe(true);
    });

    it("should allow PDF export in COMPLETED", () => {
      expect(canExportPdf("COMPLETED")).toBe(true);
    });

    it("should NOT allow PDF export in ARCHIVED", () => {
      expect(canExportPdf("ARCHIVED")).toBe(false);
    });
  });
});
