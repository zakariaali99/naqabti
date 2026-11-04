import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:naqabti/widgets/general_app_bar.dart';

Widget _app(Widget home) => MaterialApp(home: home);

Future<void> _pushPage(WidgetTester tester, GeneralAppBar appBar) async {
  await tester.pumpWidget(_app(Builder(
    builder: (context) => Scaffold(
      body: TextButton(
        onPressed: () => Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => Scaffold(appBar: appBar, body: const Text('page')),
        )),
        child: const Text('open'),
      ),
    ),
  )));
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
}

void main() {
  const back = Icons.arrow_back_ios_new;

  testWidgets('shows a back button on a pushed page by default',
      (tester) async {
    await _pushPage(tester, const GeneralAppBar(title: 'Inner'));
    expect(find.byIcon(back), findsOneWidget);

    await tester.tap(find.byIcon(back));
    await tester.pumpAndSettle();
    expect(find.text('open'), findsOneWidget);
  });

  testWidgets('no back button on the first page', (tester) async {
    await tester.pumpWidget(
        _app(const Scaffold(appBar: GeneralAppBar(title: 'Root'))));
    expect(find.byIcon(back), findsNothing);
  });

  testWidgets('showBackButton: false hides it explicitly', (tester) async {
    await _pushPage(
        tester, const GeneralAppBar(title: 'Inner', showBackButton: false));
    expect(find.byIcon(back), findsNothing);
  });

  testWidgets('drawer button replaces the default back button',
      (tester) async {
    await _pushPage(
        tester, const GeneralAppBar(title: 'Inner', showDrawerButton: true));
    expect(find.byIcon(Icons.menu), findsOneWidget);
    expect(find.byIcon(back), findsNothing);
  });
}
