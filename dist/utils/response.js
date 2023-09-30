"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbackAndRespond = void 0;
function rollbackAndRespond(res, db, err, responseObj) {
    db.rollback(() => {
        console.error("Transaction rolled back due to error:", err);
        if (responseObj) {
            res.status(500).json(responseObj);
        }
        else {
            res
                .status(500)
                .json({ success: false, message: "Internal Server Error", error: err });
        }
    });
}
exports.rollbackAndRespond = rollbackAndRespond;
