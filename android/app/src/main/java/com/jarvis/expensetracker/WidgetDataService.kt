package com.jarvis.expensetracker

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * Service to handle widget data operations
 * Bridges between native Android widgets and React Native storage
 */
class WidgetDataService(private val context: Context) {

    companion object {
        private const val PREFS_NAME = "CapacitorStorage"
        private const val KEY_TRANSACTIONS = "transactions"
        private const val KEY_CATEGORIES = "categories"
        private const val KEY_GOALS = "goals"
    }

    private val prefs: SharedPreferences = 
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /**
     * Get current month's budget statistics
     */
    fun getBudgetStats(): BudgetStats {
        val transactions = getTransactions()
        val categories = getCategories()
        
        val currentMonth = getCurrentMonth()
        val monthTransactions = transactions.filter { 
            it.date.startsWith(currentMonth) && it.type == "debit"
        }
        
        val totalSpent = monthTransactions.sumOf { it.amount }
        val totalBudget = categories.sumOf { it.budget }
        
        return BudgetStats(
            totalSpent = totalSpent,
            totalBudget = totalBudget,
            remaining = totalBudget - totalSpent,
            percentage = if (totalBudget > 0) (totalSpent / totalBudget * 100).toInt() else 0
        )
    }

    /**
     * Add a new transaction from widget
     */
    fun addTransaction(amount: Double, category: String, merchant: String = "Widget Entry"): Boolean {
        return try {
            val transactions = getTransactions().toMutableList()
            
            val newTransaction = Transaction(
                id = "widget-${System.currentTimeMillis()}",
                date = getCurrentDateTime(),
                amount = amount,
                type = "debit",
                category = category,
                merchant = merchant,
                isManual = true,
                rawSms = "Added via widget"
            )
            
            transactions.add(newTransaction)
            saveTransactions(transactions)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Get all categories
     */
    fun getCategories(): List<CategoryData> {
        val json = prefs.getString(KEY_CATEGORIES, "[]") ?: "[]"
        val categories = mutableListOf<CategoryData>()
        
        try {
            val jsonArray = JSONArray(json)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                categories.add(
                    CategoryData(
                        id = obj.getString("id"),
                        name = obj.getString("name"),
                        budget = obj.getDouble("budget"),
                        icon = obj.getString("icon")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return categories
    }

    /**
     * Get top categories for quick selection
     */
    fun getTopCategories(limit: Int = 5): List<CategoryData> {
        return getCategories().take(limit)
    }

    private fun getTransactions(): List<Transaction> {
        val json = prefs.getString(KEY_TRANSACTIONS, "[]") ?: "[]"
        val transactions = mutableListOf<Transaction>()
        
        try {
            val jsonArray = JSONArray(json)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                transactions.add(
                    Transaction(
                        id = obj.getString("id"),
                        date = obj.getString("date"),
                        amount = obj.getDouble("amount"),
                        type = obj.getString("type"),
                        category = obj.getString("category"),
                        merchant = obj.getString("merchant"),
                        isManual = obj.optBoolean("isManual", false),
                        rawSms = obj.optString("rawSms", "")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return transactions
    }

    private fun saveTransactions(transactions: List<Transaction>) {
        val jsonArray = JSONArray()
        transactions.forEach { tx ->
            val obj = JSONObject().apply {
                put("id", tx.id)
                put("date", tx.date)
                put("amount", tx.amount)
                put("type", tx.type)
                put("category", tx.category)
                put("merchant", tx.merchant)
                put("isManual", tx.isManual)
                put("rawSms", tx.rawSms)
            }
            jsonArray.put(obj)
        }
        
        prefs.edit().putString(KEY_TRANSACTIONS, jsonArray.toString()).apply()
    }

    private fun getCurrentMonth(): String {
        val sdf = SimpleDateFormat("yyyy-MM", Locale.getDefault())
        return sdf.format(Date())
    }

    private fun getCurrentDateTime(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }

    // Data classes
    data class BudgetStats(
        val totalSpent: Double,
        val totalBudget: Double,
        val remaining: Double,
        val percentage: Int
    )

    data class Transaction(
        val id: String,
        val date: String,
        val amount: Double,
        val type: String,
        val category: String,
        val merchant: String,
        val isManual: Boolean,
        val rawSms: String
    )

    data class CategoryData(
        val id: String,
        val name: String,
        val budget: Double,
        val icon: String
    )
}
