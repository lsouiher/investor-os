import { Router, Request, Response, NextFunction } from 'express';
import { ContactRoleType } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as contactService from './service.js';

const router = Router();

const VALID_ROLE_TYPES = new Set<string>([
  'agent', 'lender', 'contractor', 'attorney', 'cpa',
  'mentor', 'partner', 'seller', 'property_manager', 'other',
]);

// GET /contacts — list contacts with optional role_type filter
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roleTypeParam = req.query.role_type ? String(req.query.role_type) : undefined;

    if (roleTypeParam && !VALID_ROLE_TYPES.has(roleTypeParam)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid role_type.', 400);
    }

    const contacts = await contactService.listContacts(
      req.user!.userId,
      req.user!.tenantId,
      roleTypeParam as ContactRoleType | undefined,
    );
    res.json({ data: contacts });
  } catch (err) {
    next(err);
  }
});

// GET /contacts/network-score — get network score + gaps
router.get('/network-score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const score = await contactService.getNetworkScore(
      req.user!.userId,
      req.user!.tenantId,
    );
    res.json({ data: score });
  } catch (err) {
    next(err);
  }
});

// POST /contacts — create a new contact
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, roleType, notes, strategyRelevance, networkGapFilled } = req.body;

    if (!name || typeof name !== 'string') {
      throw new AppError('VALIDATION_ERROR', 'name is required.', 400);
    }
    if (!roleType || !VALID_ROLE_TYPES.has(roleType)) {
      throw new AppError('VALIDATION_ERROR', 'Valid role_type is required.', 400);
    }

    const contact = await contactService.createContact(
      req.user!.userId,
      req.user!.tenantId,
      { name, email, phone, roleType, notes, strategyRelevance, networkGapFilled },
    );
    res.status(201).json({ data: contact });
  } catch (err) {
    next(err);
  }
});

// PUT /contacts/:contactId — update a contact
router.put('/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactId = String(req.params.contactId);
    const { name, email, phone, roleType, notes, strategyRelevance, networkGapFilled, lastContactedAt } = req.body;

    if (roleType !== undefined && !VALID_ROLE_TYPES.has(roleType)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid role_type.', 400);
    }

    const contact = await contactService.updateContact(
      req.user!.userId,
      req.user!.tenantId,
      contactId,
      { name, email, phone, roleType, notes, strategyRelevance, networkGapFilled, lastContactedAt },
    );
    res.json({ data: contact });
  } catch (err) {
    next(err);
  }
});

// DELETE /contacts/:contactId — soft delete a contact
router.delete('/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactId = String(req.params.contactId);
    await contactService.deleteContact(
      req.user!.userId,
      req.user!.tenantId,
      contactId,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
