import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Upload, Github, FileCode, X, ArrowRight, Clipboard } from "lucide-react";
import { projectsApi, uploadApi, reviewApi } from "@/services/api";
import axios from "axios";

const CreateProject = () => {
  const [mode, setMode] = useState<"upload" | "github" | "paste">("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [pastedFileName, setPastedFileName] = useState("snippet.ts");
  const [pastedCode, setPastedCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const createRes = await projectsApi.create({
        name: projectName.trim(),
        repoUrl: mode === "github" ? repoUrl : null,
      });
      const projectId = createRes.data?.data?._id;

      if (!projectId) {
        throw new Error("Project creation failed");
      }

      if (mode === "upload" && files.length > 0) {
        const form = new FormData();
        form.append("projectId", projectId);
        files.forEach((file) => form.append("files", file));
        await uploadApi.upload(form);
      }

      if (mode === "paste" && pastedCode.trim()) {
        await projectsApi.pasteCode(projectId, {
          fileName: pastedFileName.trim() || "snippet.ts",
          content: pastedCode,
        });
      }

      await reviewApi.start(projectId);
      navigate(`/review/${projectId}`);
    } catch (err) {
      console.error("CreateProject submit failed", err);
      let message = "Failed to upload and review project";
      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.message ||
          err.message ||
          message;
        if (!err.response && mode === "github") {
          message =
            "Unable to import from GitHub. Check backend is running and network can reach api.github.com, or use file upload/paste mode.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">New Project</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            ~/upload — Submit code for AI analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {/* Project Name */}
          <div className="rounded-lg border border-border bg-card p-4">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="my-awesome-project"
              required
            />
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "upload" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload Files
            </button>
            <button
              type="button"
              onClick={() => setMode("github")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "github" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Github className="h-4 w-4" />
              GitHub URL
            </button>
            <button
              type="button"
              onClick={() => setMode("paste")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "paste" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clipboard className="h-4 w-4" />
              Paste Code
            </button>
          </div>

          {/* Upload Area */}
          {mode === "upload" ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 transition-colors hover:border-primary/50 hover:bg-secondary/30">
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Drop files here or click to browse</span>
                <span className="mt-1 text-xs text-muted-foreground">.js, .ts, .py, .go, .java, .rb, .rs</span>
                <input type="file" multiple onChange={handleFiles} className="hidden" accept=".js,.ts,.tsx,.py,.go,.java,.rb,.rs,.cpp,.c,.h" />
              </label>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)}KB
                        </span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : mode === "github" ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Repository URL</label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://github.com/user/repo"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="mb-2 block text-sm font-medium text-muted-foreground">File Name</label>
              <input
                type="text"
                value={pastedFileName}
                onChange={(e) => setPastedFileName(e.target.value)}
                className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="snippet.ts"
              />
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Code</label>
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                className="h-48 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Paste your code here..."
              />
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              !projectName ||
              (mode === "upload" && !files.length) ||
              (mode === "github" && !repoUrl.trim()) ||
              (mode === "paste" && !pastedCode.trim())
            }
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              "Starting AI Review..."
            ) : (
              <>
                Start Review <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateProject;
