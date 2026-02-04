"use client";

import { useState, useEffect } from "react";

type SafeMarkdownContentProps = {
  source: string;
};

/**
 * Simple markdown-like content renderer that won't crash on invalid content.
 * Converts basic markdown syntax to HTML without using MDX.
 */
export function SafeMarkdownContent({ source }: SafeMarkdownContentProps) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!source || source.trim() === "") {
      setContent("<p class='text-muted'>Kein Inhalt verfügbar.</p>");
      return;
    }

    try {
      // Simple markdown-to-HTML conversion
      let html = source
        // Escape HTML first for security
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Headers
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        // Bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/_(.*?)_/g, "<em>$1</em>")
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Line breaks (double newline = paragraph)
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
          // Check if it's already a block element
          if (p.startsWith("<h") || p.startsWith("<ul") || p.startsWith("<ol")) {
            return p;
          }
          return `<p>${p.replace(/\n/g, "<br/>")}</p>`;
        })
        .join("\n");

      setContent(html);
    } catch (error) {
      console.error("Error rendering content:", error);
      // Fallback: just show plain text with line breaks
      setContent(
        source
          .split("\n\n")
          .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
          .join("")
      );
    }
  }, [source]);

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        lineHeight: 1.7,
      }}
    />
  );
}
