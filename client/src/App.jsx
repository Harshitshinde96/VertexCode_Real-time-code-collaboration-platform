import { Outlet } from "react-router-dom";
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
