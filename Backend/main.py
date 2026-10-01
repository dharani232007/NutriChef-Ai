import os
import json
import traceback
import re
from typing import Optional, Literal
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from services.email_service import generate_otp, send_verification_email
from services.health_service import calculate_meal_targets, compile_health_constraints
from services.image_service import (
    analyze_food_image, 
    analyze_food_and_generate_recipe,
    estimate_nutrition_from_image
)
from services.gemini_service import (
    generate_simple_recipe_from_llm,
    generate_personalized_recipe_from_llm,
    safe_gemini_stream,
    FALLBACK_MODELS,
    types,
    RecipeOutputModel
)
from services.sanitizer import sanitize_ingredients
from services.db_service import (
    get_connection,
    save_or_update_user_profile,
    insert_meal_log,
    get_aggregated_diet
)
from services.nutrition_service import (
    estimate_nutrition_from_text,
    generate_healthy_swaps
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

app = FastAPI(
    title="NutriChef - AI Recipe & Health Assistant",
    description="Constrained generation & health tracking backend with real-time streaming"
)

# -------------------------------------------------------------
# CORS Middleware
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_stream_json(raw_text: str) -> dict:
    """Safely extracts and parses JSON even if it contains control characters or markdown."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    try:
        return json.loads(text, strict=False)
    except Exception:
        # Fallback regex if leading/trailing garbage was received
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            return json.loads(match.group(1), strict=False)
        raise

# -------------------------------------------------------------
# Request Schemas with Input Validation
# -------------------------------------------------------------
class SimpleRecipeRequest(BaseModel):
    ingredients: list[str] = Field(..., min_items=1, description="List of available ingredients")
    dish_name: Optional[str] = None
    language: Optional[str] = "en"

    @field_validator("ingredients")
    @classmethod
    def validate_and_sanitize(cls, value: list[str]) -> list[str]:
        return sanitize_ingredients(value)


class UserHealthProfile(BaseModel):
    user_id: str = Field(..., description="Unique user identifier for database tracking")
    age: int = Field(..., ge=5, le=120)
    gender: Literal["male", "female", "other"]
    height_cm: float = Field(..., ge=50, le=250)
    weight_kg: float = Field(..., ge=15, le=300)
    activity_level: Literal["sedentary", "moderate", "very_active"]
    health_goal: Literal["weight_loss", "muscle_building", "maintain_weight"]
    health_conditions: list[str] = []
    allergies: list[str] = []
    dietary_preference: Optional[str] = None
    cooking_skill: Optional[str] = "Beginner"
    max_time_minutes: Optional[int] = 30


class PersonalizedRecipeRequest(BaseModel):
    ingredients: list[str] = Field(..., min_items=1, description="List of available ingredients")
    profile: UserHealthProfile
    dish_name: Optional[str] = None
    language: Optional[str] = "en"

    @field_validator("ingredients")
    @classmethod
    def validate_and_sanitize(cls, value: list[str]) -> list[str]:
        return sanitize_ingredients(value)


class ManualLogRequest(BaseModel):
    user_id: str
    meal_name: str
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    sugar_g: float = 0.0
    sodium_mg: float = 0.0


class QuickTextLogRequest(BaseModel):
    user_id: str
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    meal_description: str = Field(..., min_length=2, description="Outside food or restaurant dish description")


class SwapRequest(BaseModel):
    food_item: str = Field(..., min_length=2, description="Food item to find alternatives for (e.g., white rice)")
    health_goal: Optional[str] = "weight_loss"
    language: Optional[str] = "en"


class ProfileUpdateRequest(BaseModel):
    user_id: str
    age: int
    gender: Literal["male", "female", "other"]
    height_cm: float
    weight_kg: float
    activity_level: Literal["sedentary", "moderate", "very_active"]
    health_goal: Literal["weight_loss", "muscle_building", "maintain_weight"]
    health_conditions: list[str] = []
    allergies: list[str] = []


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class VerifyOtpRequest(BaseModel):
    email: str
    otp: str


class GoogleAuthRequest(BaseModel):
    credential: str


def handle_api_exception(e: Exception):
    error_str = str(e)
    if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily generation quota reached or server is busy. Please try again later."
        )
    if "SSL" in error_str or "EOF" in error_str or "ConnectionReset" in error_str:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Network connection to the AI engine was temporarily interrupted. Please click generate again."
        )
    traceback.print_exc()
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=error_str
    )


# -------------------------------------------------------------
# User Authentication & Verification Endpoints
# -------------------------------------------------------------
@app.post("/api/auth/register")
def register_user(req: RegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()
    clean_user = req.username.strip().lower()
    clean_email = req.email.strip().lower()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT,
        is_verified INTEGER DEFAULT 0,
        otp_code TEXT,
        otp_expiry TIMESTAMP,
        auth_provider TEXT DEFAULT 'local',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()

    cursor.execute("SELECT user_id, is_verified FROM users WHERE email = ? OR user_id = ?", (clean_email, clean_user))
    existing = cursor.fetchone()
    
    otp = generate_otp()
    expiry = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

    if existing:
        if existing["is_verified"] == 1:
            conn.close()
            raise HTTPException(status_code=400, detail="Account with this username or email already exists.")
        else:
            cursor.execute("""
                UPDATE users SET otp_code = ?, otp_expiry = ?, password_hash = ?
                WHERE email = ?
            """, (otp, expiry, req.password, clean_email))
            conn.commit()
    else:
        cursor.execute("""
            INSERT INTO users (user_id, email, password_hash, is_verified, otp_code, otp_expiry, auth_provider)
            VALUES (?, ?, ?, 0, ?, ?, 'local')
        """, (clean_user, clean_email, req.password, otp, expiry))
        conn.commit()

    conn.close()

    try:
        send_verification_email(clean_email, otp)
    except Exception as e:
        print(f"⚠️ Email send error: {e}")
        print(f"🔑 Local Verification Code for {clean_email}: {otp}")

    return {"success": True, "message": "Verification code sent to your email."}


@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    conn = get_connection()
    cursor = conn.cursor()
    clean_email = req.email.strip().lower()

    cursor.execute("SELECT user_id, otp_code, otp_expiry FROM users WHERE email = ?", (clean_email,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User account not found.")

    if not user["otp_code"] or user["otp_code"] != req.otp.strip():
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    if user["otp_expiry"] and datetime.utcnow() > datetime.fromisoformat(user["otp_expiry"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    cursor.execute("UPDATE users SET is_verified = 1, otp_code = NULL, otp_expiry = NULL WHERE email = ?", (clean_email,))
    conn.commit()
    conn.close()

    return {"success": True, "username": user["user_id"], "message": "Email verified successfully!"}


@app.post("/api/auth/google")
def google_auth(req: GoogleAuthRequest):
    try:
        id_info = id_token.verify_oauth2_token(req.credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = id_info.get("email").strip().lower()
        name = id_info.get("name", email.split("@")[0]).strip().lower().replace(" ", "_")

        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            is_verified INTEGER DEFAULT 0,
            otp_code TEXT,
            otp_expiry TIMESTAMP,
            auth_provider TEXT DEFAULT 'local',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.commit()

        cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
        existing = cursor.fetchone()

        if not existing:
            cursor.execute("""
                INSERT INTO users (user_id, email, is_verified, auth_provider)
                VALUES (?, ?, 1, 'google')
                ON CONFLICT(user_id) DO UPDATE SET is_verified = 1, auth_provider = 'google'
            """, (name, email))
            conn.commit()
            username = name
        else:
            username = existing["user_id"]

        conn.close()
        return {"success": True, "username": username, "email": email}

    except Exception as e:
        print(f"⚠️ Google OAuth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google authentication token.")


@app.get("/")
def health_check():
    return {"status": "ok", "message": "NutriChef Engine is running"}


# -------------------------------------------------------------
# User Profile Management Endpoints
# -------------------------------------------------------------
@app.post("/api/user-profile/save")
def save_profile(data: ProfileUpdateRequest):
    clean_id = data.user_id.strip().lower()
    targets = calculate_meal_targets(
        age=data.age,
        gender=data.gender,
        height_cm=data.height_cm,
        weight_kg=data.weight_kg,
        activity_level=data.activity_level,
        health_goal=data.health_goal
    )
    
    save_or_update_user_profile(
        user_id=clean_id,
        profile_details=data.model_dump(),
        targets=targets
    )
    return {"success": True, "calculated_targets": targets, "profile": data.model_dump()}


@app.get("/api/user-profile/{user_id}")
def get_user_profile(user_id: str):
    clean_id = user_id.strip().lower()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_profiles WHERE LOWER(TRIM(user_id)) = ?", (clean_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {"exists": False}

    profile_dict = dict(row)
    raw_conds = profile_dict.get("health_conditions")
    profile_dict["health_conditions"] = [c.strip() for c in raw_conds.split(",") if c.strip()] if raw_conds else []

    raw_allgs = profile_dict.get("allergies")
    profile_dict["allergies"] = [a.strip() for a in raw_allgs.split(",") if a.strip()] if raw_allgs else []

    targets = calculate_meal_targets(
        age=int(profile_dict.get("age") or 25),
        gender=profile_dict.get("gender") or "female",
        height_cm=float(profile_dict.get("height_cm") or 165.0),
        weight_kg=float(profile_dict.get("weight_kg") or 60.0),
        activity_level=profile_dict.get("activity_level") or "moderate",
        health_goal=profile_dict.get("health_goal") or "maintain_weight"
    )

    return {
        "exists": True, 
        "profile": profile_dict,
        "calculated_targets": targets
    }


# -------------------------------------------------------------
# Feature 2: Text-to-Recipe (Standard + Real-time Streaming)
# -------------------------------------------------------------
@app.post("/api/generate-recipe")
def generate_recipe_endpoint(req: SimpleRecipeRequest):
    try:
        recipe_data = generate_simple_recipe_from_llm(
            ingredients=req.ingredients,
            dish_name=req.dish_name,
            language=req.language or "en"
        )
        return {"success": True, "data": recipe_data}
    except Exception as e:
        return {"success": False, "message": str(e)}


@app.post("/api/generate-recipe/stream")
def generate_recipe_stream_endpoint(req: SimpleRecipeRequest):
    """Streams recipe tokens in real-time with control character sanitization."""
    def event_generator():
        is_tamil = str(req.language or "en").strip().lower().startswith("ta")

        if is_tamil:
            lang_instruction = """
            STRICT LANGUAGE REQUIREMENT: Output language MUST be TAMIL (தமிழ்).
            Translate all ingredients, dish titles, pantry staples, and instructions into fluent, natural Tamil script.
            Do NOT write any step or ingredient in English. Keep all JSON keys in English.
            """
            sample_step = "1. ஒரு பாத்திரத்தில் எண்ணெய் சேர்த்து சூடாக்கவும்."
        else:
            lang_instruction = "OUTPUT LANGUAGE: English. Write all values strictly in clear English."
            sample_step = "1. Heat oil in a pan over medium flame."

        system_prompt = f"""
        You are an expert culinary chef.
        RULES:
        - If items are edible, set "is_cookable": true.
        - Assume basic pantry staples are available: salt, black pepper, cooking oil, water, garlic, onions.
        - Format the response as JSON with single-line strings.
        {lang_instruction}

        OUTPUT SCHEMA:
        {{
          "is_cookable": true,
          "message": null,
          "recipe_title": "string",
          "cooking_time_minutes": 20,
          "difficulty": "Easy | Medium | Hard",
          "is_non_veg": false,
          "used_ingredients": ["item1"],
          "pantry_staples_used": ["salt"],
          "steps": ["{sample_step}"]
        }}
        """

        prompt_lines = []
        if req.dish_name:
            prompt_lines.append(f"Target Dish: {req.dish_name}")
        prompt_lines.append("<user_ingredients>")
        prompt_lines.append(", ".join(req.ingredients))
        prompt_lines.append("</user_ingredients>")
        user_prompt = "\n".join(prompt_lines)

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.2
        )

        full_text = ""
        try:
            for chunk in safe_gemini_stream(contents=user_prompt, config=config):
                full_text += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"

            parsed = clean_stream_json(full_text)
            yield f"data: {json.dumps({'type': 'complete', 'data': parsed})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# -------------------------------------------------------------
# Feature 3: Health-Condition-Based Recipes (Standard + Stream)
# -------------------------------------------------------------
@app.post("/api/generate-personalized-recipe")
def generate_personalized_recipe(request: PersonalizedRecipeRequest):
    try:
        clean_id = request.profile.user_id.strip().lower()
        
        meal_targets = calculate_meal_targets(
            age=request.profile.age,
            gender=request.profile.gender,
            height_cm=request.profile.height_cm,
            weight_kg=request.profile.weight_kg,
            activity_level=request.profile.activity_level,
            health_goal=request.profile.health_goal
        )

        save_or_update_user_profile(
            user_id=clean_id,
            profile_details=request.profile.model_dump(),
            targets=meal_targets
        )

        health_rules = compile_health_constraints(
            health_conditions=request.profile.health_conditions,
            allergies=request.profile.allergies,
            dietary_preference=request.profile.dietary_preference
        )

        recipe = generate_personalized_recipe_from_llm(
            ingredients=request.ingredients,
            meal_targets=meal_targets,
            health_rules=health_rules,
            dish_name=request.dish_name,
            cooking_skill=request.profile.cooking_skill,
            max_time_minutes=request.profile.max_time_minutes,
            language=request.language or "en"
        )

        if not recipe.get("is_cookable", True):
            return {
                "success": False,
                "error_code": "INCOMPLETE_OR_INVALID_INGREDIENTS",
                "message": recipe.get("message") or "Cannot cook with the provided items under health constraints."
            }

        return {
            "success": True,
            "calculated_targets": meal_targets,
            "data": recipe
        }
    except HTTPException:
        raise
    except Exception as e:
        handle_api_exception(e)


@app.post("/api/generate-personalized-recipe/stream")
def generate_personalized_recipe_stream(request: PersonalizedRecipeRequest):
    """Streams personalized recipe output token by token with clean JSON parsing."""
    def event_generator():
        clean_id = request.profile.user_id.strip().lower()
        
        meal_targets = calculate_meal_targets(
            age=request.profile.age,
            gender=request.profile.gender,
            height_cm=request.profile.height_cm,
            weight_kg=request.profile.weight_kg,
            activity_level=request.profile.activity_level,
            health_goal=request.profile.health_goal
        )

        save_or_update_user_profile(
            user_id=clean_id,
            profile_details=request.profile.model_dump(),
            targets=meal_targets
        )

        health_rules = compile_health_constraints(
            health_conditions=request.profile.health_conditions,
            allergies=request.profile.allergies,
            dietary_preference=request.profile.dietary_preference
        )

        is_tamil = str(request.language or "en").strip().lower().startswith("ta")

        if is_tamil:
            lang_instruction = """
            CRITICAL MANDATORY REQUIREMENT:
            All output fields MUST BE written in TAMIL SCRIPT (தமிழ் எழுத்துக்களில்).
            - "recipe_title": தமிழில் தலைப்பு
            - "health_alignment_note": தமிழில் மருத்துவ நன்மை விளக்கம்
            - "used_ingredients": பொருட்கள் தமிழில் (எ.கா: ["கீரை", "பருப்பு", "பூண்டு"])
            - "pantry_staples_used": தமிழில் (எ.கா: ["நல்லெண்ணெய்", "சீரகம்"])
            - "steps": ஒவ்வொரு சமையல் படியும் முழுமையாக எளிய தமிழில் எழுதப்பட வேண்டும்.
            DO NOT write recipe instructions or ingredients in English. Keep all JSON keys in English.
            """
        else:
            lang_instruction = "OUTPUT LANGUAGE: Write all recipe text values strictly in English."

        system_prompt = f"""
        You are a clinical dietitian and chef. Formulate a personalized recipe adhering to the user's constraints.
        {lang_instruction}

        OUTPUT SCHEMA:
        {{
          "is_cookable": true,
          "message": null,
          "recipe_title": "string",
          "cooking_time_minutes": 25,
          "difficulty": "Easy",
          "is_non_veg": false,
          "health_alignment_note": "string",
          "estimated_nutrition": {{"calories": 450, "protein_g": 20, "carbs_g": 50, "fat_g": 12}},
          "used_ingredients": ["item1"],
          "pantry_staples_used": ["olive oil"],
          "steps": ["step 1", "step 2"]
        }}
        """

        prompt_lines = [
            f"Target Dish: {request.dish_name or 'Healthy Meal'}",
            f"Ingredients: {', '.join(request.ingredients)}",
            f"Nutrition Target: {meal_targets.get('meal_calories', 500)} kcal",
            "Health Rules:"
        ]
        for rule in health_rules:
            prompt_lines.append(f"- {rule}")

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.2
        )

        full_text = ""
        try:
            for chunk in safe_gemini_stream(contents="\n".join(prompt_lines), config=config):
                full_text += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"

            parsed = clean_stream_json(full_text)
            yield f"data: {json.dumps({'type': 'complete', 'data': parsed, 'calculated_targets': meal_targets})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# -------------------------------------------------------------
# Feature 1: Fast Image-to-Recipe
# -------------------------------------------------------------
@app.post("/api/image-to-recipe")
async def image_to_recipe(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en")
):
    try:
        contents = await file.read()
        selected_lang = str(language or "en").strip().lower()
        combo_result = analyze_food_and_generate_recipe(contents, language=selected_lang)

        if not combo_result.get("is_food_related"):
            return {
                "success": False,
                "error_code": "NON_FOOD_IMAGE",
                "message": combo_result.get("message") or "Please upload a clear food-related image or cooking ingredients."
            }

        recipe = combo_result.get("recipe")
        if recipe and not recipe.get("is_cookable", True):
            return {
                "success": False,
                "error_code": "INCOMPLETE_OR_INVALID_INGREDIENTS",
                "message": recipe.get("message") or "Cannot cook with the provided items."
            }

        return {
            "success": True,
            "image_analysis": combo_result.get("image_analysis"),
            "recipe": recipe
        }
    except HTTPException:
        raise
    except Exception as e:
        handle_api_exception(e)


# -------------------------------------------------------------
# Feature 4: Diet Tracking & Logging Endpoints
# -------------------------------------------------------------
@app.post("/api/diet/log-meal")
def log_manual_meal(request: ManualLogRequest):
    clean_id = request.user_id.strip().lower()
    insert_meal_log(
        user_id=clean_id,
        meal_name=request.meal_name,
        meal_type=request.meal_type,
        nutrition=request.model_dump()
    )
    return {"success": True, "message": f"Successfully logged '{request.meal_name}'."}


@app.post("/api/diet/quick-log")
def log_ai_text_meal(request: QuickTextLogRequest):
    try:
        clean_id = request.user_id.strip().lower()
        estimated = estimate_nutrition_from_text(request.meal_description)
        insert_meal_log(
            user_id=clean_id,
            meal_name=estimated["meal_name"],
            meal_type=request.meal_type,
            nutrition=estimated
        )
        return {
            "success": True,
            "logged_item": estimated,
            "message": f"Estimated and logged '{estimated['meal_name']}'."
        }
    except HTTPException:
        raise
    except Exception as e:
        handle_api_exception(e)


@app.post("/api/diet/log-meal-image")
async def log_meal_from_image(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    meal_type: str = Form(...),
    height_cm: Optional[float] = Form(None),
    weight_kg: Optional[float] = Form(None),
    gender: Optional[str] = Form(None)
):
    try:
        contents = await file.read()
        profile_data = {
            "height_cm": height_cm,
            "weight_kg": weight_kg,
            "gender": gender 
        }

        nutrition_data = estimate_nutrition_from_image(contents, user_profile=profile_data)

        if not nutrition_data.get("is_food", True):
            return {
                "success": False,
                "error_code": "NON_FOOD_IMAGE",
                "message": nutrition_data.get("message", "Please upload a clear picture of your meal plate.")
            }

        clean_user_id = user_id.strip().lower()
        portion_label = nutrition_data.get("portion_summary", "1 serving")
        full_meal_title = f"{nutrition_data.get('meal_name', 'Meal Plate')} ({portion_label})"

        insert_meal_log(
            user_id=clean_user_id,
            meal_name=full_meal_title,
            meal_type=meal_type.lower(),
            nutrition=nutrition_data
        )

        return {
            "success": True,
            "message": f"Successfully logged {full_meal_title} to {meal_type}.",
            "data": nutrition_data
        }
    except Exception as e:
        handle_api_exception(e)


@app.get("/api/diet/progress/{user_id}")
def view_diet_progress(
    user_id: str,
    timeframe: Literal["today", "week", "month", "year"] = "today"
):
    clean_id = user_id.strip().lower()
    return get_aggregated_diet(user_id=clean_id, timeframe=timeframe)


# -------------------------------------------------------------
# Feature 5: Healthy Swap Recommendations (Strict Tamil Enforcement)
# -------------------------------------------------------------
@app.post("/api/recommendations/swap")
def get_healthy_swaps(request: SwapRequest):
    try:
        swaps = generate_healthy_swaps(request.food_item, request.health_goal)
        return {"success": True, "data": swaps}
    except HTTPException:
        raise
    except Exception as e:
        handle_api_exception(e)


@app.post("/api/recommendations/swap/stream")
def get_healthy_swaps_stream(request: SwapRequest):
    """Streams healthy food swap suggestions in real-time with strict Tamil enforcement."""
    def event_generator():
        is_tamil = str(request.language or "en").strip().lower().startswith("ta")

        if is_tamil:
            system_prompt = """
            நீங்கள் ஒரு தலைமை மருத்துவ ஊட்டச்சத்து நிபுணர் (Clinical Dietitian).
            பயனர் கேட்கும் உணவுகளுக்கு 3 ஆரோக்கியமான மாற்று உணவுகளை (Healthy Nutritional Swaps) பரிந்துரைக்க வேண்டும்.

            கட்டாய விதி (STRICT TAMIL SCRIPT REQUIREMENT):
            1. அனைத்து பதில்களும் தூய, எளிய தமிழ் எழுத்துக்களில் (Tamil script) மட்டுமே இருக்க வேண்டும்.
            2. ஆங்கில எழுத்துக்களோ அல்லது ஆங்கில வார்த்தைகளோ இருக்கக்கூடாது.
            3. "original_item": பயனர் உள்ளிட்ட உணவின் தமிழ்ப் பெயர்
            4. "alternative_name": ஆரோக்கியமான மாற்று உணவின் தமிழ்ப் பெயர்
            5. "calorie_difference": கலோரி சேமிப்பு தமிழில்
            6. "why_it_is_better": ஏன் இது உடலுக்கு சிறந்தது என்பதற்கான மருத்துவ விளக்கம் தமிழில்
            7. JSON-இன் Keys மட்டுமே ஆங்கிலத்தில் இருக்க வேண்டும்.

            OUTPUT SCHEMA:
            {
              "original_item": "வெள்ளை சாதம், உருளைக்கிழங்கு, சாம்பார்",
              "swaps": [
                {
                  "alternative_name": "துருவிய காலிஃபிளவர் சாதம்",
                  "calorie_difference": "-160 கலோரி",
                  "why_it_is_better": "குறைந்த கார்போஹைட்ரேட் மற்றும் அதிக நார்ச்சத்து கொண்டது. உடல் எடை குறைய உதவும்."
                }
              ]
            }
            """
            user_prompt = f"உணவுப் பொருள்: {request.food_item} | ஆரோக்கிய இலக்கு: {request.health_goal}. இதற்கு 3 சிறந்த மாற்று உணவுகளை முழுமையாக தமிழில் பரிந்துரைக்கவும்."
        else:
            system_prompt = """
            You are an expert clinical nutritionist. Provide 3 healthy, nutrient-dense culinary swaps.
            OUTPUT SCHEMA:
            {
              "original_item": "string",
              "swaps": [
                {
                  "alternative_name": "string",
                  "calorie_difference": "e.g. -120 kcal",
                  "why_it_is_better": "string"
                }
              ]
            }
            """
            user_prompt = f"Food item: {request.food_item} | Health Goal: {request.health_goal}"

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.2
        )

        full_text = ""
        try:
            for chunk in safe_gemini_stream(contents=user_prompt, config=config):
                full_text += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"

            parsed = clean_stream_json(full_text)
            yield f"data: {json.dumps({'type': 'complete', 'data': parsed})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")