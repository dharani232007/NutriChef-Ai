import sqlite3
from datetime import datetime
from typing import Optional

DB_FILE = "health_tracker.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. User Profiles Table with all physical & medical attributes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        age INTEGER,
        gender TEXT,
        height_cm REAL,
        weight_kg REAL,
        activity_level TEXT,
        health_goal TEXT,
        daily_calorie_target REAL,
        daily_protein_target REAL,
        daily_carb_target REAL,
        daily_fat_target REAL,
        daily_sugar_limit REAL DEFAULT 25.0,
        daily_sodium_limit REAL DEFAULT 2000.0,
        health_conditions TEXT,
        allergies TEXT
    )
    """)

    # Automatic migration: Add any missing columns to existing databases safely
    cursor.execute("PRAGMA table_info(user_profiles)")
    existing_cols = [col["name"] for col in cursor.fetchall()]
    
    missing_cols = {
        "age": "INTEGER",
        "gender": "TEXT",
        "height_cm": "REAL",
        "weight_kg": "REAL",
        "activity_level": "TEXT",
        "health_goal": "TEXT",
        "allergies": "TEXT",
        "health_conditions": "TEXT"
    }

    for col_name, col_type in missing_cols.items():
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE user_profiles ADD COLUMN {col_name} {col_type}")

    # 2. Meal Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meal_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        meal_name TEXT,
        meal_type TEXT,
        calories REAL,
        protein_g REAL,
        carbs_g REAL,
        fat_g REAL,
        sugar_g REAL,
        sodium_mg REAL,
        logged_date TEXT,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()

def save_or_update_user_profile(user_id: str, profile_details: dict, targets: dict):
    """
    Saves or updates complete user profile attributes for ANY user dynamically.
    """
    conn = get_connection()
    cursor = conn.cursor()
    clean_id = str(user_id).strip().lower()

    daily_cal = float(targets.get("daily_calories") or (targets.get("meal_calories", 650.0) * 3))
    daily_protein = float(targets.get("protein_g", 70.0) if targets.get("protein_g", 0) > 40 else targets.get("protein_g", 25.0) * 3)
    daily_carbs = float(targets.get("carbs_g", 220.0) if targets.get("carbs_g", 0) > 80 else targets.get("carbs_g", 50.0) * 3)
    daily_fat = float(targets.get("fat_g", 60.0) if targets.get("fat_g", 0) > 30 else targets.get("fat_g", 18.0) * 3)

    raw_conds = profile_details.get("health_conditions", [])
    cond_str = ",".join(raw_conds) if isinstance(raw_conds, list) else str(raw_conds or "")

    raw_allgs = profile_details.get("allergies", [])
    allg_str = ",".join(raw_allgs) if isinstance(raw_allgs, list) else str(raw_allgs or "")

    cursor.execute("""
        INSERT INTO user_profiles (
            user_id, age, gender, height_cm, weight_kg, activity_level, health_goal,
            daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target,
            health_conditions, allergies
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            age = excluded.age,
            gender = excluded.gender,
            height_cm = excluded.height_cm,
            weight_kg = excluded.weight_kg,
            activity_level = excluded.activity_level,
            health_goal = excluded.health_goal,
            daily_calorie_target = excluded.daily_calorie_target,
            daily_protein_target = excluded.daily_protein_target,
            daily_carb_target = excluded.daily_carb_target,
            daily_fat_target = excluded.daily_fat_target,
            health_conditions = excluded.health_conditions,
            allergies = excluded.allergies
    """, (
        clean_id,
        int(profile_details.get("age", 25)),
        str(profile_details.get("gender", "female")),
        float(profile_details.get("height_cm", 165.0)),
        float(profile_details.get("weight_kg", 60.0)),
        str(profile_details.get("activity_level", "moderate")),
        str(profile_details.get("health_goal", "maintain_weight")),
        daily_cal,
        daily_protein,
        daily_carbs,
        daily_fat,
        cond_str,
        allg_str
    ))
    conn.commit()
    conn.close()

def init_user_auth_table():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        is_verified INTEGER DEFAULT 0,
        otp_code TEXT,
        otp_expiry TIMESTAMP,
        auth_provider TEXT DEFAULT 'local', -- 'local' or 'google'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()

def insert_meal_log(user_id: str, meal_name: str, meal_type: str, nutrition: dict):
    conn = get_connection()
    cursor = conn.cursor()
    clean_id = str(user_id).strip().lower()
    today_str = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
        INSERT INTO meal_logs 
        (user_id, meal_name, meal_type, calories, protein_g, carbs_g, fat_g, sugar_g, sodium_mg, logged_date, logged_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        clean_id,
        meal_name,
        meal_type.lower(),
        float(nutrition.get("calories", 0.0)),
        float(nutrition.get("protein_g", 0.0)),
        float(nutrition.get("carbs_g", 0.0)),
        float(nutrition.get("fat_g", 0.0)),
        float(nutrition.get("sugar_g", 0.0)),
        float(nutrition.get("sodium_mg", 0.0)),
        today_str,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

def get_aggregated_diet(user_id: str, timeframe: str = "today") -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    clean_id = str(user_id).strip().lower()
    today_str = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("SELECT * FROM user_profiles WHERE LOWER(TRIM(user_id)) = ?", (clean_id,))
    profile = cursor.fetchone()

    daily_cal = float(profile["daily_calorie_target"]) if profile else 2000.0
    daily_protein = float(profile["daily_protein_target"]) if profile else 100.0
    daily_carbs = float(profile["daily_carb_target"]) if profile else 220.0
    daily_fat = float(profile["daily_fat_target"]) if profile else 60.0
    conditions = profile["health_conditions"].split(",") if (profile and profile["health_conditions"]) else []

    if timeframe == "today":
        filter_sql = "logged_date = ?"
        filter_params = (clean_id, today_str)
        multiplier = 1
    elif timeframe == "week":
        filter_sql = "logged_date >= date(?, '-7 days')"
        filter_params = (clean_id, today_str)
        multiplier = 7
    elif timeframe == "month":
        filter_sql = "logged_date >= date(?, '-30 days')"
        filter_params = (clean_id, today_str)
        multiplier = 30
    else:
        filter_sql = "logged_date >= date(?, '-365 days')"
        filter_params = (clean_id, today_str)
        multiplier = 365

    total_query = f"""
        SELECT 
            COALESCE(SUM(calories), 0) as total_calories,
            COALESCE(SUM(protein_g), 0) as total_protein,
            COALESCE(SUM(carbs_g), 0) as total_carbs,
            COALESCE(SUM(fat_g), 0) as total_fat,
            COALESCE(SUM(sugar_g), 0) as total_sugar,
            COALESCE(SUM(sodium_mg), 0) as total_sodium,
            COUNT(*) as meal_count
        FROM meal_logs
        WHERE LOWER(TRIM(user_id)) = ? AND {filter_sql}
    """
    cursor.execute(total_query, filter_params)
    totals_row = cursor.fetchone()
    totals = dict(totals_row) if totals_row else {
        "total_calories": 0.0, "total_protein": 0.0, "total_carbs": 0.0, 
        "total_fat": 0.0, "total_sugar": 0.0, "total_sodium": 0.0, "meal_count": 0
    }

    breakdown_query = f"""
        SELECT 
            meal_type,
            COALESCE(SUM(calories), 0) as calories,
            COALESCE(SUM(protein_g), 0) as protein_g,
            COUNT(*) as items_count
        FROM meal_logs
        WHERE LOWER(TRIM(user_id)) = ? AND {filter_sql}
        GROUP BY meal_type
    """
    cursor.execute(breakdown_query, filter_params)
    rows = cursor.fetchall()
    conn.close()

    meal_breakdown = {
        "breakfast": {"calories": 0.0, "protein_g": 0.0, "items_count": 0},
        "lunch": {"calories": 0.0, "protein_g": 0.0, "items_count": 0},
        "dinner": {"calories": 0.0, "protein_g": 0.0, "items_count": 0},
        "snack": {"calories": 0.0, "protein_g": 0.0, "items_count": 0}
    }
    for r in rows:
        m = str(r["meal_type"]).lower()
        if m in meal_breakdown:
            meal_breakdown[m] = {
                "calories": round(float(r["calories"]), 1),
                "protein_g": round(float(r["protein_g"]), 1),
                "items_count": int(r["items_count"])
            }

    target_cal = daily_cal * multiplier
    consumed_cal = float(totals["total_calories"])
    remaining_cal = max(0.0, target_cal - consumed_cal)

    ideal_breakfast = daily_cal * 0.25
    ideal_lunch = daily_cal * 0.35
    ideal_dinner = daily_cal * 0.25

    bf_consumed = meal_breakdown["breakfast"]["calories"]
    advice = []

    if timeframe == "today":
        if bf_consumed == 0:
            advice.append(f"Breakfast not logged yet. Aim for ~{ideal_breakfast:.0f} kcal (e.g. eggs, idli with sambar, or oats) to maintain energy.")
        elif bf_consumed < (ideal_breakfast * 0.7):
            advice.append(f"Breakfast was light ({bf_consumed:.0f} kcal vs ~{ideal_breakfast:.0f} kcal recommended). Add a boiled egg, nuts, or milk to boost energy.")
        else:
            advice.append(f"Healthy breakfast intake ({bf_consumed:.0f} kcal). You have {remaining_cal:.0f} kcal remaining for lunch, dinner, and snacks.")

        if remaining_cal > 0:
            advice.append(f"To meet your daily {target_cal:.0f} kcal target, target ~{ideal_lunch:.0f} kcal for lunch and ~{ideal_dinner:.0f} kcal for dinner.")
        else:
            advice.append(f"Daily caloric target reached ({consumed_cal:.0f} kcal). Prioritize water and light salads.")

    alerts = []
    if "diabetes" in [c.lower() for c in conditions] and totals["total_sugar"] > (25.0 * multiplier):
        alerts.append(f"Sugar Warning: You reached {totals['total_sugar']:.1f}g sugar. Opt for low-glycemic, fiber-rich meals.")

    return {
        "user_id": clean_id,
        "timeframe": timeframe,
        "total_consumed": {
            "calories": round(totals["total_calories"], 1),
            "protein_g": round(totals["total_protein"], 1),
            "carbs_g": round(totals["total_carbs"], 1),
            "fat_g": round(totals["total_fat"], 1)
        },
        "targets": {
            "daily_calories": round(target_cal, 1),
            "protein_g": round(daily_protein * multiplier, 1),
            "carbs_g": round(daily_carbs * multiplier, 1),
            "fat_g": round(daily_fat * multiplier, 1)
        },
        "meal_breakdown": meal_breakdown,
        "recommended_routine": {
            "breakfast_target_kcal": round(ideal_breakfast),
            "lunch_target_kcal": round(ideal_lunch),
            "dinner_target_kcal": round(ideal_dinner),
            "remaining_kcal": round(remaining_cal)
        },
        "dietary_advice": advice,
        "health_alerts": alerts
    }

init_db()