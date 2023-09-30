import { Request, Response } from 'express';
import db from '../../../config/db';
import { RowDataPacket } from 'mysql2';
import { sendSuccess } from '../../../shared/SendSuccess';
import { PersonalInfoFields } from './personal_info.constant';
import { generatePlaceholders } from '../../../utils/generatePlaceholders';

const getPersonalInfo = (req: Request, res: Response) => {
  const sql = 'SELECT * FROM personal_info';
  db.query<RowDataPacket[]>(sql, (err, rows) => {
    if (err) {
      res.send({
        message: err?.message,
        success: false,
        error:err
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
        error:err
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
  const user_id = data.user_id; // Assuming user_id is in the request body

  // Check if user_id exists in the personal_info table
  const checkIfExistsSql = `SELECT COUNT(*) AS count FROM personal_info WHERE user_id = ?`;

  db.query<RowDataPacket[]>(checkIfExistsSql, [user_id], (err, results) => {
    if (err) {
      console.error('Error checking user_id existence:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error', error: err });
    } else {
      const count = results[0].count;
      if (count > 0) {
        // User_id already exists, return an error response
        res.status(400).json({ success: false, message: 'User_id already exists' });
      } else {
        // User_id does not exist, proceed with inserting personal info
        const insertSql = `INSERT INTO personal_info (${PersonalInfoFields.join(',')}) VALUES (${generatePlaceholders(PersonalInfoFields.length)})`;

        const personalInfo:string[] = [];
        PersonalInfoFields.forEach((field) => {
          if (data[field]) {
            personalInfo.push(data[field]);
          } else {
            personalInfo.push('');
          }
        });

        db.query(insertSql, personalInfo, (err, results) => {
          if (err) {
            console.error('Error inserting personal info:', err);
            res.status(500).json({ success: false, message: 'Internal Server Error', error: err });
          } else {
            res.status(201).json({ success: true, message: 'Personal info created successfully' });
          }
        });
      }
    }
  });
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
