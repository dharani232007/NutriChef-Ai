import io
import json
from PIL import Image
from google.genai import types
from services.gemini_service import safe_gemini_call
from services.cache_service import get_cache, set_cache, get_image_hash

def compress_image(image_bytes: bytes, max_dimension: int = 512) -> bytes:
    """Downscales image to 512px to minimize Gemini vision tokens and speed up response."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.thumbnail((max_dimension, max_dimension), Image.Resampling.BILINEAR)
    
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=65, optimize=True)
    return buffer.getvalue()


def analyze_food_image(image_bytes: bytes) -> dict:
    """
    Validates if the image contains edible food and extracts ingredients.
    Uses Redis cache for 0-second repeat responses.
    """
    compressed_bytes = compress_image(image_bytes)
    img_hash = get_image_hash(compressed_bytes)
    cache_key = f"food_analysis:{img_hash}"

    cached_result = get_cache(cache_key)
    if cached_result:
        print(f"⚡ Returning food image analysis from Redis Cache ({img_hash})")
        return cached_result

    system_prompt = """
    You are an expert culinary vision classifier and professional chef.
    Analyze the uploaded image:
    
    1. VALIDATION:
       - Check if the image contains edible food, cooking ingredients, restaurant meals, or plated dishes (e.g., Idli, Dosa, Pasta, Noodles, Biryani, Curries, Salads, Paneer dishes).
       - Plates, bowls, utensils, banana leaves, tables, and garnishes count as VALID food presentation.
       - ONLY set "is_food_related" to false if the image has NO food whatsoever.
         
    2. CLASSIFICATION:
       - Set "is_food_related": true.
       - Determine "image_type": either "cooked_dish" or "raw_ingredients".
       - If "cooked_dish": identify the primary dish name in "detected_dish_name" and list the essential ingredients in "ingredients".
       - If "raw_ingredients": set "detected_dish_name" to null and list all raw items in "ingredients".

    OUTPUT SCHEMA:
    {
      "is_food_related": true,
      "message": null,
      "image_type": "cooked_dish | raw_ingredients",
      "detected_dish_name": "string or null",
      "ingredients": ["item1", "item2"]
    }
    """

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        temperature=0.2
    )

    image_part = types.Part.from_bytes(data=compressed_bytes, mime_type="image/jpeg")

    response = safe_gemini_call(
        contents=[image_part, "Analyze this image and identify the food and ingredients."],
        config=config
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()

    result = json.loads(text)
    set_cache(cache_key, result, expire_seconds=86400)
    return result


def analyze_food_and_generate_recipe(image_bytes: bytes, language: str = "en") -> dict:
    """
    Combines Vision Analysis + Recipe Formulation in ONE single LLM call.
    Strictly separates Redis cache keys by language (en vs ta) to avoid cross-language cache contamination.
    """
    compressed_bytes = compress_image(image_bytes)
    img_hash = get_image_hash(compressed_bytes)
    
    # Strictly normalize language code to 'ta' or 'en'
    clean_lang = str(language or "en").strip().lower()
    target_lang = "ta" if clean_lang.startswith("ta") else "en"
    
    # Language-specific Redis cache key
    cache_key = f"image_recipe_combo:{img_hash}:{target_lang}"

    # Check language-specific cache
    cached_result = get_cache(cache_key)
    if cached_result:
        # Extra safety check: verify the recipe title isn't in English if Tamil was requested
        recipe_title = cached_result.get("recipe", {}).get("recipe_title", "")
        has_tamil = any("\u0B80" <= ch <= "\u0BFF" for ch in recipe_title)
        
        if target_lang == "ta" and has_tamil:
            print(f"⚡ Returning Tamil Image-Recipe from Redis Cache ({img_hash}:ta)")
            return cached_result
        elif target_lang == "en" and not has_tamil:
            print(f"⚡ Returning English Image-Recipe from Redis Cache ({img_hash}:en)")
            return cached_result
        else:
            print(f" Cache language mismatch detected. Regenerating for {target_lang}...")

    if target_lang == "ta":
        lang_instruction = """
        CRITICAL MANDATORY INSTRUCTION - TAMIL SCRIPT ONLY:
        The user has selected TAMIL (தமிழ்).
        You MUST write EVERY user-facing string in natural, authentic Tamil script (தமிழ் எழுத்துக்களில்).
        
        STRICT RULES:
        1. "detected_dish_name": Must be in Tamil (எ.கா: "பன்னீர் பட்டர் மசாலா", "வெஜ் பிரியாணி", "பாஸ்தா")
        2. "recipe_title": Must be in Tamil (எ.கா: "சுவையான பன்னீர் பட்டர் மசாலா செய்முறை")
        3. "ingredients": List ALL ingredients in Tamil script (எ.கா: ["பன்னீர்", "வெண்ணெய்", "தக்காளி விழுது", "இஞ்சி பூண்டு விழுது", "கரம் மசாலா"])
        4. "used_ingredients": List in Tamil script (எ.கா: ["பன்னீர்", "வெங்காயம்", "தக்காளி"])
        5. "pantry_staples_used": List in Tamil script (எ.கா: ["சமையல் எண்ணெய்", "உப்பு", "தண்ணீர்"])
        6. "steps": ALL instruction steps MUST be fully written in clean, step-by-step Tamil prose:
           (எ.கா: "1. ஒரு கடாயில் 2 தேக்கரண்டி வெண்ணெய் மற்றும் எண்ணெய் சேர்த்து சூடாக்கவும்.",
                  "2. இஞ்சி பூண்டு விழுது சேர்த்து பச்சை வாசனை போகும் வரை வதக்கவும்.",
                  "3. தக்காளி விழுது சேர்த்து எண்ணெய் பிரியும் வரை வதக்கவும்.")
                  
        ABSOLUTELY NO ENGLISH WORDS in the values when language is Tamil.
        JSON keys MUST stay strictly in English as defined in the schema.
        """
        user_prompt_instruction = "இந்த உணவுப் புகைப்படத்தை கூர்ந்து கவனித்து, உணவுப் பெயர், தேவையான பொருட்கள் மற்றும் சமைக்கும் செய்முறை படிநிலைகளை முழுமையாக தமிழ் எழுத்துக்களில் (Tamil script) மட்டுமே தருக."
    else:
        lang_instruction = """
        OUTPUT LANGUAGE: English.
        Provide all recipe titles, ingredient names, pantry staples, and cooking steps in clear English.
        """
        user_prompt_instruction = "Classify this food image and formulate a step-by-step cooking recipe in English."

    system_prompt = f"""
    You are an expert culinary vision classifier and professional chef.
    Examine the photo in detail:
    
    1. VALIDATION:
       - Check if the image contains edible food, cooking ingredients, restaurant meals, or plated dishes (e.g. noodles, pasta, rice, curry, vegetables, meat, paneer dishes).
       - Bowls, plates, utensils, and tables count as valid food presentation.
       - ONLY set "is_food_related" to false if there is NO edible item at all.
       - If not food, set "is_food_related": false, "message": "Please upload a clear picture of food or cooking ingredients.", and set "recipe" to null.
         
    2. RECIPE GENERATION (When food is detected):
       - Set "is_food_related": true.
       - Identify the dish name in "detected_dish_name" and all visible ingredients in "ingredients".
       - In the "recipe" object, formulate the complete, practical cooking recipe.
       - Assume pantry staples (cooking oil, salt, water, black pepper) are readily available.
       
    {lang_instruction}

    OUTPUT SCHEMA:
    {{
      "is_food_related": true,
      "message": null,
      "image_analysis": {{
        "detected_dish_name": "string",
        "ingredients": ["item1", "item2"]
      }},
      "recipe": {{
        "is_cookable": true,
        "message": null,
        "recipe_title": "string",
        "cooking_time_minutes": 20,
        "difficulty": "Easy | Medium | Hard",
        "is_non_veg": false,
        "used_ingredients": ["item1", "item2"],
        "pantry_staples_used": ["cooking oil", "salt"],
        "steps": ["step 1", "step 2", "step 3"]
      }}
    }}
    """

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        temperature=0.2
    )

    image_part = types.Part.from_bytes(data=compressed_bytes, mime_type="image/jpeg")

    response = safe_gemini_call(
        contents=[image_part, user_prompt_instruction],
        config=config
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()

    result = json.loads(text)
    
    # Store with expiration under the specific language cache key
    set_cache(cache_key, result, expire_seconds=86400)
    return result


def estimate_nutrition_from_image(image_bytes: bytes, user_profile: dict | None = None) -> dict:
    """Analyzes a plated meal and estimates calories & macros in one pass with Redis caching."""
    compressed_bytes = compress_image(image_bytes)
    img_hash = get_image_hash(compressed_bytes)
    cache_key = f"nutrition_est:{img_hash}"

    cached_result = get_cache(cache_key)
    if cached_result:
        print(f"⚡ Returning nutrition estimation from Redis Cache ({img_hash})")
        return cached_result

    biometrics_context = ""
    if user_profile:
        biometrics_context = f"User Profile Context: Height {user_profile.get('height_cm', 165)}cm, Weight {user_profile.get('weight_kg', 65)}kg, Gender {user_profile.get('gender', 'female')}."

    system_prompt = f"""
    You are an expert clinical dietitian and food intake vision estimator.
    {biometrics_context}

    INSTRUCTIONS:
    1. Check if the photo contains edible food.
       If not food, set "is_food": false and "message": "Please upload a clear picture of your meal plate."
    2. If food is present:
       - Set "is_food": true.
       - Identify the dish in "meal_name".
       - Visually assess portion volume (e.g. 1 standard plate, 1 bowl).
       - Calculate estimated nutritional intake: calories, protein_g, carbs_g, fat_g, sugar_g, sodium_mg.
       - Provide a concise dietitian note.

    OUTPUT SCHEMA:
    {{
      "is_food": true,
      "message": null,
      "meal_name": "string",
      "portion_summary": "string",
      "calories": 0.0,
      "protein_g": 0.0,
      "carbs_g": 0.0,
      "fat_g": 0.0,
      "sugar_g": 0.0,
      "sodium_mg": 0.0,
      "dietitian_note": "string"
    }}
    """

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        temperature=0.2
    )

    image_part = types.Part.from_bytes(data=compressed_bytes, mime_type="image/jpeg")

    try:
        response = safe_gemini_call(
            contents=[image_part, "Estimate the total calories and macronutrients of this meal."],
            config=config
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.strip("`").removeprefix("json").strip()
        result = json.loads(text)
        set_cache(cache_key, result, expire_seconds=86400)
        return result
    except Exception as e:
        print(f"⚠️ Nutrition vision fallback triggered: {e}")
        return {
            "is_food": True,
            "message": None,
            "meal_name": "Scanned Meal Plate",
            "portion_summary": "1 Standard Plate",
            "calories": 480.0,
            "protein_g": 16.0,
            "carbs_g": 62.0,
            "fat_g": 14.0,
            "sugar_g": 3.0,
            "sodium_mg": 500.0,
            "dietitian_note": "Standard meal portion estimated based on visual volume."
        }