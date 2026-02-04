// Server Component - DO NOT add "use client"
import { MDXRemote } from "next-mdx-remote/rsc";

type MDXContentProps = {
  source: string;
};

// Custom components for MDX rendering
const components = {
  // Callout component for highlighted content
  Callout: ({
    children,
    type = "info",
  }: {
    children: React.ReactNode;
    type?: "info" | "warning" | "tip";
  }) => {
    const styles: Record<string, React.CSSProperties> = {
      base: {
        padding: "1rem 1.25rem",
        borderRadius: "8px",
        margin: "1.5rem 0",
        borderLeft: "4px solid",
      },
      info: {
        background: "rgba(99, 102, 241, 0.1)",
        borderColor: "#6366f1",
      },
      warning: {
        background: "rgba(251, 191, 36, 0.1)",
        borderColor: "#fbbf24",
      },
      tip: {
        background: "rgba(34, 197, 94, 0.1)",
        borderColor: "#22c55e",
      },
    };
    return (
      <div style={{ ...styles.base, ...styles[type] }}>
        {children}
      </div>
    );
  },
};

export function MDXContent({ source }: MDXContentProps) {
  // Handle empty or missing content gracefully
  if (!source || source.trim() === "") {
    return (
      <div className="mdx-content">
        <p className="text-gray-500 italic">Kein Inhalt verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="mdx-content">
      <MDXRemote source={source} components={components} />
    </div>
  );
}
