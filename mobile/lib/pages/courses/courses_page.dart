import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:naqabti/services/course_service.dart';
import 'package:naqabti/widgets/general_app_bar.dart';
import 'package:naqabti/models/course.dart';
import 'package:naqabti/pages/courses/widgets/course_card.dart';
import 'package:naqabti/pages/courses/widgets/course_detail_sheet.dart';
import 'package:naqabti/pages/courses/widgets/empty_state_widget.dart';

class CoursesPage extends StatefulWidget {
  const CoursesPage({super.key});

  @override
  State<CoursesPage> createState() => _CoursesPageState();
}

class _CoursesPageState extends State<CoursesPage> {
  final CourseService _courseService = Get.find<CourseService>();
  
  List<Course> _courses = [];
  bool _isLoading = true;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadCourses();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMore) {
        _loadMoreCourses();
      }
    }
  }

  Future<void> _loadCourses() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _courseService.getCourses(
        page: 1,
        queryParams: {'page_size': 10},
      );

      setState(() {
        _courses = response.results;
        _hasMore = response.hasNext;
        _currentPage = 1;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load courses';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreCourses() async {
    if (_isLoading || !_hasMore) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _courseService.getCourses(
        page: _currentPage + 1,
        queryParams: {'page_size': 10},
      );

      setState(() {
        _courses.addAll(response.results);
        _hasMore = response.hasNext;
        _currentPage++;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshCourse(Course course) async {
    try {
      final updatedCourse = await _courseService.getCourse(course.id);
      
      setState(() {
        final index = _courses.indexWhere((c) => c.id == course.id);
        if (index != -1) {
          _courses[index] = updatedCourse;
        }
      });
    } catch (e) {
      // Silently fail if refresh fails
    }
  }

  Future<void> _enroll(Course course, {Function()? onUpdate}) async {
    final l10n = AppLocalizations.of(context)!;
    
    // 1. Confirm Dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.confirmEnrollmentTitle),
        content: Text(l10n.confirmEnrollmentMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(l10n.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(l10n.confirm),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    if (!mounted) return;

    // 2. Show Loading Spinner
    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      builder: (dialogContext) => PopScope(
        canPop: false,
        child: Center(
          child: Card(
            elevation: 8,
            shadowColor: Colors.black26,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 48,
                    height: 48,
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      color: Theme.of(dialogContext).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    l10n.enrolling,
                    style: Theme.of(dialogContext).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    try {
      // 3. Call API
      await _courseService.enroll(course.id);
      
      // 4. Refresh Data
      await _refreshCourse(course);

      if (mounted) {
        // Pop Loading Dialog
        Navigator.pop(context); 
        
        // Clear any existing snackbars first
        ScaffoldMessenger.of(context).clearSnackBars();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text(l10n.enrollmentSuccess(course.title))),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );

        // Notify caller to update local state (for BottomSheet)
        onUpdate?.call();
      }
    } catch (e) {
      // Pop Loading Dialog first
      if (mounted) {
        Navigator.pop(context);
      }
      
      // Parse error message from backend (use l10n captured before async)
      String errorMessage = l10n.enrollmentFailed;
      
      if (e is DioException && e.response != null) {
        final responseData = e.response?.data;
        if (responseData is Map && responseData.containsKey('error')) {
          final backendError = responseData['error'] as String;
          
          if (backendError.contains('already registered')) {
            errorMessage = l10n.alreadyRegistered;
          } else if (backendError.contains('closed')) {
            errorMessage = l10n.registrationClosed;
          } else {
            errorMessage = backendError;
          }
        }
      }
      
      if (mounted) {
        // Clear any existing snackbars first
        ScaffoldMessenger.of(context).clearSnackBars();
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text(errorMessage)),
              ],
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
            duration: const Duration(seconds: 4),
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            action: SnackBarAction(
              label: l10n.cancel,
              textColor: Colors.white,
              onPressed: () {},
            ),
          ),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return const Color(0xFF10B981); // Emerald Green
      case 'inactive':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFFF59E0B); // Amber
    }
  }

  void _openCourseDetail(Course initialCourse, AppLocalizations l10n) {
    final hasPrice = initialCourse.price != null && (double.tryParse(initialCourse.price!) ?? 0) > 0;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheetState) {
          // Use the latest version of the course from the list if available
          final course = _courses.firstWhere(
            (c) => c.id == initialCourse.id,
            orElse: () => initialCourse,
          );
          
          return CourseDetailSheet(
            course: course,
            hasPrice: hasPrice,
            onEnroll: () => _enroll(course, onUpdate: () {
              setSheetState(() {});
            }),
            onClose: () => Navigator.pop(sheetContext),
            getStatusColor: _getStatusColor,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: GeneralAppBar(
        title: l10n.courses, 
        showBackButton: true,
      ),
      body: RefreshIndicator(
        onRefresh: _loadCourses,
        child: _buildBody(l10n),
      ),
    );
  }

  Widget _buildBody(AppLocalizations l10n) {
    if (_isLoading && _courses.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null && _courses.isEmpty) {
      return CourseEmptyState.error(
        message: l10n.failedToLoadCourses,
        retryLabel: l10n.retry,
        onRetry: _loadCourses,
        iconColor: Theme.of(context).colorScheme.error,
      );
    }

    if (_courses.isEmpty) {
      return CourseEmptyState.empty(
        message: l10n.noCoursesAvailable,
        iconColor: Theme.of(context).colorScheme.onSurfaceVariant,
      );
    }

    return ListView.builder(
      controller: _scrollController,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: _courses.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _courses.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          );
        }

        final course = _courses[index];
        return CourseCard(
          course: course,
          onTap: () => _openCourseDetail(course, l10n),
        );
      },
    );
  }
}
