import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api_client.dart';

class WalletMonthDbHelper {
  static Future<List<Map<String, dynamic>>> loadTransactions(int folderId) async {
    final apiClient = ApiClient();
    final data = await apiClient.getJsonList('/pres/api/wallets/$folderId/transactions');
    List<Map<String, dynamic>> result = [];
    for (var item in data) {
      result.add(item as Map<String, dynamic>);
    }
    return result;
  }

  static Future<void> saveIncome(int folderId, Map<String, dynamic> data) async {
    final apiClient = ApiClient();
    await apiClient.postJson('/pres/api/wallets/$folderId/transactions', {
      'kind': 'income',
      'date_issued': data['date'],
      'quantity': data['quantity'],
      'income_type': data['income_type'],
      'description': data['description'],
      'price': data['price'],
    });
  }

  static Future<void> saveExpense(int folderId, Map<String, dynamic> data) async {
    final apiClient = ApiClient();
    await apiClient.postJson('/pres/api/wallets/$folderId/transactions', {
      'kind': 'expense',
      'date_issued': data['date'],
      'quantity': data['quantity'],
      'particulars': data['particulars'],
      'description': data['description'],
      'price': data['price'],
    });
  }

  static Future<List<Map<String, dynamic>>> loadReceipts(int folderId) async {
    final apiClient = ApiClient();
    final data = await apiClient.getJsonList('/pres/api/wallets/$folderId/receipts');
    List<Map<String, dynamic>> result = [];
    for (var item in data) {
      result.add(item as Map<String, dynamic>);
    }
    return result;
  }

  static Future<Map<String, dynamic>> uploadReceipt(int folderId, File imageFile, String description, String date) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${ApiClient.baseUrl}/pres/api/wallets/$folderId/receipts'),
    );
    request.headers.addAll(ApiClient.getHeaders());
    request.fields['receipt-desc'] = description;
    request.fields['receipt-date'] = date;
    request.files.add(await http.MultipartFile.fromPath('receipt-file', imageFile.path));
    
    final response = await request.send();
    final responseBody = await response.stream.bytesToString();
    
    if (response.statusCode != 200) {
      throw Exception('Failed to upload receipt: ${response.statusCode}');
    }
    
    return json.decode(responseBody);
  }

  static Future<String> getReceiptUrl(int receiptId) async {
    final apiClient = ApiClient();
    final data = await apiClient.getJson('/pres/api/receipts/$receiptId/url');
    return data['url'];
  }

  static Future<String> getReceiptDownloadUrl(int receiptId) async {
    final apiClient = ApiClient();
    final data = await apiClient.getJson('/pres/api/receipts/$receiptId/download-url');
    return data['url'];
  }

  static Future<void> deleteReceipt(int receiptId) async {
    final response = await http.delete(
      Uri.parse('${ApiClient.baseUrl}/pres/api/receipts/$receiptId'),
      headers: ApiClient.getHeaders(),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to delete receipt');
    }
  }

  static Future<int> _getWalletId(int folderId) async {
    final apiClient = ApiClient();
    final folders = await apiClient.getJsonList('/pres/api/wallets');
    for (var item in folders) {
      if (item['id'] == folderId) {
        return item['wallet_id'] as int;
      }
    }
    throw Exception('Wallet not found for folder $folderId');
  }

  static Future<void> generateReport(int folderId, Map<String, dynamic> reportData) async {
    final apiClient = ApiClient();
    final walletId = await _getWalletId(folderId);

    // Normalize date_prepared: convert dd/MM/yyyy → yyyy-MM-dd if needed
    String? datePrepared = reportData['date_prepared']?.toString();
    if (datePrepared != null && datePrepared.contains('/')) {
      final parts = datePrepared.split('/');
      if (parts.length == 3) {
        // dd/MM/yyyy → yyyy-MM-dd
        datePrepared = '${parts[2]}-${parts[1].padLeft(2, '0')}-${parts[0].padLeft(2, '0')}';
      }
    }

    final response = await apiClient.postJson('/pres/api/reports/generate', {
      'wallet_id': walletId,
      'budget_id': folderId,
      'event_name': reportData['event_name'],
      'date_prepared': datePrepared,
      'report_no': reportData['report_no'],
      'budget': reportData['budget'],
      'total_income': reportData['total_income'],
      'total_expense': reportData['total_expense'],
      'reimbursement': reportData['reimbursement'],
      'previous_fund': reportData['previous_fund'],
      'budget_in_the_bank': reportData['budget_in_the_bank'],
    });

    if (response['success'] != true) {
      throw Exception(response['error'] ?? 'Failed to generate report');
    }
  }

  static Future<Map<String, dynamic>?> loadBudget(int folderId) async {
    try {
      final apiClient = ApiClient();
      final data = await apiClient.getJson('/pres/api/wallets/$folderId/budget/current-month');
      return data;
    } catch (e) {
      return null;
    }
  }

  static Future<void> saveBudget(int folderId, double amount) async {
    final apiClient = ApiClient();
    await apiClient.postJson('/pres/api/wallets/$folderId/budget', {'amount': amount});
  }

  static Future<String> getPreviewUrl(int folderId) async {
    final walletId = await _getWalletId(folderId);
    return '${ApiClient.baseUrl}/pres/reports/$walletId/budgets/$folderId/preview';
  }

  static Future<String> getPrintUrl(int folderId) async {
    final walletId = await _getWalletId(folderId);
    return '${ApiClient.baseUrl}/pres/reports/$walletId/budgets/$folderId/print';
  }

  static Future<void> submitReport(int folderId) async {
    final apiClient = ApiClient();
    final walletId = await _getWalletId(folderId);
    await apiClient.postJson('/pres/reports/$walletId/submit', {});
  }

  static Future<Map<String, dynamic>?> checkReportStatus(int folderId) async {
    try {
      final walletId = await _getWalletId(folderId);

      final response = await http.get(
        Uri.parse('${ApiClient.baseUrl}/pres/api/wallets/reports/status?wallet_id=$walletId&budget_id=$folderId'),
        headers: ApiClient.getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'exists': data['has_report'] ?? false,
          'submitted': data['submitted'] ?? false,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<Map<String, dynamic>>> loadArchives(int folderId) async {
    final apiClient = ApiClient();
    final data = await apiClient.getJsonList('/pres/api/wallets/$folderId/archives');
    List<Map<String, dynamic>> result = [];
    for (var item in data) {
      result.add(item as Map<String, dynamic>);
    }
    return result;
  }

  static Future<String> getArchiveDownloadUrl(int archiveId) async {
    return '${ApiClient.baseUrl}/pres/api/archives/$archiveId/download';
  }
}
