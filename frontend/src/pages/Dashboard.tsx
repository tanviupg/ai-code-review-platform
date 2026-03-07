import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { projectsApi, reviewApi } from "@/services/api";
import { Plus, GitBranch, Bug, Shield, Zap, ArrowRight } from "lucide-react";

type ProjectRecord = {
  _id: string;
  name: string;
  repoUrl?: string | null;
  files?: Array<{ language?: string }>;
  createdAt: string;
};

type ReviewRecord = {
  qualityScore: number;
  aiFeedback: {
    bugs: string[];
    securityIssues: string[];
    performanceIssues: string[];
    codeImprovements: string[];
  };
  createdAt: string;
};

type ProjectRow = {
  id: string;
  name: string;
  language: string;
  lastReview: string;
  score: number;
  issues: number;
  status: "reviewed" | "pending";
};

const severityColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
};

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    reviewed: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning border-warning/20",
  };
  return styles[status] || styles.pending;
};

const formatTime = (value?: string) => {
  if (!value) return "Not reviewed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not reviewed";
  return date.toLocaleString();
};

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const projectsRes = await projectsApi.list();
        const projectRecords: ProjectRecord[] = projectsRes.data?.data || [];

        const rows = await Promise.all(
          projectRecords.map(async (project) => {
            const reviewsRes = await reviewApi.getByProject(project._id);
            const reviews: ReviewRecord[] = reviewsRes.data?.data?.reviews || [];

            const avgScore =
              reviews.length > 0
                ? Math.round(
                    (reviews.reduce((sum, review) => sum + review.qualityScore, 0) /
                      reviews.length) *
                      10
                  )
                : 0;

            const issues = reviews.reduce(
              (sum, review) =>
                sum +
                (review.aiFeedback?.bugs?.length || 0) +
                (review.aiFeedback?.securityIssues?.length || 0) +
                (review.aiFeedback?.performanceIssues?.length || 0) +
                (review.aiFeedback?.codeImprovements?.length || 0),
              0
            );

            const latestReviewAt = reviews[0]?.createdAt;
            return {
              id: project._id,
              name: project.name,
              language: project.files?.[0]?.language || "Unknown",
              lastReview: formatTime(latestReviewAt),
              score: avgScore,
              issues,
              status: reviews.length ? "reviewed" : "pending",
            } as ProjectRow;
          })
        );

        setProjects(rows);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const stats = useMemo(() => {
    const bugs = projects.reduce((sum, project) => sum + project.issues, 0);
    const reviewed = projects.filter((project) => project.status === "reviewed").length;

    return [
      { label: "Projects", value: projects.length, icon: GitBranch },
      { label: "Total Issues", value: bugs, icon: Bug },
      { label: "Reviewed", value: reviewed, icon: Shield },
      {
        label: "Avg Score",
        value:
          projects.length > 0
            ? Math.round(
                projects.reduce((sum, project) => sum + project.score, 0) / projects.length
              )
            : 0,
        icon: Zap,
      },
    ];
  }, [projects]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, <span className="text-primary">{user?.name}</span>
            </h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">~/dashboard</p>
          </div>
          <Link
            to="/upload"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-mono text-sm font-semibold text-foreground">Recent Projects</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No projects yet.</div>
            ) : (
              projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/review/${project.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.language} · {project.lastReview}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${statusBadge(project.status)}`}>
                      {project.status}
                    </span>
                    {project.score > 0 && (
                      <span className={`font-mono text-sm font-bold ${severityColor(project.score)}`}>
                        {project.score}/100
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{project.issues} issues</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;