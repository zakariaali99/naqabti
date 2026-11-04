import React, { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "@heroui/react";
import AuthAPI from "@/api/auth";

const PublicDoctorProfilePage = lazy(() => import("./index"));
const DoctorDetailPage = lazy(() => import("@/pages/doctors/detail"));

/**
 * Smart Route Dispatcher for `/doctors/:identifier`:
 * - If the visitor is unauthenticated OR the identifier is a non-numeric username (e.g. 'dr_ahmed'),
 *   renders the public, sanitized PublicDoctorProfilePage.
 * - If the user is authenticated and navigating via numeric ID (e.g. '/doctors/15'),
 *   renders the administrative DoctorDetailPage.
 */
export const DoctorRouteDispatcher: React.FC = () => {
  const { id, username } = useParams<{ id?: string; username?: string }>();
  const identifier = username || id || "";

  const hasTokens =
    Boolean(AuthAPI.getAccessToken()) && Boolean(AuthAPI.getRefreshToken());
  const isNumericId = /^\d+$/.test(identifier);

  if (hasTokens && isNumericId) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <Spinner label="Loading doctor details..." size="lg" />
          </div>
        }
      >
        <DoctorDetailPage />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner label="Loading profile..." size="lg" />
        </div>
      }
    >
      <PublicDoctorProfilePage />
    </Suspense>
  );
};

export default DoctorRouteDispatcher;
