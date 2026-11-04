import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../widgets/general_app_bar.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../models/doctors_membership.dart';

class RenewMembershipPage extends StatefulWidget {
  const RenewMembershipPage({super.key});

  @override
  State<RenewMembershipPage> createState() => _RenewMembershipPageState();
}

class _RenewMembershipPageState extends State<RenewMembershipPage> {
  final ApiService _apiService = Get.find<ApiService>();
  final AuthService _authService = Get.find<AuthService>();

  bool _isLoading = true;
  /// The user's membership. Null if not loaded or none found.
  DoctorsMembership? _membership;
  String? _errorMessage;
  bool _isRenewing = false;

  @override
  void initState() {
    super.initState();
    _loadMembership();
  }

  Future<void> _loadMembership() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = _authService.currentUser.value;
      if (user == null) {
        setState(() {
          _errorMessage = 'User not logged in';
          _isLoading = false;
        });
        return;
      }

      // Fetch memberships for the current doctor
      final response = await _apiService.membership.getMemberships({
        'doctor': user.id,
      });

      // Assuming we want the most recent active or last membership
      // If there are multiple, we might want to sort or pick the first one
      if (response.results.isNotEmpty) {
        setState(() {
          _membership = response.results.first;
          _isLoading = false;
        });
      } else {
        setState(() {
          _membership = null;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load membership details';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _renewMembership() async {
    if (_membership == null) return;

    setState(() {
      _isRenewing = true;
    });

    try {
      await _apiService.membership.renewMembership(_membership!.id);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Membership renewal requested successfully'),
            backgroundColor: Colors.green,
          ),
        );
        // Reload to show updated status
        _loadMembership();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to renew membership: ${e.toString()}'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isRenewing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: GeneralAppBar(
        title: l10n.renewMembershipTitle,
        showBackButton: true,
      ),
      body: _buildBody(l10n, colorScheme),
    );
  }

  Widget _buildBody(AppLocalizations l10n, ColorScheme colorScheme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: colorScheme.error),
            const SizedBox(height: 16),
            Text(l10n.failedToLoadMembershipDetails, style: TextStyle(color: colorScheme.error)),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: _loadMembership,
              child: Text(l10n.retry),
            ),
          ],
        ),
      );
    }

    if (_membership == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.card_membership, size: 64, color: colorScheme.outline),
            const SizedBox(height: 24),
            Text(
              l10n.noActiveMembershipFound,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: colorScheme.onSurface,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.contactAdminToCreateMembership,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      );
    }

    // Show membership details
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildMembershipCard(_membership!, colorScheme, l10n),
          const SizedBox(height: 32),
          
          if (_canRenew(_membership!)) ...[
            FilledButton(
              onPressed: _isRenewing ? null : _renewMembership,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: _isRenewing
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      l10n.requestRenewal,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.renewalRequestReviewMessage,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
            ),
          ] else ...[
             Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colorScheme.secondaryContainer.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: colorScheme.primary),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      l10n.membershipActiveNoRenewalNeeded,
                      style: TextStyle(
                        color: colorScheme.onSecondaryContainer,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMembershipCard(DoctorsMembership membership, ColorScheme colorScheme, AppLocalizations l10n) {
    // Force 'en' locale for date formatting to use Western Arabic numerals (0-9)
    final dateFormat = DateFormat('dd-MM-yyyy', 'en');
    final isExpired = membership.status == 'expired' || 
        (membership.endDate != null && membership.endDate!.isBefore(DateTime.now()));
    
    final statusColor = _getStatusColor(membership.status);

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colorScheme.outlineVariant.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer.withValues(alpha: 0.3),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.workspace_premium, color: colorScheme.primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        membership.membershipTypeDetails?.name ?? l10n.membership,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '#${membership.membershipNumber}',
                        style: TextStyle(
                          color: colorScheme.onSurfaceVariant,
                          fontFamily: 'Monospace',
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    _getLocalizedStatus(membership.status, l10n).toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          // Details
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                _buildInfoRow(
                  context, 
                  l10n.startDate, 
                  dateFormat.format(membership.startDate),
                  Icons.calendar_today,
                ),
                const SizedBox(height: 16),
                _buildInfoRow(
                  context, 
                  l10n.endDate, 
                  membership.endDate != null ? dateFormat.format(membership.endDate!) : 'N/A',
                  Icons.event_busy,
                  valueColor: isExpired ? colorScheme.error : null,
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 16),
                _buildInfoRow(
                  context, 
                  l10n.cost, 
                  '${membership.totalAmount} LYD', 
                  Icons.attach_money,
                ),
                const SizedBox(height: 16),
                _buildInfoRow(
                  context, 
                  l10n.paymentStatus, 
                  _getLocalizedPaymentStatus(membership.paymentStatus, l10n).toUpperCase(),
                  Icons.payment,
                  valueColor: _getPaymentStatusColor(membership.paymentStatus),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, String label, String value, IconData icon, {Color? valueColor}) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(icon, size: 20, color: colorScheme.outline),
        const SizedBox(width: 12),
        Text(
          label,
          style: TextStyle(color: colorScheme.onSurfaceVariant),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: valueColor ?? colorScheme.onSurface,
          ),
        ),
      ],
    );
  }

  String _getLocalizedStatus(String status, AppLocalizations l10n) {
    switch (status.toLowerCase()) {
      case 'active':
        return l10n.active;
      case 'expired':
        return l10n.expired;
      case 'pending':
        return l10n.pending;
      case 'canceled':
        return 'Canceled'; // Needs key if used
      default:
        return status;
    }
  }

  String _getLocalizedPaymentStatus(String status, AppLocalizations l10n) {
      // Add more cases if needed based on API response
      // Assuming 'paid', 'unpaid', 'partial' are possible values
      // Currently using l10n keys from generated file or fallback
      // Since specific payment status keys might not exist, using generic or raw
      return status; 
  }


  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Colors.green;
      case 'expired':
        return Colors.red;
      case 'pending':
        return Colors.orange;
      case 'canceled':
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  Color _getPaymentStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return Colors.green;
      case 'partial':
        return Colors.orange;
      case 'unpaid':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  bool _canRenew(DoctorsMembership membership) {
    // Can renew if expired or expiring soon (e.g., within 30 days)
    if (membership.status == 'expired' || membership.status == 'canceled') return true;
    
    if (membership.endDate != null) {
      final daysUntilExpiry = membership.endDate!.difference(DateTime.now()).inDays;
      return daysUntilExpiry <= 30;
    }
    
    return false;
  }
}
