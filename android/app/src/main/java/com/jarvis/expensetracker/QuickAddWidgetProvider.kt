package com.jarvis.expensetracker

import android.appwidget.AppWidgetManager
import android.content.Context
import android.widget.RemoteViews

/**
 * Quick Add Expense Widget Provider
 * Allows users to quickly add expenses from home screen
 */
class QuickAddWidgetProvider : BaseWidgetProvider() {

    companion object {
        const val ACTION_ADD_EXPENSE = "com.jarvis.expensetracker.ACTION_ADD_EXPENSE"
        const val EXTRA_AMOUNT = "amount"
        const val EXTRA_CATEGORY = "category"
    }

    override fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_quick_add)
        
        // Get categories for display
        val dataService = WidgetDataService(context)
        val categories = dataService.getTopCategories(4)
        
        // Set up amount buttons
        setupAmountButton(context, views, appWidgetId, 50.0, R.id.btn_amount_50)
        setupAmountButton(context, views, appWidgetId, 100.0, R.id.btn_amount_100)
        setupAmountButton(context, views, appWidgetId, 200.0, R.id.btn_amount_200)
        setupAmountButton(context, views, appWidgetId, 500.0, R.id.btn_amount_500)
        
        // Set up category buttons (using top 4 categories)
        if (categories.isNotEmpty()) {
            setupCategoryButton(context, views, appWidgetId, categories.getOrNull(0), R.id.btn_category_1)
            setupCategoryButton(context, views, appWidgetId, categories.getOrNull(1), R.id.btn_category_2)
            setupCategoryButton(context, views, appWidgetId, categories.getOrNull(2), R.id.btn_category_3)
            setupCategoryButton(context, views, appWidgetId, categories.getOrNull(3), R.id.btn_category_4)
        }
        
        // Set click listener to open app
        views.setOnClickPendingIntent(R.id.widget_container, getPendingIntent(context))
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    override fun onReceive(context: Context, intent: android.content.Intent) {
        super.onReceive(context, intent)
        
        if (intent.action == ACTION_ADD_EXPENSE) {
            val amount = intent.getDoubleExtra(EXTRA_AMOUNT, 0.0)
            val category = intent.getStringExtra(EXTRA_CATEGORY) ?: "Other"
            
            if (amount > 0) {
                val dataService = WidgetDataService(context)
                val success = dataService.addTransaction(amount, category)
                
                if (success) {
                    // Update all widgets
                    val appWidgetManager = AppWidgetManager.getInstance(context)
                    val appWidgetIds = appWidgetManager.getAppWidgetIds(
                        android.content.ComponentName(context, QuickAddWidgetProvider::class.java)
                    )
                    onUpdate(context, appWidgetManager, appWidgetIds)
                    
                    // Also update budget widget
                    val budgetWidgetIds = appWidgetManager.getAppWidgetIds(
                        android.content.ComponentName(context, BudgetOverviewWidgetProvider::class.java)
                    )
                    BudgetOverviewWidgetProvider().onUpdate(context, appWidgetManager, budgetWidgetIds)
                }
            }
        }
    }

    private fun setupAmountButton(
        context: Context,
        views: RemoteViews,
        appWidgetId: Int,
        amount: Double,
        buttonId: Int
    ) {
        val intent = android.content.Intent(context, QuickAddWidgetProvider::class.java).apply {
            action = ACTION_ADD_EXPENSE
            putExtra(EXTRA_AMOUNT, amount)
            putExtra(EXTRA_CATEGORY, "Other") // Default category
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        
        val pendingIntent = android.app.PendingIntent.getBroadcast(
            context,
            buttonId,
            intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )
        
        views.setOnClickPendingIntent(buttonId, pendingIntent)
    }

    private fun setupCategoryButton(
        context: Context,
        views: RemoteViews,
        appWidgetId: Int,
        category: WidgetDataService.CategoryData?,
        buttonId: Int
    ) {
        if (category != null) {
            views.setTextViewText(buttonId, category.icon)
            
            val intent = android.content.Intent(context, QuickAddWidgetProvider::class.java).apply {
                action = ACTION_ADD_EXPENSE
                putExtra(EXTRA_AMOUNT, 100.0) // Default amount
                putExtra(EXTRA_CATEGORY, category.name)
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            
            val pendingIntent = android.app.PendingIntent.getBroadcast(
                context,
                buttonId,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
            
            views.setOnClickPendingIntent(buttonId, pendingIntent)
        }
    }
}
