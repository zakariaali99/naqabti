import 'package:flutter/material.dart';

/// A generic empty state widget for displaying various states like
/// empty data, error messages, or loading states.
class CourseEmptyState extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const CourseEmptyState({
    super.key,
    required this.icon,
    this.iconColor,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  /// Factory constructor for empty courses state
  factory CourseEmptyState.empty({
    required String message,
    Color? iconColor,
  }) {
    return CourseEmptyState(
      icon: Icons.school_outlined,
      iconColor: iconColor,
      message: message,
    );
  }

  /// Factory constructor for error state with retry action
  factory CourseEmptyState.error({
    required String message,
    required String retryLabel,
    required VoidCallback onRetry,
    Color? iconColor,
  }) {
    return CourseEmptyState(
      icon: Icons.error_outline,
      iconColor: iconColor,
      message: message,
      actionLabel: retryLabel,
      onAction: onRetry,
    );
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    icon,
                    size: 64,
                    color: iconColor ?? Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: iconColor ?? Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (actionLabel != null && onAction != null) ...[
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: onAction,
                      icon: const Icon(Icons.refresh),
                      label: Text(actionLabel!),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
