import { Request, Response } from 'express';
import db from '../../../config/db';
import { RowDataPacket } from 'mysql2';
import { sendSuccess } from '../../../shared/SendSuccess';

const getPersonalInfo = (req: Request, res: Response) => {
  const sql = 'SELECT * FROM personal_info';
  db.query<RowDataPacket[]>(sql, (err, rows) => {
    if (err) {
      res.send({
        message: err?.message,
        success: false,
      });
    }

    res.status(200).json(sendSuccess<RowDataPacket[]>('All personal info retrieved successfully', rows));
  });
};

const getSinglePersonalInfo = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID as a route parameter
  const sql = 'SELECT * FROM personal_info WHERE id = ?';

  db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Personal info not found',
        success: false,

      });
    }

    res.status(200).json(sendSuccess<RowDataPacket[]>('Personal info retrieved', rows, 200));
  });
};

const createPersonalInfo = (req: Request, res: Response) => {
  const data = req.body;
  // Insert personal information into the database
  const insertSql = `INSERT INTO personal_info (
    user_id,
    outside_clothings,
    isBeard,
    from_beard,
    isTakhnu,
    isDailyFive,
    isDailyFiveJamaat,
    daily_five_jamaat_from,
    daily_five_from,
    qadha_weekly,
    mahram_non_mahram,
    quran_tilawat,
    fiqh,
    aqidah,
    natok_cinema,
    physical_problem,
    mental_problem,
    special_deeni_mehnot,
    mazar,
    islamic_books,
    islamic_scholars,
    my_categories,
    about_me,
    my_phone,
    my_email,
    photo,
    isNeshaDrobbo,
    isSunnotiBiya,
    devorced_reason,
    children_details
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

  db.query(
    insertSql,
    [
      data.user_id,
      data.outside_clothings,
      data.isBeard,
      data.from_beard,
      data.isTakhnu,
      data.isDailyFive,
      data.isDailyFiveJamaat,
      data.daily_five_jamaat_from,
      data.daily_five_from,
      data.qadha_weekly,
      data.mahram_non_mahram,
      data.quran_tilawat,
      data.fiqh,
      data.aqidah,
      data.natok_cinema,
      data.physical_problem,
      data.mental_problem,
      data.special_deeni_mehnot,
      data.mazar,
      data.islamic_books,
      data.islamic_scholars,
      data.my_categories,
      data.about_me,
      data.my_phone,
      data.my_email,
      data.photo,
      data.isNeshaDrobbo,
      data.isSunnotiBiya,
      data.devorced_reason,
      data.children_details,
    ],
    (err, results) => {
      if (err) {
        console.error('Error inserting personal info:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      } else {
        res.status(201).json({ success: true, message: 'Personal info created successfully' });
      }
    }
  );
};

const updatePersonalInfo = (req: Request, res: Response) => {
  const data = req.body;
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Begin a database transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    // Check if personal info for the user with the given ID exists
    const checkUserSql = 'SELECT * FROM personal_info WHERE id = ?';
    db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
      if (err) {
        console.error('Error checking personal info:', err);
        db.rollback(() => {
          res.status(500).json({ success: false, message: err?.message });
        });
        return;
      }

      const userCount = userResults.length;

      // If personal info doesn't exist, send an error response
      if (userCount === 0) {
        db.rollback(() => {
          res.status(404).json({ success: false, message: 'Personal info not found' });
        });
        return;
      }

      const currentUserData = userResults[0];

      // Build the update SQL statement dynamically based on changed values
      const updateFields = [];
      const updateValues = [];

      for (const key in data) {
        if ( data[key]  && (data[key] !== currentUserData[key])) {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key]);
        }
      }

      if (updateFields.length === 0) {
        // No fields to update
        db.commit(() => {
          res.status(200).json({ success: true, message: 'No changes to update' });
        });
        return;
      }

      // Construct the final update SQL statement
      const updateSql = `UPDATE personal_info SET ${updateFields.join(', ')} WHERE id = ?`;

      updateValues.push(userId);

      // Execute the update query within the transaction
      db.query(
        updateSql,
        updateValues,
        (err, results) => {
          if (err) {
            console.error('Error updating personal info:', err);
            db.rollback(() => {
              res.status(500).json({ success: false, message: 'Internal Server Error' });
            });
          } else {
            // Commit the transaction if the update was successful
            db.commit(() => {
              res.status(200).json(sendSuccess("Update sucessfully completed",results,200));
            });
          }
        }
      );
    });
  });
};

const deletePersonalInfo = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if personal info for the user with the given ID exists
  const checkUserSql = 'SELECT COUNT(*) AS userCount FROM personal_info WHERE id = ?';
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error('Error checking personal info:', err);
      return res.status(500).json({ success: false, message: err?.message });
    }

    const userCount = userResults[0].userCount;

    // If personal info doesn't exist, send an error response
    if (userCount === 0) {
      return res.status(404).json({ success: false, message: 'Personal info not found' });
    }

    // If personal info exists, proceed with the deletion
    const deleteSql = 'DELETE FROM personal_info WHERE id = ?';
    db.query(deleteSql, [userId], (err, results) => {
      if (err) {
        console.error('Error deleting personal info:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      } else {
        res.status(200).json({ success: true, message: 'Personal info deleted successfully' });
      }
    });
  });
};

export const PersonalInfoController = {
  getPersonalInfo,
  getSinglePersonalInfo,
  createPersonalInfo,
  updatePersonalInfo,
  deletePersonalInfo,
};
