import 'package:get/get.dart';
import '../api/dio_client.dart';
import '../api/auth_api_client.dart';
import '../api/user_api_client.dart';
import '../api/membership_api_client.dart';
import '../api/certification_api_client.dart';
import '../api/city_api_client.dart';
import '../api/payment_api_client.dart';
import '../api/notification_api_client.dart';
import '../api/device_api_client.dart';
import '../api/post_api_client.dart';
import '../api/course_api_client.dart';
import '../api/complaint_api_client.dart';
import '../api/library_api_client.dart';
import '../api/medical_report_api_client.dart';
import '../api/branch_api_client.dart';
import '../api/nationality_api_client.dart';
import '../api/academic_degree_api_client.dart';
import 'auth_service.dart';

/// API Service Factory
/// Provides singleton instances of all API clients
class ApiService extends GetxService {
  late final DioClient _dioClient;
  late final AuthApiClient _authClient;
  late final UserApiClient _userClient;
  late final MembershipApiClient _membershipClient;
  late final CertificationApiClient _certificationClient;
  late final CityApiClient _cityClient;
  late final PaymentApiClient _paymentClient;
  late final NotificationApiClient _notificationClient;
  late final DeviceApiClient _deviceClient;
  late final PostApiClient _postClient;
  late final CourseApiClient _courseClient;
  late final ComplaintApiClient _complaintClient;
  late final LibraryApiClient _libraryClient;
  late final MedicalReportApiClient _medicalReportClient;
  late final BranchApiClient _branchClient;
  late final NationalityApiClient _nationalityClient;
  late final AcademicDegreeApiClient _academicDegreeClient;

  Future<ApiService> init() async {
    final authService = Get.find<AuthService>();
    _dioClient = DioClient(authService);
    
    // Initialize all API clients with the same Dio instance
    final dio = _dioClient.dio;
    _authClient = AuthApiClient(dio);
    _userClient = UserApiClient(dio);
    _membershipClient = MembershipApiClient(dio);
    _certificationClient = CertificationApiClient(dio);
    _cityClient = CityApiClient(dio);
    _paymentClient = PaymentApiClient(dio);
    _notificationClient = NotificationApiClient(dio);
    _deviceClient = DeviceApiClient(dio);
    _postClient = PostApiClient(dio);
    _courseClient = CourseApiClient(dio);
    _complaintClient = ComplaintApiClient(dio);
    _libraryClient = LibraryApiClient(dio);
    _medicalReportClient = MedicalReportApiClient(dio);
    _branchClient = BranchApiClient(dio);
    _nationalityClient = NationalityApiClient(dio);
    _academicDegreeClient = AcademicDegreeApiClient(dio);

    return this;
  }

  // Getters for each API client
  AuthApiClient get auth => _authClient;
  UserApiClient get user => _userClient;
  MembershipApiClient get membership => _membershipClient;
  CertificationApiClient get certification => _certificationClient;
  CityApiClient get city => _cityClient;
  PaymentApiClient get payment => _paymentClient;
  NotificationApiClient get notification => _notificationClient;
  DeviceApiClient get device => _deviceClient;
  PostApiClient get post => _postClient;
  CourseApiClient get course => _courseClient;
  ComplaintApiClient get complaint => _complaintClient;
  LibraryApiClient get library => _libraryClient;
  MedicalReportApiClient get medicalReport => _medicalReportClient;
  BranchApiClient get branch => _branchClient;
  NationalityApiClient get nationality => _nationalityClient;
  AcademicDegreeApiClient get academicDegree => _academicDegreeClient;

  // Access to DioClient for custom requests if needed
  DioClient get dioClient => _dioClient;
}
