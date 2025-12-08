import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  // Change this if your Flask server IP/port changes
  static const String baseUrl = 'http://192.168.1.12:5000';
  
  // Store session cookie after login
  static String? _sessionCookie;

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_sessionCookie != null) {
      headers['Cookie'] = _sessionCookie!;
    }

    final res = await http
        .post(
          Uri.parse('$baseUrl$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 10));

    // Save session cookie from login response
    if (res.headers['set-cookie'] != null) {
      _sessionCookie = res.headers['set-cookie']!.split(';')[0];
    }

    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // For endpoints that return a JSON object
  Future<Map<String, dynamic>> getJson(String path) async {
    final headers = {'Accept': 'application/json'};
    if (_sessionCookie != null) {
      headers['Cookie'] = _sessionCookie!;
    }

    final res = await http
        .get(
          Uri.parse('$baseUrl$path'),
          headers: headers,
        )
        .timeout(const Duration(seconds: 10));

    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // For endpoints that return a JSON array, e.g. /pres/api/wallets
  Future<dynamic> getJsonList(String path) async {
    final headers = {'Accept': 'application/json'};
    if (_sessionCookie != null) {
      headers['Cookie'] = _sessionCookie!;
    }

    final res = await http
        .get(
          Uri.parse('$baseUrl$path'),
          headers: headers,
        )
        .timeout(const Duration(seconds: 10));

    final decoded = jsonDecode(res.body);
    if (decoded is Map && decoded.containsKey('error')) {
      throw Exception(decoded['error']);
    }
    return decoded is List ? decoded : [];
  }
  
  // Clear session on logout
  static void clearSession() {
    _sessionCookie = null;
  }
  
  // Get headers with session cookie for manual http requests
  static Map<String, String> getHeaders() {
    final headers = <String, String>{};
    if (_sessionCookie != null) {
      headers['Cookie'] = _sessionCookie!;
    }
    return headers;
  }
}
