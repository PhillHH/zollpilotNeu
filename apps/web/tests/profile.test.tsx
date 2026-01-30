import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/app/profile",
}));

// Mock API client
const mockProfile = {
  get: vi.fn(),
  update: vi.fn(),
};

vi.mock("../src/app/lib/api/client", () => ({
  profile: mockProfile,
  apiRequest: vi.fn(),
}));

import { ProfileClient } from "../src/app/app/profile/ProfileClient";

describe("ProfileClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfileData = {
    user_id: "user-123",
    email: "test@example.com",
    name: "Max Mustermann",
    address: "Musterstraße 1\n12345 Musterstadt",
    default_sender_name: "China Shop",
    default_sender_country: "CN",
    default_recipient_name: "Max Mustermann",
    default_recipient_country: "DE",
    preferred_countries: ["CN", "US"],
    preferred_currencies: ["EUR", "USD"],
    updated_at: "2024-01-01T00:00:00Z",
  };

  test("shows loading state initially", () => {
    mockProfile.get.mockReturnValue(new Promise(() => {}));

    render(<ProfileClient />);

    expect(screen.getByText(/Profil wird geladen/i)).toBeInTheDocument();
  });

  test("renders profile form with loaded data", async () => {
    mockProfile.get.mockResolvedValue({ data: mockProfileData });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Mein Profil")).toBeInTheDocument();
    });

    // Check form fields are populated
    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    expect(nameInput.value).toBe("Max Mustermann");

    const emailInput = screen.getByLabelText("E-Mail") as HTMLInputElement;
    expect(emailInput.value).toBe("test@example.com");
    expect(emailInput).toBeDisabled();
  });

  test("shows error when loading fails", async () => {
    mockProfile.get.mockRejectedValue(new Error("Network error"));

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText(/Profil konnte nicht geladen werden/i)).toBeInTheDocument();
    });
  });

  test("displays privacy notice", async () => {
    mockProfile.get.mockResolvedValue({ data: mockProfileData });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(
        screen.getByText(/Deine Profildaten werden nur für die Vorbereitung deiner Fälle verwendet/i)
      ).toBeInTheDocument();
    });
  });

  test("displays hint about automatic suggestions", async () => {
    mockProfile.get.mockResolvedValue({ data: mockProfileData });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(
        screen.getByText(/Diese Daten werden bei neuen Fällen automatisch vorgeschlagen/i)
      ).toBeInTheDocument();
    });
  });

  test("renders Standard-Absender section", async () => {
    mockProfile.get.mockResolvedValue({ data: mockProfileData });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Standard-Absender")).toBeInTheDocument();
    });

    // Check sender fields
    const senderNameInput = screen.getByLabelText("Name / Firma") as HTMLInputElement;
    expect(senderNameInput.value).toBe("China Shop");
  });

  test("renders Standard-Empfänger section", async () => {
    mockProfile.get.mockResolvedValue({ data: mockProfileData });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Standard-Empfänger")).toBeInTheDocument();
    });
  });

  test("renders Häufige Länder & Währungen section", async () => {
    mockProfile.get.mockResolvedValue({ data: mockProfileData });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Häufige Länder & Währungen")).toBeInTheDocument();
    });
  });

  test("allows updating profile fields", async () => {
    mockProfile.get.mockResolvedValue({
      data: { ...mockProfileData, name: "" },
    });
    mockProfile.update.mockResolvedValue({
      data: { ...mockProfileData, name: "New Name" },
    });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Mein Profil")).toBeInTheDocument();
    });

    // Update name
    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "New Name" } });
    });

    // Click save
    const saveButton = screen.getByText("Profil speichern");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockProfile.update).toHaveBeenCalled();
    });
  });

  test("shows success message after saving", async () => {
    mockProfile.get.mockResolvedValue({ data: mockProfileData });
    mockProfile.update.mockResolvedValue({ data: mockProfileData });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Mein Profil")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Profil speichern");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Gespeichert!")).toBeInTheDocument();
    });
  });

  test("shows error message when save fails", async () => {
    mockProfile.get.mockResolvedValue({ data: mockProfileData });
    mockProfile.update.mockRejectedValue(new Error("Save failed"));

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Mein Profil")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Profil speichern");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Profil konnte nicht gespeichert werden/i)).toBeInTheDocument();
    });
  });

  test("renders empty profile for new users", async () => {
    mockProfile.get.mockResolvedValue({
      data: {
        user_id: "user-123",
        email: "new@example.com",
        name: null,
        address: null,
        default_sender_name: null,
        default_sender_country: null,
        default_recipient_name: null,
        default_recipient_country: null,
        preferred_countries: null,
        preferred_currencies: null,
        updated_at: null,
      },
    });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Mein Profil")).toBeInTheDocument();
    });

    // Fields should be empty
    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });

  test("country selection works", async () => {
    mockProfile.get.mockResolvedValue({
      data: { ...mockProfileData, preferred_countries: [] },
    });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Häufige Länder & Währungen")).toBeInTheDocument();
    });

    // Click on a country chip
    const germanyChip = screen.getByRole("button", { name: "Deutschland" });
    await act(async () => {
      fireEvent.click(germanyChip);
    });

    // Should show as selected
    expect(germanyChip).toHaveClass("chip-selected");
  });
});

describe("Profile - Data Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("profile data is isolated per user", async () => {
    // This test verifies that the profile API is called correctly
    // and doesn't leak data between users (tenant isolation is in backend)
    mockProfile.get.mockResolvedValue({
      data: {
        user_id: "user-specific-123",
        email: "specific@example.com",
        name: "Specific User",
        address: null,
        default_sender_name: null,
        default_sender_country: null,
        default_recipient_name: null,
        default_recipient_country: null,
        preferred_countries: null,
        preferred_currencies: null,
        updated_at: null,
      },
    });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(mockProfile.get).toHaveBeenCalled();
    });

    // Verify the correct user data is displayed
    await waitFor(() => {
      const emailInput = screen.getByLabelText("E-Mail") as HTMLInputElement;
      expect(emailInput.value).toBe("specific@example.com");
    });
  });

  test("profile changes do not affect case data directly", async () => {
    // Profile is separate from case data - this is conceptual
    // The wizard applies defaults but doesn't sync continuously
    mockProfile.get.mockResolvedValue({
      data: {
        user_id: "user-123",
        email: "test@example.com",
        name: "Test User",
        address: null,
        default_sender_name: "My Company",
        default_sender_country: "CN",
        default_recipient_name: null,
        default_recipient_country: null,
        preferred_countries: null,
        preferred_currencies: null,
        updated_at: null,
      },
    });
    mockProfile.update.mockResolvedValue({
      data: {
        user_id: "user-123",
        email: "test@example.com",
        name: "Test User",
        address: null,
        default_sender_name: "New Company Name",
        default_sender_country: "CN",
        default_recipient_name: null,
        default_recipient_country: null,
        preferred_countries: null,
        preferred_currencies: null,
        updated_at: new Date().toISOString(),
      },
    });

    render(<ProfileClient />);

    await waitFor(() => {
      expect(screen.getByText("Mein Profil")).toBeInTheDocument();
    });

    // Update sender name
    const senderInput = screen.getByLabelText("Name / Firma") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(senderInput, { target: { value: "New Company Name" } });
    });

    const saveButton = screen.getByText("Profil speichern");
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify the API was called with updated data
    await waitFor(() => {
      expect(mockProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          default_sender_name: "New Company Name",
        })
      );
    });
  });
});
