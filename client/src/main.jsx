import React, { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home.jsx";
const EditorPage = React.lazy(() => import("./pages/EditorPage"));

const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#1c1e29] text-white">
    Loading Editor...
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "editor/:roomId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <EditorPage />
          </Suspense>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Render the RouterProvider with your defined router */}
    <RouterProvider router={router} />
  </StrictMode>
);
