import json
with open('C:/Users/jaron/.gemini/antigravity/brain/584f9fa7-0488-4381-a5a7-d8656cca5a77/.system_generated/logs/overview.txt', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'step_index' in data and data['step_index'] >= 309 and data['step_index'] <= 313:
                print(f"--- STEP {data['step_index']} ---")
                if 'content' in data:
                    print(data['content'][:1000])
        except Exception:
            pass
