import express from 'express';
import { OccupationController } from './occupation.controller';
const OccupationRouter = express.Router();

OccupationRouter
  .route('/')
  .get(OccupationController.getOccupation)
  .post(OccupationController.createOccupation);

OccupationRouter
  .route('/:id')
  .get(OccupationController.getSingleOccupation)
  .put(OccupationController.updateOccupation)
  .delete(OccupationController.deleteOccupation);

export default OccupationRouter;
