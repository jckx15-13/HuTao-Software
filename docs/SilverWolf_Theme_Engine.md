# Adaptive theme engine: design background and roadmap

> **Document status:** Background proposal, not the current interface specification. The implemented runtime palettes and wallpaper sampling are described in `src/lib/themeEngine.ts`, `src/lib/imageTheme.ts`, and the shared [design system](../DESIGN.md). Ideas labeled future below are not shipped capabilities.

**Product context:**
Silver Wolf VI combines chat and spatial workflows. Its current dark default uses purple and cyan accents, while the theme engine supports alternate palettes and local wallpaper-derived color themes. This note preserves the original adaptive-theme rationale and separates implemented behavior from future exploration.

---

## 1. Visual Identity and Art Direction

**Core Identity Analysis:**
Silver Wolf relies on a rebellious hacker "Punk" archetype crossed with game-boy-retro / arcade glitch elements. Her default visual identity leans on deep violet/indigo bases, stark cyan/neon blue electric accents, silver/gray structural elements, and harsh magenta glitch warnings.

**Pastel Dream Extension:**
The attached reference imagery introduces a dream-like, softer, nostalgic extension. By blending high-contrast hacker geometry (sharp corners, thin borders, monospace fonts) with soft pastel glows (lavender, soft cyan, pale lilac), we create an interface that feels high-tech but calming—like an arcade screen glowing softly in a dark room.

**Palette direction:**
The application supports dark and light palettes rather than requiring one fixed two-mode pairing. Purple/cyan is the current default direction; pastel palettes are an optional alternate. Palette names and values in this proposal are illustrative where they differ from `src/lib/themeEngine.ts`.

**Art Direction System:**
*   **Mood:** Futuristic, playful, nostalgic, premium.
*   **Texture Language:** Glassmorphism (blur-based overlays), subtle grid patterns, pixel-art/arcade motifs for empty states/loading.
*   **Glow Language:** Soft outer shadow drops matching the primary accent color. Not intense drop-shadows, but "bloom" effects.
*   **Border Language:** Hairline (1px) borders, usually opaque or semi-transparent based on surface elevation. Mix of rounded corners for dialogs, and sharp cut-corners (clip-path) for interactive buttons.
*   **Typography:** Primary sans-serif clean UI font (`Inter` or `Geist`). Secondary monospace for code, system tags, and timestamps (`JetBrains Mono` or `Fira Code`).

---

## 2. Color System and Design Tokens

Our design tokens classify colors strictly by semantic role to allow multiple palettes to plug-in.

### Palette Sets

**1. Core Hacker** (Default Dark Theme)
*   `--theme-bg-base`: `#1A1A2E`
*   `--theme-bg-surface`: `#252542`
*   `--theme-primary`: `#6B4E9A`
*   `--theme-accent-1`: `#00D4FF`
*   `--theme-accent-2`: `#A9A9A9`
*   `--theme-text-primary`: `#FFFFFF`

**2. Glitch Neon** (High Contrast / High Energy)
*   `--theme-bg-base`: `#0F0F23`
*   `--theme-primary`: `#8A5BC7`
*   `--theme-accent-1`: `#00FFFF`
*   `--theme-error` / Glitch: `#FF00FF`

**3. Pastel Dream** (Soft Light Theme)
*   `--theme-bg-base`: `#F5F0FF`
*   `--theme-bg-surface`: `#E6D8F8`
*   `--theme-primary`: `#E6C7F0`
*   `--theme-accent-1`: `#B0E0E6`
*   `--theme-text-primary`: `#6B4E9A`
*   `--theme-glow`: `#FFE4F5`

### Component-Level Token Rules
*   `--color-surface-elevated`: `color-mix(in srgb, var(--bg-surface) 90%, var(--primary) 10%)`
*   `--color-border`: `color-mix(in srgb, var(--primary) 30%, transparent)`
*   `--shadow-glow`: `0 0 16px var(--color-glow, var(--primary))`

---

## 3. Image-to-Palette Extraction Solutions

To build the dynamic theming engine, we assessed several color extraction strategies:

1.  **RGB K-means clustering:** Fast but often gives perceptually unpleasing palettes (chooses muddy mid-tones).
2.  **LAB-space K-means:** Much better for human perception. Keeps vibrant colors separated.
3.  **Histogram-based:** Fast, but heavily biased by background colors (e.g., if the wallpaper is mostly black).
4.  **Edge-aware / Saliency-aware sampling:** Focuses color extraction on the "subject" (the character/avatar) rather than the background. Excellent for anime art where characters are focal.
5.  **Neural Palette Gen:** Passing the image through a tuned model (e.g., Colorgram / specialized CNN) to output aesthetic palettes.
6.  **Hybrid Pipeline:**

**Current Implementation: Canvas Sampling Heuristic**
*   *Why:* The app only needs fast, local theme extraction for uploaded wallpapers, and avoiding heavyweight palette dependencies keeps the bundle and security surface smaller.
*   *How:* `src/lib/imageTheme.ts` loads the uploaded image into a small canvas, samples opaque pixels, scores them by saturation and luminance, then assigns semantic roles: dark muted background, vibrant primary, light vibrant secondary, and muted warning/text support.
*   *Tradeoff:* This is simpler than saliency-aware LAB K-means. It is fast and dependency-free, but it can still be biased by very large flat backgrounds. If wallpaper theming becomes central, upgrade this into a Web Worker with LAB-space clustering and contrast validation.

**Future Recommendation: Saliency-Aware LAB-space K-means**
*   *Why:* Anime illustrations often have vast empty / monochrome backgrounds with highly detailed, colorful, salient characters. Standard K-means can over-select background shades.
*   *How:* Use a lightweight foreground-detection filter to weight pixels. Run K-means (k=8) in LAB color space. Filter out low-saturation and exceedingly low-luminance clusters to find the true accent.

---

## 4. Technical System Architecture

**Color Generation Pipeline:**
1.  **Ingestion:** User uploads image -> converted to `<canvas>`.
2.  **Analysis:** Browser canvas reads a downscaled image sample.
3.  **Extraction:** Score sampled pixels by saturation, luminance, and balance against target roles.
4.  **Role Assignment:**
    *   Sort extracted colors by Luminance and Saturation.
    *   Pick highest Saturation -> *Primary / Accent*.
    *   Pick Extreme Luminance (Dark/Light depending on target mode) -> *Background*.
5.  **Validation:** Ensure text (calculated based on background) passes WCAG 4.5:1.
6.  **Token Generation:** Emit a JSON `{ "--theme-bg": "...", ... }`.
7.  **Theme Switch:** Apply to `document.documentElement.style`.

**JSON Theme Schema:**
```json
{
  "themeName": "Extracted_Avatar",
  "mode": "dark",
  "tokens": {
    "bg-base": "#1B1724",
    "bg-surface": "#2D2638",
    "primary": "#D4A5FF",
    "accent-1": "#7AF0D6",
    "text-main": "#F8F5FC",
    "text-muted": "#968B9E",
    "border": "#4C405E"
  }
}
```

---

## 5. Accessibility and Resilience

**Contrast goal:** Theme generation should check text/background contrast and adjust or reject combinations that are hard to read. A contrast calculation for one token pair is not a complete WCAG assessment; interactive states, focus indicators, non-text contrast, and actual rendered surfaces also need review. Do not describe the current extractor as WCAG-certified.

**Fallback Safeties:**
*   If an image returns monolithic or muddy colors (e.g., a highly compressed grey screenshot), we detect the low variance.
*   If variance is low, the pipeline falls back to the **Core Hacker** palette but subtly tints the background with the image's average color (`color-mix(in srgb, #1A1A2E 90%, ExtractedColor)`).

---

## 6. Future Evolution into Motion and AI-Generated Themes

Everything in this section is exploratory and should not be presented as existing product behavior.

**From Tokens to Motion:**
Next-gen theming means extracting *movement speed* and *energy* from images.
*   An uploaded high-contrast, edgy illustration creates a theme with fast, aggressive, glitch-style transitions (`transition: 0.15s cubic-bezier(1, 0, 0, 1)`).
*   A pastel, soft anime illustration creates long, breathing, ambient motion (`transition: 0.8s ease-in-out`).

**Variables Generation:**
Extracted metadata will soon populate motion tokens:
`--animation-typing-pulse-speed: 1.2s` vs `0.4s`
`--border-glow-rhythm: wave` vs `strobe`
`--particle-effect: star_dust` vs `binary_rain`

**AI Generative Leap:**
A Vision-Language Model (VLM like Gemini) analyzes the image context: "This is a dreamy illustration of a character under a starry sky."
The prompt triggers:
1. CSS palette payload.
2. A WebGL or CSS-animated ambient background generation (e.g., generating CSS twinkling stars).

---

## 7. Product Strategy Roadmap

*   **v1 (Current/Immediate):** Ship the exact fixed palettes (Silver Punk, Hacker, Pastel Dream). Implement a robust CSS variable system and CSS `color-mix` styling. Let users swap manually.
*   **v2 (Mid-Term):** Introduce client-side `Vibrant.js` pipeline. User uploads avatar -> App applies the Hybrid Pipeline (Saliency-Aware LAB K-means) to generate a custom palette, saving it to LocalStorage.
*   **v3 (Future State):** Connect a Vision LLM backend. User uploads image, the system replies in character ("Nice aesthetic. Applying quantum filter.") and dynamically streams back CSS tokens *and* animation tokens for a fully rigged intelligent theme.
