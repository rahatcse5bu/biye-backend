import { Request, Response } from 'express';
import db from '../../../config/db';
import { RowDataPacket } from 'mysql2';
import { sendSuccess } from '../../../shared/SendSuccess';

const getOngikarNama = (req: Request, res: Response) => {
  const sql = 'SELECT * FROM ongikar_nama';
  db.query<RowDataPacket[]>(sql, (err, rows) => {
    if (err) {
      res.send({
        message: err?.message,
        success: false,
      });
    }

    res.status(200).json(sendSuccess<RowDataPacket[]>('All Ongikar nama  retrieved successfully', rows));
  });
};

const getSingleOngikarNama = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID as a route parameter
  const sql = 'SELECT * FROM ongikar_nama WHERE id = ?';

  db.query<RowDataPacket[]>(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: err?.message,
        success: false,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Ongikar nama not found',
        success: false,

      });
    }

    res.status(200).json(sendSuccess<RowDataPacket[]>('Ongikar nama retrieved', rows, 200));
  });
};

const createOngikarNama = (req: Request, res: Response) => {
  const data = req.body;
  // Insert Ongikar namarmation into the database
  const insertSql = `INSERT INTO ongikar_nama (
    	user_id,isFamilyAware,isTrueData,isFamilyAgree
  ) VALUES (?, ?, ?, ?)`;

  db.query(
    insertSql,
   [
    data.user_id,
    data.isFamilyAware,
    data.isTrueData,
    data.isFamilyAgree
   ],
    (err, results) => {
      if (err) {
        console.error('Error inserting Ongikar nama:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      } else {
        res.status(201).json({ success: true, message: 'Ongikar nama created successfully' });
      }
    }
  );
};

const updateOngikarNama = (req: Request, res: Response) => {
  const data = req.body;
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  console.log(data);

  // Begin a database transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    // Check if Ongikar nama for the user with the given ID exists
    const checkUserSql = 'SELECT * FROM ongikar_nama WHERE id = ?';
    db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
      if (err) {
        console.error('Error checking Ongikar nama:', err);
        db.rollback(() => {
          res.status(500).json({ success: false, message: err?.message });
        });
        return;
      }

      const userCount = userResults.length;

      // If Ongikar nama doesn't exist, send an error response
      if (userCount === 0) {
        db.rollback(() => {
          res.status(404).json({ success: false, message: 'Ongikar nama not found' });
        });
        return;
      }

      const currentUserData = userResults[0];

      // Build the update SQL statement dynamically based on changed values
      const updateFields: string[] = [];
      const updateValues = [];

      Object.keys(data).forEach(key => {
        updateFields.push(`${key} = ?`);
        updateValues.push(data[key]);
      });

      if (updateFields.length === 0) {
        // No fields to update
        db.commit(() => {
          res.status(200).json({ success: true, message: 'No changes to update' });
        });
        return;
      }

      // Construct the final update SQL statement
      const updateSql = `UPDATE ongikar_nama SET ${updateFields.join(', ')} WHERE id = ?`;

      updateValues.push(userId);

      // Execute the update query within the transaction
      db.query(
        updateSql,
        updateValues,
        (err, results) => {
          if (err) {
            console.error('Error updating Ongikar nama:', err);
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

const deleteOngikarNama = (req: Request, res: Response) => {
  const userId = req.params.id; // Assuming you pass the user ID in the URL

  // Check if Ongikar nama for the user with the given ID exists
  const checkUserSql = 'SELECT COUNT(*) AS userCount FROM ongikar_nama WHERE id = ?';
  db.query<RowDataPacket[]>(checkUserSql, [userId], (err, userResults) => {
    if (err) {
      console.error('Error checking Ongikar nama:', err);
      return res.status(500).json({ success: false, message: err?.message });
    }

    const userCount = userResults[0].userCount;

    // If Ongikar nama doesn't exist, send an error response
    if (userCount === 0) {
      return res.status(404).json({ success: false, message: 'Ongikar nama not found' });
    }

    // If Ongikar nama exists, proceed with the deletion
    const deleteSql = 'DELETE FROM ongikar_nama WHERE id = ?';
    db.query(deleteSql, [userId], (err, results) => {
      if (err) {
        console.error('Error deleting Ongikar nama:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      } else {
        res.status(200).json({ success: true, message: 'Ongikar nama deleted successfully' });
      }
    });
  });
};

export const OngikarNamaController = {
  getOngikarNama,
  getSingleOngikarNama,
  createOngikarNama,
  updateOngikarNama,
  deleteOngikarNama,
};
