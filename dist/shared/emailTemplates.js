"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_TEMPLATE_CATALOG = exports.emailTemplates = exports.formatDateBn = void 0;
const bibahoMail_1 = require("./bibahoMail");
const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const period = (hour) => hour < 4 ? "রাত" : hour < 6 ? "ভোর" : hour < 12 ? "সকাল" : hour < 15 ? "দুপুর" : hour < 18 ? "বিকাল" : hour < 20 ? "সন্ধ্যা" : "রাত";
// TODO: "১৭ অক্টোবর ২০২৬, রাত ৯:৪২" in Dhaka time; returns "" for missing/invalid dates.
const formatDateBn = (value, withTime = false) => {
    const date = value instanceof Date ? value : new Date(String(value !== null && value !== void 0 ? value : ""));
    if (!value || Number.isNaN(date.getTime()))
        return "";
    const dhaka = new Date(date.getTime() + 6 * 60 * 60 * 1000);
    const day = `${(0, bibahoMail_1.toBanglaDigits)(dhaka.getUTCDate())} ${MONTHS[dhaka.getUTCMonth()]} ${(0, bibahoMail_1.toBanglaDigits)(dhaka.getUTCFullYear())}`;
    if (!withTime)
        return day;
    const hour = dhaka.getUTCHours();
    const minute = String(dhaka.getUTCMinutes()).padStart(2, "0");
    return `${day}, ${period(hour)} ${(0, bibahoMail_1.toBanglaDigits)(hour % 12 || 12)}:${(0, bibahoMail_1.toBanglaDigits)(minute)}`;
};
exports.formatDateBn = formatDateBn;
const bold = (value) => `<strong>${(0, bibahoMail_1.escapeHtml)(value)}</strong>`;
exports.emailTemplates = {
    // TODO: A1 · account created.
    welcome: (d) => ({
        subject: `বিয়ে-তে আপনাকে স্বাগতম${d.name ? `, ${d.name}` : ""}!`,
        content: {
            icon: "welcome",
            eyebrow: "স্বাগতম",
            title: "আপনার জীবনসঙ্গী খোঁজার যাত্রা শুরু হলো",
            preheader: "জীবনসঙ্গী খোঁজার যাত্রা শুরু হোক আজই — মাত্র ৩টি ধাপে।",
            name: d.name,
            paragraphs: [
                "বাংলাদেশের বিশ্বস্ত অনলাইন ম্যাট্রিমনি <strong>বিয়ে</strong>-তে আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। নিজের জন্য কিংবা অভিভাবক হিসেবে সন্তান বা আত্মীয়ের জন্য — এখন থেকে সহজেই উপযুক্ত পাত্র-পাত্রী খুঁজতে পারবেন।",
            ],
            blocks: [
                {
                    type: "steps",
                    title: "কীভাবে শুরু করবেন",
                    items: [
                        "<strong>বায়োডাটা তৈরি করুন</strong> — ব্যক্তিগত, পারিবারিক, শিক্ষা ও পেশার তথ্য ধাপে ধাপে দিন।",
                        "<strong>যাচাই ও প্রকাশ</strong> — আমাদের টিম যাচাই করার পর আপনার বায়োডাটা প্রকাশিত হবে।",
                        "<strong>খুঁজুন ও যোগাযোগ করুন</strong> — এলাকা, বয়স ও পেশা দিয়ে খুঁজে পছন্দের বায়োডাটায় অনুরোধ পাঠান।",
                    ],
                },
                { type: "buttons", actions: [{ label: "বায়োডাটা তৈরি করুন", path: "/user/account/edit-biodata" }] },
                {
                    type: "quote",
                    text: "আর তাঁর নিদর্শনাবলীর মধ্যে রয়েছে যে, তিনি তোমাদের জন্য তোমাদের মধ্য থেকেই সঙ্গিনী সৃষ্টি করেছেন, যাতে তোমরা তাদের কাছে প্রশান্তি পাও।",
                    source: "সূরা আর-রূম, আয়াত ২১",
                },
            ],
        },
    }),
    // TODO: A3 · forgot password; the link is valid for 30 minutes.
    passwordReset: (d) => ({
        subject: "পাসওয়ার্ড রিসেট করার অনুরোধ",
        content: {
            icon: "key",
            eyebrow: "পাসওয়ার্ড রিসেট",
            title: "নতুন পাসওয়ার্ড সেট করুন",
            preheader: "নতুন পাসওয়ার্ড সেট করতে লিংকটি ৩০ মিনিটের মধ্যে ব্যবহার করুন।",
            name: d.name,
            paragraphs: ["আমরা আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার একটি অনুরোধ পেয়েছি। নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।"],
            blocks: [
                { type: "buttons", actions: [{ label: "পাসওয়ার্ড রিসেট করুন", path: d.resetPath }] },
                {
                    type: "info",
                    title: "অনুরোধের বিবরণ",
                    rows: [
                        { label: "সময়", value: (0, exports.formatDateBn)(d.requestedAt || new Date(), true) },
                        { label: "লিংকের মেয়াদ", value: "৩০ মিনিট (একবার ব্যবহারযোগ্য)" },
                    ],
                },
                { type: "link", label: "বাটন কাজ না করলে এই লিংকটি ব্রাউজারে পেস্ট করুন:", url: `${bibahoMail_1.SITE_URL}${d.resetPath}` },
                { type: "notice", title: "আপনি অনুরোধ করেননি?", text: "তাহলে কিছু করার প্রয়োজন নেই — আপনার বর্তমান পাসওয়ার্ড অপরিবর্তিত থাকবে।" },
            ],
        },
    }),
    // TODO: B1 · biodata sent for review.
    biodataInReview: (d) => ({
        subject: "আপনার বায়োডাটা জমা হয়েছে — পর্যালোচনা চলছে",
        content: {
            icon: "clock",
            eyebrow: "পর্যালোচনাধীন",
            title: "আপনার বায়োডাটা আমরা পেয়েছি",
            preheader: "আমাদের টিম আপনার বায়োডাটা পর্যালোচনা করছে।",
            name: d.name,
            paragraphs: [
                `ধন্যবাদ! আপনার বায়োডাটা ${d.biodataNo ? `${bold(d.biodataNo)} ` : ""}সফলভাবে জমা হয়েছে এবং আমাদের টিম এখন তা পর্যালোচনা করছে। স্ট্যাটাস পরিবর্তন হলে আপনাকে ইমেইল ও নোটিফিকেশনে জানানো হবে।`,
            ],
            blocks: [
                { type: "progress", stages: ["জমা দেওয়া হয়েছে", "যাচাই ও সম্মতি", "প্রকাশিত"], current: 1 },
                {
                    type: "info",
                    title: "সংক্ষিপ্ত তথ্য",
                    rows: [
                        { label: "বায়োডাটা নং", value: d.biodataNo },
                        { label: "জমার তারিখ", value: (0, exports.formatDateBn)(d.submittedAt || new Date()) },
                    ],
                },
                { type: "notice", title: "অভিভাবকের ফোন খোলা রাখুন", text: "যাচাইয়ের জন্য আমাদের টিম আপনার দেওয়া অভিভাবকের নম্বরে কল করতে পারে।" },
                { type: "buttons", actions: [{ label: "বায়োডাটা দেখুন", path: "/user/account/dashboard", outline: true }] },
            ],
        },
    }),
    // TODO: B3 · biodata (or its latest changes) approved and live.
    biodataApproved: (d) => ({
        subject: d.changesOnly ? "আপনার বায়োডাটার পরিবর্তন অনুমোদিত হয়েছে" : "অভিনন্দন! আপনার বায়োডাটা অনুমোদিত হয়েছে 🎉",
        content: {
            icon: "check",
            eyebrow: "অনুমোদিত",
            title: d.changesOnly ? "আপনার বায়োডাটার পরিবর্তন এখন প্রকাশিত" : "অভিনন্দন! আপনার বায়োডাটা এখন প্রকাশিত",
            preheader: `বায়োডাটা${d.biodataNo ? ` ${d.biodataNo}` : ""} এখন সবার জন্য দৃশ্যমান।`,
            name: d.name,
            paragraphs: [
                d.changesOnly
                    ? "আপনার বায়োডাটার পরিবর্তনগুলো যাচাই করে অনুমোদন করা হয়েছে এবং এখন সবার কাছে প্রকাশিত।"
                    : "আপনার বায়োডাটা প্রকাশিত হয়েছে। এখন থেকে বিয়ে-র সদস্যরা আপনার বায়োডাটা দেখতে ও যোগাযোগের অনুরোধ পাঠাতে পারবেন।",
            ],
            blocks: [
                { type: "progress", stages: ["জমা দেওয়া হয়েছে", "যাচাই ও সম্মতি", "প্রকাশিত"], current: 3 },
                ...(d.biodataNo ? [{ type: "biodata", id: d.biodataNo }] : []),
                {
                    type: "checklist",
                    title: "সেরা ফলাফলের জন্য টিপস",
                    items: [
                        "প্রত্যাশিত জীবনসঙ্গীর বিবরণ স্পষ্ট ও বাস্তবসম্মত রাখুন",
                        "<strong>AI বাংলা সার্চে</strong> নিজের পছন্দ লিখে উপযুক্ত বায়োডাটা খুঁজুন",
                        "প্রাপ্ত যোগাযোগের অনুরোধের দ্রুত উত্তর দিন",
                    ],
                },
                {
                    type: "buttons",
                    actions: [
                        { label: "আমার বায়োডাটা দেখুন", path: "/user/account/dashboard" },
                        { label: "বায়োডাটা খুঁজুন", path: "/biodatas", outline: true },
                    ],
                },
            ],
        },
    }),
    // TODO: B4 · admin rejected the biodata or its changes; reason may hold one point per line.
    biodataRejected: (d) => {
        const reasons = String(d.reason || "")
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean);
        return {
            subject: d.changesOnly ? "আপনার বায়োডাটার পরিবর্তনে কিছু সংশোধন প্রয়োজন" : "আপনার বায়োডাটায় কিছু সংশোধন প্রয়োজন",
            content: {
                icon: "edit",
                eyebrow: "সংশোধন প্রয়োজন",
                title: d.changesOnly ? "আপনার বায়োডাটার পরিবর্তন অনুমোদন করা যায়নি" : "আপনার বায়োডাটা এই মুহূর্তে অনুমোদন করা যায়নি",
                preheader: "সংশোধন করে আবার জমা দিন — আমরা দ্রুত পুনরায় পর্যালোচনা করব।",
                name: d.name,
                paragraphs: [
                    `আপনার বায়োডাটা ${d.biodataNo ? `${bold(d.biodataNo)} ` : ""}পর্যালোচনা করে আমরা কিছু বিষয় লক্ষ্য করেছি, যার কারণে ${d.changesOnly ? "সাম্প্রতিক পরিবর্তনগুলো প্রকাশ করা সম্ভব হয়নি। আগের অনুমোদিত সংস্করণটি প্রকাশিত আছে।" : "এটি এখনই প্রকাশ করা সম্ভব হয়নি।"}`,
                ],
                blocks: [
                    ...(reasons.length ? [{ type: "checklist", title: "সংশোধনের কারণসমূহ", mark: "cross", items: reasons.map(bibahoMail_1.escapeHtml) }] : []),
                    { type: "text", html: "প্রয়োজনীয় বিষয়গুলো সংশোধন করে আবার জমা দিন। পুনরায় জমা দেওয়ার পর আমরা দ্রুত পর্যালোচনা সম্পন্ন করব।" },
                    { type: "buttons", actions: [{ label: "বায়োডাটা সংশোধন করুন", path: "/user/account/edit-biodata" }] },
                    { type: "note", html: "কোনো প্রশ্ন থাকলে এই ইমেইলের উত্তর দিন — আমরা সাহায্য করব।" },
                ],
            },
        };
    },
    // TODO: C1 · someone sent a proposal to this biodata.
    requestReceived: (d) => ({
        subject: "নতুন যোগাযোগের অনুরোধ এসেছে",
        content: {
            icon: "request",
            eyebrow: "নতুন অনুরোধ",
            title: "আপনার বায়োডাটায় আগ্রহ প্রকাশ করা হয়েছে",
            preheader: "একজন সদস্য আপনার বায়োডাটায় আগ্রহ প্রকাশ করেছেন।",
            name: d.name,
            paragraphs: ["একজন সদস্য আপনার বায়োডাটা দেখে আগ্রহ প্রকাশ করেছেন এবং তার বায়োডাটা ও প্রস্তাব আপনার কাছে পাঠিয়েছেন।"],
            blocks: [
                ...(d.senderNo ? [{ type: "label", text: "অনুরোধকারীর বায়োডাটা" }, { type: "biodata", id: d.senderNo }] : []),
                {
                    type: "text",
                    html: "অনুরোধটি গ্রহণ করলে তিনি পরবর্তী ধাপে আপনার অভিভাবকের যোগাযোগ তথ্য নিতে পারবেন। বায়োডাটাটি দেখে পরিবারের সাথে আলোচনা করে সিদ্ধান্ত নিন।",
                },
                {
                    type: "buttons",
                    actions: [
                        { label: "অনুরোধ গ্রহণ করুন", path: "/user/account/bio-requests" },
                        { label: "বাতিল করুন", path: "/user/account/bio-requests", outline: true },
                    ],
                },
            ],
        },
    }),
    // TODO: confirmation to the member who sent a proposal (no Figma frame; uses the C-series look).
    requestSent: (d) => ({
        subject: "আপনার প্রস্তাব পাঠানো হয়েছে",
        content: {
            icon: "request",
            eyebrow: "প্রস্তাব পাঠানো হয়েছে",
            title: "আপনার প্রস্তাব সফলভাবে পাঠানো হয়েছে",
            name: d.name,
            paragraphs: ["আপনার বায়োডাটা ও প্রস্তাব পাত্র/পাত্রীর কাছে পাঠানো হয়েছে। তিনি সাড়া দিলে আপনাকে ইমেইল ও নোটিফিকেশনে জানানো হবে।"],
            blocks: [
                ...(d.biodataNo ? [{ type: "biodata", id: d.biodataNo }] : []),
                {
                    type: "info",
                    title: "পয়েন্টের হিসাব",
                    rows: [
                        { label: "খরচ হওয়া পয়েন্ট", value: (0, bibahoMail_1.toBanglaDigits)(d.spent) },
                        { label: "অবশিষ্ট পয়েন্ট", value: (0, bibahoMail_1.toBanglaDigits)(d.balance) },
                    ],
                },
                { type: "buttons", actions: [{ label: "আমার অনুরোধগুলো দেখুন", path: "/user/account/purchases" }] },
            ],
        },
    }),
    // TODO: C2 · proposal accepted; the requester can now take the guardian contact.
    requestAccepted: (d) => ({
        subject: "সুসংবাদ! আপনার প্রস্তাব গৃহীত হয়েছে",
        content: {
            icon: "check",
            eyebrow: "অনুরোধ গৃহীত",
            title: "সুসংবাদ! আপনার প্রস্তাব গৃহীত হয়েছে",
            preheader: "এখন পরবর্তী ধাপে অভিভাবকের যোগাযোগ তথ্য নিতে পারবেন।",
            name: d.name,
            paragraphs: [
                `সুসংবাদ! বায়োডাটা ${d.biodataNo ? bold(d.biodataNo) : ""}-এর পক্ষ থেকে আপনার প্রস্তাবটি গ্রহণ করা হয়েছে। এখন পরবর্তী ধাপে অভিভাবকের যোগাযোগ তথ্য নিতে পারবেন।`,
            ],
            blocks: [
                ...(d.biodataNo ? [{ type: "biodata", id: d.biodataNo }] : []),
                { type: "notice", title: "যোগাযোগের শিষ্টাচার", text: "প্রথমবার যোগাযোগের সময় নিজের পরিচয় ও বায়োডাটা নম্বর জানান। পারিবারিকভাবে, সম্মানজনক উপায়ে কথা বলুন।" },
                { type: "buttons", actions: [{ label: "পরবর্তী ধাপে যান", path: "/user/account/purchases" }] },
            ],
        },
    }),
    // TODO: C3 · proposal declined.
    requestDeclined: (d) => ({
        subject: "আপনার যোগাযোগের অনুরোধের আপডেট",
        content: {
            icon: "heart",
            eyebrow: "অনুরোধের আপডেট",
            title: "এবার হয়তো মেলেনি, তবে আশা ছাড়বেন না",
            preheader: "এবার মেলেনি — আপনার জন্য আরো উপযুক্ত বায়োডাটা অপেক্ষা করছে।",
            name: d.name,
            paragraphs: [
                `বায়োডাটা ${d.biodataNo ? bold(d.biodataNo) : ""}-এর পরিবার এই মুহূর্তে আপনার যোগাযোগের অনুরোধটি গ্রহণ করতে পারেননি। এতে মন খারাপ করবেন না — সঠিক মানুষটি নিশ্চয়ই কোথাও অপেক্ষা করছে।`,
            ],
            blocks: [{ type: "buttons", actions: [{ label: "আরো বায়োডাটা খুঁজুন", path: "/biodatas" }] }],
        },
    }),
    // TODO: C4 · owner hasn't answered; sent when the requester presses "remind".
    requestReminder: (d) => {
        const sentOn = (0, exports.formatDateBn)(d.sentAt);
        return {
            subject: "একটি যোগাযোগের অনুরোধ আপনার উত্তরের অপেক্ষায়",
            content: {
                icon: "bell",
                eyebrow: "রিমাইন্ডার",
                title: "একটি অনুরোধ আপনার উত্তরের অপেক্ষায়",
                preheader: "একজন সদস্য আপনার উত্তরের অপেক্ষায় আছেন।",
                name: d.name,
                paragraphs: [
                    `${sentOn ? `${bold(sentOn)} তারিখে ` : ""}একজন সদস্য আপনার বায়োডাটায় প্রস্তাব পাঠিয়েছেন এবং আপনার উত্তরের অপেক্ষায় আছেন।`,
                ],
                blocks: [
                    ...(d.senderNo ? [{ type: "biodata", id: d.senderNo }] : []),
                    {
                        type: "buttons",
                        actions: [
                            { label: "অনুরোধ দেখুন", path: "/user/account/bio-requests" },
                            { label: "বাতিল করুন", path: "/user/account/bio-requests", outline: true },
                        ],
                    },
                    { type: "note", html: "দ্রুত উত্তর দিলে উভয় পরিবারের সময় বাঁচে। আগ্রহ না থাকলে বিনয়ের সাথে অনুরোধটি বাতিল করতে পারেন।" },
                ],
            },
        };
    },
    // TODO: C2 · guardian contact bought; this is where the contact actually opens up.
    contactUnlocked: (d) => ({
        subject: "অভিভাবকের যোগাযোগ তথ্য এখন উন্মুক্ত",
        content: {
            icon: "check",
            eyebrow: "যোগাযোগ উন্মুক্ত",
            title: "অভিভাবকের যোগাযোগ তথ্য এখন উন্মুক্ত",
            preheader: `বায়োডাটা${d.biodataNo ? ` ${d.biodataNo}` : ""}-এর অভিভাবকের যোগাযোগ তথ্য এখন আপনার জন্য উন্মুক্ত।`,
            name: d.name,
            paragraphs: [
                `ধন্যবাদ! বায়োডাটা ${d.biodataNo ? bold(d.biodataNo) : ""}-এর অভিভাবকের যোগাযোগ তথ্য নিচে দেওয়া হলো। এই তথ্য আপনার অ্যাকাউন্টের "ক্রয়কৃত" অংশেও সবসময় দেখতে পাবেন।`,
            ],
            blocks: [
                ...(d.biodataNo ? [{ type: "biodata", id: d.biodataNo }] : []),
                {
                    type: "info",
                    title: "অভিভাবকের যোগাযোগ",
                    rows: [
                        { label: "নাম", value: d.guardian.name },
                        { label: "সম্পর্ক", value: d.guardian.relation },
                        { label: "মোবাইল", value: d.guardian.phone },
                        { label: "ইমেইল", value: d.guardian.email },
                    ],
                },
                { type: "notice", title: "যোগাযোগের শিষ্টাচার", text: "প্রথমবার যোগাযোগের সময় নিজের পরিচয় ও বায়োডাটা নম্বর জানান। পারিবারিকভাবে, সম্মানজনক উপায়ে কথা বলুন।" },
                { type: "buttons", actions: [{ label: "ক্রয়কৃত বায়োডাটা দেখুন", path: "/user/account/purchases" }] },
                { type: "note", html: `এই তথ্যের জন্য <strong>${(0, bibahoMail_1.toBanglaDigits)(d.spent)} পয়েন্ট</strong> খরচ হয়েছে। অবশিষ্ট পয়েন্ট: <strong>${(0, bibahoMail_1.escapeHtml)((0, bibahoMail_1.toBanglaDigits)(d.balance))}</strong>।` },
            ],
        },
    }),
    // TODO: P1 · bKash payment succeeded and points were credited.
    paymentSuccess: (d) => ({
        subject: `পেমেন্ট সফল — ${(0, bibahoMail_1.toBanglaDigits)(d.points)} পয়েন্ট যোগ হয়েছে`,
        content: {
            icon: "coins",
            eyebrow: "পেমেন্ট সফল",
            title: "ধন্যবাদ! আপনার পয়েন্ট যোগ হয়েছে",
            preheader: `বিকাশে ${(0, bibahoMail_1.formatTaka)(d.amount)} পেমেন্ট গৃহীত হয়েছে। রসিদ ভিতরে।`,
            name: d.name,
            paragraphs: [
                "আপনার বিকাশ পেমেন্ট সফলভাবে গৃহীত হয়েছে এবং পয়েন্ট আপনার অ্যাকাউন্টে যোগ করা হয়েছে। এখন আপনি পছন্দের বায়োডাটার অভিভাবকের সাথে যোগাযোগ করতে পারবেন।",
            ],
            blocks: [
                ...(d.balance !== undefined && d.balance !== null
                    ? [{ type: "stat", label: "বর্তমান পয়েন্ট ব্যালেন্স", value: d.balance, unit: "পয়েন্ট" }]
                    : []),
                {
                    type: "info",
                    title: "পেমেন্ট রসিদ",
                    rows: [
                        { label: "প্যাকেজ", value: `${(0, bibahoMail_1.toBanglaDigits)(d.points)} পয়েন্ট` },
                        { label: "পেমেন্ট মাধ্যম", value: "বিকাশ" },
                        { label: "ট্রানজেকশন আইডি", value: d.trxId },
                        { label: "তারিখ", value: (0, exports.formatDateBn)(d.paidAt || new Date(), true) },
                    ],
                    total: { label: "মোট পরিশোধিত", value: (0, bibahoMail_1.formatTaka)(d.amount) },
                },
                { type: "buttons", actions: [{ label: "বায়োডাটা খুঁজুন", path: "/biodatas" }] },
                {
                    type: "note",
                    html: `এই ইমেইলটি আপনার পেমেন্টের রসিদ হিসেবে সংরক্ষণ করুন। পেমেন্টের ৩ দিনের মধ্যে পেমেন্ট হিস্টোরি থেকে রিফান্ড অনুরোধ করা যাবে — বিস্তারিত জানতে আমাদের <a href="${bibahoMail_1.SITE_URL}/refund-policy" style="color:#4a5c61;font-weight:600;">রিফান্ড নীতিমালা</a> দেখুন।`,
                },
            ],
        },
    }),
    // TODO: P4 · refund sent back through bKash.
    refundCompleted: (d) => ({
        subject: "আপনার রিফান্ড সম্পন্ন হয়েছে",
        content: {
            icon: "refund",
            eyebrow: "রিফান্ড",
            title: "আপনার রিফান্ড সফলভাবে প্রক্রিয়া হয়েছে",
            preheader: `${(0, bibahoMail_1.formatTaka)(d.amount)} আপনার বিকাশ অ্যাকাউন্টে ফেরত পাঠানো হয়েছে।`,
            name: d.name,
            paragraphs: [
                "রিফান্ড নীতিমালা অনুযায়ী আপনার অনুরোধ যাচাই করে টাকা বিকাশের মাধ্যমে ফেরত পাঠানো হয়েছে। টাকা আপনার বিকাশ অ্যাকাউন্টে পৌঁছাতে কিছু সময় লাগতে পারে।",
            ],
            blocks: [
                {
                    type: "info",
                    title: "রিফান্ডের বিবরণ",
                    rows: [
                        { label: "রিফান্ড ট্রানজেকশন আইডি", value: d.refundTrxId },
                        { label: "মূল ট্রানজেকশন", value: d.originalTrxId },
                        { label: "ফেরতের মাধ্যম", value: "বিকাশ" },
                        { label: "সমন্বয়কৃত পয়েন্ট", value: d.pointsRemoved ? `−${(0, bibahoMail_1.toBanglaDigits)(d.pointsRemoved)} পয়েন্ট` : "" },
                        { label: "বর্তমান পয়েন্ট", value: d.balance === null || d.balance === undefined ? "" : (0, bibahoMail_1.toBanglaDigits)(d.balance) },
                    ],
                    total: { label: "ফেরতকৃত পরিমাণ", value: (0, bibahoMail_1.formatTaka)(d.amount) },
                },
                { type: "buttons", actions: [{ label: "লেনদেনের ইতিহাস দেখুন", path: "/user/account/payment-and-refund", outline: true }] },
            ],
        },
    }),
};
// TODO: sample data for the admin template gallery; mirrors the Figma example values.
const SAMPLE_NAME = "তানভীর আহমেদ";
exports.EMAIL_TEMPLATE_CATALOG = [
    { id: "welcome", code: "A1", name: "স্বাগতম", trigger: "Account created", sample: () => exports.emailTemplates.welcome({ name: SAMPLE_NAME }) },
    { id: "passwordReset", code: "A3", name: "পাসওয়ার্ড রিসেট", trigger: "Forgot password requested", sample: () => exports.emailTemplates.passwordReset({ name: SAMPLE_NAME, resetPath: "/forgot-password?token=sample" }) },
    { id: "biodataInReview", code: "B1", name: "বায়োডাটা জমা — পর্যালোচনাধীন", trigger: "Biodata sent for review", sample: () => exports.emailTemplates.biodataInReview({ name: SAMPLE_NAME, biodataNo: "10482" }) },
    { id: "biodataApproved", code: "B3", name: "বায়োডাটা অনুমোদিত", trigger: "Biodata published / changes approved", sample: () => exports.emailTemplates.biodataApproved({ name: SAMPLE_NAME, biodataNo: "10482" }) },
    {
        id: "biodataRejected",
        code: "B4",
        name: "সংশোধন প্রয়োজন",
        trigger: "Admin rejected biodata changes",
        sample: () => exports.emailTemplates.biodataRejected({
            name: SAMPLE_NAME,
            biodataNo: "10482",
            reason: "অভিভাবকের মোবাইল নম্বরে যোগাযোগ করা যায়নি\nপেশাগত তথ্য অংশের বিবরণ অসম্পূর্ণ",
        }),
    },
    { id: "requestReceived", code: "C1", name: "নতুন যোগাযোগের অনুরোধ", trigger: "A member sent a proposal", sample: () => exports.emailTemplates.requestReceived({ name: "নুসরাত জাহান", senderNo: "10482" }) },
    { id: "requestSent", code: "C1·", name: "প্রস্তাব পাঠানো হয়েছে", trigger: "Proposal sent (sender copy)", sample: () => exports.emailTemplates.requestSent({ name: SAMPLE_NAME, biodataNo: "20931", spent: 30, balance: 100 }) },
    { id: "requestAccepted", code: "C2", name: "অনুরোধ গৃহীত", trigger: "Owner accepted the proposal", sample: () => exports.emailTemplates.requestAccepted({ name: SAMPLE_NAME, biodataNo: "20931" }) },
    {
        id: "contactUnlocked",
        code: "C2·",
        name: "যোগাযোগ উন্মুক্ত",
        trigger: "Guardian contact bought",
        sample: () => exports.emailTemplates.contactUnlocked({
            name: SAMPLE_NAME,
            biodataNo: "20931",
            guardian: { name: "মোঃ রফিকুল ইসলাম", relation: "পিতা", phone: "+880 1711-XXXXXX" },
            spent: 70,
            balance: 60,
        }),
    },
    { id: "requestDeclined", code: "C3", name: "অনুরোধ গৃহীত হয়নি", trigger: "Owner declined the proposal", sample: () => exports.emailTemplates.requestDeclined({ name: SAMPLE_NAME, biodataNo: "20931" }) },
    { id: "requestReminder", code: "C4", name: "অনুরোধের উত্তর বাকি", trigger: "Requester sent a reminder", sample: () => exports.emailTemplates.requestReminder({ name: "নুসরাত জাহান", senderNo: "10482", sentAt: new Date(Date.now() - 5 * 864e5) }) },
    { id: "paymentSuccess", code: "P1", name: "পেমেন্ট সফল (রসিদ)", trigger: "bKash payment success", sample: () => exports.emailTemplates.paymentSuccess({ name: SAMPLE_NAME, amount: 500, points: 100, balance: 130, trxId: "BKX7H2K9QP" }) },
    {
        id: "refundCompleted",
        code: "P4",
        name: "রিফান্ড সম্পন্ন",
        trigger: "Refund processed",
        sample: () => exports.emailTemplates.refundCompleted({ name: SAMPLE_NAME, amount: 500, refundTrxId: "RF7Q2M1KZT", originalTrxId: "BKX7H2K9QP", pointsRemoved: 100, balance: 30 }),
    },
];
