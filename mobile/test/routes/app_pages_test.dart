import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/routes/app_pages.dart';

void main() {
  final registered = AppPages.routes.map((p) => p.name).toSet();

  test('every Routes constant is registered', () {
    final source = File('lib/routes/app_routes.dart').readAsStringSync();
    final declared = RegExp(r"static const \w+ = '([^']+)'")
        .allMatches(source)
        .map((m) => m.group(1)!)
        .toSet();

    expect(declared, isNotEmpty);
    expect(declared.difference(registered), isEmpty);
  });

  test('every literal route used in lib/ is registered', () {
    final pattern = RegExp(r"(?:toNamed|offNamed|offAllNamed|offNamedUntil)\(\s*'([^']+)'");
    final used = <String, String>{};
    for (final file in Directory('lib').listSync(recursive: true)) {
      if (file is! File || !file.path.endsWith('.dart')) continue;
      for (final m in pattern.allMatches(file.readAsStringSync())) {
        used[m.group(1)!] = file.path;
      }
    }

    final missing = {
      for (final e in used.entries)
        if (!registered.contains(e.key)) e.key: e.value,
    };
    expect(missing, isEmpty);
  });
}
