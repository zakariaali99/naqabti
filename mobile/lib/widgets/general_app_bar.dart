import 'package:flutter/material.dart';


class GeneralAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final List<Widget>? actions;
  final bool showDrawerButton;

  const GeneralAppBar({
    super.key,
    this.title,
    this.showBackButton = false,
    this.onBackPressed,
    this.actions,
    this.showDrawerButton = false,
  });

  @override
  Widget build(BuildContext context) {
    // Custom styled header matching NotificationsPage
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 24),
        child: Row(
          children: [
            // Leading: Back button or Drawer button
            if (showDrawerButton || showBackButton)
              Container(
                decoration: BoxDecoration(
                  color: isDark ? null : const Color(0xFF4183D9),
                  gradient: isDark
                      ? const LinearGradient(
                          colors: [Color(0xFF1565C0), Color(0xFF0D47A1)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: showDrawerButton
                    ? Builder(
                        builder: (context) => IconButton(
                          icon: const Icon(Icons.menu, color: Colors.white),
                          onPressed: () => Scaffold.of(context).openDrawer(),
                          tooltip: 'Open menu',
                        ),
                      )
                    : IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Colors.white),
                        onPressed: onBackPressed ?? () => Navigator.of(context).maybePop(),
                        tooltip: 'Back',
                      ),
              )
            else
              const SizedBox(width: 0), // Placeholder if needed, or remove

            if (showDrawerButton || showBackButton) const SizedBox(width: 16),

            // Title
            Expanded(
              child: title != null
                  ? Text(
                      title!,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          ),
                    )
                  : const SizedBox.shrink(),
            ),

            // Default actions if none provided
            if (actions != null) ...actions!,
          ],
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(90); // Increased height for padding
}

