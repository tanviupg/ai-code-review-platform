import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ReviewIssue } from "@/utils/mockData";
import { Bug, Shield, Zap, Lightbulb } from "lucide-react";

interface Props {
  code: string;
  language: string;
  fileName?: string;
  issues: ReviewIssue[];
  selectedIssue: ReviewIssue | null;
}

const issueIcon = (type: string) => {
  switch (type) {
    case "bug": return <Bug className="h-3 w-3" />;
    case "security": return <Shield className="h-3 w-3" />;
    case "performance": return <Zap className="h-3 w-3" />;
    default: return <Lightbulb className="h-3 w-3" />;
  }
};

const issueColor = (type: string) => {
  switch (type) {
    case "bug": return "bg-destructive/10 border-destructive/30 text-destructive";
    case "security": return "bg-warning/10 border-warning/30 text-warning";
    case "performance": return "bg-accent/10 border-accent/30 text-accent";
    default: return "bg-primary/10 border-primary/30 text-primary";
  }
};

const CodeViewer = ({ code, language, fileName = "code", issues, selectedIssue }: Props) => {
  const issueLines = new Map<number, ReviewIssue[]>();
  issues.forEach((issue) => {
    for (let l = issue.lineStart; l <= issue.lineEnd; l++) {
      const existing = issueLines.get(l) || [];
      existing.push(issue);
      issueLines.set(l, existing);
    }
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-warning/60" />
          <span className="h-3 w-3 rounded-full bg-success/60" />
        </div>
        <span className="font-mono text-xs text-muted-foreground">{fileName}</span>
      </div>

      <div className="relative overflow-auto text-sm">
        <SyntaxHighlighter
          language={language === "TypeScript" ? "typescript" : language.toLowerCase()}
          style={oneDark}
          showLineNumbers
          wrapLines
          lineProps={(lineNumber) => {
            const hasIssue = issueLines.has(lineNumber);
            const isSelected = selectedIssue && lineNumber >= selectedIssue.lineStart && lineNumber <= selectedIssue.lineEnd;
            return {
              style: {
                display: "block",
                backgroundColor: isSelected
                  ? "rgba(234, 179, 8, 0.08)"
                  : hasIssue
                  ? "rgba(239, 68, 68, 0.04)"
                  : undefined,
                borderLeft: isSelected ? "3px solid hsl(38, 92%, 55%)" : hasIssue ? "3px solid transparent" : "3px solid transparent",
              },
            };
          }}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: "hsl(220, 18%, 6%)",
            fontSize: "13px",
          }}
        >
          {code}
        </SyntaxHighlighter>

        {/* Issue annotations */}
        {selectedIssue && (
          <div className="border-t border-border bg-card p-4">
            <div className={`flex items-start gap-2 rounded-md border p-3 ${issueColor(selectedIssue.type)}`}>
              {issueIcon(selectedIssue.type)}
              <div>
                <p className="text-sm font-semibold">{selectedIssue.title}</p>
                <p className="mt-1 text-xs opacity-80">{selectedIssue.description}</p>
                {selectedIssue.suggestion && (
                  <div className="mt-2 rounded bg-muted px-3 py-2 font-mono text-xs text-foreground">
                    💡 {selectedIssue.suggestion}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeViewer;
