import React, { createContext, useEffect, useState } from "react";
import { loginUser } from "../api/auth";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
      setToken(localStorage.getItem("token") || "");
    } catch {}
  }, []);

  const login = async (arg1, arg2) => {
    if (typeof arg1 === "string" && typeof arg2 === "string") {
      const username = arg1.trim();
      const password = arg2;
      if (!username || !password) throw new Error("Username və password tələb olunur");

      const data = await loginUser(username, password);
      if (!data?.access_token) throw new Error("Token alınmadı");

      const session = { username, role: data.role };
      setUser(session);
      setToken(data.access_token);
      localStorage.setItem("user", JSON.stringify(session));
      localStorage.setItem("token", data.access_token);
      return;
    }

    if (arg1 && typeof arg1 === "object") {
      const { username, role, token: tok } = arg1;
      if (!username || !role || !tok) throw new Error("Username, role və token tələb olunur");

      const session = { username, role };
      setUser(session);
      setToken(tok);
      localStorage.setItem("user", JSON.stringify(session));
      localStorage.setItem("token", tok);
      return;
    }

    throw new Error("Yanlış login çağırışı");
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
