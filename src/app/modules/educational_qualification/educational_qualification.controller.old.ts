// import { Request, Response } from "express";
// import db from "../../../config/db";
// import { RowDataPacket } from "mysql2";
// import { sendSuccess } from "../../../shared/SendSuccess";
// import { generatePlaceholders } from "../../../utils/generatePlaceholders";
// import { EducationalQualificationFields } from "./educational_qualification.constant";
// import httpStatus from "http-status";
// import { rollbackAndRespond } from "../../../utils/response";
// import { JwtPayload } from "jsonwebtoken";

// const getEducationalQualification = (req: Request, res: Response) => {
//   const sql = "SELECT * FROM educational_qualification";
//   db.query<RowDataPacket[]>(
//     sql,
//     (err: { message: any }, rows: RowDataPacket[]) => {
//       if (err) {
//         res.send({
//           message: err?.message,
//           success: false,
//         });
//       }

//       res
//         .status(200)
//         .json(
//           sendSuccess<RowDataPacket[]>(
//             "All Educational qualification  retrieved successfully",
//             rows
//           )
//         );
//     }
//   );
// };

// const getSingleEducationalQualification = (req: Request, res: Response) => {
//   const userId = req.params.id; // Assuming you pass the user ID as a route parameter
//   const sql = "SELECT * FROM educational_qualification WHERE id = ?";

//   db.query<RowDataPacket[]>(
//     sql,
//     [userId],
//     (err: { message: any }, rows: string | any[]) => {
//       if (err) {
//         return res.status(500).json({
//           message: err?.message,
//           success: false,
//         });
//       }

//       if (rows.length === 0) {
//         return res.status(404).json({
//           message: "Educational qualification not found",
//           success: false,
//         });
//       }

//       res
//         .status(200)
//         .json(
//           sendSuccess<RowDataPacket[]>(
//             "Educational qualification retrieved",
//             rows,
//             200
//           )
//         );
//     }
//   );
// };

// const createEducationalQualification = (req: Request, res: Response) => {
//   const data = req.body;
//   const token_id = req.user?.token_id;
//   let { user_form, ...others } = data;

//   let user_id: string | null = null;
//   // console.log(req.user);
//   if (!token_id) {
//     return res.status(401).send({
//       statusCode: httpStatus.UNAUTHORIZED,
//       message: "You are not authorized",
//       success: false,
//     });
//   }

//   db.beginTransaction((err: any) => {
//     if (err) {
//       console.error("Error starting transaction:", err);
//       return res
//         .status(500)
//         .json({ success: false, message: "Internal Server Error", error: err });
//     }

//     //! get user_id using token_id
//     const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
//     db.query<RowDataPacket[]>(
//       getUserIdByTokenSql,
//       [token_id],
//       (err: any, result: { id: string | null }[]) => {
//         if (err) {
//           return rollbackAndRespond(res, db, null, {
//             success: false,
//             message: "You are not authorized",
//             error: err,
//           });
//         }
//         //console.log(result);

//         user_id = result[0]?.id;

//         //! Check if the user_id already exists in the database

//         const checkSql =
//           "SELECT COUNT(*) AS count FROM educational_qualification WHERE user_id = ?";

//         db.query<RowDataPacket[]>(
//           checkSql,
//           [user_id],
//           (err: any, results: { count: any }[]) => {
//             if (err) {
//               console.error("Error checking User Id:", err);
//               return rollbackAndRespond(res, db, err);
//             }

//             const count = results[0].count;

//             if (count > 0) {
//               //! User with this user_id already exists, return an error response
//               return rollbackAndRespond(res, db, null, {
//                 success: false,
//                 message: "User with this user id already exists",
//               });
//             }

//             others = {
//               ...others,
//               user_id,
//             };

//             const keys = Object.keys(others);
//             const values = Object.values(others);

//             //! Insert Educational qualification into the database
//             const insertSql = `INSERT INTO educational_qualification (${keys.join(
//               ","
//             )}) VALUES (${generatePlaceholders(values.length)})`;
//             const educationalQualification: string[] = [];
//             keys.forEach((field) => {
//               educationalQualification.push(others[field]);
//             });

//             //! Insert educational qualification information
//             db.query(
//               insertSql,
//               educationalQualification,
//               (err: any, results: any) => {
//                 if (err) {
//                   console.error("Error inserting General info:", err);
//                   return rollbackAndRespond(res, db, err);
//                 }

//                 //! Update the fields edited_timeline_index and last_edited_timeline_index of user_info table
//                 const updateUserInfoSql = `
//             UPDATE user_info SET edited_timeline_index = CASE WHEN ${user_form} > edited_timeline_index THEN ${user_form} ELSE edited_timeline_index END,last_edited_timeline_index = ${user_form} WHERE id=?
//           `;
//                 db.query(
//                   updateUserInfoSql,
//                   [user_id],
//                   (err: any, results: any) => {
//                     if (err) {
//                       console.error("Error updating user_info:", err);
//                       return rollbackAndRespond(res, db, err);
//                     }

//                     // Commit the transaction if everything is successful
//                     db.commit((err: any) => {
//                       if (err) {
//                         console.error("Error committing transaction:", err);
//                         return rollbackAndRespond(res, db, err);
//                       }

//                       res.status(201).json({
//                         success: true,
//                         message:
//                           "General info created and user_info updated successfully",
//                       });
//                     });
//                   }
//                 );
//               }
//             );
//           }
//         );
//       }
//     );
//   });
// };

// const updateEducationalQualification = (req: Request, res: Response) => {
//   const data = req.body;
//   const token_id = (req.user?.token_id as JwtPayload) ?? null;
//   let user_id: number | null = null;
//   if (!token_id) {
//     return res.status(401).send({
//       statusCode: httpStatus.UNAUTHORIZED,
//       message: "You are not authorized",
//       success: false,
//     });
//   }

//   //! Begin a database transaction
//   db.beginTransaction((err: any) => {
//     if (err) {
//       console.error("Error starting transaction:", err);
//       return res
//         .status(500)
//         .json({ success: false, message: "Internal Server Error", error: err });
//     }
//     // get user id using token id
//     const getUserIdByTokenSql = `select id from user_info where token_id = ?`;
//     db.query<RowDataPacket[]>(
//       getUserIdByTokenSql,
//       [token_id],
//       (err: any, result: { id: any }[]) => {
//         if (err) {
//           return rollbackAndRespond(res, db, null, {
//             success: false,
//             message: "You are not authorized",
//             error: err,
//           });
//         }

//         console.log(result);

//         user_id = Number(result[0]?.id);

//         if (isNaN(user_id)) {
//           return rollbackAndRespond(res, db, null, {
//             success: false,
//             message: "You are not authorized",
//             error: err,
//           });
//         }
//         //! Check if General info for the user with the given ID exists
//         const checkUserSql =
//           "SELECT user_id FROM educational_qualification WHERE user_id = ?";

//         db.query<RowDataPacket[]>(
//           checkUserSql,
//           [user_id],
//           (err: { message: any }, userResults: string | any[]) => {
//             if (err) {
//               console.error("Error checking address info:", err);
//               db.rollback(() => {
//                 res.status(500).json({ success: false, message: err?.message });
//               });
//               return;
//             }

//             const userCount = userResults.length;

//             //! If address info doesn't exist, send an error response
//             if (userCount === 0) {
//               db.rollback(() => {
//                 res
//                   .status(404)
//                   .json({ success: false, message: "Address info not found" });
//               });
//               return;
//             }

//             //! Build the update SQL statement dynamically based on changed values
//             const updateFields: string[] = [];
//             const updateValues = [];

//             Object.keys(data).forEach((key) => {
//               updateFields.push(`${key} = ?`);
//               updateValues.push(data[key]);
//             });

//             if (updateFields.length === 0) {
//               // No fields to update
//               db.commit(() => {
//                 res
//                   .status(200)
//                   .json({ success: true, message: "No changes to update" });
//               });
//               return;
//             }

//             // Construct the final update SQL statement
//             const updateSql = `UPDATE educational_qualification SET ${updateFields.join(
//               ", "
//             )} WHERE user_id = ?`;

//             updateValues.push(user_id);

//             // Execute the update query within the transaction
//             db.query(updateSql, updateValues, (err: any, results: any) => {
//               if (err) {
//                 console.error("Error updating educational qualification:", err);
//                 db.rollback(() => {
//                   res.status(500).json({
//                     success: false,
//                     message: "Internal Server Error",
//                     error: err,
//                   });
//                 });
//               } else {
//                 // Commit the transaction if the update was successful
//                 db.commit(() => {
//                   res.status(200).json({
//                     message: "Update successfully completed",
//                     success: true,
//                     data: results,
//                   });
//                 });
//               }
//             });
//           }
//         );
//       }
//     );
//   });
// };

// const deleteEducationalQualification = (req: Request, res: Response) => {
//   const userId = req.params.id; // Assuming you pass the user ID in the URL

//   // Check if educational_qualification for the user with the given ID exists
//   const checkUserSql =
//     "SELECT COUNT(*) AS userCount FROM educational_qualification WHERE id = ?";
//   db.query<RowDataPacket[]>(
//     checkUserSql,
//     [userId],
//     (err: { message: any }, userResults: { userCount: any }[]) => {
//       if (err) {
//         console.error("Error checking Educational qualification:", err);
//         return res.status(500).json({ success: false, message: err?.message });
//       }

//       const userCount = userResults[0].userCount;

//       // If educational_qualification doesn't exist, send an error response
//       if (userCount === 0) {
//         return res.status(404).json({
//           success: false,
//           message: "educational_qualification not found",
//         });
//       }

//       // If Educational qualification exists, proceed with the deletion
//       const deleteSql = "DELETE FROM educational_qualification WHERE id = ?";
//       db.query(deleteSql, [userId], (err: any, results: any) => {
//         if (err) {
//           console.error("Error deleting Educational qualification:", err);
//           res
//             .status(500)
//             .json({ success: false, message: "Internal Server Error" });
//         } else {
//           res.status(200).json({
//             success: true,
//             message: "Educational qualification deleted successfully",
//           });
//         }
//       });
//     }
//   );
// };

// const getEducationalQualificationByUserId = (req: Request, res: Response) => {
//   const userId = req.params.id; // Assuming the user_id is in the route parameter
//   const sql = "SELECT * FROM educational_qualification WHERE user_id = ?";
//   db.query<RowDataPacket[]>(
//     sql,
//     [userId],
//     (err: { message: any }, rows: string | any[]) => {
//       if (err) {
//         res.send({
//           message: err?.message,
//           success: false,
//         });
//       } else {
//         if (rows.length === 0) {
//           res.status(404).json({
//             message:
//               "Educational qualification not found for the specified user_id",
//             success: false,
//           });
//         } else {
//           res.status(200).json({
//             message: "Educational qualification retrieved successfully",
//             success: true,
//             data: rows[0], // Assuming you expect only one row per user_id
//           });
//         }
//       }
//     }
//   );
// };

// export const EducationalQualificationController = {
//   getEducationalQualification,
//   getSingleEducationalQualification,
//   createEducationalQualification,
//   updateEducationalQualification,
//   deleteEducationalQualification,
//   getEducationalQualificationByUserId,
// };
