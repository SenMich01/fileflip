import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";
import PrivacyPage from "./pages/PrivacyPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EpubToPdfPage from "./pages/EpubToPdfPage";
import ImageToPdfPage from "./pages/ImageToPdfPage";

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
    path: "/epub-to-pdf",
    element: <EpubToPdfPage />,
  },
  {
    path: "/image-to-pdf",
    element: <ImageToPdfPage />,
  },
]);