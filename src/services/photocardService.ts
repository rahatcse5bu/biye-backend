import { callGroqAPI } from "./groqService";
import { IUnverifiedBiodata } from "../app/modules/unverified_biodata/unverified_biodata.interface";

interface GroqMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface PhotocardData {
    mainHighlight: string; // Most attractive feature
    subHighlight: string; // Secondary highlight
    profileText: string; // Brief compelling profile text
    emoji: string; // Appropriate emoji for the profile
    strength1: string; // Key strength or trait
    strength2: string; // Secondary strength
    valueProposal: string; // What they value/seek
}

/**
 * Extract the most attractive and compelling aspects of a biodata using Groq
 * Returns highlighted text suitable for Facebook promotion
 */
export const extractPhotocardContent = async (
    biodata: IUnverifiedBiodata
): Promise<PhotocardData> => {
    // Build a comprehensive biodata description for analysis
    const biodataDescription = `
Bio Type: ${biodata.bio_type}
Gender: ${biodata.gender}
Age: ${biodata.date_of_birth ? new Date().getFullYear() - new Date(biodata.date_of_birth).getFullYear() : "Not specified"}
Height: ${biodata.height} cm
Weight: ${biodata.weight} kg
Blood Group: ${biodata.blood_group}
Complexion: ${biodata.screen_color}
Nationality: ${biodata.nationality}
Marital Status: ${biodata.marital_status}
Religion: ${biodata.religion}
Religious Type: ${biodata.religious_type || "Not specified"}
Location: ${biodata.zilla || "Not specified"}
Division: ${biodata.division || "Not specified"}

Extra Information:
${biodata.extra_fields
            .map(
                (field) =>
                    `- ${field.label}: ${typeof field.value === "string"
                        ? field.value
                        : JSON.stringify(field.value)
                    }`
            )
            .join("\n")}
`;

    const messages: GroqMessage[] = [
        {
            role: "system",
            content: `You are an expert matrimony marketing specialist who creates compelling promotional content for biodata profiles. 
Your task is to extract the most attractive and valuable aspects of a biodata profile to create engaging promotional material.

Return ONLY a valid JSON object (no markdown, no extra text) with exactly this structure:
{
  "mainHighlight": "The most compelling single aspect (max 40 chars, Bengali or English)",
  "subHighlight": "Secondary interesting feature (max 40 chars, Bengali or English)",
  "profileText": "Brief compelling description (max 100 chars, Bengali or English)",
  "emoji": "One relevant emoji that represents the profile",
  "strength1": "First personal strength or positive trait (max 35 chars)",
  "strength2": "Second personal strength or quality (max 35 chars)",
  "valueProposal": "What this person values or seeks in a partner (max 50 chars)"
}

Focus on:
- Positive qualities and strengths
- Personal virtues and character
- Career/education achievements if present
- Family values and beliefs
- What makes this profile unique and appealing

Be creative, positive, and compelling!`,
        },
        {
            role: "user",
            content: `Extract comprehensive promotional content from this biodata profile:\n\n${biodataDescription}`,
        },
    ];

    try {
        const response = await callGroqAPI(messages, "meta-llama/llama-4-scout-17b-16e-instruct", 0.7, 768);

        let content = response.choices[0]?.message?.content || "{}";

        // Remove markdown code blocks if present
        content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

        // Parse the JSON response
        const photocardData = JSON.parse(content);

        // Validate and provide defaults
        return {
            mainHighlight: photocardData.mainHighlight || "সুন্দর জীবন খুঁজছি",
            subHighlight: photocardData.subHighlight || "নিষ্ঠাবান ও শিক্ষিত",
            profileText:
                photocardData.profileText ||
                "একজন যোগ্য জীবনসঙ্গী খুঁজছি যার সাথে সুখী জীবন গড়তে পারব",
            emoji: photocardData.emoji || "💕",
            strength1: photocardData.strength1 || "সৎ স্বভাব",
            strength2: photocardData.strength2 || "পরিবার প্রিয়",
            valueProposal: photocardData.valueProposal || "বিশ্বাস ও ভালোবাসা ভিত্তিক সম্পর্ক",
        };
    } catch (error) {
        console.error("[extractPhotocardContent] Error:", error);
        // Return default content if extraction fails
        return {
            mainHighlight: "সুন্দর জীবন খুঁজছি",
            subHighlight: "নিষ্ঠাবান ও শিক্ষিত",
            profileText: "একজন যোগ্য জীবনসঙ্গী খুঁজছি যার সাথে সুখী জীবন গড়তে পারব",
            emoji: "💕",
            strength1: "সৎ স্বভাব",
            strength2: "পরিবার প্রিয়",
            valueProposal: "বিশ্বাস ও ভালোবাসা ভিত্তিক সম্পর্ক",
        };
    }
};

/**
 * Generate an SVG photocard for Facebook promotion
 * Includes biodata information in an attractive format
 */
export const generatePhotocardSVG = (
    biodata: IUnverifiedBiodata,
    photocardContent: PhotocardData,
    uid: string
): string => {
    const WIDTH = 1080; // Facebook post standard width
    const HEIGHT = 1500; // Increased height for more content
    const PADDING = 40;

    // Get initials for avatar
    const contactName = biodata.contact_name || "User";
    const initials = contactName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Gender-based colors
    const isDemand = biodata.bio_type?.toLowerCase().includes("চাই") || false;
    const primaryColor = biodata.gender === "নারী" ? "#E84B8A" : "#2E86AB";
    const accentColor = isDemand ? "#FF6B6B" : "#06D6A0";

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap');
      .bn-text { font-family: 'Noto Sans Bengali', sans-serif; }
      .bn-bold { font-family: 'Noto Sans Bengali', sans-serif; font-weight: 700; }
      .bn-heavy { font-family: 'Noto Sans Bengali', sans-serif; font-weight: 800; }
    </style>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1B3656;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.95" />
      <stop offset="100%" style="stop-color:#F8FBFF;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Main background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGradient)"/>
  
  <!-- Decorative top ribbons -->
  <path d="M 0 0 L ${WIDTH} 0 L ${WIDTH} 120 Q ${WIDTH / 2} 180 0 120 Z" fill="${accentColor}" opacity="0.2"/>
  
  <!-- Company branding area -->
  <rect x="${PADDING}" y="${PADDING}" width="${WIDTH - 2 * PADDING}" height="100" fill="rgba(255,255,255,0.1)" rx="10"/>
  <circle cx="${PADDING + 50}" cy="${PADDING + 50}" r="35" fill="white" opacity="0.3"/>
  <text x="${PADDING + 70}" y="${PADDING + 50}" class="bn-heavy" font-size="48" fill="white">
    বিয়ে.ইনফো
  </text>
  <text x="${PADDING + 70}" y="${PADDING + 75}" class="bn-text" font-size="18" fill="rgba(255,255,255,0.8)">
    Matrimony Platform
  </text>

  <!-- Main profile card -->
  <g filter="drop-shadow(0 10px 30px rgba(0,0,0,0.3))">
    <rect x="${PADDING}" y="200" width="${WIDTH - 2 * PADDING}" height="950" fill="url(#cardGradient)" rx="20"/>
  </g>

  <!-- Avatar circle -->
  <circle cx="${WIDTH / 2}" cy="320" r="80" fill="${primaryColor}"/>
  <circle cx="${WIDTH / 2}" cy="320" r="75" fill="white" opacity="0.1"/>
  <text x="${WIDTH / 2}" y="340" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${primaryColor}" text-anchor="middle">
    ${initials}
  </text>

  <!-- Main highlight emoji -->
  <text x="${WIDTH / 2}" y="450" font-size="48" text-anchor="middle">
    ${photocardContent.emoji}
  </text>
  
  <!-- Main highlight text -->
  <text x="${WIDTH / 2}" y="520" class="bn-heavy" font-size="48" fill="${primaryColor}" text-anchor="middle" xml:space="preserve">
    ${photocardContent.mainHighlight}
  </text>

  <!-- Separator line -->
  <line x1="${PADDING + 40}" y1="600" x2="${WIDTH - PADDING - 40}" y2="600" stroke="${accentColor}" stroke-width="3" opacity="0.5"/>

  <!-- Sub highlight with emoji -->
  <text x="${WIDTH / 2}" y="650" class="bn-bold" font-size="36" fill="#666666" text-anchor="middle" xml:space="preserve">
    ⭐ ${photocardContent.subHighlight}
  </text>

  <!-- Profile text -->
  <text x="${WIDTH / 2}" y="710" class="bn-text" font-size="28" fill="#555555" text-anchor="middle" xml:space="preserve">
    "${photocardContent.profileText}"
  </text>

  <!-- Strengths and Values Section -->
  <line x1="${PADDING + 20}" y1="750" x2="${WIDTH - PADDING - 20}" y2="750" stroke="${accentColor}" stroke-width="2" opacity="0.3"/>
  
  <!-- Strength 1 -->
  <text x="${WIDTH / 2}" y="800" class="bn-bold" font-size="26" fill="${primaryColor}" text-anchor="middle" xml:space="preserve">
    💫 ${photocardContent.strength1}
  </text>

  <!-- Strength 2 -->
  <text x="${WIDTH / 2}" y="850" class="bn-bold" font-size="26" fill="${primaryColor}" text-anchor="middle" xml:space="preserve">
    ✨ ${photocardContent.strength2}
  </text>

  <!-- Value Proposal -->
  <text x="${WIDTH / 2}" y="910" class="bn-text" font-size="22" fill="#666666" text-anchor="middle" xml:space="preserve" font-style="italic">
    "${photocardContent.valueProposal}"
  </text>

  <!-- Info section -->
  <!-- Age -->
  <text x="${PADDING + 40}" y="1000" class="bn-bold" font-size="28" fill="${primaryColor}">বয়স</text>
  <text x="${PADDING + 40}" y="1035" class="bn-text" font-size="24" fill="#333333">${biodata.date_of_birth
            ? new Date().getFullYear() - new Date(biodata.date_of_birth).getFullYear()
            : "—"
        } বছর</text>
    
  <!-- Height -->
  <text x="${PADDING + 40}" y="1080" class="bn-bold" font-size="28" fill="${primaryColor}">উচ্চতা</text>
  <text x="${PADDING + 40}" y="1115" class="bn-text" font-size="24" fill="#333333">${biodata.height} সেমি</text>
    
    <text x="${PADDING + 40}" y="1220" font-weight="bold" fill="${primaryColor}" font-size="30">ধর্ম</text>
    <text x="${PADDING + 40}" y="1250" font-size="28">${biodata.religion}</text>

    <!-- Right column -->
    <text x="${WIDTH / 2 + 40}" y="1080" font-weight="bold" fill="${primaryColor}" font-size="30">মর্যাদা</text>
    <text x="${WIDTH / 2 + 40}" y="1110" font-size="28">${biodata.marital_status}</text>
    
    <text x="${WIDTH / 2 + 40}" y="1150" font-weight="bold" fill="${primaryColor}" font-size="30">ওজন</text>
    <text x="${WIDTH / 2 + 40}" y="1180" font-size="28">${biodata.weight} কেজি</text>
    
    <text x="${WIDTH / 2 + 40}" y="1220" font-weight="bold" fill="${primaryColor}" font-size="30">অবস্থান</text>
    <text x="${WIDTH / 2 + 40}" y="1250" font-size="28">${biodata.zilla || "—"}</text>
  </g>

  <!-- Footer area with CTA -->
  <rect x="${PADDING}" y="1260" width="${WIDTH - 2 * PADDING}" height="150" fill="${accentColor}" opacity="0.1" rx="15"/>
  
  <text x="${WIDTH / 2}" y="1310" font-family="'Noto Sans Bengali', Arial, sans-serif" font-size="28" fill="${accentColor}" text-anchor="middle" font-weight="bold">
    আরও জানতে ভিজিট করুন
  </text>
  
  <rect x="${PADDING + 40}" y="1320" width="${WIDTH - 2 * PADDING - 80}" height="50" fill="${primaryColor}" rx="8"/>
  <text x="${WIDTH / 2}" y="1360" font-family="'Courier New', monospace" font-size="20" fill="white" text-anchor="middle" font-weight="bold">
    https://biye.info/biodata/unverified/${uid}
  </text>

  <!-- Bottom branding -->
  <text x="${WIDTH / 2}" y="${HEIGHT - PADDING - 10}" font-family="'Noto Sans Bengali', Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)" text-anchor="middle">
    Made with ❤️ by বিয়ে.ইনফো
  </text>
</svg>`;

    return svg;
};

/**
 * Generate complete photocard with both LLM extraction and SVG rendering
 */
export const generatePhotocard = async (
    biodata: IUnverifiedBiodata,
    uid: string
): Promise<string> => {
    try {
        // Extract attractive content using Groq
        const photocardContent = await extractPhotocardContent(biodata);

        // Generate SVG
        const svg = generatePhotocardSVG(biodata, photocardContent, uid);

        return svg;
    } catch (error) {
        console.error("[generatePhotocard] Error:", error);
        throw error;
    }
};

/**
 * Generate photocard using a template
 * If template is provided, use it with placeholder rendering
 * Otherwise fall back to hard-coded SVG generation
 */
export const generatePhotocardWithTemplate = async (
    biodata: IUnverifiedBiodata,
    uid: string,
    template?: any
): Promise<string> => {
    try {
        // If no template provided, use the original method
        if (!template || !template.svgCode) {
            return generatePhotocard(biodata, uid);
        }

        // Extract content for template placeholders
        const photocardContent = await extractPhotocardContent(biodata);
        const age = biodata.date_of_birth
            ? new Date().getFullYear() - new Date(biodata.date_of_birth).getFullYear()
            : "—";

        // Build data object for template rendering
        const templateData: Record<string, any> = {
            headline: photocardContent.mainHighlight,
            name: biodata.contact_name || "User",
            age: age,
            height: biodata.height ? `${biodata.height} সেমি` : "—",
            weight: biodata.weight ? `${biodata.weight} কেজি` : "—",
            religion: biodata.religion,
            location: biodata.zilla || "—",
            complexion: biodata.screen_color,
            profession: biodata.extra_fields
                ?.find((f) => f.label.toLowerCase().includes("পেশা"))
                ?.value || "—",
            quote: photocardContent.profileText,
            url: `https://biye.info/biodata/unverified/${uid}`,
            gender: biodata.gender,
            bio_type: biodata.bio_type,
            strength1: photocardContent.strength1,
            strength2: photocardContent.strength2,
            valueProposal: photocardContent.valueProposal,
            emoji: photocardContent.emoji,
            mainHighlight: photocardContent.mainHighlight,
            subHighlight: photocardContent.subHighlight,
            profileText: photocardContent.profileText,
        };

        // Render template with data
        let svg = template.svgCode;

        // Replace all placeholders
        for (const [key, value] of Object.entries(templateData)) {
            if (value === undefined || value === null) continue;
            const regex = new RegExp(`\\{${key}(?::[^}]*)?\\}`, "g");
            svg = svg.replace(regex, String(value));
        }

        // Remove any unreplaced placeholders
        svg = svg.replace(/\{[^}]+\}/g, "—");

        return svg;
    } catch (error) {
        console.error("[generatePhotocardWithTemplate] Error:", error);
        // Fall back to standard generation
        return generatePhotocard(biodata, uid);
    }
};
