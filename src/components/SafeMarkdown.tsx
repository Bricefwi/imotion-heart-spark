import ReactMarkdown, { type Components } from "react-markdown";
import DOMPurify from "dompurify";

interface SafeMarkdownProps {
  children: string;
  className?: string;
  components?: Components;
}

/**
 * Wrapper around ReactMarkdown that sanitizes content with DOMPurify
 * to prevent XSS attacks from user-generated or AI-generated markdown.
 */
export function SafeMarkdown({ children, className, components }: SafeMarkdownProps) {
  const sanitized = DOMPurify.sanitize(children, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "strong", "em", "del", "code", "pre", "blockquote",
      "table", "thead", "tbody", "tr", "th", "td",
      "a", "img",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div className={className}>
      <ReactMarkdown components={components}>
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
