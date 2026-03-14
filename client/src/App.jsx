import { Outlet } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext"; // Import your new AuthProvider

function App() {
  return (
    // Wrap the entire app layout in the AuthProvider
    <AuthProvider>
      <main>
        {/* The Outlet component renders the matched child route */}
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
