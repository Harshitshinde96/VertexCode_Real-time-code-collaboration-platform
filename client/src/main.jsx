import React, { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Standard Pages
import Home from "./pages/Home.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

// Auth Pages & Security Wrapper
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const EditorPage = React.lazy(() => import("./pages/EditorPage"));

const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#1c1e29] text-white">
    Loading Editor...
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App.jsx now contains the AuthProvider
    errorElement: <ErrorPage />,
    children: [
      // --- PUBLIC ROUTES ---
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },

      // --- PROTECTED ROUTES ---
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "editor/:roomId",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <EditorPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Render the RouterProvider with your defined router */}
    <RouterProvider router={router} />
  </StrictMode>,
);
