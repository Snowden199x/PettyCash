import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  // Change this if your Flask server IP/port changes
  static const String baseUrl = 'http://192.168.1.12:5000';

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final res = await http
        .post(
          Uri.parse('$baseUrl$path'),
          headers: const {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 10));

    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // For endpoints that return a JSON object
  Future<Map<String, dynamic>> getJson(String path) async {
    final res = await http
        .get(
          Uri.parse('$baseUrl$path'),
          headers: const {'Accept': 'application/json'},
        )
        .timeout(const Duration(seconds: 10));

    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // For endpoints that return a JSON array, e.g. /pres/api/wallets
  Future<List<dynamic>> getJsonList(String path) async {
    final res = await http
        .get(
          Uri.parse('$baseUrl$path'),
          headers: const {'Accept': 'application/json'},
        )
        .timeout(const Duration(seconds: 10));

    return jsonDecode(res.body) as List<dynamic>;
  }
}
