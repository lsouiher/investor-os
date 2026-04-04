import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../../shared/middleware/rbac.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import { PromptServiceType } from '@prisma/client';
import * as adminRepo from './repository.js';

const router = Router();

const VALID_SERVICE_TYPES = ['identity_synthesis', 'strategy_generation', 'simulation', 'insight', 'scoring'];

router.use(requireRole('admin'));

router.get('/prompt-templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceType = typeof req.query.service_type === 'string' ? req.query.service_type : undefined;
    if (serviceType && !VALID_SERVICE_TYPES.includes(serviceType)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid service_type filter.', 400);
    }
    const templates = await adminRepo.listPromptTemplates(serviceType as PromptServiceType | undefined);
    res.json({ data: templates });
  } catch (err) {
    next(err);
  }
});

router.get('/prompt-templates/:publicId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.params;
    if (!publicId) throw new AppError('VALIDATION_ERROR', 'Invalid template ID.', 400);

    const template = await adminRepo.getPromptTemplateByPublicId(String(publicId));
    if (!template) throw new AppError('NOT_FOUND', 'Template not found.', 404);

    res.json({
      data: {
        id: template.publicId,
        serviceType: template.serviceType,
        version: template.version,
        templateContent: template.templateContent,
        outputSchema: template.outputSchema,
        isActive: template.isActive,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/prompt-templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { service_type, template_content, output_schema } = req.body;
    if (!service_type || !VALID_SERVICE_TYPES.includes(service_type)) {
      throw new AppError('VALIDATION_ERROR', 'Valid service_type is required.', 400);
    }
    if (!template_content || typeof template_content !== 'string') {
      throw new AppError('VALIDATION_ERROR', 'template_content is required.', 400);
    }

    const template = await adminRepo.createPromptTemplate({
      serviceType: service_type as PromptServiceType,
      templateContent: template_content,
      outputSchema: output_schema,
    });
    res.status(201).json({
      data: {
        id: template.publicId,
        serviceType: template.serviceType,
        version: template.version,
        isActive: template.isActive,
        createdAt: template.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/prompt-templates/:publicId/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.params;
    if (!publicId) throw new AppError('VALIDATION_ERROR', 'Invalid template ID.', 400);

    const template = await adminRepo.activatePromptTemplate(String(publicId));
    if (!template) throw new AppError('NOT_FOUND', 'Template not found.', 404);

    res.json({ data: { id: template.publicId, service_type: template.serviceType, version: template.version, is_active: template.isActive } });
  } catch (err) {
    next(err);
  }
});

export default router;
