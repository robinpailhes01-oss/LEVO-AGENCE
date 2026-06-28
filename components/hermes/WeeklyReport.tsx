import { Fragment } from "react";

/** Render inline **bold** segments without any external markdown dependency. */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Minimal, safe Markdown renderer for HERMES reports (headings, lists, paragraphs). */
export function WeeklyReport({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="my-2 list-inside list-disc space-y-1 text-sm text-ink/80">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flushList(`l-${idx}`);
      blocks.push(
        <h4 key={idx} className="mt-4 font-display text-base font-semibold text-ink">
          {renderInline(line.replace(/^###\s+/, ""))}
        </h4>,
      );
    } else if (/^##\s+/.test(line)) {
      flushList(`l-${idx}`);
      blocks.push(
        <h3 key={idx} className="mt-5 font-display text-lg font-semibold text-ink">
          {renderInline(line.replace(/^##\s+/, ""))}
        </h3>,
      );
    } else if (/^#\s+/.test(line)) {
      flushList(`l-${idx}`);
      blocks.push(
        <h2 key={idx} className="mt-2 font-display text-xl font-semibold text-ink">
          {renderInline(line.replace(/^#\s+/, ""))}
        </h2>,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flushList(`l-${idx}`);
    } else {
      flushList(`l-${idx}`);
      blocks.push(
        <p key={idx} className="my-2 text-sm leading-relaxed text-ink/80">
          {renderInline(line)}
        </p>,
      );
    }
  });
  flushList("l-final");

  return <div>{blocks}</div>;
}
