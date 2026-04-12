"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPhotocardTemplates = void 0;
const photocard_template_model_1 = require("./photocard_template.model");
/**
 * Built-in SVG templates
 */
const TEMPLATE_1_GREEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <style>
      text { font-family: 'Noto Sans Bengali', Arial, sans-serif; }
    </style>
    <!-- Background gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a2e1a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#2d4a2d;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f1f0f;stop-opacity:1" />
    </linearGradient>

    <!-- Bokeh/nature overlay blobs -->
    <radialGradient id="bokeh1" cx="70%" cy="30%" r="35%">
      <stop offset="0%" style="stop-color:#4a7a3a;stop-opacity:0.5" />
      <stop offset="100%" style="stop-color:#1a2e1a;stop-opacity:0" />
    </radialGradient>
    <radialGradient id="bokeh2" cx="80%" cy="70%" r="30%">
      <stop offset="0%" style="stop-color:#3d6b2a;stop-opacity:0.4" />
      <stop offset="100%" style="stop-color:#1a2e1a;stop-opacity:0" />
    </radialGradient>
    <radialGradient id="bokeh3" cx="55%" cy="50%" r="25%">
      <stop offset="0%" style="stop-color:#5a8a40;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#1a2e1a;stop-opacity:0" />
    </radialGradient>

    <!-- Header gradient -->
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#111111" />
      <stop offset="100%" style="stop-color:#1f3a1f" />
    </linearGradient>

    <!-- White strip shadow -->
    <filter id="stripShadow" x="-5%" y="-20%" width="115%" height="140%">
      <feDropShadow dx="3" dy="3" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>

    <!-- Circle shadow -->
    <filter id="circleShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000" flood-opacity="0.5"/>
    </filter>

    <!-- Badge gradient -->
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a1a" />
      <stop offset="100%" style="stop-color:#2a2a2a" />
    </linearGradient>

    <!-- Green accent gradient -->
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50" />
      <stop offset="100%" style="stop-color:#2e7d32" />
    </linearGradient>

    <!-- Logo gradient -->
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#56ab2f" />
      <stop offset="100%" style="stop-color:#a8e063" />
    </linearGradient>

    <!-- Strip gradient -->
    <linearGradient id="stripGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffffff" />
      <stop offset="85%" style="stop-color:#f0f0f0" />
      <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:0" />
    </linearGradient>
  </defs>

  <g>
    <!-- === BACKGROUND === -->
    <rect width="1080" height="1080" fill="url(#bgGrad)"/>
    <rect width="1080" height="1080" fill="url(#bokeh1)"/>
    <rect width="1080" height="1080" fill="url(#bokeh2)"/>
    <rect width="1080" height="1080" fill="url(#bokeh3)"/>

    <!-- === HEADER BAR === -->
    <rect x="30" y="42" width="1020" height="110" rx="12" fill="url(#headerGrad)" filter="url(#stripShadow)"/>
    <rect x="30" y="42" width="1020" height="110" rx="12" fill="none" stroke="#4CAF50" stroke-width="2.5" opacity="0.6"/>
    <rect x="30" y="42" width="8" height="110" rx="4" fill="#4CAF50"/>

    <!-- Header Title Text -->
    <text x="540" y="116" 
      font-family="'Noto Sans Bengali', 'SolaimanLipi', serif" 
      font-size="56" 
      font-weight="700" 
      fill="white" 
      text-anchor="middle"
      letter-spacing="1">{headline}</text>

    <!-- === LEFT WHITE STRIPS === -->
    <!-- Strip 1: Location -->
    <g filter="url(#stripShadow)">
      <polygon points="25,200 520,200 540,245 25,245" fill="url(#stripGrad)"/>
    </g>
    <circle cx="60" cy="222" r="8" fill="#4CAF50"/>
    <text x="82" y="233" 
      font-family="'Noto Sans Bengali', Arial, sans-serif"
      font-size="42" font-weight="700" fill="white">{location}</text>

    <!-- Strip 2: Height -->
    <g filter="url(#stripShadow)">
      <polygon points="25,300 500,300 520,345 25,345" fill="url(#stripGrad)"/>
    </g>
    <circle cx="60" cy="322" r="8" fill="#4CAF50"/>
    <text x="82" y="333" 
      font-family="'Noto Sans Bengali', Arial, sans-serif"
      font-size="42" font-weight="700" fill="white">उचचता: {height}</text>

    <!-- Strip 3: Age -->
    <g filter="url(#stripShadow)">
      <polygon points="25,400 510,400 530,445 25,445" fill="url(#stripGrad)"/>
    </g>
    <circle cx="60" cy="422" r="8" fill="#4CAF50"/>
    <text x="82" y="433" 
      font-family="'Noto Sans Bengali', Arial, sans-serif"
      font-size="42" font-weight="700" fill="white">बयस: {age}</text>

    <!-- Strip 4: Weight -->
    <g filter="url(#stripShadow)">
      <polygon points="25,500 490,500 510,545 25,545" fill="url(#stripGrad)"/>
    </g>
    <circle cx="60" cy="522" r="8" fill="#4CAF50"/>
    <text x="82" y="533" 
      font-family="'Noto Sans Bengali', Arial, sans-serif"
      font-size="42" font-weight="700" fill="white">وجن: {weight}</text>

    <!-- Strip 5: Profession -->
    <g filter="url(#stripShadow)">
      <polygon points="25,600 530,600 550,645 25,645" fill="url(#stripGrad)"/>
    </g>
    <circle cx="60" cy="622" r="8" fill="#4CAF50"/>
    <text x="82" y="633" 
      font-family="'Noto Sans Bengali', Arial, sans-serif"
      font-size="42" font-weight="700" fill="white">{profession}</text>

    <!-- Strip 6: Religion -->
    <g filter="url(#stripShadow)">
      <polygon points="25,700 490,700 510,745 25,745" fill="url(#stripGrad)"/>
    </g>
    <circle cx="60" cy="722" r="8" fill="#4CAF50"/>
    <text x="82" y="733" 
      font-family="'Noto Sans Bengali', Arial, sans-serif"
      font-size="42" font-weight="700" fill="white">धर्म: {religion}</text>

    <!-- === AVATAR CIRCLE === -->
    <circle cx="800" cy="580" r="205" fill="#0f1f0f" filter="url(#circleShadow)" opacity="0.9"/>
    <circle cx="800" cy="580" r="200" fill="none" stroke="#4CAF50" stroke-width="6" opacity="0.9"/>
    <circle cx="800" cy="580" r="180" fill="#0d1f0d" opacity="0.95"/>

    <!-- Avatar silhouette -->
    <circle cx="800" cy="490" r="62" fill="url(#greenGrad)" opacity="0.9"/>
    <ellipse cx="800" cy="640" rx="90" ry="75" fill="url(#greenGrad)" opacity="0.9"/>

    <!-- Complexity badge -->
    <circle cx="640" cy="500" r="68" fill="url(#badgeGrad)" filter="url(#circleShadow)"/>
    <circle cx="640" cy="500" r="65" fill="none" stroke="#4CAF50" stroke-width="3" opacity="0.8"/>
    <text x="640" y="508" 
      font-family="'Noto Sans Bengali', 'SolaimanLipi', serif"
      font-size="30" font-weight="700" fill="white" text-anchor="middle">{complexion}</text>

    <!-- === URL STRIP === -->
    <rect x="25" y="820" width="320" height="50" rx="6" fill="#0d1f0d" opacity="0.8"/>
    <rect x="25" y="820" width="320" height="50" rx="6" fill="none" stroke="#4CAF50" stroke-width="1.5" opacity="0.5"/>
    <text x="185" y="852" 
      font-family="'Courier New', monospace"
      font-size="20" fill="#4CAF50" text-anchor="middle" opacity="0.9">{url}</text>

    <!-- === BRANDING === -->
    <rect x="25" y="990" width="260" height="68" rx="12" fill="#0a150a" opacity="0.92"/>
    <rect x="25" y="990" width="260" height="68" rx="12" fill="none" stroke="#4CAF50" stroke-width="2" opacity="0.7"/>

    <!-- Logo -->
    <text x="82" y="1022" 
      font-family="Georgia, serif"
      font-size="48" font-weight="700" 
      fill="url(#logoGrad)">Biye</text>
    <text x="82" y="1048" 
      font-family="'Noto Sans Bengali', Arial, sans-serif"
      font-size="22" fill="#81C784" opacity="0.85">Matrimony</text>

    <!-- CARD BORDER -->
    <rect x="0" y="0" width="1080" height="1080" rx="24" ry="24" 
      fill="none" stroke="#4CAF50" stroke-width="6" opacity="0.5"/>
  </g>
</svg>`;
const TEMPLATE_2_CHERRY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <!-- Sky gradient -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#87CEEB"/>
      <stop offset="60%" style="stop-color:#b0e0f5"/>
      <stop offset="100%" style="stop-color:#d4f0ff"/>
    </linearGradient>

    <!-- Teal quote area -->
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7fd8e8"/>
      <stop offset="100%" style="stop-color:#5bbcd4"/>
    </linearGradient>

    <!-- Purple stats panel -->
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9b59b6"/>
      <stop offset="50%" style="stop-color:#7e3fa8"/>
      <stop offset="100%" style="stop-color:#5b2d8e"/>
    </linearGradient>

    <!-- Avatar circle border -->
    <linearGradient id="avatarBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#e0d4f7"/>
    </linearGradient>

    <!-- Logo gradient -->
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#56ab2f"/>
      <stop offset="100%" style="stop-color:#a8e063"/>
    </linearGradient>

    <!-- Green hijab gradient -->
    <linearGradient id="hijabGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50"/>
      <stop offset="100%" style="stop-color:#2e7d32"/>
    </linearGradient>

    <!-- Drop shadow filters -->
    <filter id="softShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.25"/>
    </filter>

    <filter id="avatarShadow" x="-15%" y="-15%" width="135%" height="135%">
      <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#000" flood-opacity="0.35"/>
    </filter>

    <filter id="pillShadow" x="-5%" y="-15%" width="115%" height="135%">
      <feDropShadow dx="2" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.2"/>
    </filter>
  </defs>

  <g>
    <!-- === TOP: SKY === -->
    <rect width="1080" height="480" fill="url(#skyGrad)"/>

    <!-- Sun glow -->
    <circle cx="900" cy="80" r="120" fill="#fff8e1" opacity="0.4"/>
    <circle cx="900" cy="80" r="80" fill="#fff176" opacity="0.3"/>

    <!-- === BOTTOM LEFT: TEAL QUOTE AREA === -->
    <rect x="0" y="480" width="680" height="530" fill="url(#tealGrad)"/>

    <!-- Decorative quotation mark -->
    <text x="46" y="580" 
      font-family="Georgia, serif" font-size="110" fill="#2a8ba0" opacity="0.55">"</text>

    <!-- Quote text placeholder -->
    <foreignObject x="45" y="555" width="610" height="380">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Noto Sans Bengali', SolaimanLipi, serif; font-size: 28px; font-weight: 500; color: #0d3d4a; line-height: 1.75; padding: 0 8px;">
        {quote}
      </div>
    </foreignObject>

    <!-- Closing quote mark -->
    <text x="48" y="980" 
      font-family="Georgia, serif" font-size="100" fill="#2a8ba0" opacity="0.45" transform="scale(-1,1) translate(-200, 0)">"</text>

    <!-- === BOTTOM RIGHT: PURPLE STATS PANEL === -->
    <rect x="680" y="480" width="400" height="530" fill="url(#purpleGrad)"/>

    <!-- Stats pills -->
    <!-- Height -->
    <rect x="710" y="510" width="340" height="70" rx="35" fill="white" filter="url(#pillShadow)"/>
    <text x="880" y="557" 
      font-family="'Noto Sans Bengali', SolaimanLipi, serif"
      font-size="36" font-weight="700" fill="#6a1b9a" text-anchor="middle">{height}</text>

    <!-- Age -->
    <rect x="710" y="600" width="340" height="70" rx="35" fill="white" filter="url(#pillShadow)"/>
    <text x="880" y="647" 
      font-family="'Noto Sans Bengali', SolaimanLipi, serif"
      font-size="36" font-weight="700" fill="#6a1b9a" text-anchor="middle">{age}</text>

    <!-- Weight -->
    <rect x="710" y="690" width="340" height="70" rx="35" fill="white" filter="url(#pillShadow)"/>
    <text x="880" y="737" 
      font-family="'Noto Sans Bengali', SolaimanLipi, serif"
      font-size="36" font-weight="700" fill="#6a1b9a" text-anchor="middle">{weight}</text>

    <!-- Complexion -->
    <rect x="710" y="780" width="340" height="70" rx="35" fill="white" filter="url(#pillShadow)"/>
    <text x="880" y="827" 
      font-family="'Noto Sans Bengali', SolaimanLipi, serif"
      font-size="33" font-weight="700" fill="#6a1b9a" text-anchor="middle">{complexion}</text>

    <!-- Location bar -->
    <rect x="680" y="920" width="400" height="90" fill="#5b2d8e" opacity="0.85"/>
    <text x="880" y="978" 
      font-family="'Noto Sans Bengali', SolaimanLipi, serif"
      font-size="40" font-weight="700" fill="white" text-anchor="middle">{location}</text>

    <!-- === AVATAR CIRCLE === -->
    <circle cx="700" cy="478" r="115" fill="white" filter="url(#avatarShadow)"/>
    <circle cx="700" cy="478" r="108" fill="#f3e5f5"/>
    <circle cx="700" cy="478" r="100" fill="#e8d5f5"/>

    <!-- Avatar silhouette -->
    <ellipse cx="700" cy="440" rx="42" ry="44" fill="url(#hijabGreen)"/>
    <ellipse cx="700" cy="488" rx="65" ry="38" fill="url(#hijabGreen)"/>
    <ellipse cx="700" cy="438" rx="28" ry="30" fill="#e8f5e9"/>
    <rect x="674" y="448" width="52" height="24" rx="10" fill="url(#hijabGreen)"/>
    <ellipse cx="690" cy="440" rx="5" ry="4" fill="#1b5e20"/>
    <ellipse cx="710" cy="440" rx="5" ry="4" fill="#1b5e20"/>

    <!-- === LOGO AREA === -->
    <rect x="18" y="998" width="230" height="64" rx="12" fill="white" opacity="0.92" filter="url(#pillShadow)"/>
    <text x="68" y="1026" 
      font-family="Georgia, serif"
      font-size="32" font-weight="700" fill="url(#logoGrad)">Biye</text>
    <text x="68" y="1051" 
      font-family="Arial, sans-serif"
      font-size="15" fill="#388e3c" opacity="0.85">Matrimony</text>

    <!-- === WEBSITE URL === -->
    <rect x="18" y="935" width="520" height="42" rx="8" fill="white" opacity="0.75"/>
    <text x="260" y="963" 
      font-family="'Courier New', monospace"
      font-size="17" fill="#2e7d32" text-anchor="middle" font-weight="600">{url}</text>

    <!-- === CARD BORDER === -->
    <rect x="0" y="0" width="1080" height="1080" rx="20" ry="20"
      fill="none" stroke="white" stroke-width="5" opacity="0.4"/>
  </g>
</svg>`;
/**
 * Seed built-in templates into database
 */
const seedPhotocardTemplates = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const builtInTemplates = [
            {
                name: "Modern Green (Supply Side)",
                description: "Modern green theme for biodatas offering services (supply)",
                svgCode: TEMPLATE_1_GREEN,
                isBuiltIn: true,
                bioType: "supply",
                isActive: true,
                placeholders: [
                    "headline",
                    "location",
                    "height",
                    "age",
                    "weight",
                    "profession",
                    "religion",
                    "complexion",
                    "url",
                ],
            },
            {
                name: "Cherry Blossom (Demand Side)",
                description: "Elegant cherry blossom theme for biodatas seeking services (demand)",
                svgCode: TEMPLATE_2_CHERRY,
                isBuiltIn: true,
                bioType: "demand",
                isActive: true,
                placeholders: ["quote", "height", "age", "weight", "complexion", "location", "url"],
            },
        ];
        for (const template of builtInTemplates) {
            yield photocard_template_model_1.PhotocardTemplate.findOneAndUpdate({ name: template.name }, template, { upsert: true });
        }
        console.log("✅ Photocard templates seeded successfully");
    }
    catch (error) {
        console.error("❌ Error seeding templates:", error);
    }
});
exports.seedPhotocardTemplates = seedPhotocardTemplates;
