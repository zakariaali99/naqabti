# API Clients Quick Reference

## Import

```dart
import 'package:get/get.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
```

## Get Service Instance

```dart
final api = Get.find<ApiService>();
final auth = Get.find<AuthService>();
```

## Authentication

```dart
// Login
final user = await auth.login('username', 'password');

// Register
final newUser = await auth.register({
  'username': 'john',
  'email': 'john@example.com',
  'password': 'secure123',
  'full_name': 'John Doe',
});

// Logout
await auth.logout();

// Request password reset
await auth.requestPasswordReset('user@example.com');

// Check if logged in
if (auth.isLoggedIn) {
  // User is authenticated
}

// Get current user
final currentUser = auth.user;
```

## Users

```dart
// Get current user
final user = await api.user.getCurrentUser();

// Update current user
final updated = await api.user.updateCurrentUser({
  'full_name': 'New Name',
  'bio': 'Updated bio',
});

// List users
final users = await api.user.getUsers({'user_type': 'doctor'});

// Get user by ID
final user = await api.user.getUser(1);

// Create user
final newUser = await api.user.createUser({
  'username': 'newdoc',
  'email': 'doc@example.com',
  'user_type': 'doctor',
});

// Update user
final updated = await api.user.updateUser(1, {'bio': 'New bio'});

// Delete user
await api.user.deleteUser(1);
```

## Memberships

```dart
// List memberships
final memberships = await api.membership.getMemberships({
  'status': 'active',
  'doctor': 1,
});

// Get membership
final membership = await api.membership.getMembership(1);

// Create membership
final newMembership = await api.membership.createMembership({
  'doctor': 1,
  'membership_type': 1,
  'city': 1,
  'start_date': '2024-01-01',
});

// Update membership
final updated = await api.membership.updateMembership(1, {
  'status': 'inactive',
});

// Renew membership
final renewed = await api.membership.renewMembership(1);

// Delete membership
await api.membership.deleteMembership(1);
```

## Membership Types

```dart
// List types
final types = await api.membership.getMembershipTypes(null);

// Get type
final type = await api.membership.getMembershipType(1);

// Create type
final newType = await api.membership.createMembershipType({
  'name_en': 'Gold',
  'name_ar': 'ذهبي',
  'price': 1000.0,
  'duration_months': 12,
});

// Update type
final updated = await api.membership.updateMembershipType(1, {
  'price': 1200.0,
});

// Delete type
await api.membership.deleteMembershipType(1);
```

## Certifications

```dart
// List certifications
final certs = await api.certification.getCertifications({
  'doctor': 1,
});

// Get certification
final cert = await api.certification.getCertification(1);

// Create certification
final newCert = await api.certification.createCertification({
  'doctor': 1,
  'certification_type': 1,
  'issue_date': '2024-01-01',
  'issued_from': 'Medical Board',
});

// Update certification
final updated = await api.certification.updateCertification(1, {
  'expiry_date': '2025-01-01',
});

// Delete certification
await api.certification.deleteCertification(1);
```

## Certification Types

```dart
// List types
final types = await api.certification.getCertificationTypes(null);

// Get type
final type = await api.certification.getCertificationType(1);

// Create type
final newType = await api.certification.createCertificationType({
  'name_en': 'Medical License',
  'name_ar': 'رخصة طبية',
});

// Update type
final updated = await api.certification.updateCertificationType(1, {
  'name_en': 'Updated Name',
});

// Delete type
await api.certification.deleteCertificationType(1);
```

## Cities

```dart
// List cities
final cities = await api.city.getCities(null);

// Get city
final city = await api.city.getCity(1);

// Create city
final newCity = await api.city.createCity({
  'name_en': 'Baghdad',
  'name_ar': 'بغداد',
});

// Update city
final updated = await api.city.updateCity(1, {
  'name_en': 'Updated Name',
});

// Delete city
await api.city.deleteCity(1);
```

## Payments

```dart
// List payments
final payments = await api.payment.getPayments({
  'membership': 1,
});

// Get payment
final payment = await api.payment.getPayment(1);

// Create payment
final newPayment = await api.payment.createPayment({
  'membership': 1,
  'amount': 500.0,
  'payment_method': 'cash',
  'payment_date': '2024-01-01',
  'reference_number': 'PAY-001',
});

// Update payment
final updated = await api.payment.updatePayment(1, {
  'reference_number': 'PAY-001-UPDATED',
});

// Delete payment
await api.payment.deletePayment(1);
```

## Notifications

```dart
// List notifications
final notifications = await api.notification.getNotifications({
  'is_read': false,
});

// Get notification
final notification = await api.notification.getNotification(1);

// Mark as read
final updated = await api.notification.markNotificationAsRead(1, {
  'is_read': true,
});

// Mark all as read
await api.notification.markAllNotificationsAsRead();
```

## Error Handling

```dart
try {
  final user = await api.user.getCurrentUser();
  // Success
} on DioException catch (e) {
  if (e.response?.statusCode == 401) {
    // Unauthorized
    print('Please login');
  } else if (e.response?.statusCode == 404) {
    // Not found
    print('User not found');
  } else {
    // Other error
    print('Error: ${e.message}');
  }
} catch (e) {
  // Unknown error
  print('Unexpected error: $e');
}
```

## Query Parameters

```dart
// Simple filters
final memberships = await api.membership.getMemberships({
  'status': 'active',
  'payment_status': 'paid',
});

// Pagination
final users = await api.user.getUsers({
  'page': 1,
  'page_size': 20,
});

// Sorting
final payments = await api.payment.getPayments({
  'ordering': '-payment_date', // Descending
});

// Search
final cities = await api.city.getCities({
  'search': 'Bagh',
});

// Multiple filters
final certs = await api.certification.getCertifications({
  'doctor': 1,
  'certification_type': 2,
  'is_expired': false,
});
```

## Tips

1. **Always use try-catch** for API calls
2. **Check auth status** before making protected calls
3. **Use query parameters** for filtering and pagination
4. **Handle 401 errors** - usually means token expired
5. **Log out on persistent auth errors**
6. **Use proper HTTP methods** - GET for reads, POST for creates, PATCH for updates
