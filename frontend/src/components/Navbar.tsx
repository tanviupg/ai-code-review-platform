import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Code2, LayoutDashboard, Upload, FileSearch, LogOut, Terminal } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/upload", label: "Upload Project", icon: Upload },
    { to: "/reviews", label: "Reviews", icon: FileSearch },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-mono font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Terminal className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">CodeReview<span className="text-primary">.ai</span></span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(to)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-sm text-muted-foreground sm:inline font-mono">
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
