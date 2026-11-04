import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/utils/app_snackbar.dart';

void main() {
  test('snackbar backgrounds are fully opaque', () {
    for (final kind in SnackKind.values) {
      expect(AppSnackbar.colorFor(kind).a, 1.0, reason: kind.name);
    }
  });
}
