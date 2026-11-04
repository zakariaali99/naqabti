import { Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { Spinner } from "@heroui/react";

const LoginPage = lazy(() => import("@/pages/auth/login"));
const RegisterPage = lazy(() => import("@/pages/auth/register"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/verify-email"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Forbidden = lazy(() => import("@/pages/error/Forbidden"));
const MembershipsPage = lazy(() => import("@/pages/memberships/index"));
const MembershipsFormPage = lazy(() => import("@/pages/memberships/form"));
const MembershipDetailPage = lazy(() => import("@/pages/memberships/detail"));
const MembershipTypesPage = lazy(() => import("@/pages/membership-types/index"));
const MembershipTypesFormPage = lazy(() => import("@/pages/membership-types/form"));
const DoctorsPage = lazy(() => import("@/pages/doctors/index"));
const DoctorsFormPage = lazy(() => import("@/pages/doctors/form"));
const DoctorDetailPage = lazy(() => import("@/pages/doctors/detail"));
const DoctorRouteDispatcher = lazy(() => import("@/pages/public/DoctorProfile/DoctorRouteDispatcher"));
const LegalPage = lazy(() => import("@/pages/public/Legal/LegalPage"));

const PUBLIC_LEGAL_PATHS = ["/privacy", "/account-deletion"];
const StudentsPage = lazy(() => import("@/pages/students/index"));
const StudentFormPage = lazy(() => import("@/pages/students/form"));
const StudentDetailPage = lazy(() => import("@/pages/students/detail"));
const InstitutionsPage = lazy(() => import("@/pages/institutions/index"));
const InstitutionFormPage = lazy(() => import("@/pages/institutions/form"));
const InstitutionDetailPage = lazy(() => import("@/pages/institutions/detail"));
const CertificationsPage = lazy(() => import("@/pages/certifications/index"));
const CertificationsFormPage = lazy(() => import("@/pages/certifications/form"));
const CitiesPage = lazy(() => import("@/pages/cities/index"));
const CityFormPage = lazy(() => import("@/pages/cities/form"));
const BranchesListPage = lazy(() => import("@/pages/branches/index"));
const BranchFormPage = lazy(() => import("@/pages/branches/form"));
const UsersPage = lazy(() => import("@/pages/users"));
const UsersFormPage = lazy(() => import("@/pages/users/form"));
const UserDetailPage = lazy(() => import("@/pages/users/detail"));
const UserGroupsPage = lazy(() => import("@/pages/user-groups/index"));
const UserGroupsFormPage = lazy(() => import("@/pages/user-groups/form"));
const ProfessionalDevelopmentPage = lazy(() => import("@/pages/professional-development"));
const ProfessionalDevelopmentDetailPage = lazy(() => import("@/pages/professional-development/detail"));
const ProfessionalDevelopmentTypesPage = lazy(() => import("@/pages/professional-development/types"));
const ProfessionalDevelopmentCategoriesPage = lazy(() => import("@/pages/professional-development/categories"));
const ItemTypesPage = lazy(() => import("@/pages/item-types"));
const CertificationTypesFormPage = lazy(() => import("@/pages/certification-types/form"));
const NotificationsPage = lazy(() => import("@/pages/notifications/index"));
const SendNotificationPage = lazy(() => import("@/pages/notifications/send"));
const BulkNotificationPage = lazy(() => import("@/pages/notifications/bulk"));
const PaymentsPage = lazy(() => import("@/pages/payments/index"));
const AdsPage = lazy(() => import("@/pages/ads/index"));
const AdFormPage = lazy(() => import("@/pages/ads/form"));
const AdDetailPage = lazy(() => import("@/pages/ads/detail"));
const PaymentsFormPage = lazy(() => import("@/pages/payments/form"));
const PostsPage = lazy(() => import("@/pages/posts/index"));
const PostFormPage = lazy(() => import("@/pages/posts/form"));
const EventsListPage = lazy(() => import("@/pages/events/index"));
const EventFormPage = lazy(() => import("@/pages/events/form"));
const MemberHomePage = lazy(() => import("@/pages/member/index"));
const MemberCertificationsPage = lazy(() => import("@/pages/member/certifications"));
const MemberNotificationsPage = lazy(() => import("@/pages/member/notifications"));
const MembershipStatusPage = lazy(() => import("@/pages/member/membership"));
const MemberRenewPage = lazy(() => import("@/pages/member/membershipRenew"));
const MemberProfilePage = lazy(() => import("@/pages/member/profile"));
const MemberProfileEditPage = lazy(() => import("@/pages/member/profileEdit"));
const LibraryPage = lazy(() => import("@/pages/library"));
const LibraryFormPage = lazy(() => import("@/pages/library/form"));
const ComplaintsPage = lazy(() => import("@/pages/complaints/index"));
const ComplaintsFormPage = lazy(() => import("@/pages/complaints/form"));
const MedicalReportsPage = lazy(() => import("@/pages/medical-reports/index"));
const DoctorHeatmapPage = lazy(() => import("@/pages/dashboard/DoctorHeatmapPage"));
const MedicalReportFormPage = lazy(() => import("@/pages/medical-reports/form"));
const NationalitiesPage = lazy(() => import("@/pages/nationalities/index"));
const AcademicDegreesPage = lazy(() => import("@/pages/academic-degrees/index"));
const DoctorSpecialtiesPage = lazy(() => import("@/pages/doctor-specialties/index"));
const InsurancePage = lazy(() => import("@/pages/insurance"));

import ProtectedView from "@/components/ProtectedView";
import MemberProtectedView from "@/components/MemberProtectedView";
import { PermissionGuard } from "@/components/PermissionGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PERMISSIONS } from "@/types/permissions";

import AuthAPI from "@/api/auth";
import { useUserStore } from "@/stores/userStore";

function App() {
  const {
    user,
    initialize,
    setUser,
    setLoading: setUserLoading,
  } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  let [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasTokens =
      Boolean(AuthAPI.getAccessToken()) && Boolean(AuthAPI.getRefreshToken());

    // If no tokens exist, clear user state and redirect to login only when not on auth pages
    if (!hasTokens) {
      setUser(null);
      setUserLoading(false);

      // Allow access to all auth pages and public doctor profiles without tokens
      const isAuthPage = location.pathname.startsWith("/auth/");
      const isPublicDoctorPage =
        location.pathname.startsWith("/doctors/") &&
        !location.pathname.endsWith("/add") &&
        !location.pathname.endsWith("/edit");
      const isLegalPage = PUBLIC_LEGAL_PATHS.includes(location.pathname);

      if (!isAuthPage && !isPublicDoctorPage && !isLegalPage) {
        navigate("/auth/login");
      }

      setIsLoading(false);

      return;
    }

    // If tokens exist, initialize (fetch user profile from API)
    const initializeUser = async () => {
      try {
        await initialize();
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [initialize, navigate, setUser, setUserLoading, location.pathname]);

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (user && location.pathname.startsWith("/auth/")) {
      navigate("/");
    }
  }, [user, location.pathname, navigate]);

  // If tokens exist, show a spinner until we fetch the profile

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner label="Loading..." size="lg" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner label="Loading..." size="lg" />
        </div>
      }
    >
      <ErrorBoundary>
        <Routes>
        <Route element={<LoginPage />} path="/auth/login" />
        <Route element={<RegisterPage />} path="/auth/register" />
        <Route element={<VerifyEmailPage />} path="/auth/verify-email" />
        <Route element={<ResetPasswordPage />} path="/auth/reset-password" />
        {/* Public legal pages, linked from the mobile app and store listings */}
        <Route element={<LegalPage page="privacy" />} path="/privacy" />
        <Route
          element={<LegalPage page="accountDeletion" />}
          path="/account-deletion"
        />
        {/* Public Doctor Profile Route (accessible without login) */}
        <Route element={<DoctorRouteDispatcher />} path="/doctors/:username" />
        <Route element={<ProtectedView />}>
          <Route element={<Dashboard />} path="/" />
          {/* Memberships Pages — staff/admin only */}
          <Route
            element={
              <PermissionGuard
                fallback={<Navigate to="/member/membership" replace />}
                permission={PERMISSIONS.MEMBERSHIP.VIEW}
              >
                <MembershipsPage />
              </PermissionGuard>
            }
            path="/memberships"
          />
          <Route
            element={
              <PermissionGuard
                fallback={<Navigate to="/member/membership" replace />}
                permission={PERMISSIONS.MEMBERSHIP.VIEW}
              >
                <MembershipDetailPage />
              </PermissionGuard>
            }
            path="/memberships/:id"
          />
          <Route
            element={
              <PermissionGuard
                fallback={<Navigate to="/member/membership" replace />}
                permission={PERMISSIONS.MEMBERSHIP.ADD}
              >
                <MembershipsFormPage />
              </PermissionGuard>
            }
            path="/memberships/add"
          />
          <Route
            element={
              <PermissionGuard
                fallback={<Navigate to="/member/membership" replace />}
                permission={PERMISSIONS.MEMBERSHIP.CHANGE}
              >
                <MembershipsFormPage />
              </PermissionGuard>
            }
            path="/memberships/:id/edit"
          />

          {/* Membership Types Pages */}
          <Route element={<MembershipTypesPage />} path="/membership-types" />
          <Route
            element={<MembershipTypesFormPage />}
            path="/membership-types/add"
          />
          <Route
            element={<MembershipTypesFormPage />}
            path="/membership-types/:id/edit"
          />

          {/* Doctors Pages */}
          <Route element={<DoctorsPage />} path="/doctors" />
          <Route element={<DoctorDetailPage />} path="/doctors/:id" />
          <Route element={<DoctorsFormPage />} path="/doctors/add" />
          <Route element={<DoctorsFormPage />} path="/doctors/:id/edit" />

          {/* Student pages */}
          <Route element={<StudentsPage />} path="/students" />
          <Route element={<StudentDetailPage />} path="/students/:id" />
          <Route element={<StudentFormPage />} path="/students/add" />
          <Route element={<StudentFormPage />} path="/students/:id/edit" />

          {/* Institutions pages */}
          <Route element={<InstitutionsPage />} path="/institutions" />
          <Route element={<InstitutionDetailPage />} path="/institutions/:id" />
          <Route element={<InstitutionFormPage />} path="/institutions/add" />
          <Route
            element={<InstitutionFormPage />}
            path="/institutions/:id/edit"
          />

          {/* Certifications Pages */}
          <Route element={<CertificationsPage />} path="/certifications" />
          <Route
            element={<CertificationsFormPage />}
            path="/certifications/add"
          />
          <Route
            element={<CertificationsFormPage />}
            path="/certifications/:id/edit"
          />

          {/* Cities Pages */}
          <Route element={<CitiesPage />} path="/cities" />
          <Route element={<CityFormPage />} path="/cities/add" />
          <Route element={<CityFormPage />} path="/cities/:id/edit" />

        {/* Nationalities Pages */}
        <Route
          element={
            <PermissionGuard
              fallback={<Forbidden />}
              permission={PERMISSIONS.NATIONALITY.VIEW}
            >
              <NationalitiesPage />
            </PermissionGuard>
          }
          path="/nationalities"
        />

        {/* Academic Degrees Pages */}
        <Route
          element={
            <PermissionGuard
              fallback={<Forbidden />}
              permission={PERMISSIONS.ACADEMIC_DEGREE.VIEW}
            >
              <AcademicDegreesPage />
            </PermissionGuard>
          }
          path="/academic-degrees"
        />

        {/* Doctor Specialties Pages */}
        <Route
          element={
            <PermissionGuard
              fallback={<Forbidden />}
              permission={PERMISSIONS.ACADEMIC_DEGREE.VIEW}
            >
              <DoctorSpecialtiesPage />
            </PermissionGuard>
          }
          path="/doctor-specialties"
        />

        {/* Branches Pages */}
        <Route
          element={
            <PermissionGuard
              fallback={<Forbidden />}
              permission={PERMISSIONS.BRANCH.VIEW}
            >
              <BranchesListPage />
            </PermissionGuard>
          }
          path="/branches"
        />
        <Route
          element={
            <PermissionGuard
              fallback={<Forbidden />}
              permission={PERMISSIONS.BRANCH.ADD}
            >
              <BranchFormPage />
            </PermissionGuard>
          }
          path="/branches/add"
        />
        <Route
          element={
            <PermissionGuard
              fallback={<Forbidden />}
              permission={PERMISSIONS.BRANCH.VIEW}
            >
              <BranchFormPage />
            </PermissionGuard>
          }
          path="/branches/:id/edit"
        />

          {/* Users Pages */}
          <Route
            element={
              <PermissionGuard
                fallback={<Forbidden />}
                permission={PERMISSIONS.USER.VIEW}
              >
                <UsersPage />
              </PermissionGuard>
            }
            path="/users"
          />
          <Route
            element={
              <PermissionGuard
                fallback={<Forbidden />}
                permission={PERMISSIONS.USER.ADD}
              >
                <UsersFormPage />
              </PermissionGuard>
            }
            path="/users/add"
          />
          <Route
            element={
              <PermissionGuard
                fallback={<Forbidden />}
                permission={PERMISSIONS.USER.CHANGE}
              >
                <UsersFormPage />
              </PermissionGuard>
            }
            path="/users/:id/edit"
          />
          <Route
            element={
              <PermissionGuard
                fallback={<Forbidden />}
                permission={PERMISSIONS.USER.VIEW}
              >
                <UserDetailPage />
              </PermissionGuard>
            }
            path="/users/:id"
          />

          {/* User Groups Pages */}
          <Route element={<UserGroupsPage />} path="/user-groups" />
          <Route element={<UserGroupsFormPage />} path="/user-groups/add" />
          <Route element={<UserGroupsFormPage />} path="/user-groups/:id/edit" />

          {/* Professional Development Pages */}
          <Route
            element={<ProfessionalDevelopmentPage />}
            path="/professional-development"
          />
          <Route
            element={<ProfessionalDevelopmentDetailPage />}
            path="/professional-development/:id"
          />
          <Route
            element={<ProfessionalDevelopmentTypesPage />}
            path="/professional-development/types"
          />
          <Route
            element={<ProfessionalDevelopmentCategoriesPage />}
            path="/professional-development/categories"
          />

          {/* Certification Types Pages */}
          <Route element={<ItemTypesPage />} path="/certification-types" />
          <Route element={<CertificationTypesFormPage />} path="/certification-types/add" />
          <Route element={<CertificationTypesFormPage />} path="/certification-types/:id/edit" />
          
          {/* Notifications Pages */}     
          <Route element={<NotificationsPage />} path="/notifications" />
          <Route element={<SendNotificationPage />} path="/notifications/send" />
          <Route element={<BulkNotificationPage />} path="/notifications/bulk" />

          {/* Payments Pages */}
          <Route element={<PaymentsPage />} path="/payments" />
          <Route element={<PaymentsFormPage />} path="/payments/add" />
          <Route element={<PaymentsFormPage />} path="/payments/:id/edit" />

          {/* Posts Pages */}
          <Route element={<PostsPage />} path="/posts" />
          <Route element={<PostFormPage />} path="/posts/add" />
          <Route element={<PostFormPage />} path="/posts/:id/edit" />
          <Route element={<PostFormPage />} path="/posts/:id" />
          <Route element={<EventsListPage />} path="/events" />
          <Route element={<EventFormPage />} path="/events/add" />
          <Route element={<EventFormPage />} path="/events/:id/edit" />

          {/* Complaints Pages */}
          <Route element={<ComplaintsPage />} path="/complaints" />
          <Route element={<ComplaintsFormPage />} path="/complaints/add" />
          <Route element={<ComplaintsFormPage />} path="/complaints/:id/edit" />
          <Route element={<MedicalReportsPage />} path="/medical-reports" />
          <Route element={<MedicalReportFormPage />} path="/medical-reports/add" />
          <Route element={<MedicalReportFormPage />} path="/medical-reports/:id/edit" />
          <Route element={<LibraryPage />} path="/library" />
          <Route element={<LibraryFormPage />} path="/library/add" />
          <Route element={<LibraryFormPage />} path="/library/:id/edit" />
          <Route
            element={
              <PermissionGuard permission={PERMISSIONS.USER.VIEW} fallback={<Navigate to="/" replace />}>
                <DoctorHeatmapPage />
              </PermissionGuard>
            }
            path="/doctor-map"
          />
          <Route element={<InsurancePage />} path="/insurance" />
          <Route element={<AdsPage />} path="/ads" />
          <Route element={<AdFormPage />} path="/ads/add" />
          <Route element={<AdFormPage />} path="/ads/:id/edit" />
          <Route element={<AdDetailPage />} path="/ads/:id" />
        </Route>

        {/* Member Portal Routes (no sidebar) */}
        <Route element={<MemberProtectedView />}>
          <Route element={<MemberHomePage />} path="/member" />
          <Route
            element={<MemberCertificationsPage />}
            path="/member/certifications"
          />
          <Route
            element={<MemberNotificationsPage />}
            path="/member/notifications"
          />
          <Route element={<MembershipStatusPage />} path="/member/membership" />
          <Route element={<MemberRenewPage />} path="/member/membership/renew" />
          <Route element={<MemberProfilePage />} path="/member/profile" />
          <Route element={<MemberProfileEditPage />} path="/member/profile/edit" />
        </Route>
      </Routes>
      </ErrorBoundary>
    </Suspense>
  );
}

export default App;
