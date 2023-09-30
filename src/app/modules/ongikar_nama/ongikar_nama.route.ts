import express from 'express';
import { OngikarNamaController } from './ongikar_nama.controller';
const ongikarNamaRouter = express.Router();

ongikarNamaRouter
  .route('/')
  .get(OngikarNamaController.getOngikarNama)
  .post(OngikarNamaController.createOngikarNama);

ongikarNamaRouter
  .route('/:id')
  .get(OngikarNamaController.getSingleOngikarNama)
  .put(OngikarNamaController.updateOngikarNama)
  .delete(OngikarNamaController.deleteOngikarNama);

export default ongikarNamaRouter;
