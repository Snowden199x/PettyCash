import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  // Flask backend hosted on Render — works from any network
  static const String baseUrl = 'https://pockitrack-api.onrender.com';
  
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
        .timeout(const Duration(seconds: 30));

    // Save session cookie from login response
    if (res.headers['set-cookie'] != null) {
      _sessionCookie = res.headers['set-cookie']!.split(';')[0];
    }

    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // POST as application/x-www-form-urlencoded (for form-based Flask routes)
  // Returns a map with 'success' and optional 'error' keys derived from the
  // HTTP response — a redirect (3xx) means success, 4xx/5xx means failure.
  Future<Map<String, dynamic>> postForm(
    String path,
    Map<String, String> fields,
  ) async {
    final headers = <String, String>{};
    if (_sessionCookie != null) {
      headers['Cookie'] = _sessionCookie!;
    }

    final res = await http
        .post(
          Uri.parse('$baseUrl$path'),
          headers: headers,
          body: fields, // http package sends as form-urlencoded by default
        )
        .timeout(const Duration(seconds: 30));

    // Save any new session cookie
    if (res.headers['set-cookie'] != null) {
      _sessionCookie = res.headers['set-cookie']!.split(';')[0];
    }

    // Flask form routes redirect (302) on success and re-render (200) on error.
    // A redirect to the login page means the password was changed successfully.
    if (res.statusCode >= 300 && res.statusCode < 400) {
      return {'success': true};
    }

    // On error Flask re-renders the HTML page — check for flash danger message
    final body = res.body;
    if (body.contains('danger') || body.contains('do not match') || body.contains('Invalid')) {
      // Try to extract the flash message text
      final match = RegExp(r'class="flash danger"[^>]*>([^<]+)<').firstMatch(body);
      final msg = match?.group(1)?.trim() ?? 'Failed to change password';
      return {'success': false, 'error': msg};
    }

    return {'success': res.statusCode < 400};
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
        .timeout(const Duration(seconds: 30));

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
        .timeout(const Duration(seconds: 30));

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
  
  // PUT request
  Future<Map<String, dynamic>> putJson(
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
        .put(
          Uri.parse('$baseUrl$path'),
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 30));

    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // DELETE request
  Future<Map<String, dynamic>> deleteJson(String path) async {
    final headers = {'Accept': 'application/json'};
    if (_sessionCookie != null) {
      headers['Cookie'] = _sessionCookie!;
    }

    final res = await http
        .delete(
          Uri.parse('$baseUrl$path'),
          headers: headers,
        )
        .timeout(const Duration(seconds: 30));

    return jsonDecode(res.body) as Map<String, dynamic>;
  }
  
  // Get headers with session cookie for manual http requests
  static Map<String, String> getHeaders() {
    final headers = <String, String>{};
    if (_sessionCookie != null) {
      headers['Cookie'] = _sessionCookie!;
    }
    return headers;
  }

  // Parse a JSON string into a Map
  static Map<String, dynamic> parseJson(String body) {
    return jsonDecode(body) as Map<String, dynamic>;
  }
}
