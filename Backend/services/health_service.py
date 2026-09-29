from typing import Literal

def calculate_meal_targets(
    age: int,
    gender: Literal["male", "female", "other"],
    height_cm: float,
    weight_kg: float,
    activity_level: Literal["sedentary", "moderate", "very_active"],
    health_goal: Literal["weight_loss", "muscle_building", "maintain_weight"]
) -> dict:
    """Calculates single-meal calorie and macro targets using Mifflin-St Jeor."""
    
    # 1. Base Metabolic Rate (BMR)
    if gender.lower() == "male":
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:  # Female or other
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161

    # 2. Total Daily Energy Expenditure (TDEE)
    multipliers = {
        "sedentary": 1.2,
        "moderate": 1.55,
        "very_active": 1.725
    }
    tdee = bmr * multipliers.get(activity_level, 1.2)

    # 3. Adjust for User Goal
    if health_goal == "weight_loss":
        daily_calories = tdee - 500
    elif health_goal == "muscle_building":
        daily_calories = tdee + 300
    else:
        daily_calories = tdee

    # A single meal is roughly 35% of daily intake
    meal_calories = round(daily_calories * 0.35)

    # 4. Macro Splits based on goal
    if health_goal == "muscle_building":
        protein_g = round((meal_calories * 0.30) / 4)  # 30% protein (4 kcal/g)
        carbs_g = round((meal_calories * 0.45) / 4)    # 45% carbs (4 kcal/g)
        fat_g = round((meal_calories * 0.25) / 9)      # 25% fat (9 kcal/g)
    elif health_goal == "weight_loss":
        protein_g = round((meal_calories * 0.35) / 4)  # High protein preserves muscle
        carbs_g = round((meal_calories * 0.35) / 4)
        fat_g = round((meal_calories * 0.30) / 9)
    else:
        protein_g = round((meal_calories * 0.25) / 4)
        carbs_g = round((meal_calories * 0.50) / 4)
        fat_g = round((meal_calories * 0.25) / 9)

    return {
        "meal_calories": meal_calories,
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fat_g": fat_g
    }


def compile_health_constraints(
    health_conditions: list[str],
    allergies: list[str],
    dietary_preference: str | None = None
) -> list[str]:
    """Translates medical and allergy checkboxes into clear culinary rules."""
    
    rules = []

    # Map conditions to medical dietary guidelines
    condition_rules = {
        "diabetes": "Low glycemic index, strictly no added refined sugars, high dietary fiber.",
        "high_blood_pressure": "Low sodium (<500mg), emphasize potassium-rich ingredients, minimal added salt.",
        "high_cholesterol": "Low saturated fat, zero trans fat, focus on healthy unsaturated fats.",
        "heart_disease": "Heart-healthy, low sodium, rich in antioxidants and healthy fats."
    }

    for condition in health_conditions:
        norm = condition.lower().strip().replace(" ", "_")
        if norm in condition_rules:
            rules.append(condition_rules[norm])

    if allergies:
        rules.append(f"STRICT ALLERGY BAN: Completely exclude {', '.join(allergies)}.")

    if dietary_preference and dietary_preference.lower() != "omnivore":
        rules.append(f"Diet Pattern: Strictly follow a {dietary_preference} diet.")

    return rules