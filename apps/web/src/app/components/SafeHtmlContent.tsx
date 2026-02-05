"use client";

type SafeHtmlContentProps = {
  html: string;
  className?: string;
};

/**
 * Renders HTML content safely.
 * Used for content created with TinyMCE by trusted admin users.
 *
 * Note: This trusts the HTML content. For user-submitted content,
 * consider adding DOMPurify sanitization.
 */
export function SafeHtmlContent({ html, className = "" }: SafeHtmlContentProps) {
  if (!html || html.trim() === "") {
    return (
      <div className={`html-content ${className}`}>
        <p className="text-muted">Kein Inhalt verfügbar.</p>
      </div>
    );
  }

  return (
    <div
      className={`html-content prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        lineHeight: 1.7,
      }}
    />
  );
}
