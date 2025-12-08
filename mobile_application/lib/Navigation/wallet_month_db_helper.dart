import 'dart:io';
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

  static Future<void> uploadReceipt(int folderId, File imageFile, String description, String date) async {
    final apiClient = ApiClient();
    await apiClient.postJson('/pres/api/wallets/$folderId/receipts', {
      'description': description,
      'date': date,
      'image_path': imageFile.path,
    });
  }

  static Future<void> deleteReceipt(String imagePath) async {
    final apiClient = ApiClient();
    await apiClient.postJson('/pres/api/receipts/delete', {
      'image_path': imagePath,
    });
  }

  static Future<void> generateReport(int folderId, Map<String, dynamic> reportData) async {
    final apiClient = ApiClient();
    // Get wallet_id from folder
    final folders = await apiClient.getJsonList('/pres/api/wallets');
    int? walletId;
    for (var item in folders) {
      if (item['id'] == folderId) {
        walletId = item['wallet_id'];
        break;
      }
    }
    if (walletId == null) throw Exception('Wallet not found');
    
    await apiClient.postJson('/pres/api/reports/generate', {
      'wallet_id': walletId,
      'budget_id': folderId,
      'event_name': reportData['event_name'],
      'date_prepared': reportData['date_prepared'],
      'report_no': reportData['report_no'],
      'budget': reportData['budget'],
      'total_income': reportData['total_income'],
      'total_expense': reportData['total_expense'],
      'reimbursement': reportData['reimbursement'],
      'previous_fund': reportData['previous_fund'],
      'budget_in_the_bank': reportData['budget_in_the_bank'],
    });
  }

  static Future<String> getPreviewUrl(int folderId) async {
    final apiClient = ApiClient();
    final folders = await apiClient.getJsonList('/pres/api/wallets');
    int? walletId;
    for (var item in folders) {
      if (item['id'] == folderId) {
        walletId = item['wallet_id'];
        break;
      }
    }
    if (walletId == null) throw Exception('Wallet not found');
    return '${ApiClient.baseUrl}/pres/reports/$walletId/budgets/$folderId/preview';
  }

  static Future<Map<String, dynamic>?> loadBudget(int folderId) async {
    final apiClient = ApiClient();
    try {
      final data = await apiClient.getJson('/pres/api/wallets/$folderId/budget/current-month');
      return data;
    } catch (e) {
      return null;
    }
  }

  static Future<void> saveBudget(int folderId, double amount) async {
    final apiClient = ApiClient();
    await apiClient.postJson('/pres/api/wallets/$folderId/budget', {
      'budget': amount,
    });
  }
}
