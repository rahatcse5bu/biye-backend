import express from 'express';
import { PersonalInfoController } from './personal_info.controller'; // Replace with the actual path

const personalInfoRouter = express.Router();

personalInfoRouter
  .route('/')
  .get(PersonalInfoController.getPersonalInfo)
  .post(PersonalInfoController.createPersonalInfo);

personalInfoRouter
  .route('/:id')
  .get(PersonalInfoController.getSinglePersonalInfo)
  .put(PersonalInfoController.updatePersonalInfo)
  .delete(PersonalInfoController.deletePersonalInfo);

export default personalInfoRouter;
