import { Outlet, Link } from "react-router-dom";
import Home from "./pages/Home";
import EditorPage from "./pages/EditorPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <>
      {/* The Outlet component renders the matched child route */}
      <main>
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
