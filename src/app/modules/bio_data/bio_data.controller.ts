import { RowDataPacket } from "mysql2";
import { sendSuccess } from "../../../shared/SendSuccess";
import db from "../../../config/db";
import { Request, Response } from "express";

const getBioData = (req: Request, res: Response) => {
	const bioId = req.params.id;
	let bioData = {};

	db.beginTransaction((err) => {
		if (err) {
			console.log(err);
			return res
				.status(500)
				.json({ success: false, message: "Internal server error" });
		}
		const userInfoSql =
			"SELECT email,username,phone FROM user_info where id = ? ";
		db.query<RowDataPacket[]>(userInfoSql, [bioId], (err, userInfo) => {
			if (err) {
				console.log(err);
				// Rollback the transaction in case of an error

				db.rollback(() => {
					console.log("Transaction rolled back.");
					return res
						.status(500)
						.json({ success: false, message: "Internal server error" });
				});
			} else {
				bioData = {
					userInfo: userInfo[0],
				};

				const personalInfoSql = "SELECT * FROM personal_info WHERE user_id = ?";
				db.query<RowDataPacket[]>(
					personalInfoSql,
					[bioId],
					(err, personalInfo) => {
						if (err) {
							console.log(err);
							// Rollback the transaction in case of an error
							db.rollback(() => {
								console.log("Transaction rolled back.");
								return res
									.status(500)
									.json({ success: false, message: "Internal server error" });
							});
						} else {
							bioData = {
								...bioData,
								personalInfo: personalInfo[0],
							};

							const generalInfoSql =
								"SELECT * FROM general_info WHERE user_id = ?";
							db.query<RowDataPacket[]>(
								generalInfoSql,
								[bioId],
								(err, generalInfo) => {
									if (err) {
										console.log(err);
										// Rollback the transaction in case of an error
										db.rollback(() => {
											console.log("Transaction rolled back.");
											return res.status(500).json({
												success: false,
												message: "Internal server error",
											});
										});
									} else {
										bioData = {
											...bioData,
											generalInfo: generalInfo[0],
										};

										const educationQualificationSql =
											"SELECT * FROM educational_qualification WHERE user_id = ?";
										db.query<RowDataPacket[]>(
											educationQualificationSql,
											[bioId],
											(err, educationQualification) => {
												if (err) {
													console.log(err);
													// Rollback the transaction in case of an error
													db.rollback(() => {
														console.log("Transaction rolled back.");
														return res.status(500).json({
															success: false,
															message: "Internal server error",
														});
													});
												} else {
													bioData = {
														...bioData,
														educationQualification: educationQualification[0],
													};
													const addressSql =
														"SELECT * FROM address WHERE user_id = ?";
													db.query<RowDataPacket[]>(
														addressSql,
														[bioId],
														(err, address) => {
															if (err) {
																console.log(err);
																// Rollback the transaction in case of an error
																db.rollback(() => {
																	console.log("Transaction rolled back.");
																	return res.status(500).json({
																		success: false,
																		message: "Internal server error",
																	});
																});
															} else {
																bioData = {
																	...bioData,
																	address: address[0],
																};
																const occupationSql =
																	"SELECT * FROM occupation WHERE user_id = ?";
																db.query<RowDataPacket[]>(
																	occupationSql,
																	[bioId],
																	(err, occupation) => {
																		if (err) {
																			console.log(err);
																			// Rollback the transaction in case of an error
																			db.rollback(() => {
																				console.log("Transaction rolled back.");
																				return res.status(500).json({
																					success: false,
																					message: "Internal server error",
																				});
																			});
																		} else {
																			bioData = {
																				...bioData,
																				occupation: occupation[0],
																			};

																			const expectedLifePartnerSql =
																				"SELECT * FROM expected_lifepartner WHERE user_id =? ";
																			db.query<RowDataPacket[]>(
																				expectedLifePartnerSql,
																				[bioId],
																				(err, expectedLifePartner) => {
																					if (err) {
																						console.log(err);
																						// Rollback the transaction in case of an error
																						db.rollback(() => {
																							console.log(
																								"Transaction rolled back."
																							);
																							return res.status(500).json({
																								success: false,
																								message:
																									"Internal server error",
																							});
																						});
																					} else {
																						bioData = {
																							...bioData,
																							expectedLifePartner:
																								expectedLifePartner[0],
																						};

																						const familyStatusSql =
																							"select * from family_status where user_id = ?";
																						db.query<RowDataPacket[]>(
																							familyStatusSql,
																							[bioId],
																							(err, familyStatus) => {
																								if (err) {
																									console.log(err);
																									// Rollback the transaction in case of an error
																									db.rollback(() => {
																										console.log(
																											"Transaction rolled back."
																										);
																										return res
																											.status(500)
																											.json({
																												success: false,
																												message:
																													"Internal server error",
																											});
																									});
																								} else {
																									bioData = {
																										...bioData,
																										familyStatus:
																											familyStatus[0],
																									};

																									const maritalInfoSql =
																										"SELECT * FROM marital_info WHERE user_id =?";
																									db.query<RowDataPacket[]>(
																										maritalInfoSql,
																										[bioId],
																										(err, maritalInfo) => {
																											if (err) {
																												console.log(err);
																												// Rollback the transaction in case of an error
																												db.rollback(() => {
																													console.log(
																														"Transaction rolled back."
																													);
																													return res
																														.status(500)
																														.json({
																															success: false,
																															message:
																																"Internal server error",
																														});
																												});
																											} else {
																												bioData = {
																													...bioData,
																													maritalInfo:
																														maritalInfo[0],
																												};
																												const ongikarNamaSql =
																													"SELECT * FROM ongikar_nama WHERE user_id = ?";
																												db.query<
																													RowDataPacket[]
																												>(
																													ongikarNamaSql,
																													[bioId],
																													(
																														err,
																														ongikarNama
																													) => {
																														if (err) {
																															console.log(err);
																															// Rollback the transaction in case of an error
																															db.rollback(
																																() => {
																																	console.log(
																																		"Transaction rolled back."
																																	);
																																	return res
																																		.status(500)
																																		.json({
																																			success:
																																				false,
																																			message:
																																				"Internal server error",
																																		});
																																}
																															);
																														} else {
																															bioData = {
																																...bioData,
																																ongikarNama:
																																	ongikarNama[0],
																															};
																															const updateViews = `UPDATE general_info SET views=views+1 where user_id=?`;
																															db.query(
																																updateViews,
																																[bioId],
																																(err, rows) => {
																																	if (err) {
																																		// Rollback the transaction in case of an error
																																		db.rollback(
																																			() => {
																																				console.log(
																																					"Transaction rolled back."
																																				);
																																				return res
																																					.status(
																																						500
																																					)
																																					.json(
																																						{
																																							success:
																																								false,
																																							message:
																																								"Internal server error",
																																						}
																																					);
																																			}
																																		);
																																	} else {
																																		db.commit(
																																			(err) => {
																																				if (
																																					err
																																				) {
																																					console.log(
																																						err
																																					);
																																					db.rollback(
																																						() => {
																																							console.log(
																																								"Transaction rolled back."
																																							);
																																							return res
																																								.status(
																																									500
																																								)
																																								.json(
																																									{
																																										success:
																																											false,
																																										message:
																																											"Internal server error",
																																									}
																																								);
																																						}
																																					);
																																				} else {
																																					return res
																																						.status(
																																							200
																																						)
																																						.json(
																																							sendSuccess(
																																								"Retrieved bio data successfully",
																																								bioData,
																																								200
																																							)
																																						);
																																				}
																																			}
																																		);
																																	}
																																}
																															);
																														}
																													}
																												);
																											}
																										}
																									);
																								}
																							}
																						);
																					}
																				}
																			);
																		}
																	}
																);
															}
														}
													);
												}
											}
										);
									}
								}
							);
						}
					}
				);
			}
		});
	});
};

export const BioDataController = {
	getBioData,
};
