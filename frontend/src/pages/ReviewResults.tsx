import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CodeViewer from "@/components/CodeViewer";
import IssuesPanel from "@/components/IssuesPanel";
import CommentsSection from "@/components/CommentsSection";
import VersionComparePanel from "@/components/VersionComparePanel";
import { type ReviewIssue } from "@/utils/mockData";
import { Bug, Shield, Zap, Lightbulb } from "lucide-react";
import { projectsApi, reviewApi, uploadApi, versionsApi } from "@/services/api";

type ReviewRecord = {
  _id: string;
  fileName: string;
  qualityScore: number;
  createdAt: string;
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

type VersionDiff = {
  added: string[];
  removed: string[];
  changed: string[];
};

type VersionAnalysis = {
  avgScore: number;
  criticalIssues: number;
  totalIssues: number;
  reviewCount: number;
};

const ReviewResults = () => {
  const { id: projectId = "" } = useParams();
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "bug" | "security" | "performance" | "improvement">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [fileName, setFileName] = useState("code");
  const [projectLabel, setProjectLabel] = useState("project");
  const [reviewIdForComments, setReviewIdForComments] = useState("");
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [versions, setVersions] = useState<ProjectVersionSummary[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [compareBaseVersionId, setCompareBaseVersionId] = useState("");
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null);
  const [selectedVersionAnalysis, setSelectedVersionAnalysis] = useState<VersionAnalysis | null>(null);
  const [baseVersionAnalysis, setBaseVersionAnalysis] = useState<VersionAnalysis | null>(null);
  const [analysisByVersionId, setAnalysisByVersionId] = useState<Record<string, VersionAnalysis>>({});
  const [addMode, setAddMode] = useState<"upload" | "paste">("upload");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFileName, setNewFileName] = useState("snippet.ts");
  const [newCode, setNewCode] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);
  const [saveVersionError, setSaveVersionError] = useState("");
  const [saveVersionMessage, setSaveVersionMessage] = useState("");
  const [runningReview, setRunningReview] = useState(false);
  const [runReviewError, setRunReviewError] = useState("");
  const [runReviewMessage, setRunReviewMessage] = useState("");

  const refreshVersions = async (preferredVersionId?: string) => {
    const versionsRes = await versionsApi.list(projectId);
    const versionData = versionsRes.data?.data;
    const loadedVersions: ProjectVersionSummary[] = versionData?.versions || [];
    setVersions(loadedVersions);

    if (preferredVersionId && loadedVersions.some((version) => version.id === preferredVersionId)) {
      setSelectedVersionId(preferredVersionId);
      return;
    }

    const currentVersionId = versionData?.currentVersionId || loadedVersions[0]?.id || "";
    if (currentVersionId) {
      setSelectedVersionId(currentVersionId);
    }
  };

  const analyzeReviews = (reviews: ReviewRecord[]): VersionAnalysis => {
    const reviewCount = reviews.length;
    if (!reviewCount) {
      return {
        avgScore: 0,
        criticalIssues: 0,
        totalIssues: 0,
        reviewCount: 0,
      };
    }

    const totalScore = reviews.reduce((sum, review) => sum + (review.qualityScore || 0), 0);
    const criticalIssues = reviews.reduce(
      (sum, review) => sum + (review.aiFeedback?.bugs?.length || 0) + (review.aiFeedback?.securityIssues?.length || 0),
      0
    );
    const totalIssues = reviews.reduce(
      (sum, review) =>
        sum +
        (review.aiFeedback?.bugs?.length || 0) +
        (review.aiFeedback?.securityIssues?.length || 0) +
        (review.aiFeedback?.performanceIssues?.length || 0) +
        (review.aiFeedback?.codeImprovements?.length || 0),
      0
    );

    return {
      avgScore: Math.round((totalScore / reviewCount) * 10) / 10,
      criticalIssues,
      totalIssues,
      reviewCount,
    };
  };

  const getLatestReviewsPerFile = (reviews: ReviewRecord[]) => {
    const byFile = new Map<string, ReviewRecord>();
    reviews.forEach((review) => {
      const existing = byFile.get(review.fileName);
      if (!existing) {
        byFile.set(review.fileName, review);
        return;
      }

      const existingTs = new Date(existing.createdAt || 0).getTime();
      const currentTs = new Date(review.createdAt || 0).getTime();
      if (currentTs >= existingTs) {
        byFile.set(review.fileName, review);
      }
    });
    return [...byFile.values()];
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        setError("");

        const [projectRes, versionsRes] = await Promise.all([projectsApi.get(projectId), versionsApi.list(projectId)]);

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

        const defaultCompareBase = loadedVersions.find((version) => version.id !== firstVersionId)?.id || "";
        setCompareBaseVersionId(defaultCompareBase);
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
    let isActive = true;

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
        const reviewsRaw: ReviewRecord[] = reviewsRes.data?.data?.reviews || [];
        const reviews = getLatestReviewsPerFile(reviewsRaw);

        if (!version) {
          throw new Error("Project version not found");
        }

        const firstFile = version.files?.[0];
        if (!isActive) return;
        setCode(firstFile?.content || "// No code file available");
        setLanguage((firstFile?.language || "typescript").toLowerCase());
        setFileName(firstFile?.fileName || "code");
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

        if (!isActive) return;
        setIssues(nextIssues);
        setSelectedIssue(nextIssues[0] || null);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load version data");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadVersionData();

    return () => {
      isActive = false;
    };
  }, [projectId, selectedVersionId]);

  useEffect(() => {
    const loadVersionAnalyses = async () => {
      if (!projectId || !versions.length) {
        setAnalysisByVersionId({});
        return;
      }

      try {
        const entries = await Promise.all(
          versions.map(async (version) => {
            const reviewsRes = await reviewApi.getByProject(projectId, version.id);
            const rawReviews: ReviewRecord[] = reviewsRes.data?.data?.reviews || [];
            const latestReviews = getLatestReviewsPerFile(rawReviews);
            return [version.id, analyzeReviews(latestReviews)] as const;
          })
        );

        setAnalysisByVersionId(Object.fromEntries(entries));
      } catch {
        // Keep existing analyses on transient failures; UI can still function with prior data.
      }
    };

    void loadVersionAnalyses();
  }, [projectId, versions]);

  useEffect(() => {
    if (!selectedVersionId) return;
    if (compareBaseVersionId && compareBaseVersionId !== selectedVersionId) return;

    const fallbackVersion = versions.find((version) => version.id !== selectedVersionId)?.id || "";
    setCompareBaseVersionId(fallbackVersion);
  }, [versions, selectedVersionId, compareBaseVersionId]);

  useEffect(() => {
    const loadCompare = async () => {
      if (!projectId || !selectedVersionId || !compareBaseVersionId || compareBaseVersionId === selectedVersionId) {
        setVersionDiff(null);
        setCompareError("");
        return;
      }

      try {
        setCompareLoading(true);
        setCompareError("");

        const compareRes = await versionsApi.compare(projectId, compareBaseVersionId, selectedVersionId);
        const diff = compareRes.data?.data?.diff;

        setVersionDiff({
          added: diff?.added || [],
          removed: diff?.removed || [],
          changed: diff?.changed || [],
        });
      } catch (err) {
        setVersionDiff(null);
        setCompareError(err instanceof Error ? err.message : "Failed to compare versions");
      } finally {
        setCompareLoading(false);
      }
    };

    void loadCompare();
  }, [projectId, selectedVersionId, compareBaseVersionId]);

  useEffect(() => {
    setSelectedVersionAnalysis(
      selectedVersionId ? (analysisByVersionId[selectedVersionId] || null) : null
    );
  }, [selectedVersionId, analysisByVersionId]);

  useEffect(() => {
    setBaseVersionAnalysis(
      compareBaseVersionId ? (analysisByVersionId[compareBaseVersionId] || null) : null
    );
  }, [compareBaseVersionId, analysisByVersionId]);

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    try {
      setSavingVersion(true);
      setSaveVersionError("");
      setSaveVersionMessage("");
      setRunReviewError("");
      setRunReviewMessage("");
      let nextVersionId = "";

      if (addMode === "upload") {
        if (!newFiles.length) {
          throw new Error("Select at least one file.");
        }
        const form = new FormData();
        form.append("projectId", projectId);
        newFiles.forEach((file) => form.append("files", file));
        const uploadRes = await uploadApi.upload(form);
        nextVersionId = uploadRes.data?.data?.currentVersionId || "";
      } else {
        if (!newCode.trim()) {
          throw new Error("Paste code to create a new version.");
        }
        const pasteRes = await projectsApi.pasteCode(projectId, {
          fileName: newFileName.trim() || "snippet.ts",
          content: newCode,
        });
        nextVersionId = pasteRes.data?.data?.currentVersionId || "";
      }

      if (nextVersionId) {
        await reviewApi.start(projectId, nextVersionId);
      }

      await refreshVersions(nextVersionId || undefined);
      setSaveVersionMessage("New version added and reviewed successfully.");
      setNewFiles([]);
      if (addMode === "paste") {
        setNewCode("");
      }
    } catch (err) {
      setSaveVersionError(err instanceof Error ? err.message : "Failed to add a new version");
    } finally {
      setSavingVersion(false);
    }
  };

  const handleRunReviewForSelectedVersion = async () => {
    if (!projectId || !selectedVersionId) return;
    try {
      setRunningReview(true);
      setRunReviewError("");
      setRunReviewMessage("");
      const versionId = selectedVersionId;
      await reviewApi.start(projectId, versionId);
      await refreshVersions(versionId);
      setRunReviewMessage("Review completed for selected version.");
    } catch (err) {
      setRunReviewError(err instanceof Error ? err.message : "Failed to run review");
    } finally {
      setRunningReview(false);
    }
  };

  const score = useMemo(() => {
    if (!selectedVersionAnalysis || !selectedVersionAnalysis.reviewCount) return 0;
    return Math.round(selectedVersionAnalysis.avgScore * 10);
  }, [selectedVersionAnalysis]);

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
  const hasCompareSummary = Boolean(versionDiff) && !compareLoading && !compareError;
  const selectedVersionNumber = versions.find((version) => version.id === selectedVersionId)?.versionNumber;

  const recommendation = useMemo(() => {
    if (!versions.length) {
      return { label: "Recommendation unavailable", detail: "No versions found for this project yet." };
    }

    const reviewedVersions = versions
      .map((version) => ({ version, analysis: analysisByVersionId[version.id] }))
      .filter((entry) => entry.analysis && entry.analysis.reviewCount > 0) as Array<{
      version: ProjectVersionSummary;
      analysis: VersionAnalysis;
    }>;

    if (!reviewedVersions.length) {
      return { label: "Recommendation unavailable", detail: "Run review for at least one version." };
    }

    const sorted = [...reviewedVersions].sort((a, b) => {
      if (a.analysis.criticalIssues !== b.analysis.criticalIssues) {
        return a.analysis.criticalIssues - b.analysis.criticalIssues;
      }
      if (a.analysis.avgScore !== b.analysis.avgScore) {
        return b.analysis.avgScore - a.analysis.avgScore;
      }
      if (a.analysis.totalIssues !== b.analysis.totalIssues) {
        return a.analysis.totalIssues - b.analysis.totalIssues;
      }
      return b.version.versionNumber - a.version.versionNumber;
    });

    const winner = sorted[0];
    const second = sorted[1];

    if (!second) {
      return {
        label: `Recommended: v${winner.version.versionNumber}`,
        detail: "Only one version has review results so far.",
      };
    }

    const tiedWithSecond =
      winner.analysis.criticalIssues === second.analysis.criticalIssues &&
      winner.analysis.avgScore === second.analysis.avgScore &&
      winner.analysis.totalIssues === second.analysis.totalIssues;

    if (tiedWithSecond) {
      return {
        label: `Recommended: v${winner.version.versionNumber}`,
        detail: "Top versions tie on metrics; latest version is preferred.",
      };
    }

    return {
      label: `Recommended: v${winner.version.versionNumber}`,
      detail: "Best overall across all reviewed versions (critical issues, score, total issues).",
    };
  }, [analysisByVersionId, versions]);

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
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-xs font-semibold text-foreground">Version History</h2>
            {hasCompareSummary ? (
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="rounded border border-border bg-background px-2 py-0.5 text-success">
                  +{versionDiff?.added.length || 0}
                </span>
                <span className="rounded border border-border bg-background px-2 py-0.5 text-destructive">
                  -{versionDiff?.removed.length || 0}
                </span>
                <span className="rounded border border-border bg-background px-2 py-0.5 text-warning">
                  ~{versionDiff?.changed.length || 0}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {compareLoading ? "Calculating diff..." : "Select versions to compare"}
              </span>
            )}
          </div>
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
                v{version.versionNumber} - {version.source} - {version.fileCount} files
              </button>
            ))}
          </div>
        </div>

        <VersionComparePanel
          versions={versions}
          selectedVersionId={selectedVersionId}
          compareBaseVersionId={compareBaseVersionId}
          onChangeCompareBaseVersionId={setCompareBaseVersionId}
          diff={versionDiff}
          loading={compareLoading}
          error={compareError}
        />

        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <h2 className="mb-2 font-mono text-xs font-semibold text-foreground">Recommended Version</h2>
          <p className="text-sm font-semibold text-foreground">{recommendation.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{recommendation.detail}</p>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <h2 className="mb-3 font-mono text-xs font-semibold text-foreground">Add New Version</h2>
          <form onSubmit={handleAddVersion} className="space-y-3">
            {saveVersionError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {saveVersionError}
              </p>
            )}
            {saveVersionMessage && (
              <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                {saveVersionMessage}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddMode("upload")}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  addMode === "upload"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                Upload Files
              </button>
              <button
                type="button"
                onClick={() => setAddMode("paste")}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  addMode === "paste"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                Paste Code
              </button>
            </div>

            {addMode === "upload" ? (
              <div className="space-y-2">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setNewFiles(e.target.files ? Array.from(e.target.files) : [])}
                  className="block w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
                  accept=".js,.ts,.tsx,.py,.go,.java,.rb,.rs,.cpp,.c,.h"
                />
                <p className="text-xs text-muted-foreground">{newFiles.length} file(s) selected</p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
                  placeholder="snippet.ts"
                />
                <textarea
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="h-24 w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs text-foreground"
                  placeholder="Paste updated code..."
                />
              </div>
            )}

            <button
              type="submit"
              disabled={savingVersion}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {savingVersion ? "Adding..." : "Add Version"}
            </button>
          </form>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <h2 className="mb-2 font-mono text-xs font-semibold text-foreground">Review Selected Version</h2>
          {runReviewError && (
            <p className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {runReviewError}
            </p>
          )}
          {runReviewMessage && (
            <p className="mb-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              {runReviewMessage}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleRunReviewForSelectedVersion()}
            disabled={runningReview || !selectedVersionId}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {runningReview ? "Running Review..." : "Run Review for Selected Version"}
          </button>
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
              key={selectedVersionId || "version-code"}
              code={code}
              language={language}
              fileName={fileName}
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
