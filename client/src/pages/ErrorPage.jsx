// pages/ErrorPage.jsx
import { useRouteError, Link } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();

  console.error(error);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#1c1e29] text-white">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-400 mb-4">
        {error?.statusText || error?.message || "Unknown error"}
      </p>
      <Link to="/" className="underline text-blue-400">
        Go Home
      </Link>
    </div>
  );
}
