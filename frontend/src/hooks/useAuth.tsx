import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/services/api";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const payload = response.data?.data;

      if (!payload?.token || !payload?.user) {
        throw new Error("Invalid login response from server");
      }

      const normalizedUser: User = {
        id: payload.user.id,
        name: payload.user.name,
        email: payload.user.email,
      };

      localStorage.setItem("token", payload.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    } catch (error) {
      console.error("Login failed", error);
      throw new Error(extractApiErrorMessage(error, "Login failed"));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.register(name, email, password);
      const payload = response.data?.data;

      if (!payload?.token || !payload?.user) {
        throw new Error("Invalid register response from server");
      }

      const normalizedUser: User = {
        id: payload.user.id,
        name: payload.user.name,
        email: payload.user.email,
      };

      localStorage.setItem("token", payload.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    } catch (error) {
      console.error("Register failed", error);
      throw new Error(extractApiErrorMessage(error, "Registration failed"));
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
