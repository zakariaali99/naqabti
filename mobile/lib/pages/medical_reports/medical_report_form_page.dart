import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:file_picker/file_picker.dart';
import 'package:naqabti/l10n/app_localizations.dart';
import '../../models/medical_report.dart';
import '../../services/api_service.dart';
import '../../widgets/general_app_bar.dart';

class MedicalReportFormPage extends StatefulWidget {
  final MedicalReport? report;
  const MedicalReportFormPage({super.key, this.report});

  @override
  State<MedicalReportFormPage> createState() => _MedicalReportFormPageState();
}

class _MedicalReportFormPageState extends State<MedicalReportFormPage> {
  final ApiService _apiService = Get.find<ApiService>();
  final _formKey = GlobalKey<FormState>();

  final _patientNameController = TextEditingController();
  final _patientIdController = TextEditingController();
  final _diagnosisController = TextEditingController();
  final _treatmentController = TextEditingController();
  final _recommendationsController = TextEditingController();
  final _notesController = TextEditingController();

  File? _selectedFile;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.report != null) {
      _patientNameController.text = widget.report!.patientName;
      _patientIdController.text = widget.report!.patientNationalId ?? '';
      _diagnosisController.text = widget.report!.diagnosis;
      _treatmentController.text = widget.report!.treatment ?? '';
      _recommendationsController.text = widget.report!.recommendations ?? '';
      _notesController.text = widget.report!.notes ?? '';
    }
  }

  @override
  void dispose() {
    _patientNameController.dispose();
    _patientIdController.dispose();
    _diagnosisController.dispose();
    _treatmentController.dispose();
    _recommendationsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.pickFile();
    if (result != null && result.path != null) {
      setState(() {
        _selectedFile = File(result.path!);
      });
    }
  }

  Future<void> _saveReport() async {
    if (!_formKey.currentState!.validate()) return;
    final l10n = AppLocalizations.of(context)!;

    setState(() => _isSaving = true);
    try {
      if (widget.report != null) {
        await _apiService.medicalReport.updateReport(
          widget.report!.id,
          patientName: _patientNameController.text,
          patientId: _patientIdController.text,
          diagnosis: _diagnosisController.text,
          treatment: _treatmentController.text,
          recommendations: _recommendationsController.text,
          notes: _notesController.text,
          document: _selectedFile,
        );
      } else {
        await _apiService.medicalReport.createReport(
          patientName: _patientNameController.text,
          patientId: _patientIdController.text,
          diagnosis: _diagnosisController.text,
          treatment: _treatmentController.text,
          recommendations: _recommendationsController.text,
          notes: _notesController.text,
          document: _selectedFile,
        );
      }
      if (mounted) Get.back();
      Get.snackbar(
        l10n.success,
        l10n.dataSavedSuccessfully,
        backgroundColor: Colors.green,
        colorText: Colors.white,
      );
    } catch (e) {
      Get.snackbar(
        l10n.error,
        e.toString(),
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isEdit = widget.report != null;

    return Scaffold(
      appBar: GeneralAppBar(
        title: isEdit ? l10n.medicalReportDetails : l10n.createMedicalReport,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _patientNameController,
                decoration: InputDecoration(labelText: l10n.patientName),
                validator: (v) => v?.isEmpty ?? true ? l10n.requiredField : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _patientIdController,
                decoration: InputDecoration(labelText: l10n.patientId),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _diagnosisController,
                decoration: InputDecoration(labelText: l10n.diagnosis),
                maxLines: 3,
                validator: (v) => v?.isEmpty ?? true ? l10n.requiredField : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _treatmentController,
                decoration: InputDecoration(labelText: l10n.treatment),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _recommendationsController,
                decoration: InputDecoration(labelText: l10n.recommendations),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _notesController,
                decoration: InputDecoration(labelText: l10n.notes),
                maxLines: 2,
              ),
              const SizedBox(height: 24),
              ListTile(
                title: Text(l10n.attachments),
                subtitle: Text(_selectedFile?.path.split('/').last ?? 
                             widget.report?.document?.split('/').last ?? 
                             l10n.noFileSelected),
                trailing: IconButton(
                  icon: const Icon(Icons.attach_file),
                  onPressed: _pickFile,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(color: Colors.grey[300]!),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isSaving ? null : _saveReport,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isSaving 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(isEdit ? l10n.save : l10n.create),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
