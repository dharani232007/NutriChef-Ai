import sqlite3
from datetime import datetime

DB_FILE = "health_tracker.db"

def save_meal_log(user_id: str, meal_name: str, meal_type: str, nutrition: dict):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO meal_logs 
        (user_id, meal_name, meal_type, calories, protein_g, carbs_g, fat_g, sugar_g, sodium_mg, logged_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        meal_name,
        meal_type,
        nutrition.get("calories", 0),
        nutrition.get("protein_g", 0),
        nutrition.get("carbs_g", 0),
        nutrition.get("fat_g", 0),
        nutrition.get("sugar_g", 0),
        nutrition.get("sodium_mg", 0),
        datetime.now()
    ))
    conn.commit()
    conn.close()

def get_diet_summary_and_alerts(user_id: str, timeframe: str = "today") -> dict:
    """
    timeframe options: 'today', 'week', 'month', 'year'
    Aggregates intake and triggers deterministic health warnings.
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Fetch user targets
    cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
    profile = cursor.fetchone()
    
    # Fallback baseline if user hasn't calculated targets yet
    cal_target = profile["daily_calorie_target"] if profile else 2000.0
    protein_target = profile["daily_protein_target"] if profile else 60.0
    sugar_limit = profile["daily_sugar_limit"] if profile else 25.0
    sodium_limit = profile["daily_sodium_limit"] if profile else 2000.0
    conditions = profile["health_conditions"].split(",") if profile and profile["health_conditions"] else []

    # 2. Date filters in SQLite
    filter_sql = {
        "today": "date(logged_at) = date('now', 'localtime')",
        "week": "date(logged_at) >= date('now', 'localtime', '-7 days')",
        "month": "date(logged_at) >= date('now', 'localtime', '-1 month')",
        "year": "date(logged_at) >= date('now', 'localtime', '-1 year')"
    }.get(timeframe, "date(logged_at) = date('now', 'localtime')")

    query = f"""
        SELECT 
            COUNT(*) as meal_count,
            COALESCE(SUM(calories), 0) as total_calories,
            COALESCE(SUM(protein_g), 0) as total_protein,
            COALESCE(SUM(carbs_g), 0) as total_carbs,
            COALESCE(SUM(fat_g), 0) as total_fat,
            COALESCE(SUM(sugar_g), 0) as total_sugar,
            COALESCE(SUM(sodium_mg), 0) as total_sodium
        FROM meal_logs
        WHERE user_id = ? AND {filter_sql}
    """
    cursor.execute(query, (user_id,))
    totals = dict(cursor.fetchone())
    conn.close()

    # 3. Deterministic Health Boundary Checks & Mistake Alerts
    alerts = []
    recommendations = []

    # Daily checks are scaled if viewing across a full week/month
    multiplier = 7 if timeframe == "week" else (30 if timeframe == "month" else (365 if timeframe == "year" else 1))
    period_cal_limit = cal_target * multiplier
    period_sugar_limit = sugar_limit * multiplier
    period_sodium_limit = sodium_limit * multiplier

    # Calorie Checks
    if totals["total_calories"] > period_cal_limit:
        alerts.append(f"⚠️ Calorie Budget Exceeded: Consumed {totals['total_calories']:.0f} kcal (Target: {period_cal_limit:.0f} kcal).")
        recommendations.append("Consider a lighter, vegetable-broth-based meal for your next dish.")
    
    # Sugar Checks (Diabetes risk)
    if totals["total_sugar"] > period_sugar_limit or "diabetes" in conditions:
        if totals["total_sugar"] > period_sugar_limit:
            alerts.append(f"🚨 Sugar Intake Alert: Consumed {totals['total_sugar']:.1f}g sugar, exceeding threshold of {period_sugar_limit:.1f}g.")
            recommendations.append("Swap high-glycemic carbs for whole grains and cut sugary beverages.")

    # Sodium / Salt Checks (Hypertension / High BP risk)
    if totals["total_sodium"] > period_sodium_limit or "high_blood_pressure" in conditions:
        if totals["total_sodium"] > period_sodium_limit:
            alerts.append(f"🚨 High Sodium Warning: Reached {totals['total_sodium']:.0f}mg sodium. Safe boundary is {period_sodium_limit:.0f}mg.")
            recommendations.append("Limit processed condiments and use lemon juice or herbs for flavoring.")

    # Protein Check
    if totals["total_protein"] < (protein_target * multiplier * 0.7):
        recommendations.append("Protein intake is falling behind. Add boiled eggs, tofu, paneer, or lentils to your next meal.")

    return {
        "user_id": user_id,
        "timeframe": timeframe,
        "meal_count": totals["meal_count"],
        "intake_summary": {
            "calories": round(totals["total_calories"], 1),
            "protein_g": round(totals["total_protein"], 1),
            "carbs_g": round(totals["total_carbs"], 1),
            "fat_g": round(totals["total_fat"], 1),
            "sugar_g": round(totals["total_sugar"], 1),
            "sodium_mg": round(totals["total_sodium"], 1)
        },
        "target_allowance": {
            "calories": period_cal_limit,
            "sugar_g_max": period_sugar_limit,
            "sodium_mg_max": period_sodium_limit
        },
        "alerts": alerts,
        "improvement_tips": recommendations
    }