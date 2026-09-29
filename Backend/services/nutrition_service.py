import json
from google.genai import types
from services.gemini_service import safe_gemini_call

def estimate_nutrition_from_text(description: str) -> dict:
    """Estimates calories and macronutrients for food descriptions with safe fallback."""
    system_prompt = """
    You are an expert nutritional estimation engine.
    Given a meal description:
    1. Estimate realistic total calories, protein, carbs, fat, sugar, and sodium.
    2. Output strictly valid JSON matching this schema:
       {
         "meal_name": "Standardized title",
         "calories": 0.0,
         "protein_g": 0.0,
         "carbs_g": 0.0,
         "fat_g": 0.0,
         "sugar_g": 0.0,
         "sodium_mg": 0.0
       }
    """
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        temperature=0.1
    )
    
    try:
        response = safe_gemini_call(
            contents=f"Meal description: {description}", 
            config=config
        )
        
        text = response.text.strip()
        if text.startswith("```"):
            text = text.strip("`").removeprefix("json").strip()
            
        data = json.loads(text)
        return {
            "meal_name": str(data.get("meal_name", description)).title(),
            "calories": float(data.get("calories", 380.0)),
            "protein_g": float(data.get("protein_g", 12.0)),
            "carbs_g": float(data.get("carbs_g", 50.0)),
            "fat_g": float(data.get("fat_g", 10.0)),
            "sugar_g": float(data.get("sugar_g", 2.0)),
            "sodium_mg": float(data.get("sodium_mg", 350.0)),
        }
    except Exception as e:
        print(f"⚠️ Nutrition estimation fallback used due to: {e}")
        # Deterministic fallback so user logging never 500 crashes
        return {
            "meal_name": description.title(),
            "calories": 380.0,
            "protein_g": 12.0,
            "carbs_g": 52.0,
            "fat_g": 10.0,
            "sugar_g": 2.5,
            "sodium_mg": 380.0,
        }

def generate_healthy_swaps(food_item: str, health_goal: str = "weight_loss") -> dict:
    system_prompt = """
    You are a culinary dietitian.
    Given an ingredient or dish, propose 2-3 healthier nutritional alternatives.
    Output strictly valid JSON matching this schema:
    {
      "original_item": "string",
      "swaps": [
        {
          "alternative_name": "string",
          "why_it_is_better": "string",
          "calorie_difference": "string"
        }
      ]
    }
    """
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        temperature=0.2
    )
    try:
        response = safe_gemini_call(
            contents=f"Original item: {food_item}\nUser Goal: {health_goal}", 
            config=config
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.strip("`").removeprefix("json").strip()
        return json.loads(text)
    except Exception as e:
        print(f"⚠️ Swaps fallback triggered: {e}")
        return {
            "original_item": food_item,
            "swaps": [
                {
                    "alternative_name": f"Low-Calorie {food_item}",
                    "why_it_is_better": "Lower glycemic impact, higher fiber, and reduced sodium.",
                    "calorie_difference": "-150 kcal"
                }
            ]
        }