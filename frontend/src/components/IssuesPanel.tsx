import type { ReviewIssue } from "@/utils/mockData";
import { Bug, Shield, Zap, Lightbulb, ChevronRight } from "lucide-react";

interface Props {
  issues: ReviewIssue[];
  selectedIssue: ReviewIssue | null;
  onSelectIssue: (issue: ReviewIssue) => void;
}

const iconMap = { bug: Bug, security: Shield, performance: Zap, improvement: Lightbulb };
const colorMap = {
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-warning/30 bg-warning/5",
  low: "border-accent/30 bg-accent/5",
};
const sevLabel = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-accent",
};

const IssuesPanel = ({ issues, selectedIssue, onSelectIssue }: Props) => {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-mono text-sm font-semibold text-foreground">Issues ({issues.length})</h3>
      </div>
      <div className="divide-y divide-border">
        {issues.map((issue) => {
          const Icon = iconMap[issue.type];
          const isSelected = selectedIssue?.id === issue.id;
          return (
            <button
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30 ${
                isSelected ? "bg-secondary/50 border-l-2 border-l-primary" : ""
              }`}
            >
              <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${sevLabel[issue.severity]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{issue.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{issue.description}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${sevLabel[issue.severity]} ${colorMap[issue.severity]}`}>
                    {issue.severity}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">L{issue.lineStart}</span>
                </div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IssuesPanel;
