import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CodeViewer from "@/components/CodeViewer";
import IssuesPanel from "@/components/IssuesPanel";
import CommentsSection from "@/components/CommentsSection";
import { type ReviewIssue } from "@/utils/mockData";
import { Bug, Shield, Zap, Lightbulb } from "lucide-react";
import { projectsApi, reviewApi, versionsApi } from "@/services/api";

type ReviewRecord = {
  _id: string;
  fileName: string;
  qualityScore: number;
  aiFeedback: {
    bugs: string[];
    securityIssues: string[];
    performanceIssues: string[];
    codeImprovements: string[];
    summary: string;
  };
};

type ProjectVersionSummary = {
  id: string;
  versionNumber: number;
  source: string;
  notes: string;
  fileCount: number;
  createdAt: string;
};

type ProjectVersionDetail = {
  id: string;
  versionNumber: number;
  source: string;
  notes: string;
  files: Array<{
    fileName: string;
    language: string;
    content: string;
  }>;
  createdAt: string;
};

const ReviewResults = () => {
  const { id: projectId = "" } = useParams();
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "bug" | "security" | "performance" | "improvement">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [projectLabel, setProjectLabel] = useState("project");
  const [reviewIdForComments, setReviewIdForComments] = useState("");
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [versions, setVersions] = useState<ProjectVersionSummary[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState("");

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        setError("");

        const [projectRes, versionsRes] = await Promise.all([
          projectsApi.get(projectId),
          versionsApi.list(projectId),
        ]);

        const project = projectRes.data?.data;
        const versionData = versionsRes.data?.data;
        const loadedVersions: ProjectVersionSummary[] = versionData?.versions || [];

        if (!project) {
          throw new Error("Project not found");
        }

        setProjectLabel(project.name || project.repoUrl || project._id || "project");
        setVersions(loadedVersions);

        const firstVersionId = versionData?.currentVersionId || loadedVersions[0]?.id || "";
        setSelectedVersionId(firstVersionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load review results");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      void loadInitial();
    }
  }, [projectId]);

  useEffect(() => {
    const loadVersionData = async () => {
      if (!projectId || !selectedVersionId) return;

      try {
        setLoading(true);
        setError("");

        const [versionRes, reviewsRes] = await Promise.all([
          versionsApi.get(projectId, selectedVersionId),
          reviewApi.getByProject(projectId, selectedVersionId),
        ]);

        const version: ProjectVersionDetail = versionRes.data?.data;
        const reviews: ReviewRecord[] = reviewsRes.data?.data?.reviews || [];

        if (!version) {
          throw new Error("Project version not found");
        }

        const firstFile = version.files?.[0];
        setCode(firstFile?.content || "// No code file available");
        setLanguage((firstFile?.language || "typescript").toLowerCase());
        setReviewIdForComments(reviews[0]?._id || "");

        const nextIssues: ReviewIssue[] = [];
        let index = 1;
        reviews.forEach((review) => {
          review.aiFeedback.bugs.forEach((desc) => {
            nextIssues.push({ id: `${review._id}-bug-${index++}`, type: "bug", severity: "high", title: review.fileName, description: desc, lineStart: 1, lineEnd: 1 });
          });
          review.aiFeedback.securityIssues.forEach((desc) => {
            nextIssues.push({ id: `${review._id}-sec-${index++}`, type: "security", severity: "high", title: review.fileName, description: desc, lineStart: 1, lineEnd: 1 });
          });
          review.aiFeedback.performanceIssues.forEach((desc) => {
            nextIssues.push({ id: `${review._id}-perf-${index++}`, type: "performance", severity: "medium", title: review.fileName, description: desc, lineStart: 1, lineEnd: 1 });
          });
          review.aiFeedback.codeImprovements.forEach((desc) => {
            nextIssues.push({ id: `${review._id}-imp-${index++}`, type: "improvement", severity: "low", title: review.fileName, description: desc, lineStart: 1, lineEnd: 1 });
          });
        });

        setIssues(nextIssues);
        setSelectedIssue(nextIssues[0] || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load version data");
      } finally {
        setLoading(false);
      }
    };

    void loadVersionData();
  }, [projectId, selectedVersionId]);

  const score = useMemo(() => {
    if (!issues.length) return 0;
    const bySeverity = issues.reduce((acc, issue) => {
      if (issue.severity === "high") return acc + 0;
      if (issue.severity === "medium") return acc + 5;
      return acc + 8;
    }, 0);
    return Math.max(10, Math.min(100, Math.round((bySeverity / issues.length) * 10)));
  }, [issues]);

  const filteredIssues = activeTab === "all" ? issues : issues.filter((i) => i.type === activeTab);

  const tabs = [
    { key: "all", label: "All", count: issues.length },
    { key: "bug", label: "Bugs", count: issues.filter((i) => i.type === "bug").length, icon: Bug },
    { key: "security", label: "Security", count: issues.filter((i) => i.type === "security").length, icon: Shield },
    { key: "performance", label: "Performance", count: issues.filter((i) => i.type === "performance").length, icon: Zap },
    { key: "improvement", label: "Improvements", count: issues.filter((i) => i.type === "improvement").length, icon: Lightbulb },
  ];

  const scoreColor = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  const scoreRing = score >= 80 ? "border-success" : score >= 60 ? "border-warning" : "border-destructive";

  if (loading) {
    return <div className="min-h-screen bg-background"><Navbar /><main className="container py-6 text-muted-foreground">Loading review...</main></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background"><Navbar /><main className="container py-6 text-destructive">{error}</main></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-xl font-bold text-foreground">{projectLabel}</h1>
            <p className="text-sm text-muted-foreground">Reviewed just now</p>
          </div>
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 ${scoreRing}`}>
            <span className={`font-mono text-xl font-bold ${scoreColor}`}>{score}</span>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <h2 className="mb-2 font-mono text-xs font-semibold text-foreground">Version History</h2>
          <div className="flex flex-wrap gap-2">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => setSelectedVersionId(version.id)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedVersionId === version.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                v{version.versionNumber} · {version.source} · {version.fileCount} files
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon && <tab.icon className="h-3 w-3" />}
              {tab.label}
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CodeViewer
              code={code}
              language={language}
              issues={issues}
              selectedIssue={selectedIssue}
            />
          </div>
          <div className="space-y-4">
            <IssuesPanel
              issues={filteredIssues}
              selectedIssue={selectedIssue}
              onSelectIssue={setSelectedIssue}
            />
          </div>
        </div>

        <div className="mt-6">
          <CommentsSection reviewId={reviewIdForComments} />
        </div>
      </main>
    </div>
  );
};

export default ReviewResults;