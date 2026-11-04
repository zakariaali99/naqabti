import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ar'),
  ];

  /// Application title
  ///
  /// In en, this message translates to:
  /// **'Naqabti'**
  String get appTitle;

  /// Login page subtitle
  ///
  /// In en, this message translates to:
  /// **'Sign in to continue'**
  String get signInToContinue;

  /// Username field label
  ///
  /// In en, this message translates to:
  /// **'Username'**
  String get username;

  /// Username field hint
  ///
  /// In en, this message translates to:
  /// **'Enter your username'**
  String get enterYourUsername;

  /// Username validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter your username'**
  String get pleaseEnterYourUsername;

  /// Password field label
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// Password field hint
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get enterYourPassword;

  /// Password validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter your password'**
  String get pleaseEnterYourPassword;

  /// Password length validation message
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 6 characters'**
  String get passwordMustBeAtLeast6Characters;

  /// Forgot password link text
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPassword;

  /// Sign in button text
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get signIn;

  /// Divider text
  ///
  /// In en, this message translates to:
  /// **'OR'**
  String get or;

  /// Sign up prompt
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? '**
  String get dontHaveAccount;

  /// Sign up button text
  ///
  /// In en, this message translates to:
  /// **'Sign Up'**
  String get signUp;

  /// Login success message
  ///
  /// In en, this message translates to:
  /// **'Login successful!'**
  String get loginSuccessful;

  /// Create account page title
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// Register page heading
  ///
  /// In en, this message translates to:
  /// **'Join Naqabti'**
  String get joinNiqabaty;

  /// Register page subtitle
  ///
  /// In en, this message translates to:
  /// **'Create your account to get started'**
  String get createYourAccountToGetStarted;

  /// Full name field label
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get fullName;

  /// First name field label
  ///
  /// In en, this message translates to:
  /// **'First Name'**
  String get firstName;

  /// Father name field label
  ///
  /// In en, this message translates to:
  /// **'Father Name'**
  String get fatherName;

  /// Grandfather name field label
  ///
  /// In en, this message translates to:
  /// **'Grandfather Name'**
  String get grandfatherName;

  /// Family name field label
  ///
  /// In en, this message translates to:
  /// **'Family Name'**
  String get familyName;

  /// First name (English) field label
  ///
  /// In en, this message translates to:
  /// **'First Name (English)'**
  String get firstNameEn;

  /// Father name (English) field label
  ///
  /// In en, this message translates to:
  /// **'Father Name (English)'**
  String get fatherNameEn;

  /// Grandfather name (English) field label
  ///
  /// In en, this message translates to:
  /// **'Grandfather Name (English)'**
  String get grandfatherNameEn;

  /// Family name (English) field label
  ///
  /// In en, this message translates to:
  /// **'Family Name (English)'**
  String get familyNameEn;

  /// No description provided for @enterFirstName.
  ///
  /// In en, this message translates to:
  /// **'Enter first name'**
  String get enterFirstName;

  /// No description provided for @enterFatherName.
  ///
  /// In en, this message translates to:
  /// **'Enter father name'**
  String get enterFatherName;

  /// No description provided for @enterGrandfatherName.
  ///
  /// In en, this message translates to:
  /// **'Enter grandfather name'**
  String get enterGrandfatherName;

  /// No description provided for @enterFamilyName.
  ///
  /// In en, this message translates to:
  /// **'Enter family name'**
  String get enterFamilyName;

  /// No description provided for @pleaseEnterFirstName.
  ///
  /// In en, this message translates to:
  /// **'Please enter first name'**
  String get pleaseEnterFirstName;

  /// No description provided for @pleaseEnterFatherName.
  ///
  /// In en, this message translates to:
  /// **'Please enter father name'**
  String get pleaseEnterFatherName;

  /// No description provided for @pleaseEnterGrandfatherName.
  ///
  /// In en, this message translates to:
  /// **'Please enter grandfather name'**
  String get pleaseEnterGrandfatherName;

  /// No description provided for @pleaseEnterFamilyName.
  ///
  /// In en, this message translates to:
  /// **'Please enter family name'**
  String get pleaseEnterFamilyName;

  /// No description provided for @arabicNames.
  ///
  /// In en, this message translates to:
  /// **'Arabic Names'**
  String get arabicNames;

  /// No description provided for @englishNames.
  ///
  /// In en, this message translates to:
  /// **'English Names'**
  String get englishNames;

  /// Full name field hint
  ///
  /// In en, this message translates to:
  /// **'Enter your full name'**
  String get enterYourFullName;

  /// Full name validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter your full name'**
  String get pleaseEnterYourFullName;

  /// Username field hint for registration
  ///
  /// In en, this message translates to:
  /// **'Choose a username'**
  String get chooseAUsername;

  /// Username validation message for registration
  ///
  /// In en, this message translates to:
  /// **'Please enter a username'**
  String get pleaseEnterAUsername;

  /// Username length validation message
  ///
  /// In en, this message translates to:
  /// **'Username must be at least 3 characters'**
  String get usernameMustBeAtLeast3Characters;

  /// Email field label
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// Email field hint
  ///
  /// In en, this message translates to:
  /// **'Enter your email'**
  String get enterYourEmail;

  /// Email validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter your email'**
  String get pleaseEnterYourEmail;

  /// Email format validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email'**
  String get pleaseEnterAValidEmail;

  /// Phone number field label
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phoneNumber;

  /// Phone number field hint
  ///
  /// In en, this message translates to:
  /// **'Enter your phone number'**
  String get enterYourPhoneNumber;

  /// Phone number validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter your phone number'**
  String get pleaseEnterYourPhoneNumber;

  /// Password field hint for registration
  ///
  /// In en, this message translates to:
  /// **'Create a password'**
  String get createAPassword;

  /// Password validation message for registration
  ///
  /// In en, this message translates to:
  /// **'Please enter a password'**
  String get pleaseEnterAPassword;

  /// Password length validation message for registration
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 8 characters'**
  String get passwordMustBeAtLeast8Characters;

  /// Validation message when the password contains only digits
  ///
  /// In en, this message translates to:
  /// **'Password can\'t be entirely numeric'**
  String get passwordCannotBeEntirelyNumeric;

  /// Validation message when the password has no letters
  ///
  /// In en, this message translates to:
  /// **'Password must contain at least one letter'**
  String get passwordMustContainLetter;

  /// Confirm password field label
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get confirmPassword;

  /// Confirm password field hint
  ///
  /// In en, this message translates to:
  /// **'Re-enter your password'**
  String get reEnterYourPassword;

  /// Confirm password validation message
  ///
  /// In en, this message translates to:
  /// **'Please confirm your password'**
  String get pleaseConfirmYourPassword;

  /// Password mismatch validation message
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get passwordsDoNotMatch;

  /// Terms agreement prefix
  ///
  /// In en, this message translates to:
  /// **'I agree to the '**
  String get iAgreeToThe;

  /// Terms and conditions link text
  ///
  /// In en, this message translates to:
  /// **'Terms and Conditions'**
  String get termsAndConditions;

  /// Terms acceptance validation message
  ///
  /// In en, this message translates to:
  /// **'Please accept the terms and conditions'**
  String get pleaseAcceptTheTermsAndConditions;

  /// Registration success message
  ///
  /// In en, this message translates to:
  /// **'Registration successful!'**
  String get registrationSuccessful;

  /// Sign in prompt on registration page
  ///
  /// In en, this message translates to:
  /// **'Already have an account? '**
  String get alreadyHaveAnAccount;

  /// Reset password page title
  ///
  /// In en, this message translates to:
  /// **'Reset Password'**
  String get resetPassword;

  /// Forgot password page heading
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPasswordQuestion;

  /// Forgot password page description
  ///
  /// In en, this message translates to:
  /// **'Enter your email address and we\'ll send you a link to reset your password.'**
  String get enterYourEmailAddressWeWillSendYouALink;

  /// Email field hint for password reset
  ///
  /// In en, this message translates to:
  /// **'Enter your email address'**
  String get enterYourEmailAddress;

  /// Send reset link button text
  ///
  /// In en, this message translates to:
  /// **'Send Reset Link'**
  String get sendResetLink;

  /// Back to sign in button text
  ///
  /// In en, this message translates to:
  /// **'Back to Sign In'**
  String get backToSignIn;

  /// Email sent success heading
  ///
  /// In en, this message translates to:
  /// **'Check Your Email'**
  String get checkYourEmail;

  /// Email sent success message
  ///
  /// In en, this message translates to:
  /// **'We\'ve sent a password reset link to'**
  String get weSentAPasswordResetLinkTo;

  /// Email not received help text
  ///
  /// In en, this message translates to:
  /// **'Didn\'t receive the email? Check your spam folder or try again.'**
  String get didntReceiveTheEmailCheckSpamFolder;

  /// Resend email button text
  ///
  /// In en, this message translates to:
  /// **'Resend Email'**
  String get resendEmail;

  /// Welcome message
  ///
  /// In en, this message translates to:
  /// **'Welcome'**
  String get welcome;

  /// Login error title
  ///
  /// In en, this message translates to:
  /// **'Login Failed'**
  String get loginFailed;

  /// Invalid credentials error message
  ///
  /// In en, this message translates to:
  /// **'Invalid username or password'**
  String get invalidCredentials;

  /// Home menu item
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// Payments menu item
  ///
  /// In en, this message translates to:
  /// **'Payments'**
  String get payments;

  /// Certifications menu item
  ///
  /// In en, this message translates to:
  /// **'Certifications'**
  String get certifications;

  /// Memberships menu item
  ///
  /// In en, this message translates to:
  /// **'Memberships'**
  String get memberships;

  /// Edit profile menu item
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get editProfile;

  /// About menu item
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get about;

  /// Logout menu item
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// Default user name
  ///
  /// In en, this message translates to:
  /// **'User'**
  String get user;

  /// Application name
  ///
  /// In en, this message translates to:
  /// **'Naqabti'**
  String get naqabti;

  /// Application version
  ///
  /// In en, this message translates to:
  /// **'1.0.4'**
  String get applicationVersion;

  /// Copyright text
  ///
  /// In en, this message translates to:
  /// **'© 2025 Naqabti. All rights reserved.'**
  String get allRightsReserved;

  /// Application description
  ///
  /// In en, this message translates to:
  /// **'A comprehensive membership management system for doctors and medical professionals.'**
  String get comprehensiveMembershipManagement;

  /// Logout dialog title
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logoutTitle;

  /// Logout confirmation message
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to logout?'**
  String get areYouSureYouWantToLogout;

  /// Cancel button text
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// Error message when loading fails
  ///
  /// In en, this message translates to:
  /// **'Failed to load data'**
  String failedToLoadData(Object error);

  /// Retry button
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// Contact information section title
  ///
  /// In en, this message translates to:
  /// **'Contact Information'**
  String get contactInformation;

  /// Email label
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No email placeholder
  ///
  /// In en, this message translates to:
  /// **'No email'**
  String get noEmail;

  /// Label for phone number
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get phone;

  /// Account details section title
  ///
  /// In en, this message translates to:
  /// **'Account Details'**
  String get accountDetails;

  /// User ID label
  ///
  /// In en, this message translates to:
  /// **'User ID'**
  String get userId;

  /// Account type label
  ///
  /// In en, this message translates to:
  /// **'Account Type'**
  String get accountType;

  /// Doctor account type
  ///
  /// In en, this message translates to:
  /// **'Doctor'**
  String get doctor;

  /// Staff member account type
  ///
  /// In en, this message translates to:
  /// **'Staff Member'**
  String get staffMember;

  /// Member since label
  ///
  /// In en, this message translates to:
  /// **'Member Since'**
  String get memberSince;

  /// About section label
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get aboutLabel;

  /// No user data message
  ///
  /// In en, this message translates to:
  /// **'No user data available'**
  String get noUserDataAvailable;

  /// Membership section title
  ///
  /// In en, this message translates to:
  /// **'Membership'**
  String get membership;

  /// Active status
  ///
  /// In en, this message translates to:
  /// **'ACTIVE'**
  String get active;

  /// Pending status
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pending;

  /// Membership number label
  ///
  /// In en, this message translates to:
  /// **'Membership Number'**
  String get membershipNumber;

  /// Type label
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get type;

  /// City label
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get city;

  /// Start date label
  ///
  /// In en, this message translates to:
  /// **'Start Date'**
  String get startDate;

  /// End date label
  ///
  /// In en, this message translates to:
  /// **'End Date'**
  String get endDate;

  /// Empty payments message title
  ///
  /// In en, this message translates to:
  /// **'No Payments Found'**
  String get noPaymentsFound;

  /// Empty payments message description
  ///
  /// In en, this message translates to:
  /// **'Your payment history will appear here'**
  String get yourPaymentHistoryWillAppearHere;

  /// Payment loading error prefix
  ///
  /// In en, this message translates to:
  /// **'Failed to load payments'**
  String get failedToLoadPayments;

  /// Payment label
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get payment;

  /// Amount label
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get amount;

  /// Method label
  ///
  /// In en, this message translates to:
  /// **'Method'**
  String get method;

  /// Payment details title
  ///
  /// In en, this message translates to:
  /// **'Payment Details'**
  String get paymentDetails;

  /// Payment ID label
  ///
  /// In en, this message translates to:
  /// **'Payment ID'**
  String get paymentId;

  /// Date label
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// Payment method label
  ///
  /// In en, this message translates to:
  /// **'Payment Method'**
  String get paymentMethod;

  /// Reference number label
  ///
  /// In en, this message translates to:
  /// **'Reference Number'**
  String get referenceNumber;

  /// Label for description
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get description;

  /// Cash payment method
  ///
  /// In en, this message translates to:
  /// **'Cash'**
  String get cash;

  /// Card payment method
  ///
  /// In en, this message translates to:
  /// **'Card'**
  String get card;

  /// Bank transfer payment method
  ///
  /// In en, this message translates to:
  /// **'Bank Transfer'**
  String get bankTransfer;

  /// Online payment method
  ///
  /// In en, this message translates to:
  /// **'Online Payment'**
  String get onlinePayment;

  /// Other payment method
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get other;

  /// Empty certifications message title
  ///
  /// In en, this message translates to:
  /// **'No Certifications Found'**
  String get noCertificationsFound;

  /// Empty certifications message description
  ///
  /// In en, this message translates to:
  /// **'Your certifications will appear here'**
  String get yourCertificationsWillAppearHere;

  /// Certification loading error prefix
  ///
  /// In en, this message translates to:
  /// **'Failed to load certifications'**
  String get failedToLoadCertifications;

  /// Certification label
  ///
  /// In en, this message translates to:
  /// **'Certification'**
  String get certification;

  /// Certification details title
  ///
  /// In en, this message translates to:
  /// **'Certification Details'**
  String get certificationDetails;

  /// Certification ID label
  ///
  /// In en, this message translates to:
  /// **'Certification ID'**
  String get certificationId;

  /// Issued label
  ///
  /// In en, this message translates to:
  /// **'Issued'**
  String get issued;

  /// Expires label
  ///
  /// In en, this message translates to:
  /// **'Expires'**
  String get expires;

  /// Issue date label
  ///
  /// In en, this message translates to:
  /// **'Issue Date'**
  String get issueDate;

  /// Expiry date label
  ///
  /// In en, this message translates to:
  /// **'Expiry Date'**
  String get expiryDate;

  /// Issued from label
  ///
  /// In en, this message translates to:
  /// **'Issued From'**
  String get issuedFrom;

  /// View document button
  ///
  /// In en, this message translates to:
  /// **'View Document'**
  String get viewDocument;

  /// Expired status
  ///
  /// In en, this message translates to:
  /// **'Expired'**
  String get expired;

  /// Expiring soon status
  ///
  /// In en, this message translates to:
  /// **'Expiring Soon'**
  String get expiringSoon;

  /// Valid status
  ///
  /// In en, this message translates to:
  /// **'Valid'**
  String get valid;

  /// Empty memberships message title
  ///
  /// In en, this message translates to:
  /// **'No Memberships Found'**
  String get noMembershipsFound;

  /// Empty memberships message description
  ///
  /// In en, this message translates to:
  /// **'Your memberships will appear here'**
  String get yourMembershipsWillAppearHere;

  /// Membership loading error prefix
  ///
  /// In en, this message translates to:
  /// **'Failed to load memberships'**
  String get failedToLoadMemberships;

  /// Membership details title
  ///
  /// In en, this message translates to:
  /// **'Membership Details'**
  String get membershipDetails;

  /// Status label
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// Valid until label
  ///
  /// In en, this message translates to:
  /// **'Valid Until'**
  String get validUntil;

  /// Total amount label
  ///
  /// In en, this message translates to:
  /// **'Total Amount'**
  String get totalAmount;

  /// Paid amount label
  ///
  /// In en, this message translates to:
  /// **'Paid Amount'**
  String get paidAmount;

  /// Remaining amount label
  ///
  /// In en, this message translates to:
  /// **'Remaining Amount'**
  String get remainingAmount;

  /// Developer credit text
  ///
  /// In en, this message translates to:
  /// **'Developed by Muwaija Company for Information Technology'**
  String get developedByMuwaija;

  /// Save button
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// Success title
  ///
  /// In en, this message translates to:
  /// **'Success'**
  String get success;

  /// Error title
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// Profile update success message
  ///
  /// In en, this message translates to:
  /// **'Profile updated successfully'**
  String get profileUpdatedSuccessfully;

  /// Profile update error message
  ///
  /// In en, this message translates to:
  /// **'Failed to update profile'**
  String get failedToUpdateProfile;

  /// Username validation message
  ///
  /// In en, this message translates to:
  /// **'Username is required'**
  String get usernameRequired;

  /// Email required validation message
  ///
  /// In en, this message translates to:
  /// **'Email is required'**
  String get emailRequired;

  /// Email format validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email'**
  String get pleaseEnterValidEmail;

  /// Specialty field label
  ///
  /// In en, this message translates to:
  /// **'Specialty'**
  String get specialty;

  /// Bio field label
  ///
  /// In en, this message translates to:
  /// **'Bio'**
  String get bio;

  /// Save changes button
  ///
  /// In en, this message translates to:
  /// **'Save Changes'**
  String get saveChanges;

  /// Change password button
  ///
  /// In en, this message translates to:
  /// **'Change Password'**
  String get changePassword;

  /// Coming soon title
  ///
  /// In en, this message translates to:
  /// **'Coming Soon'**
  String get comingSoon;

  /// Profile picture upload coming soon message
  ///
  /// In en, this message translates to:
  /// **'Profile picture upload will be available soon'**
  String get profilePictureUploadSoon;

  /// Change password coming soon message
  ///
  /// In en, this message translates to:
  /// **'Change password feature will be available soon'**
  String get changePasswordSoon;

  /// Account type selection title
  ///
  /// In en, this message translates to:
  /// **'Select Account Type'**
  String get selectAccountType;

  /// Account type selection subtitle
  ///
  /// In en, this message translates to:
  /// **'Choose the type of account you want to create'**
  String get chooseTheTypeOfAccount;

  /// Student account type
  ///
  /// In en, this message translates to:
  /// **'Student'**
  String get student;

  /// Student account type description
  ///
  /// In en, this message translates to:
  /// **'For students pursuing their education'**
  String get forStudentsPursuingEducation;

  /// Doctor account type description
  ///
  /// In en, this message translates to:
  /// **'For medical professionals and practitioners'**
  String get forMedicalProfessionals;

  /// Institution account type
  ///
  /// In en, this message translates to:
  /// **'Institution'**
  String get institution;

  /// Institution account type description
  ///
  /// In en, this message translates to:
  /// **'For educational and medical institutions'**
  String get forEducationalAndMedicalInstitutions;

  /// Continue button
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueButton;

  /// Back button
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// Personal information step title
  ///
  /// In en, this message translates to:
  /// **'Personal Information'**
  String get personalInformation;

  /// Institution information step title
  ///
  /// In en, this message translates to:
  /// **'Institution Information'**
  String get institutionInformation;

  /// Personal information step subtitle
  ///
  /// In en, this message translates to:
  /// **'Enter your personal details'**
  String get enterYourPersonalDetails;

  /// Institution information step subtitle
  ///
  /// In en, this message translates to:
  /// **'Enter your institution details'**
  String get enterYourInstitutionDetails;

  /// Institution name field label
  ///
  /// In en, this message translates to:
  /// **'Institution Name'**
  String get institutionName;

  /// Institution name field hint
  ///
  /// In en, this message translates to:
  /// **'Enter institution name'**
  String get enterInstitutionName;

  /// Institution name validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter institution name'**
  String get pleaseEnterInstitutionName;

  /// Username character validation message
  ///
  /// In en, this message translates to:
  /// **'Username can only contain letters, numbers, and underscores'**
  String get usernameCanOnlyContain;

  /// Birthdate field label
  ///
  /// In en, this message translates to:
  /// **'Birthdate'**
  String get birthdate;

  /// Birthdate field hint
  ///
  /// In en, this message translates to:
  /// **'Select your birthdate'**
  String get selectYourBirthdate;

  /// Birthdate validation message
  ///
  /// In en, this message translates to:
  /// **'Please select your birthdate'**
  String get pleaseSelectYourBirthdate;

  /// Location information step title
  ///
  /// In en, this message translates to:
  /// **'Location Information'**
  String get locationInformation;

  /// Location information step subtitle
  ///
  /// In en, this message translates to:
  /// **'Enter your location details'**
  String get enterYourLocationDetails;

  /// City field hint
  ///
  /// In en, this message translates to:
  /// **'Select your city'**
  String get selectYourCity;

  /// City validation message
  ///
  /// In en, this message translates to:
  /// **'Please select a city'**
  String get pleaseSelectACity;

  /// Alternate city validation message key used in code
  ///
  /// In en, this message translates to:
  /// **'Please select a city'**
  String get pleaseSelectCity;

  /// Address field label
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get address;

  /// Address field hint
  ///
  /// In en, this message translates to:
  /// **'Enter your address'**
  String get enterYourAddress;

  /// Address validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter your address'**
  String get pleaseEnterYourAddress;

  /// Phone number field hint for institutions
  ///
  /// In en, this message translates to:
  /// **'Enter phone number'**
  String get enterPhoneNumber;

  /// Phone number validation message for institutions
  ///
  /// In en, this message translates to:
  /// **'Please enter phone number'**
  String get pleaseEnterPhoneNumber;

  /// Nationality field label
  ///
  /// In en, this message translates to:
  /// **'Nationality'**
  String get nationality;

  /// Nationality field hint
  ///
  /// In en, this message translates to:
  /// **'Select your nationality'**
  String get selectYourNationality;

  /// Nationality validation message
  ///
  /// In en, this message translates to:
  /// **'Please select your nationality'**
  String get pleaseSelectYourNationality;

  /// Passport image section title
  ///
  /// In en, this message translates to:
  /// **'Passport Image'**
  String get passportImage;

  /// Passport image upload hint
  ///
  /// In en, this message translates to:
  /// **'Tap to upload passport image'**
  String get tapToUploadPassportImage;

  /// Passport image change hint
  ///
  /// In en, this message translates to:
  /// **'Tap to change passport image'**
  String get tapToChangePassportImage;

  /// Passport image requirement note
  ///
  /// In en, this message translates to:
  /// **'Required for non-Libyan nationals'**
  String get requiredForNonLibyanNationals;

  /// Passport image validation message
  ///
  /// In en, this message translates to:
  /// **'Please upload your passport image'**
  String get pleaseUploadYourPassportImage;

  /// Generic error when image picker fails
  ///
  /// In en, this message translates to:
  /// **'Failed to pick image'**
  String get failedToPickImage;

  /// Bottom sheet title for passport upload source selection
  ///
  /// In en, this message translates to:
  /// **'Choose Passport Document'**
  String get choosePassportSource;

  /// Option to pick a photo from gallery
  ///
  /// In en, this message translates to:
  /// **'Upload from Gallery'**
  String get uploadFromGallery;

  /// Option to pick a PDF file
  ///
  /// In en, this message translates to:
  /// **'Upload PDF Document'**
  String get uploadPdfDocument;

  /// Label shown when a PDF has been chosen
  ///
  /// In en, this message translates to:
  /// **'PDF file selected'**
  String get pdfFileSelected;

  /// Hint when a PDF is already selected
  ///
  /// In en, this message translates to:
  /// **'Tap to change PDF document'**
  String get tapToChangePdfDocument;

  /// Generic error when file picker fails
  ///
  /// In en, this message translates to:
  /// **'Failed to pick file'**
  String get failedToPickFile;

  /// Education information step title
  ///
  /// In en, this message translates to:
  /// **'Education Information'**
  String get educationInformation;

  /// Education information step subtitle
  ///
  /// In en, this message translates to:
  /// **'Tell us about your education'**
  String get tellUsAboutYourEducation;

  /// University name field label
  ///
  /// In en, this message translates to:
  /// **'University Name'**
  String get universityName;

  /// University name field hint
  ///
  /// In en, this message translates to:
  /// **'Enter your university name'**
  String get enterYourUniversityName;

  /// University name validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter your university name'**
  String get pleaseEnterYourUniversityName;

  /// Current degree section title
  ///
  /// In en, this message translates to:
  /// **'Current Degree'**
  String get currentDegree;

  /// Bachelor's degree option
  ///
  /// In en, this message translates to:
  /// **'Bachelor\'s Degree'**
  String get bachelorsDegree;

  /// PhD/Doctorate option
  ///
  /// In en, this message translates to:
  /// **'PhD / Doctorate'**
  String get phdDoctorate;

  /// Other degree option
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get otherDegree;

  /// Degree validation message
  ///
  /// In en, this message translates to:
  /// **'Please select your current degree'**
  String get pleaseSelectYourCurrentDegree;

  /// Doctor information step title
  ///
  /// In en, this message translates to:
  /// **'Doctor Information'**
  String get doctorInformation;

  /// Doctor information step subtitle
  ///
  /// In en, this message translates to:
  /// **'Additional information for doctors'**
  String get additionalInformationForDoctors;

  /// Membership number field hint
  ///
  /// In en, this message translates to:
  /// **'Enter your membership number'**
  String get enterYourMembershipNumber;

  /// Membership number validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter your membership number'**
  String get pleaseEnterYourMembershipNumber;

  /// Branch section title
  ///
  /// In en, this message translates to:
  /// **'Select Branch'**
  String get selectBranch;

  /// Branch field label
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get branch;

  /// Branch field hint
  ///
  /// In en, this message translates to:
  /// **'Select your branch'**
  String get selectYourBranch;

  /// Branch validation message
  ///
  /// In en, this message translates to:
  /// **'Please select a branch'**
  String get pleaseSelectABranch;

  /// Review and submit step title
  ///
  /// In en, this message translates to:
  /// **'Review & Submit'**
  String get reviewAndSubmit;

  /// Review and submit step subtitle
  ///
  /// In en, this message translates to:
  /// **'Review your information and create your account'**
  String get reviewYourInformationAndCreateAccount;

  /// Registration summary section title
  ///
  /// In en, this message translates to:
  /// **'Registration Summary'**
  String get registrationSummary;

  /// Name label
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get name;

  /// Email field label optional
  ///
  /// In en, this message translates to:
  /// **'Email (Optional)'**
  String get emailOptional;

  /// Phone field label optional
  ///
  /// In en, this message translates to:
  /// **'Phone Number (Optional)'**
  String get phoneOptional;

  /// Registration credentials step title
  ///
  /// In en, this message translates to:
  /// **'Account Credentials'**
  String get accountCredentials;

  /// Registration credentials step subtitle
  ///
  /// In en, this message translates to:
  /// **'Enter your email and choose a password to sign in with.'**
  String get enterEmailAndChoosePassword;

  /// Submit button
  ///
  /// In en, this message translates to:
  /// **'Submit'**
  String get submit;

  /// Welcome page title
  ///
  /// In en, this message translates to:
  /// **'Welcome to Naqabti!'**
  String get welcomeToNiqabaty;

  /// Doctor account success message
  ///
  /// In en, this message translates to:
  /// **'Your doctor account has been successfully created! You can now access all professional features.'**
  String get yourDoctorAccountCreatedSuccessfully;

  /// Student account success message
  ///
  /// In en, this message translates to:
  /// **'Your student account has been successfully created! Start your learning journey today.'**
  String get yourStudentAccountCreatedSuccessfully;

  /// Institution account success message
  ///
  /// In en, this message translates to:
  /// **'Your institution account has been created and is pending approval. We\'ll notify you once it\'s approved.'**
  String get yourInstitutionAccountPendingApproval;

  /// Generic account success message
  ///
  /// In en, this message translates to:
  /// **'Your account has been successfully created!'**
  String get yourAccountCreatedSuccessfully;

  /// Doctor verification info message
  ///
  /// In en, this message translates to:
  /// **'Your membership will be verified shortly. You\'ll receive a notification once approved.'**
  String get yourMembershipWillBeVerified;

  /// Student info message
  ///
  /// In en, this message translates to:
  /// **'You can now access educational resources and connect with professionals.'**
  String get youCanNowAccessEducationalResources;

  /// Institution approval info message
  ///
  /// In en, this message translates to:
  /// **'Our team will review your application within 24-48 hours.'**
  String get ourTeamWillReviewYourApplication;

  /// Generic verification info message
  ///
  /// In en, this message translates to:
  /// **'Check your email for verification instructions.'**
  String get checkYourEmailForVerification;

  /// Verified account feature title
  ///
  /// In en, this message translates to:
  /// **'Verified Account'**
  String get verifiedAccount;

  /// Verified account feature description
  ///
  /// In en, this message translates to:
  /// **'Your account is secure and verified'**
  String get yourAccountIsSecureAndVerified;

  /// Explore features title
  ///
  /// In en, this message translates to:
  /// **'Explore Features'**
  String get exploreFeatures;

  /// Explore features description
  ///
  /// In en, this message translates to:
  /// **'Access all platform features'**
  String get accessAllPlatformFeatures;

  /// 24/7 support feature title
  ///
  /// In en, this message translates to:
  /// **'24/7 Support'**
  String get support247;

  /// 24/7 support feature description
  ///
  /// In en, this message translates to:
  /// **'Get help whenever you need it'**
  String get getHelpWheneverYouNeedIt;

  /// Get started button
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get getStarted;

  /// Continue button alternate key
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueLabel;

  /// Terms acceptance validation message used in review step
  ///
  /// In en, this message translates to:
  /// **'Please accept the terms and conditions'**
  String get pleaseAcceptTermsAndConditions;

  /// Generic registration failure message
  ///
  /// In en, this message translates to:
  /// **'Registration failed'**
  String get registrationFailed;

  /// Connection timeout error message
  ///
  /// In en, this message translates to:
  /// **'Connection timed out. Please try again.'**
  String get connectionTimeoutPleaseTryAgain;

  /// No internet connection error message
  ///
  /// In en, this message translates to:
  /// **'No internet connection. Please check your network.'**
  String get noInternetConnection;

  /// Generic unexpected error message
  ///
  /// In en, this message translates to:
  /// **'An unexpected error occurred'**
  String get unexpectedErrorOccurred;

  /// Review and submit subtitle (alternate key used in code)
  ///
  /// In en, this message translates to:
  /// **'Review your information and create your account'**
  String get reviewYourInformationAndCreateYourAccount;

  /// Password field hint for registration (alternate key used in code)
  ///
  /// In en, this message translates to:
  /// **'Create a password'**
  String get createPassword;

  /// Password required validation message (alternate key used in code)
  ///
  /// In en, this message translates to:
  /// **'Please enter a password'**
  String get pleaseEnterPassword;

  /// University label (alternate key used in summary)
  ///
  /// In en, this message translates to:
  /// **'University'**
  String get university;

  /// Success message shown after registration, prompting the user to log in
  ///
  /// In en, this message translates to:
  /// **'Your account has been created! Log in to complete your profile and start using the app.'**
  String get accountCreatedLoginToComplete;

  /// Label for the profile completion percentage indicator
  ///
  /// In en, this message translates to:
  /// **'Profile Completion'**
  String get profileCompletion;

  /// Title of the modal shown after successfully saving the edit-profile form
  ///
  /// In en, this message translates to:
  /// **'Profile Updated'**
  String get profileUpdatedModalTitle;

  /// Generic close button label
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// Title of the complete-your-profile modal
  ///
  /// In en, this message translates to:
  /// **'Complete Your Profile'**
  String get completeProfileModalTitle;

  /// Body message of the complete-your-profile modal
  ///
  /// In en, this message translates to:
  /// **'Please complete your profile information to get the most out of the app.'**
  String get completeProfileModalMessage;

  /// Call-to-action button on the complete-your-profile modal and profile completion card
  ///
  /// In en, this message translates to:
  /// **'Complete Profile'**
  String get completeProfileModalCta;

  /// Heading for the list of missing profile fields
  ///
  /// In en, this message translates to:
  /// **'Still needed:'**
  String get missingFieldsHint;

  /// Heading for the list of completed profile fields
  ///
  /// In en, this message translates to:
  /// **'Completed:'**
  String get completedFieldsHint;

  /// Semantic label for the missing-field warning icon on the edit-profile form
  ///
  /// In en, this message translates to:
  /// **'Needed to complete your profile'**
  String get fieldNeededForCompletion;

  /// Label for the profile photo field
  ///
  /// In en, this message translates to:
  /// **'Profile Photo'**
  String get profilePhoto;

  /// Validation message for the current degree dropdown
  ///
  /// In en, this message translates to:
  /// **'Please select your current degree'**
  String get pleaseSelectDegree;

  /// Info message about membership verification for doctors
  ///
  /// In en, this message translates to:
  /// **'Your membership will be verified shortly. You\'ll receive a notification once approved.'**
  String get doctorMembershipVerificationMessage;

  /// Info message shown to students after registration
  ///
  /// In en, this message translates to:
  /// **'You can now access educational resources and connect with professionals.'**
  String get studentAccessResourcesMessage;

  /// Info message for institutions about review timing
  ///
  /// In en, this message translates to:
  /// **'Our team will review your application within 24-48 hours.'**
  String get institutionReviewTimeMessage;

  /// Feature title: verified account
  ///
  /// In en, this message translates to:
  /// **'Verified Account'**
  String get verifiedAccountTitle;

  /// Feature description: verified account
  ///
  /// In en, this message translates to:
  /// **'Your account is secure and verified'**
  String get verifiedAccountDescription;

  /// Feature title: explore features
  ///
  /// In en, this message translates to:
  /// **'Explore Features'**
  String get exploreFeaturesTitle;

  /// Feature description: explore features
  ///
  /// In en, this message translates to:
  /// **'Access all platform features'**
  String get exploreFeaturesDescription;

  /// Feature title: support
  ///
  /// In en, this message translates to:
  /// **'24/7 Support'**
  String get supportTitle;

  /// Feature description: support
  ///
  /// In en, this message translates to:
  /// **'Get help whenever you need it'**
  String get supportDescription;

  /// Prominent notice shown to institutions after registration
  ///
  /// In en, this message translates to:
  /// **'Your account was created and is waiting for activation. Check your email for updates.'**
  String get accountPendingNotice;

  /// Notifications menu item
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// Courses menu item
  ///
  /// In en, this message translates to:
  /// **'Courses'**
  String get courses;

  /// Profile menu item
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// Professional information section title
  ///
  /// In en, this message translates to:
  /// **'Professional Information'**
  String get professionalInformation;

  /// Placeholder for missing data
  ///
  /// In en, this message translates to:
  /// **'Not Provided'**
  String get notProvided;

  /// Renew membership action label
  ///
  /// In en, this message translates to:
  /// **'Renew'**
  String get renewMembership;

  /// Events action label
  ///
  /// In en, this message translates to:
  /// **'Events'**
  String get events;

  /// News action label
  ///
  /// In en, this message translates to:
  /// **'News'**
  String get news;

  /// Announcements action label
  ///
  /// In en, this message translates to:
  /// **'Announcements'**
  String get announcements;

  /// Quick actions section title
  ///
  /// In en, this message translates to:
  /// **'Quick Actions'**
  String get quickActions;

  /// No description provided for @complaints.
  ///
  /// In en, this message translates to:
  /// **'Complaints'**
  String get complaints;

  /// No description provided for @myComplaints.
  ///
  /// In en, this message translates to:
  /// **'My Complaints'**
  String get myComplaints;

  /// No description provided for @addComplaint.
  ///
  /// In en, this message translates to:
  /// **'Submit New Complaint'**
  String get addComplaint;

  /// No description provided for @subject.
  ///
  /// In en, this message translates to:
  /// **'Subject'**
  String get subject;

  /// No description provided for @statusTerm.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get statusTerm;

  /// No description provided for @priority.
  ///
  /// In en, this message translates to:
  /// **'Priority'**
  String get priority;

  /// No description provided for @electronicLibrary.
  ///
  /// In en, this message translates to:
  /// **'Electronic Library'**
  String get electronicLibrary;

  /// No description provided for @library.
  ///
  /// In en, this message translates to:
  /// **'Library'**
  String get library;

  /// No description provided for @download.
  ///
  /// In en, this message translates to:
  /// **'Download'**
  String get download;

  /// No description provided for @open.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get open;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// Author label
  ///
  /// In en, this message translates to:
  /// **'Author'**
  String get author;

  /// Year field label
  ///
  /// In en, this message translates to:
  /// **'Year'**
  String get year;

  /// Settings page title
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// Language setting label
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// English language name
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// Arabic language name
  ///
  /// In en, this message translates to:
  /// **'Arabic'**
  String get arabic;

  /// Dark mode setting label
  ///
  /// In en, this message translates to:
  /// **'Dark Mode'**
  String get darkMode;

  /// On status
  ///
  /// In en, this message translates to:
  /// **'On'**
  String get on;

  /// Off status
  ///
  /// In en, this message translates to:
  /// **'Off'**
  String get off;

  /// Message when switching to dark mode
  ///
  /// In en, this message translates to:
  /// **'Switched to dark mode'**
  String get switchedToDarkMode;

  /// Message when switching to light mode
  ///
  /// In en, this message translates to:
  /// **'Switched to light mode'**
  String get switchedToLightMode;

  /// Light mode label
  ///
  /// In en, this message translates to:
  /// **'Light Mode'**
  String get lightMode;

  /// Enabled status
  ///
  /// In en, this message translates to:
  /// **'Enabled'**
  String get enabled;

  /// Select language dialog title
  ///
  /// In en, this message translates to:
  /// **'Select Language'**
  String get selectLanguage;

  /// Language changed success title
  ///
  /// In en, this message translates to:
  /// **'Language Changed'**
  String get languageChanged;

  /// Language changed to English message
  ///
  /// In en, this message translates to:
  /// **'Language changed to English'**
  String get languageChangedToEnglish;

  /// Language changed to Arabic message
  ///
  /// In en, this message translates to:
  /// **'Language changed to Arabic'**
  String get languageChangedToArabic;

  /// Version label
  ///
  /// In en, this message translates to:
  /// **'Version'**
  String get version;

  /// General settings section title
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get general;

  /// Preferences settings section title
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get preferences;

  /// App info settings section title
  ///
  /// In en, this message translates to:
  /// **'App Info'**
  String get appInfo;

  /// Title for renew membership page
  ///
  /// In en, this message translates to:
  /// **'Renew Membership'**
  String get renewMembershipTitle;

  /// Error message when user is not logged in
  ///
  /// In en, this message translates to:
  /// **'User not logged in'**
  String get userNotLoggedIn;

  /// Error message when loading membership details fails
  ///
  /// In en, this message translates to:
  /// **'Failed to load membership details'**
  String get failedToLoadMembershipDetails;

  /// Message when no active membership is found
  ///
  /// In en, this message translates to:
  /// **'No active membership found'**
  String get noActiveMembershipFound;

  /// Instruction to contact admin
  ///
  /// In en, this message translates to:
  /// **'Contact administration to create a membership'**
  String get contactAdminToCreateMembership;

  /// Button text to request renewal
  ///
  /// In en, this message translates to:
  /// **'Request Renewal'**
  String get requestRenewal;

  /// Success message for renewal request
  ///
  /// In en, this message translates to:
  /// **'Membership renewal requested successfully'**
  String get renewalRequestSent;

  /// Error message for renewal failure
  ///
  /// In en, this message translates to:
  /// **'Failed to renew membership'**
  String get failedToRenewMembership;

  /// Info message about renewal process
  ///
  /// In en, this message translates to:
  /// **'A renewal request will be sent to the administration for review.'**
  String get renewalRequestReviewMessage;

  /// Message when membership doesn't need renewal
  ///
  /// In en, this message translates to:
  /// **'Your membership is currently active and does not need renewal yet.'**
  String get membershipActiveNoRenewalNeeded;

  /// Payment status label
  ///
  /// In en, this message translates to:
  /// **'Payment Status'**
  String get paymentStatus;

  /// Cost label
  ///
  /// In en, this message translates to:
  /// **'Cost'**
  String get cost;

  /// Title for memberships page
  ///
  /// In en, this message translates to:
  /// **'My Memberships'**
  String get myMemberships;

  /// Label for active membership
  ///
  /// In en, this message translates to:
  /// **'Active Membership'**
  String get activeMembership;

  /// Toggle label for doctor membership number
  ///
  /// In en, this message translates to:
  /// **'I have an active membership number'**
  String get iHaveAnActiveMembershipNumber;

  /// Label for membership history
  ///
  /// In en, this message translates to:
  /// **'Membership History'**
  String get membershipHistory;

  /// Button text to view details
  ///
  /// In en, this message translates to:
  /// **'View Details'**
  String get viewDetails;

  /// Message when history is empty
  ///
  /// In en, this message translates to:
  /// **'No membership history found.'**
  String get noMembershipHistory;

  /// Error message when loading courses
  ///
  /// In en, this message translates to:
  /// **'Failed to load courses'**
  String get failedToLoadCourses;

  /// Message when no courses are found
  ///
  /// In en, this message translates to:
  /// **'No courses available'**
  String get noCoursesAvailable;

  /// Label for free courses
  ///
  /// In en, this message translates to:
  /// **'Free'**
  String get free;

  /// Label for instructor
  ///
  /// In en, this message translates to:
  /// **'Instructor'**
  String get instructor;

  /// Subtitle for instructor
  ///
  /// In en, this message translates to:
  /// **'Course Instructor'**
  String get courseInstructor;

  /// Title for course description
  ///
  /// In en, this message translates to:
  /// **'About this course'**
  String get aboutThisCourse;

  /// Button to enroll in a course
  ///
  /// In en, this message translates to:
  /// **'Enroll Now'**
  String get enrollNow;

  /// Title for enrollment dialog/snackbar
  ///
  /// In en, this message translates to:
  /// **'Enrollment'**
  String get enrollment;

  /// Title for enrollment confirmation dialog
  ///
  /// In en, this message translates to:
  /// **'Confirm Enrollment'**
  String get confirmEnrollmentTitle;

  /// Message for enrollment confirmation dialog
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to enroll in this course?'**
  String get confirmEnrollmentMessage;

  /// Confirm button text
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// Message while enrollment is in progress
  ///
  /// In en, this message translates to:
  /// **'Enrolling...'**
  String get enrolling;

  /// Confirmed status
  ///
  /// In en, this message translates to:
  /// **'Confirmed'**
  String get confirmed;

  /// Message for feature availability
  ///
  /// In en, this message translates to:
  /// **'Enrollment feature coming soon'**
  String get enrollmentFeatureComingSoon;

  /// Error message when user is already registered
  ///
  /// In en, this message translates to:
  /// **'You are already registered for this course'**
  String get alreadyRegistered;

  /// Error message when registration is closed
  ///
  /// In en, this message translates to:
  /// **'Registration is closed for this course'**
  String get registrationClosed;

  /// Success message after enrollment
  ///
  /// In en, this message translates to:
  /// **'Successfully enrolled in {courseName}'**
  String enrollmentSuccess(String courseName);

  /// Generic error message for enrollment failure
  ///
  /// In en, this message translates to:
  /// **'Failed to enroll. Please try again'**
  String get enrollmentFailed;

  /// Error message when announcements fail to load
  ///
  /// In en, this message translates to:
  /// **'Failed to load announcements'**
  String get failedToLoadAnnouncements;

  /// Message when there are no announcements
  ///
  /// In en, this message translates to:
  /// **'No announcements available'**
  String get noAnnouncementsAvailable;

  /// Featured badge label
  ///
  /// In en, this message translates to:
  /// **'FEATURED'**
  String get featured;

  /// Error message when news fails to load
  ///
  /// In en, this message translates to:
  /// **'Failed to load news'**
  String get failedToLoadNews;

  /// Message when there is no news
  ///
  /// In en, this message translates to:
  /// **'No news available'**
  String get noNewsAvailable;

  /// Error message when events fail to load
  ///
  /// In en, this message translates to:
  /// **'Failed to load events'**
  String get failedToLoadEvents;

  /// Message when there are no events
  ///
  /// In en, this message translates to:
  /// **'No events available'**
  String get noEventsAvailable;

  /// Day field label
  ///
  /// In en, this message translates to:
  /// **'Day'**
  String get day;

  /// Month field label
  ///
  /// In en, this message translates to:
  /// **'Month'**
  String get month;

  /// Day validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter the day'**
  String get pleaseEnterDay;

  /// Day range validation message
  ///
  /// In en, this message translates to:
  /// **'Day must be between 1 and 31'**
  String get dayMustBeBetween1And31;

  /// Month validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter the month'**
  String get pleaseEnterMonth;

  /// Month range validation message
  ///
  /// In en, this message translates to:
  /// **'Month must be between 1 and 12'**
  String get monthMustBeBetween1And12;

  /// Year validation message
  ///
  /// In en, this message translates to:
  /// **'Please enter the year'**
  String get pleaseEnterYear;

  /// Year range validation message
  ///
  /// In en, this message translates to:
  /// **'Year must be between 1900 and {currentYear}'**
  String yearMustBeBetween1900AndCurrentYear(String currentYear);

  /// Delete button text
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// Confirmation message for deleting a notification
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this notification?'**
  String get confirmDeleteNotification;

  /// Title for branches and syndicates page
  ///
  /// In en, this message translates to:
  /// **'Syndicates & Branches'**
  String get branches;

  /// Title for branch details page
  ///
  /// In en, this message translates to:
  /// **'Branch Details'**
  String get branchDetails;

  /// Label for syndicate
  ///
  /// In en, this message translates to:
  /// **'Syndicate'**
  String get syndicate;

  /// Label for branch manager
  ///
  /// In en, this message translates to:
  /// **'Branch Manager'**
  String get branchManager;

  /// Label for location
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get location;

  /// Message when no branches are found
  ///
  /// In en, this message translates to:
  /// **'No branches found'**
  String get noBranchesFound;

  /// Error message when branches fail to load
  ///
  /// In en, this message translates to:
  /// **'Failed to load branches'**
  String get failedToLoadBranches;

  /// Medical reports title
  ///
  /// In en, this message translates to:
  /// **'Medical Reports'**
  String get medicalReports;

  /// Create medical report title
  ///
  /// In en, this message translates to:
  /// **'Create Medical Report'**
  String get createMedicalReport;

  /// Medical report details title
  ///
  /// In en, this message translates to:
  /// **'Medical Report Details'**
  String get medicalReportDetails;

  /// Patient name label
  ///
  /// In en, this message translates to:
  /// **'Patient Name'**
  String get patientName;

  /// Patient ID label
  ///
  /// In en, this message translates to:
  /// **'Patient ID / National ID'**
  String get patientId;

  /// Diagnosis label
  ///
  /// In en, this message translates to:
  /// **'Diagnosis'**
  String get diagnosis;

  /// Treatment label
  ///
  /// In en, this message translates to:
  /// **'Treatment'**
  String get treatment;

  /// Recommendations label
  ///
  /// In en, this message translates to:
  /// **'Recommendations'**
  String get recommendations;

  /// Notes label
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get notes;

  /// Message when no reports are found
  ///
  /// In en, this message translates to:
  /// **'No medical reports found.'**
  String get noReportsFound;

  /// Validation message for required fields
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get requiredField;

  /// Success message when saving data
  ///
  /// In en, this message translates to:
  /// **'Data saved successfully'**
  String get dataSavedSuccessfully;

  /// Attachments label
  ///
  /// In en, this message translates to:
  /// **'Attachments'**
  String get attachments;

  /// No file selected label
  ///
  /// In en, this message translates to:
  /// **'No file selected'**
  String get noFileSelected;

  /// Create button label
  ///
  /// In en, this message translates to:
  /// **'Create'**
  String get create;

  /// Button to open maps
  ///
  /// In en, this message translates to:
  /// **'Get Directions'**
  String get getDirections;

  /// Fallback for missing data
  ///
  /// In en, this message translates to:
  /// **'N/A'**
  String get notAvailable;

  /// Library search hint
  ///
  /// In en, this message translates to:
  /// **'Search library...'**
  String get searchPlaceholder;

  /// Filter all
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get all;

  /// Filter links
  ///
  /// In en, this message translates to:
  /// **'Links'**
  String get links;

  /// Empty library message
  ///
  /// In en, this message translates to:
  /// **'No resources found'**
  String get noResults;

  /// Empty complaints message
  ///
  /// In en, this message translates to:
  /// **'No complaints submitted yet'**
  String get noComplaints;

  /// Error message when loading notifications fails
  ///
  /// In en, this message translates to:
  /// **'Failed to load notifications'**
  String get failedToLoadNotifications;

  /// Singular notification label
  ///
  /// In en, this message translates to:
  /// **'Notification'**
  String get notification;

  /// Context menu action to mark notification as unread
  ///
  /// In en, this message translates to:
  /// **'Mark as unread'**
  String get markAsUnread;

  /// Context menu action to mark notification as read
  ///
  /// In en, this message translates to:
  /// **'Mark as read'**
  String get markAsRead;

  /// Button label to mark all notifications as read
  ///
  /// In en, this message translates to:
  /// **'Mark all read'**
  String get markAllRead;

  /// Header text for empty notifications screen
  ///
  /// In en, this message translates to:
  /// **'No notifications'**
  String get noNotifications;

  /// Subtitle text for empty notifications screen
  ///
  /// In en, this message translates to:
  /// **'You\'re all caught up!'**
  String get youAreAllCaughtUp;

  /// Time ago text for immediate notifications
  ///
  /// In en, this message translates to:
  /// **'Just now'**
  String get justNow;

  /// Days ago indicator
  ///
  /// In en, this message translates to:
  /// **'{count}d ago'**
  String daysAgo(String count);

  /// Hours ago indicator
  ///
  /// In en, this message translates to:
  /// **'{count}h ago'**
  String hoursAgo(String count);

  /// Minutes ago indicator
  ///
  /// In en, this message translates to:
  /// **'{count}m ago'**
  String minutesAgo(String count);

  /// Error message when resource URL fails to open
  ///
  /// In en, this message translates to:
  /// **'Could not open resource'**
  String get couldNotOpenResource;

  /// PDF format label
  ///
  /// In en, this message translates to:
  /// **'PDF'**
  String get pdf;

  /// Video format label
  ///
  /// In en, this message translates to:
  /// **'Video'**
  String get video;

  /// Link format label
  ///
  /// In en, this message translates to:
  /// **'Link'**
  String get link;

  /// Error message when loading library items fails
  ///
  /// In en, this message translates to:
  /// **'Failed to load items'**
  String get failedToLoadItems;

  /// Unknown error placeholder
  ///
  /// In en, this message translates to:
  /// **'Unknown error'**
  String get unknownError;

  /// Button to delete user account
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get deleteAccount;

  /// Title of delete account confirmation dialog
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get deleteAccountConfirmationTitle;

  /// Message warning user about account deletion
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete your account? It will be disabled right away and you will not be able to sign in; your personal data (name, contact details, photo and documents) is permanently deleted within 30 days. To withdraw the request during that time, contact the syndicate.'**
  String get deleteAccountConfirmationMessage;

  /// Success message after deleting account
  ///
  /// In en, this message translates to:
  /// **'Your deletion request was received; your account will be deleted within 30 days'**
  String get deleteAccountSuccess;

  /// Forgot password first step description
  ///
  /// In en, this message translates to:
  /// **'Enter your email and we will send you a 6-digit code to reset your password.'**
  String get forgotPasswordCodeDescription;

  /// Button that requests a password reset code
  ///
  /// In en, this message translates to:
  /// **'Send Code'**
  String get sendResetCode;

  /// Second step of password reset
  ///
  /// In en, this message translates to:
  /// **'We sent a 6-digit code to your email. Enter it below and choose a new password.'**
  String get resetCodeSentDescription;

  /// Label for the emailed verification code
  ///
  /// In en, this message translates to:
  /// **'Verification code'**
  String get verificationCode;

  /// Validation for empty verification code
  ///
  /// In en, this message translates to:
  /// **'Please enter the 6-digit code'**
  String get pleaseEnterVerificationCode;

  /// Button to send the reset code again
  ///
  /// In en, this message translates to:
  /// **'Resend code'**
  String get resendCode;

  /// Shown when the reset request did not identify an account
  ///
  /// In en, this message translates to:
  /// **'If an account exists for this email, a code will arrive shortly. Check the address and try again.'**
  String get resetCodeNotSent;

  /// Error for a wrong or expired reset code
  ///
  /// In en, this message translates to:
  /// **'The code is invalid or has expired'**
  String get invalidOrExpiredCode;

  /// Shown after a successful password reset
  ///
  /// In en, this message translates to:
  /// **'Your password has been reset. You can now sign in.'**
  String get passwordResetSuccess;

  /// Label for the current password field
  ///
  /// In en, this message translates to:
  /// **'Current Password'**
  String get currentPassword;

  /// Label for the new password field
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get newPassword;

  /// Error when the current password is wrong
  ///
  /// In en, this message translates to:
  /// **'Current password is incorrect'**
  String get currentPasswordIncorrect;

  /// Shown after changing the password
  ///
  /// In en, this message translates to:
  /// **'Your password has been changed'**
  String get passwordChangedSuccess;

  /// Generic error message
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get somethingWentWrong;

  /// Network error message
  ///
  /// In en, this message translates to:
  /// **'Check your internet connection and try again.'**
  String get checkInternetConnection;

  /// Shown when account deletion fails
  ///
  /// In en, this message translates to:
  /// **'We could not delete your account. Please try again.'**
  String get deleteAccountFailed;

  /// No description provided for @accountDeletionPendingTitle.
  ///
  /// In en, this message translates to:
  /// **'Account scheduled for deletion'**
  String get accountDeletionPendingTitle;

  /// No description provided for @accountDeletionPendingMessage.
  ///
  /// In en, this message translates to:
  /// **'You asked to delete this account. It will be permanently deleted within 30 days of your request. To cancel, contact the syndicate.'**
  String get accountDeletionPendingMessage;

  /// Privacy policy link
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// Button to call a branch
  ///
  /// In en, this message translates to:
  /// **'Call'**
  String get callBranch;

  /// Button to open an address in maps
  ///
  /// In en, this message translates to:
  /// **'Open in Maps'**
  String get openInMaps;

  /// Shown after requesting a membership renewal
  ///
  /// In en, this message translates to:
  /// **'Your renewal request has been sent'**
  String get membershipRenewalRequested;

  /// Shown when a renewal request fails
  ///
  /// In en, this message translates to:
  /// **'We could not send your renewal request. Please try again.'**
  String get membershipRenewalFailed;

  /// Shown when a notification cannot be loaded
  ///
  /// In en, this message translates to:
  /// **'Notification not found'**
  String get notificationNotFound;

  /// Text before the privacy policy link on registration
  ///
  /// In en, this message translates to:
  /// **'By creating an account you agree to the'**
  String get byRegisteringYouAgreeTo;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
