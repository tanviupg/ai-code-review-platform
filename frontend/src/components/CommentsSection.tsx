import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { commentsApi } from "@/services/api";
import { MessageSquare, Send } from "lucide-react";

interface Props {
  reviewId: string;
}

type ApiComment = {
  _id: string;
  reviewId: string;
  userId?: {
    name?: string;
    email?: string;
  };
  message: string;
  createdAt: string;
};

type UiComment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

const formatTimestamp = (iso: string) => {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "Just now";
  return dt.toLocaleString();
};

const mapComment = (comment: ApiComment): UiComment => ({
  id: comment._id,
  author: comment.userId?.name || comment.userId?.email || "Anonymous",
  content: comment.message,
  timestamp: formatTimestamp(comment.createdAt),
});

const CommentsSection = ({ reviewId }: Props) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<UiComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadComments = async () => {
      if (!reviewId) {
        setComments([]);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await commentsApi.list(reviewId);
        const data: ApiComment[] = response.data?.data || [];
        setComments(data.map(mapComment));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load comments";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadComments();
  }, [reviewId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !reviewId) return;

    try {
      setSubmitting(true);
      setError("");
      const response = await commentsApi.create(reviewId, newComment.trim());
      const created = response.data?.data as ApiComment;
      if (created) {
        setComments((prev) => [mapComment(created), ...prev]);
      } else {
        setComments((prev) => [
          {
            id: String(Date.now()),
            author: user?.name || "Anonymous",
            content: newComment.trim(),
            timestamp: "Just now",
          },
          ...prev,
        ]);
      }
      setNewComment("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add comment";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-mono text-sm font-semibold text-foreground">
          Discussion ({comments.length})
        </h3>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="divide-y divide-border">
        {loading ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">No comments yet.</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                  {comment.author[0]}
                </div>
                <span className="text-sm font-medium text-foreground">{comment.author}</span>
                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
              </div>
              <p className="mt-2 pl-8 text-sm text-secondary-foreground">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border px-4 py-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={reviewId ? "Add a comment..." : "No review selected"}
          disabled={!reviewId || submitting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || !reviewId || submitting}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default CommentsSection;