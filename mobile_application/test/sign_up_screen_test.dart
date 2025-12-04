import 'package:flutter_test/flutter_test.dart';
import 'package:pockitrack/main.dart'; // ✅ MyApp is here

void main() {
  testWidgets('Sign Up screen loads correctly', (WidgetTester tester) async {
    // Build the app
    await tester.pumpWidget(const MyApp());

    // Check if "Sign up" text is displayed
    expect(find.text('Sign up'), findsOneWidget);

    // Check for email and password fields
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);

    // Check for "Continue" button
    expect(find.text('Continue'), findsOneWidget);
  });
}
