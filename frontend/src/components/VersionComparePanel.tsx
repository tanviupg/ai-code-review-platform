type VersionOption = {
  id: string;
  versionNumber: number;
  source: string;
  fileCount: number;
};

type VersionDiff = {
  added: string[];
  removed: string[];
  changed: string[];
};

type VersionComparePanelProps = {
  versions: VersionOption[];
  selectedVersionId: string;
  compareBaseVersionId: string;
  onChangeCompareBaseVersionId: (value: string) => void;
  diff: VersionDiff | null;
  loading: boolean;
  error: string;
};

const renderFileList = (prefix: string, files: string[], emptyText: string, prefixClassName: string) => {
  if (!files.length) {
    return <p className="text-xs text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-1">
      {files.map((fileName) => (
        <p key={`${prefix}-${fileName}`} className="font-mono text-xs text-foreground">
          <span className={`mr-2 ${prefixClassName}`}>{prefix}</span>
          {fileName}
        </p>
      ))}
    </div>
  );
};

const VersionComparePanel = ({
  versions,
  selectedVersionId,
  compareBaseVersionId,
  onChangeCompareBaseVersionId,
  diff,
  loading,
  error,
}: VersionComparePanelProps) => {
  const selectedVersion = versions.find((version) => version.id === selectedVersionId);
  const baseVersion = versions.find((version) => version.id === compareBaseVersionId);

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-semibold text-foreground">Version Compare</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Base</span>
          <select
            value={compareBaseVersionId}
            onChange={(e) => onChangeCompareBaseVersionId(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={versions.length < 2}
          >
            {versions
              .filter((version) => version.id !== selectedVersionId)
              .map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.versionNumber} ({version.source})
                </option>
              ))}
          </select>
          <span className="text-muted-foreground">
            {baseVersion && selectedVersion
              ? `v${baseVersion.versionNumber} -> v${selectedVersion.versionNumber}`
              : "Select two versions"}
          </span>
        </div>
      </div>

      {versions.length < 2 ? (
        <p className="text-xs text-muted-foreground">
          Add another version to view file-level changes.
        </p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Loading version diff...</p>
      ) : error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border bg-background p-2.5">
            <p className="mb-2 text-xs font-semibold text-foreground">Added Files</p>
            {renderFileList("+", diff?.added || [], "No added files", "text-success")}
          </div>
          <div className="rounded-md border border-border bg-background p-2.5">
            <p className="mb-2 text-xs font-semibold text-foreground">Removed Files</p>
            {renderFileList("-", diff?.removed || [], "No removed files", "text-destructive")}
          </div>
          <div className="rounded-md border border-border bg-background p-2.5">
            <p className="mb-2 text-xs font-semibold text-foreground">Changed Files</p>
            {renderFileList("~", diff?.changed || [], "No changed files", "text-warning")}
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionComparePanel;
