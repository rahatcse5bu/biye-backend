export const PaymentsFields = [
	"transaction_id",
	"method",
	"user_id",
	"amount",
	"status",
	"bio_id",
	"trnx_time",
];

export const amountToPoints: { [key: number]: string } = {
	30: "35",
	100: "120",
	300: "345",
	500: "560",
};
