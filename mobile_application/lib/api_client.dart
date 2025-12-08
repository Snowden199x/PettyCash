import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  static const String baseUrl = 'http://10.216.33.26:5000'; // Replace with your server's address or IP for device access

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

  Future<Map<String, dynamic>> getJson(String path) async {
    final res = await http
        .get(
          Uri.parse('$baseUrl$path'),
          headers: const {'Accept': 'application/json'},
        )
        .timeout(const Duration(seconds: 10));

    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}