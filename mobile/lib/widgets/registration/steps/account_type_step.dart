import 'package:flutter/material.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../../models/registration/registration_data.dart';

class AccountTypeStep extends StatefulWidget {
  final RegistrationData data;
  final VoidCallback onNext;

  const AccountTypeStep({
    super.key,
    required this.data,
    required this.onNext,
  });

  @override
  State<AccountTypeStep> createState() => _AccountTypeStepState();
}

class _AccountTypeStepState extends State<AccountTypeStep> {
  String? _selectedType;

  @override
  void initState() {
    super.initState();
    _selectedType = widget.data.userType;
  }

  void _selectType(String type) {
    setState(() {
      _selectedType = type;
      widget.data.userType = type;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          l10n.selectAccountType,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          l10n.chooseTheTypeOfAccount,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),

        // Student Card
        _AccountTypeCard(
          title: l10n.student,
          description: l10n.forStudentsPursuingEducation,
          icon: Icons.school,
          isSelected: _selectedType == 'student',
          onTap: () => _selectType('student'),
        ),
        const SizedBox(height: 16),

        // Doctor Card
        _AccountTypeCard(
          title: l10n.doctor,
          description: l10n.forMedicalProfessionals,
          icon: Icons.medical_services,
          isSelected: _selectedType == 'doctor',
          onTap: () => _selectType('doctor'),
        ),
        const SizedBox(height: 16),

        // Institution Card
        _AccountTypeCard(
          title: l10n.institution,
          description: l10n.forEducationalAndMedicalInstitutions,
          icon: Icons.business,
          isSelected: _selectedType == 'institution',
          onTap: () => _selectType('institution'),
        ),
        const SizedBox(height: 32),

        // Next Button
        FilledButton(
          onPressed: _selectedType != null ? widget.onNext : null,
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Text(l10n.continueButton,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}

class _AccountTypeCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _AccountTypeCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected
                ? Theme.of(context).primaryColor
                : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
          color: isSelected
              ? Theme.of(context).primaryColor.withValues(alpha: 0.05)
              : (isDark ? Colors.grey[800] : Colors.white),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected
                    ? Theme.of(context).primaryColor
                    : Colors.grey[200],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 32,
                color: isSelected ? Colors.white : Colors.grey[600],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? Theme.of(context).primaryColor
                              : (isDark ? Colors.white : Colors.black),
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: Theme.of(context).primaryColor,
                size: 28,
              ),
          ],
        ),
      ),
    );
  }
}
