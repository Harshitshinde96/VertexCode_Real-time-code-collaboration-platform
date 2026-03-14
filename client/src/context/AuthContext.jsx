import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios to always send cookies (crucial for JWT)
  axios.defaults.withCredentials = true;

  // On initial load, check if the user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 🟢 FIX 1: Changed from /api/user/profile to /api/user/data
        const response = await axios.get("http://localhost:4000/api/user/data");

        // In userController.js, you send: new ApiResponse(200, { user }, "...")
        setUser(response.data.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post("http://localhost:4000/api/auth/login", {
      email,
      password,
    });

    // 🟢 FIX 2: Removed .user at the end.
    // In authController.js, login sends: new ApiResponse(200, { id, name, email }, "...")
    setUser(response.data.data);

    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await axios.post(
      "http://localhost:4000/api/auth/register",
      {
        name,
        email,
        password,
      },
    );
    return response.data;
  };

  const logout = async () => {
    await axios.post("http://localhost:4000/api/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
