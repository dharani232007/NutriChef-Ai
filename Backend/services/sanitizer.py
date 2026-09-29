import re

# Blocklist of common prompt injection & command keywords
INJECTION_KEYWORDS = {
    "ignore", "system", "instruction", "prompt", "bypass", "assistant",
    "developer", "jailbreak", "override", "dan", "forget", "reveal"
}

def sanitize_ingredients(raw_ingredients: list[str]) -> list[str]:
    """
    Validates and cleans user ingredients:
    1. Rejects full conversational sentences (more than 3 words per item).
    2. Blocks jailbreak/injection phrases.
    3. Restricts length and allows only letters, numbers, hyphens, and spaces.
    """
    cleaned = []
    
    for item in raw_ingredients:
        # 1. Clean whitespace
        text = item.strip()
        
        # 2. Prevent empty entries
        if not text:
            raise ValueError("Ingredient items cannot be empty.")
            
        # 3. Restrict item length (e.g., 'bell pepper' vs entire paragraph)
        if len(text) > 35:
            raise ValueError(f"'{text[:20]}...' is too long. Provide standard food names, not sentences.")
            
        # 4. Detect conversational talk (Food names are rarely more than 3 words)
        words = text.split()
        if len(words) > 3:
            raise ValueError(f"'{text}' appears to be a sentence or phrase. Enter individual food items (e.g., 'carrot', 'pumpkin').")
            
        # 5. Check for injection keywords
        lower_words = set(re.findall(r'\b\w+\b', text.lower()))
        matched_forbidden = lower_words.intersection(INJECTION_KEYWORDS)
        if matched_forbidden:
            raise ValueError(f"Invalid ingredient detected: '{list(matched_forbidden)[0]}'. Unrelated command words are blocked.")
            
        # 6. Character whitelist: letters, numbers, spaces, hyphens only
        if not re.match(r"^[a-zA-Z0-9\s\-']+$", text):
            raise ValueError(f"'{text}' contains disallowed special characters.")
            
        cleaned.append(text.lower())
        
    return cleaned