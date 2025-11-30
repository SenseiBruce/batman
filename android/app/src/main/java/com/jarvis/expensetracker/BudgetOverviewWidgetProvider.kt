package com.jarvis.expensetracker

import android.appwidget.AppWidgetManager
import android.content.Context
import android.widget.RemoteViews
import java.text.NumberFormat
import java.util.Locale

/**
 * Budget Overview Widget Provider
 * Displays current month's budget status at a glance
 */
class BudgetOverviewWidgetProvider : BaseWidgetProvider() {

    override fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_budget_overview)
        
        // Get budget data
        val dataService = WidgetDataService(context)
        val stats = dataService.getBudgetStats()
        
        // Format currency
        val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
        
        // Update views
        views.setTextViewText(R.id.txt_spent, currencyFormat.format(stats.totalSpent))
        views.setTextViewText(R.id.txt_budget, currencyFormat.format(stats.totalBudget))
        views.setTextViewText(R.id.txt_remaining, currencyFormat.format(stats.remaining))
        views.setTextViewText(R.id.txt_percentage, "${stats.percentage}%")
        
        // Update progress bar
        views.setProgressBar(R.id.progress_budget, 100, stats.percentage, false)
        
        // Set progress bar color based on percentage
        val progressColor = when {
            stats.percentage >= 90 -> android.R.color.holo_red_dark
            stats.percentage >= 75 -> android.R.color.holo_orange_dark
            else -> android.R.color.holo_blue_dark
        }
        views.setInt(R.id.progress_budget, "setProgressTintList", 
            android.content.res.ColorStateList.valueOf(context.getColor(progressColor)))
        
        // Set month label
        val monthFormat = java.text.SimpleDateFormat("MMMM yyyy", Locale.getDefault())
        views.setTextViewText(R.id.txt_month, monthFormat.format(java.util.Date()))
        
        // Set click listener to open app
        views.setOnClickPendingIntent(R.id.widget_container, getPendingIntent(context))
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
