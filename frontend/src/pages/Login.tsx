import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Terminal, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary glow-primary">
            <Terminal className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-mono text-2xl font-bold text-foreground">
            CodeReview<span className="text-primary">.ai</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-powered code analysis for better software
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-6 font-mono text-lg font-semibold text-foreground">$ login</h2>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="dev@company.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
