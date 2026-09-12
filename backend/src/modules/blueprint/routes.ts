import { Router, Request, Response, NextFunction } from 'express';
import * as blueprintService from './service.js';

const router = Router();

// POST /blueprint/generate — generate Investment Blueprint PDF
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdfBuffer = await blueprintService.generateBlueprint(
      req.user!.userId,
      req.user!.tenantId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="investment-blueprint.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;
