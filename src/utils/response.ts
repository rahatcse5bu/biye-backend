import { Response } from "express";

export function rollbackAndRespond(
	res: Response,
	db: any,
	err: any,
	responseObj?: any
) {
	db.rollback(() => {
		console.error("Transaction rolled back due to error:", err);
		if (responseObj) {
			res.status(500).json(responseObj);
		} else {
			res
				.status(500)
				.json({ success: false, message: "Internal Server Error", error: err });
		}
	});
}
