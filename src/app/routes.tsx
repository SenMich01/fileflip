import { createBrowserRouter } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";
import PrivacyPage from "./pages/PrivacyPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import EpubToPdfPage from "./pages/EpubToPdfPage";
import ImageToPdfPage from "./pages/ImageToPdfPage";
import ConvertPage from "./pages/ConvertPage";
import UploadPage from "./pages/UploadPage";
import HistoryPage from "./pages/HistoryPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import SecuritySettingsPage from "./pages/SecuritySettingsPage";
import NotificationsPage from "./pages/NotificationsPage";

// 404 Not Found component
function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/pricing",
    element: <PricingPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/epub-to-pdf",
    element: <EpubToPdfPage />,
  },
  {
    path: "/image-to-pdf",
    element: <ImageToPdfPage />,
  },
  {
    path: "/convert",
    element: (
      <ProtectedRoute>
        <ConvertPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/upload",
    element: (
      <ProtectedRoute>
        <UploadPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/history",
    element: (
      <ProtectedRoute>
        <HistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings/profile",
    element: (
      <ProtectedRoute>
        <ProfileSettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings/security",
    element: (
      <ProtectedRoute>
        <SecuritySettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings/notifications",
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
