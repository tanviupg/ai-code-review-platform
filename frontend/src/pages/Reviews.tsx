import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { projectsApi, reviewApi } from "@/services/api";
import { FileSearch, ArrowRight } from "lucide-react";

type ProjectRecord = {
  _id: string;
  name: string;
  files?: Array<{ language?: string }>;
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

type ReviewRow = {
  id: string;
  name: string;
  language: string;
  reviewedAt: string;
  issues: number;
  score: number;
};

const severityColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

const Reviews = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const projectsRes = await projectsApi.list();
        const projects: ProjectRecord[] = projectsRes.data?.data || [];

        const rows = await Promise.all(
          projects.map(async (project) => {
            const reviewsRes = await reviewApi.getByProject(project._id);
            const projectReviews: ReviewRecord[] = reviewsRes.data?.data?.reviews || [];
            if (!projectReviews.length) return null;

            const score = Math.round(
              (projectReviews.reduce((sum, review) => sum + review.qualityScore, 0) /
                projectReviews.length) *
                10
            );

            const issues = projectReviews.reduce(
              (sum, review) =>
                sum +
                (review.aiFeedback?.bugs?.length || 0) +
                (review.aiFeedback?.securityIssues?.length || 0) +
                (review.aiFeedback?.performanceIssues?.length || 0) +
                (review.aiFeedback?.codeImprovements?.length || 0),
              0
            );

            return {
              id: project._id,
              name: project.name,
              language: project.files?.[0]?.language || "Unknown",
              reviewedAt: formatTime(projectReviews[0].createdAt),
              issues,
              score,
            } as ReviewRow;
          })
        );

        setReviews(rows.filter(Boolean) as ReviewRow[]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load reviews";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            ~/reviews — Browse all completed code analyses
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
              No completed reviews yet.
            </div>
          ) : (
            reviews.map((project) => (
              <Link
                key={project.id}
                to={`/review/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <FileSearch className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.language} · Reviewed {project.reviewedAt} · {project.issues} issues
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-lg font-bold ${severityColor(project.score)}`}>
                    {project.score}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Reviews;