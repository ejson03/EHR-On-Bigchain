import { Router } from 'express';
import { chatbotController } from '../controllers';

const chatbotRouter: Router = Router();

chatbotRouter.post('/upload', chatbotController.addRecord);
chatbotRouter.post('/getall', chatbotController.getAll);

export default chatbotRouter;
