const { z } = require('zod');

// Auth Validators
const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};

// User Validators
const createUserSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']),
    baseId: z.string().optional().nullable(),
    rank: z.string().optional(),
    serviceId: z.string().optional(),
  }),
};

const updateUserSchema = {
  body: z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']).optional(),
    baseId: z.string().optional().nullable(),
    rank: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

// Purchase Validators
const createPurchaseSchema = {
  body: z.object({
    purchaseDate: z.string().or(z.date()).optional(),
    baseId: z.string().min(1, 'Base is required'),
    equipmentId: z.string().min(1, 'Equipment is required'),
    assetDescription: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be greater than zero'),
    unitCost: z.number().min(0, 'Unit cost cannot be negative'),
    supplier: z.string().min(1, 'Supplier is required'),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).default('COMPLETED').optional(),
  }),
};

const updatePurchaseSchema = {
  body: z.object({
    purchaseDate: z.string().or(z.date()).optional(),
    baseId: z.string().optional(),
    equipmentId: z.string().optional(),
    assetDescription: z.string().optional(),
    quantity: z.number().int().positive().optional(),
    unitCost: z.number().min(0).optional(),
    supplier: z.string().optional(),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  }),
};

// Transfer Validators
const createTransferSchema = {
  body: z
    .object({
      fromBaseId: z.string().min(1, 'Origin base is required'),
      toBaseId: z.string().min(1, 'Destination base is required'),
      equipmentId: z.string().min(1, 'Equipment is required'),
      assetDescription: z.string().optional(),
      assetCode: z.string().optional(),
      quantity: z.number().int().positive('Quantity must be greater than zero'),
      transferDate: z.string().or(z.date()).optional(),
      expectedArrival: z.string().or(z.date()).optional(),
      reason: z.string().optional(),
      notes: z.string().optional(),
    })
    .refine((data) => data.fromBaseId !== data.toBaseId, {
      message: 'Source base and destination base cannot be the same',
      path: ['toBaseId'],
    }),
};

const updateTransferStatusSchema = {
  body: z.object({
    status: z.enum(['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']),
    notes: z.string().optional(),
  }),
};

// Assignment Validators
const createAssignmentSchema = {
  body: z.object({
    baseId: z.string().min(1, 'Base is required'),
    equipmentId: z.string().min(1, 'Equipment is required'),
    assetCode: z.string().optional(),
    personnelName: z.string().min(2, 'Personnel name is required'),
    personnelId: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be greater than zero'),
    assignmentDate: z.string().or(z.date()).optional(),
    purpose: z.string().optional(),
    notes: z.string().optional(),
  }),
};

const updateAssignmentSchema = {
  body: z.object({
    status: z.enum(['ACTIVE', 'RETURNED', 'TRANSFERRED']).optional(),
    returnedAt: z.string().or(z.date()).optional().nullable(),
    notes: z.string().optional(),
  }),
};

// Expenditure Validators
const createExpenditureSchema = {
  body: z.object({
    date: z.string().or(z.date()).optional(),
    baseId: z.string().min(1, 'Base is required'),
    equipmentId: z.string().min(1, 'Equipment is required'),
    assetDescription: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be greater than zero'),
    reason: z.string().min(2, 'Reason for expenditure is required'),
    personnelName: z.string().optional(),
    notes: z.string().optional(),
  }),
};

// Equipment Validators
const createEquipmentSchema = {
  body: z.object({
    name: z.string().min(2, 'Equipment name is required'),
    type: z.enum(['VEHICLE', 'WEAPON', 'AMMUNITION', 'COMMUNICATION', 'PROTECTIVE', 'OTHER']),
    code: z.string().min(2, 'Equipment code is required'),
    description: z.string().optional(),
    isSerialized: z.boolean().optional(),
    unitOfMeasure: z.string().optional(),
    standardCost: z.number().min(0).optional(),
  }),
};

// Base Validators
const createBaseSchema = {
  body: z.object({
    name: z.string().min(2, 'Base name is required'),
    code: z.string().min(2, 'Base code is required'),
    location: z.string().min(2, 'Location is required'),
    type: z.string().optional(),
    capacity: z.number().positive().optional(),
    description: z.string().optional(),
    commanderName: z.string().optional(),
  }),
};

module.exports = {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createPurchaseSchema,
  updatePurchaseSchema,
  createTransferSchema,
  updateTransferStatusSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  createExpenditureSchema,
  createEquipmentSchema,
  createBaseSchema,
};
