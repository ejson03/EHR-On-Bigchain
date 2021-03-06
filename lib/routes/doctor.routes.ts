import { Router, Request, Response } from 'express';
import { doctorController } from '../controllers';
import fileUpload from '../middleware/file-upload';

const doctorRouter: Router = Router();

doctorRouter.get('/list', doctorController.getFiles);

doctorRouter.get('/home', doctorController.getDetails);

doctorRouter.post('/prescribe', doctorController.getPrescription);

doctorRouter.post('/prescription', fileUpload.any(), doctorController.postPrescription);

doctorRouter.get('/profileupdate', function (req: Request, res: Response) {
   res.render('doctor/profileupdate.ejs', { data: req.user?.user, name: req.user?.user.name });
});

doctorRouter.get('/chatbot', function (req: Request, res: Response) {
   res.render('doctor/chatbot.ejs', { name: req.user?.user.name });
});

export default doctorRouter;
