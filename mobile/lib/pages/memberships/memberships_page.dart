import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../models/doctors_membership.dart';
import 'package:naqabti/l10n/app_localizations.dart';

class MembershipsPage extends StatefulWidget {
  const MembershipsPage({super.key});

  @override
  State<MembershipsPage> createState() => _MembershipsPageState();
}

class _MembershipsPageState extends State<MembershipsPage> {
  final ApiService _apiService = Get.find<ApiService>();
  final AuthService _authService = Get.find<AuthService>();

  bool _isLoading = true;
  String? _errorMessage;
  List<DoctorsMembership> _memberships = [];

  @override
  void initState() {
    super.initState();
    _loadMemberships();
  }

  Future<void> _loadMemberships() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = _authService.user;
      if (user != null) {
        final response = await _apiService.membership.getMemberships({
          'doctor': user.id,
        });
        setState(() {
          _memberships = response.results;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'User not logged in';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.myMemberships),
      ),
      body: RefreshIndicator(
        onRefresh: _loadMemberships,
        child: _buildBody(l10n, colorScheme),
      ),
    );
  }

  Widget _buildBody(AppLocalizations l10n, ColorScheme colorScheme) {
    if (_isLoading && _memberships.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.7,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48, color: colorScheme.error),
                  const SizedBox(height: 16),
                  Text(l10n.failedToLoadMemberships, style: TextStyle(color: colorScheme.error)),
                  const SizedBox(height: 16),
                  FilledButton.tonal(
                    onPressed: _loadMemberships,
                    child: Text(l10n.retry),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    if (_memberships.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.7,
            child: Center(child: Text(l10n.noMembershipHistory)),
          ),
        ],
      );
    }

    final dateFormat = DateFormat('dd-MM-yyyy', 'en');

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: _memberships.length,
      itemBuilder: (context, index) {
        final membership = _memberships[index];
        final isExpired = membership.status == 'expired';
        
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: isExpired 
                  ? Colors.red.withOpacity(0.1) 
                  : Colors.green.withOpacity(0.1),
              child: Icon(
                Icons.card_membership, 
                color: isExpired ? Colors.red : Colors.green,
              ),
            ),
            title: Text(
              '${l10n.membershipNumber}: ${membership.membershipNumber}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                 Text('${l10n.status}: ${membership.status.toUpperCase()}'),
                 if (membership.endDate != null)
                   Text('${l10n.endDate}: ${dateFormat.format(membership.endDate!)}'),
              ],
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
               // Navigation to details if implemented
            },
          ),
        );
      },
    );
  }
}
