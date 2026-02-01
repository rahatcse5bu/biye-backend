export const GeneralInfoFields: string[] = [
	"user_id",
	"bio_type",
	"isMarriageDone",
	"date_of_birth",
	"height",
	"gender",
	"weight",
	"blood_group",
	"screen_color",
	"nationality",
	"marital_status",
	"religion",
	"religious_type",
	"request_practicing_status",
	"views_count",
	"purchases_count",
	"isFbPosted",
	"isFeatured",
];

// Religion constants
export const RELIGIONS = ["islam", "hinduism", "christianity"] as const;
export type Religion = typeof RELIGIONS[number];

export const RELIGIOUS_TYPES = [
	"practicing_muslim",
	"general_muslim",
	"practicing_hindu",
	"general_hindu",
	"practicing_christian",
	"general_christian",
] as const;
export type ReligiousType = typeof RELIGIOUS_TYPES[number];
