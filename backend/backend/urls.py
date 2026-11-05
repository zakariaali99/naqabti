"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from django.urls import re_path
from django.conf import settings as django_settings
from django.views.static import serve
from . import settings
from niqabaty.views.home import HomeView
from niqabaty.views import (
    UserViewSet,
    MembershipTypeViewSet,
    DoctorsMembershipViewSet,
    DoctorsMembershipRenewHistoryViewSet,
    PaymentViewSet,
    NotificationViewSet,
    CertificationTypeViewSet,
    CertificationViewSet,
    CityViewSet,
    BranchViewSet,
    BranchDynamicFieldViewSet,
    DeviceViewSet,
    LoginView,
    RegisterView,
    LogoutView,
    ResetPasswordView,
    VerifyEmailView,
    ResendVerificationView,
    CurrentUserView,
    DashboardSummaryView,
    ProfessionalDevelopmentViewSet,
    ProfessionalDevelopmentTypeViewSet,
    ProfessionalDevelopmentCategoryViewSet,
    ProfessionalDevelopmentRegistrationViewSet,
    PostViewSet,
    EventViewSet,
    VerifyPasswordResetView,
    ConfirmPasswordResetView,
    ChangePasswordView,
    SafeTokenRefreshView,
    ComplaintViewSet,
    LibraryItemViewSet,
    MedicalReportViewSet,
    NationalityViewSet,
    AcademicDegreeViewSet,
    DoctorSpecialtyViewSet,
    InstitutionViewSet,
    InsuranceViewSet,
    DoctorDistributionView,
    AdViewSet,
    PublicDoctorProfileView,
)
from niqabaty.views.permission_viewset import PermissionViewSet, UserGroupViewSet
from rest_framework_simplejwt.views import TokenVerifyView

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'membership-types', MembershipTypeViewSet)
router.register(r'memberships', DoctorsMembershipViewSet)
router.register(r'membership-renew-history', DoctorsMembershipRenewHistoryViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'certification-types', CertificationTypeViewSet)
router.register(r'certifications', CertificationViewSet)
router.register(r'cities', CityViewSet)
router.register(r'branches', BranchViewSet)
router.register(r'branch-dynamic-fields', BranchDynamicFieldViewSet)
router.register(r'devices', DeviceViewSet)
router.register(r'professional-development', ProfessionalDevelopmentViewSet, basename='professional-development')
router.register(r'professional-development-types', ProfessionalDevelopmentTypeViewSet, basename='professional-development-types')
router.register(r'professional-development-categories', ProfessionalDevelopmentCategoryViewSet, basename='professional-development-categories')
router.register(r'professional-development-registrations', ProfessionalDevelopmentRegistrationViewSet, basename='professional-development-registrations')
router.register(r'posts', PostViewSet)
router.register(r'events', EventViewSet)
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'user-groups', UserGroupViewSet, basename='usergroup')
router.register(r'complaints', ComplaintViewSet)
router.register(r'library', LibraryItemViewSet)
router.register(r'medical-reports', MedicalReportViewSet)
router.register(r'nationalities', NationalityViewSet)
router.register(r'academic-degrees', AcademicDegreeViewSet)
router.register(r'doctor-specialties', DoctorSpecialtyViewSet)
router.register(r'institutions', InstitutionViewSet)
router.register(r'insurances', InsuranceViewSet)
router.register(r'ads', AdViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    # Auth endpoints
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('api/auth/resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('api/auth/verify-password-reset/', VerifyPasswordResetView.as_view(), name='verify-password-reset'),
    path('api/auth/confirm-password-reset/', ConfirmPasswordResetView.as_view(), name='confirm-password-reset'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('api/auth/token/refresh/', SafeTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('api/dashboard/doctor-distribution/', DoctorDistributionView.as_view(), name='doctor-distribution'),
    # Public doctor profile (unauthenticated)
    path('api/public/doctors/<str:username>/', PublicDoctorProfileView.as_view(), name='public-doctor-profile'),
    path('', HomeView.as_view(), name='home'),
    re_path(r'^(?!api/|assets/|media/).*$', HomeView.as_view(), name='fallback-home'),
]

# The shared host has no web server serving files in front of Django, so
# Django serves the site's assets and uploaded media itself, with DEBUG off
# too (django.conf.urls.static.static() only works with DEBUG on).
def _serve_asset(request, path):
    return serve(request, path, document_root=django_settings.STATIC_ROOT)


def _serve_media(request, path):
    return serve(request, path, document_root=django_settings.MEDIA_ROOT)


urlpatterns += [
    re_path(r'^assets/(?P<path>.*)$', _serve_asset),
    re_path(r'^media/(?P<path>.*)$', _serve_media),
]
