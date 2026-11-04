import 'package:flutter/material.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import 'package:get/get.dart';

class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    final actions = [
      _ActionItem(
        icon: Icons.autorenew_rounded,
        label: l10n.renewMembership,
        onTap: (ctx) => Get.toNamed('/renew-membership'),
        color: const Color(0xFF4CAF50),
      ),
      _ActionItem(
        icon: Icons.receipt_long_rounded,
        label: l10n.payments,
        onTap: (ctx) => Get.toNamed('/payments'),
        color: const Color(0xFFFF9800),
      ),
      _ActionItem(
        icon: Icons.assignment_outlined,
        color: Colors.teal,
        label: l10n.medicalReports,
        onTap: (ctx) => Get.toNamed('/medical-reports'),
      ),
      _ActionItem(
        icon: Icons.school_rounded,
        label: l10n.courses,
        onTap: (ctx) => Get.toNamed('/courses'),
        color: const Color(0xFF9C27B0),
      ),
      _ActionItem(
        icon: Icons.event_rounded,
        label: l10n.events,
        onTap: (ctx) => Get.toNamed('/events'),
        color: const Color(0xFFE91E63),
      ),
      _ActionItem(
        icon: Icons.article_rounded,
        label: l10n.news,
        onTap: (ctx) => Get.toNamed('/news'),
        color: const Color(0xFF2196F3),
      ),
      _ActionItem(
        icon: Icons.campaign_rounded,
        label: l10n.announcements,
        onTap: (ctx) => Get.toNamed('/announcements'),
        color: const Color(0xFF00BCD4),
      ),
      _ActionItem(
        icon: Icons.feedback_rounded,
        label: l10n.complaints,
        onTap: (ctx) => Get.toNamed('/complaints'),
        color: const Color(0xFFFF5252),
      ),
      _ActionItem(
        icon: Icons.auto_stories_rounded,
        label: l10n.library,
        onTap: (ctx) => Get.toNamed('/library'),
        color: const Color(0xFF795548),
      ),
      _ActionItem(
        icon: Icons.map_rounded,
        label: l10n.branches,
        onTap: (ctx) => Get.toNamed('/branches'),
        color: const Color(0xFF607D8B),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0),
          child: Text(
            l10n.quickActions,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.0,
          ),
          itemCount: actions.length,
          itemBuilder: (context, index) {
            final action = actions[index];
            return _ActionTile(action: action);
          },
        ),
      ],
    );
  }
}

class _ActionItem {
  final IconData icon;
  final String label;
  final Function(BuildContext) onTap;
  final Color color;

  _ActionItem({required this.icon, required this.label, required this.onTap, required this.color});
}

class _ActionTile extends StatelessWidget {
  final _ActionItem action;

  const _ActionTile({required this.action});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return InkWell(
      onTap: () => action.onTap(context),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: action.color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                action.icon,
                color: action.color,
                size: 28,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              action.label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
