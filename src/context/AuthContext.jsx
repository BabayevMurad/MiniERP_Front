import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = ({ username, role, token }) => {
    const payload = { username, role, token };
    localStorage.setItem("user", JSON.stringify(payload));
    setUser(payload);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
