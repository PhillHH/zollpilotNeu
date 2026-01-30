"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { Alert } from "../../design-system/primitives/Alert";
import { profile, type ProfileData, type ProfileUpdatePayload } from "../../lib/api/client";
import { COUNTRIES, CURRENCIES } from "../cases/[id]/wizard/constants";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ProfileClient() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [defaultSenderName, setDefaultSenderName] = useState("");
  const [defaultSenderCountry, setDefaultSenderCountry] = useState("");
  const [defaultRecipientName, setDefaultRecipientName] = useState("");
  const [defaultRecipientCountry, setDefaultRecipientCountry] = useState("");
  const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
  const [preferredCurrencies, setPreferredCurrencies] = useState<string[]>([]);

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await profile.get();
        const data = response.data;
        setProfileData(data);

        // Populate form
        setName(data.name || "");
        setAddress(data.address || "");
        setDefaultSenderName(data.default_sender_name || "");
        setDefaultSenderCountry(data.default_sender_country || "");
        setDefaultRecipientName(data.default_recipient_name || "");
        setDefaultRecipientCountry(data.default_recipient_country || "");
        setPreferredCountries(data.preferred_countries || []);
        setPreferredCurrencies(data.preferred_currencies || []);
      } catch {
        setError("Profil konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Save profile
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    setError(null);

    const payload: ProfileUpdatePayload = {
      name: name || null,
      address: address || null,
      default_sender_name: defaultSenderName || null,
      default_sender_country: defaultSenderCountry || null,
      default_recipient_name: defaultRecipientName || null,
      default_recipient_country: defaultRecipientCountry || null,
      preferred_countries: preferredCountries.length > 0 ? preferredCountries : null,
      preferred_currencies: preferredCurrencies.length > 0 ? preferredCurrencies : null,
    };

    try {
      const response = await profile.update(payload);
      setProfileData(response.data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setError("Profil konnte nicht gespeichert werden.");
      setSaveStatus("error");
    }
  }, [
    name,
    address,
    defaultSenderName,
    defaultSenderCountry,
    defaultRecipientName,
    defaultRecipientCountry,
    preferredCountries,
    preferredCurrencies,
  ]);

  // Toggle country/currency selection
  const toggleCountry = (code: string) => {
    if (preferredCountries.includes(code)) {
      setPreferredCountries(preferredCountries.filter((c) => c !== code));
    } else if (preferredCountries.length < 10) {
      setPreferredCountries([...preferredCountries, code]);
    }
  };

  const toggleCurrency = (code: string) => {
    if (preferredCurrencies.includes(code)) {
      setPreferredCurrencies(preferredCurrencies.filter((c) => c !== code));
    } else if (preferredCurrencies.length < 5) {
      setPreferredCurrencies([...preferredCurrencies, code]);
    }
  };

  if (loading) {
    return (
      <Section>
        <div className="loading">Profil wird geladen...</div>
        <style jsx>{`
          .loading {
            text-align: center;
            padding: 4rem;
            color: var(--color-text-muted);
          }
        `}</style>
      </Section>
    );
  }

  return (
    <Section>
      <div className="profile-header">
        <h1>Mein Profil</h1>
        <p className="profile-subtitle">
          Diese Daten werden bei neuen Fällen automatisch vorgeschlagen.
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Fehler">
          {error}
        </Alert>
      )}

      <Alert variant="info" title="Hinweis">
        Deine Profildaten werden nur für die Vorbereitung deiner Fälle verwendet.
        Sie werden nicht an Dritte weitergegeben.
      </Alert>

      {/* Persönliche Daten */}
      <Card padding="lg" className="profile-card">
        <h2 className="section-title">Persönliche Daten</h2>

        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Max Mustermann"
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">E-Mail</label>
          <input
            type="email"
            id="email"
            value={profileData?.email || ""}
            disabled
            className="input-disabled"
          />
          <span className="form-hint">E-Mail-Adresse kann nicht geändert werden</span>
        </div>

        <div className="form-group">
          <label htmlFor="address">Adresse</label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Musterstraße 1&#10;12345 Musterstadt&#10;Deutschland"
            rows={3}
            maxLength={500}
          />
        </div>
      </Card>

      {/* Standard-Absender */}
      <Card padding="lg" className="profile-card">
        <h2 className="section-title">Standard-Absender</h2>
        <p className="section-hint">
          Wird als Vorschlag für Versenderangaben bei neuen Fällen verwendet.
        </p>

        <div className="form-group">
          <label htmlFor="sender-name">Name / Firma</label>
          <input
            type="text"
            id="sender-name"
            value={defaultSenderName}
            onChange={(e) => setDefaultSenderName(e.target.value)}
            placeholder="Name des Versenders"
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sender-country">Land</label>
          <select
            id="sender-country"
            value={defaultSenderCountry}
            onChange={(e) => setDefaultSenderCountry(e.target.value)}
          >
            <option value="">Bitte wählen...</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Standard-Empfänger */}
      <Card padding="lg" className="profile-card">
        <h2 className="section-title">Standard-Empfänger</h2>
        <p className="section-hint">
          Wird als Vorschlag für Empfängerangaben bei neuen Fällen verwendet.
        </p>

        <div className="form-group">
          <label htmlFor="recipient-name">Name</label>
          <input
            type="text"
            id="recipient-name"
            value={defaultRecipientName}
            onChange={(e) => setDefaultRecipientName(e.target.value)}
            placeholder="Name des Empfängers"
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="recipient-country">Land</label>
          <select
            id="recipient-country"
            value={defaultRecipientCountry}
            onChange={(e) => setDefaultRecipientCountry(e.target.value)}
          >
            <option value="">Bitte wählen...</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Häufige Länder & Währungen */}
      <Card padding="lg" className="profile-card">
        <h2 className="section-title">Häufige Länder & Währungen</h2>
        <p className="section-hint">
          Optional: Wähle Länder und Währungen aus, die du häufig verwendest.
          Sie erscheinen dann oben in den Auswahllisten.
        </p>

        <div className="form-group">
          <label>Häufige Länder (max. 10)</label>
          <div className="chip-grid">
            {COUNTRIES.slice(0, 20).map((country) => (
              <button
                key={country.code}
                type="button"
                className={`chip ${preferredCountries.includes(country.code) ? "chip-selected" : ""}`}
                onClick={() => toggleCountry(country.code)}
              >
                {country.name}
              </button>
            ))}
          </div>
          {preferredCountries.length > 0 && (
            <div className="selected-items">
              Ausgewählt: {preferredCountries.map((c) => COUNTRIES.find((x) => x.code === c)?.name).join(", ")}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Häufige Währungen (max. 5)</label>
          <div className="chip-grid">
            {CURRENCIES.slice(0, 10).map((currency) => (
              <button
                key={currency.code}
                type="button"
                className={`chip ${preferredCurrencies.includes(currency.code) ? "chip-selected" : ""}`}
                onClick={() => toggleCurrency(currency.code)}
              >
                {currency.code} - {currency.name}
              </button>
            ))}
          </div>
          {preferredCurrencies.length > 0 && (
            <div className="selected-items">
              Ausgewählt: {preferredCurrencies.map((c) => CURRENCIES.find((x) => x.code === c)?.name).join(", ")}
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="save-section">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saveStatus === "saving"}
        >
          {saveStatus === "saved" ? "Gespeichert!" : "Änderungen sichern"}
        </Button>
        {saveStatus === "saved" && (
          <span className="save-success">Änderungen wurden gespeichert</span>
        )}
      </div>

      <style jsx>{`
        .profile-header {
          margin-bottom: var(--space-lg);
        }

        .profile-header h1 {
          margin: 0 0 var(--space-xs) 0;
          font-size: var(--heading-h1);
        }

        .profile-subtitle {
          color: var(--color-text-muted);
          margin: 0;
        }

        :global(.profile-card) {
          margin-bottom: var(--space-lg);
        }

        .section-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          margin: 0 0 var(--space-xs) 0;
        }

        .section-hint {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0 0 var(--space-md) 0;
        }

        .form-group {
          margin-bottom: var(--space-md);
        }

        .form-group label {
          display: block;
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          margin-bottom: var(--space-xs);
          color: var(--color-text);
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-base);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-background);
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-soft);
        }

        .form-group .input-disabled {
          background: var(--color-background-subtle);
          color: var(--color-text-muted);
          cursor: not-allowed;
        }

        .form-hint {
          display: block;
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          margin-top: var(--space-xs);
        }

        .chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
          margin-top: var(--space-sm);
        }

        .chip {
          padding: var(--space-xs) var(--space-sm);
          font-size: var(--text-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          background: var(--color-background);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .chip:hover {
          border-color: var(--color-primary);
        }

        .chip-selected {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .selected-items {
          margin-top: var(--space-sm);
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .save-section {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-top: var(--space-lg);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--color-border);
        }

        .save-success {
          color: var(--color-success);
          font-size: var(--text-sm);
        }
      `}</style>
    </Section>
  );
}
