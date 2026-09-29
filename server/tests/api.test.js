const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const {
  User,
  Base,
  Equipment,
  Purchase,
  Transfer,
  Assignment,
  Expenditure,
  InventoryTransaction,
  AuditLog,
} = require('../src/models');
const inventoryService = require('../src/services/inventoryService');

describe('MILTRACK Full-Stack Integration & Business Logic Tests', () => {
  let adminToken;
  let commanderAlphaToken;
  let commanderBravoToken;
  let logisticsToken;
  let baseAlpha;
  let baseBravo;
  let testRifle;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/miltrack_test';
    await mongoose.connect(mongoUri);

    // Clean test DB
    await Promise.all([
      User.deleteMany({}),
      Base.deleteMany({}),
      Equipment.deleteMany({}),
      Purchase.deleteMany({}),
      Transfer.deleteMany({}),
      Assignment.deleteMany({}),
      Expenditure.deleteMany({}),
      InventoryTransaction.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // Create bases
    baseAlpha = await Base.create({
      name: 'Base Alpha Test',
      code: 'ALPHA-TEST',
      location: 'Test Alpha Location',
      capacity: 10000,
    });

    baseBravo = await Base.create({
      name: 'Base Bravo Test',
      code: 'BRAVO-TEST',
      location: 'Test Bravo Location',
      capacity: 10000,
    });

    // Create test equipment
    testRifle = await Equipment.create({
      name: 'Service Carbine M4 Test',
      type: 'WEAPON',
      code: 'EQ-TST-001',
      unitOfMeasure: 'units',
      standardCost: 1000,
    });

    // Create test users
    const pwdHash = await User.hashPassword('Password123!');
    const admin = await User.create({
      fullName: 'Admin Tester',
      email: 'admin.test@miltrack.local',
      passwordHash: pwdHash,
      role: 'ADMIN',
      baseId: null,
    });

    const cmdAlpha = await User.create({
      fullName: 'Cmd Alpha Tester',
      email: 'cmd.alpha@miltrack.local',
      passwordHash: pwdHash,
      role: 'BASE_COMMANDER',
      baseId: baseAlpha._id,
    });

    const cmdBravo = await User.create({
      fullName: 'Cmd Bravo Tester',
      email: 'cmd.bravo@miltrack.local',
      passwordHash: pwdHash,
      role: 'BASE_COMMANDER',
      baseId: baseBravo._id,
    });

    const logOff = await User.create({
      fullName: 'Logistics Tester',
      email: 'log.test@miltrack.local',
      passwordHash: pwdHash,
      role: 'LOGISTICS_OFFICER',
      baseId: baseAlpha._id,
    });

    // Login users to acquire JWT tokens
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.test@miltrack.local', password: 'Password123!' });
    adminToken = resAdmin.body.token;

    const resCmdAlpha = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cmd.alpha@miltrack.local', password: 'Password123!' });
    commanderAlphaToken = resCmdAlpha.body.token;

    const resCmdBravo = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cmd.bravo@miltrack.local', password: 'Password123!' });
    commanderBravoToken = resCmdBravo.body.token;

    const resLog = await request(app)
      .post('/api/auth/login')
      .send({ email: 'log.test@miltrack.local', password: 'Password123!' });
    logisticsToken = resLog.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // TEST SUITE 1: AUTHENTICATION
  describe('Phase 3: Authentication & Security', () => {
    it('should authenticate user and return token with sanitized user object', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin.test@miltrack.local', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('should reject invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin.test@miltrack.local', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return current authenticated user via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin.test@miltrack.local');
    });
  });

  // TEST SUITE 2: RBAC & BASE-LEVEL ISOLATION
  describe('Phase 4: RBAC & Base Authorization', () => {
    it('should allow Admin to access any base data', async () => {
      const res = await request(app)
        .get(`/api/purchases?baseId=${baseBravo._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should prevent Base Commander Alpha from requesting Base Bravo data with 403', async () => {
      const res = await request(app)
        .get(`/api/purchases?baseId=${baseBravo._id}`)
        .set('Authorization', `Bearer ${commanderAlphaToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Security Violation|Access denied|Access restricted/);
    });

    it('should block non-admins from user administration', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${commanderAlphaToken}`);

      expect(res.status).toBe(403);
    });
  });

  // TEST SUITE 3: PURCHASE & INVENTORY LEDGER
  describe('Phase 5: Purchases & Ledger Inflow', () => {
    let createdPurchaseId;

    it('should record purchase, compute totalCost safely, and credit inventory ledger', async () => {
      const res = await request(app)
        .post('/api/purchases')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({
          baseId: baseAlpha._id.toString(),
          equipmentId: testRifle._id.toString(),
          quantity: 100,
          unitCost: 1000,
          supplier: 'Colt Test',
          referenceNumber: 'PO-REF-101',
          status: 'COMPLETED',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.totalCost).toBe(100000);
      createdPurchaseId = res.body.data._id;

      // Verify inventory ledger
      const balance = await inventoryService.getLedgerBalance(baseAlpha._id, testRifle._id);
      expect(balance).toBe(100);

      // Verify Audit log was created
      const auditLog = await AuditLog.findOne({
        action: 'PURCHASE_CREATED',
        entityId: createdPurchaseId.toString(),
      });
      expect(auditLog).toBeDefined();
    });
  });

  // TEST SUITE 4: ASSIGNMENTS & AVAILABLE INVENTORY
  describe('Phase 5: Unit Assignments & Available Stock Verification', () => {
    it('should reject assignment when requested quantity exceeds available stock', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${commanderAlphaToken}`)
        .send({
          baseId: baseAlpha._id.toString(),
          equipmentId: testRifle._id.toString(),
          personnelName: 'Sgt. Large Request',
          quantity: 150, // Only 100 in stock!
          purpose: 'Training',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient available/);
    });

    it('should successfully assign within available quantity without reducing total inventory', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${commanderAlphaToken}`)
        .send({
          baseId: baseAlpha._id.toString(),
          equipmentId: testRifle._id.toString(),
          personnelName: 'Sgt. Valid Assignment',
          quantity: 30,
          purpose: 'Range Exercise',
        });

      expect(res.status).toBe(201);

      // Verify inventory status: Total should still be 100, Assigned 30, Available 70!
      const status = await inventoryService.getInventoryStatus(baseAlpha._id, testRifle._id);
      expect(status.closingBalance).toBe(100);
      expect(status.assigned).toBe(30);
      expect(status.available).toBe(70);
    });
  });

  // TEST SUITE 5: EXPENDITURES
  describe('Phase 5: Expenditures & Permanent Inventory Reduction', () => {
    it('should reject expenditure greater than available unassigned quantity', async () => {
      const res = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${commanderAlphaToken}`)
        .send({
          baseId: baseAlpha._id.toString(),
          equipmentId: testRifle._id.toString(),
          quantity: 80, // Available is only 70 (100 total - 30 assigned)!
          reason: 'Excessive Live Fire',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot expend more than available/);
    });

    it('should permanently decrease inventory on valid expenditure', async () => {
      const res = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${commanderAlphaToken}`)
        .send({
          baseId: baseAlpha._id.toString(),
          equipmentId: testRifle._id.toString(),
          quantity: 20,
          reason: 'Training wear write-off',
        });

      expect(res.status).toBe(201);

      // Total balance should now be 100 - 20 = 80!
      const status = await inventoryService.getInventoryStatus(baseAlpha._id, testRifle._id);
      expect(status.closingBalance).toBe(80);
      expect(status.assigned).toBe(30);
      expect(status.available).toBe(50);
    });
  });

  // TEST SUITE 6: TRANSFERS & LIFECYCLE
  describe('Phase 5: Inter-Base Transfers & Single Inventory Application', () => {
    let transferId;

    it('should prevent transfer from base to itself', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({
          fromBaseId: baseAlpha._id.toString(),
          toBaseId: baseAlpha._id.toString(),
          equipmentId: testRifle._id.toString(),
          quantity: 10,
        });

      expect(res.status).toBe(400);
    });

    it('should prevent transfer exceeding available stock', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({
          fromBaseId: baseAlpha._id.toString(),
          toBaseId: baseBravo._id.toString(),
          equipmentId: testRifle._id.toString(),
          quantity: 60, // Available is only 50
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient available stock/);
    });

    it('should create pending transfer without immediately altering inventory balances', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({
          fromBaseId: baseAlpha._id.toString(),
          toBaseId: baseBravo._id.toString(),
          equipmentId: testRifle._id.toString(),
          quantity: 25,
          reason: 'Bravo rotation test',
          status: 'PENDING',
        });

      expect(res.status).toBe(201);
      transferId = res.body.data._id;

      // Balances must remain unchanged until COMPLETED
      const alphaStatus = await inventoryService.getInventoryStatus(baseAlpha._id, testRifle._id);
      const bravoStatus = await inventoryService.getInventoryStatus(baseBravo._id, testRifle._id);
      expect(alphaStatus.closingBalance).toBe(80);
      expect(bravoStatus.closingBalance).toBe(0);
    });

    it('should apply inventory exactly once when status transitions to COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/transfers/${transferId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(res.body.data.inventoryApplied).toBe(true);

      // Origin Base Alpha balance should decrease by 25: 80 - 25 = 55
      const alphaStatus = await inventoryService.getInventoryStatus(baseAlpha._id, testRifle._id);
      expect(alphaStatus.closingBalance).toBe(55);

      // Destination Base Bravo balance should increase by 25: 0 + 25 = 25
      const bravoStatus = await inventoryService.getInventoryStatus(baseBravo._id, testRifle._id);
      expect(bravoStatus.closingBalance).toBe(25);
    });
  });

  // TEST SUITE 7: DASHBOARD ACCOUNTING FORMULA
  describe('Phase 9: Dashboard Accounting Validation', () => {
    it('should calculate opening balance, net movement, and closing balance consistently', async () => {
      const res = await request(app)
        .get(`/api/dashboard/summary?baseId=${baseAlpha._id}`)
        .set('Authorization', `Bearer ${commanderAlphaToken}`);

      expect(res.status).toBe(200);
      const { summary } = res.body.data;

      // Formula: Net Movement = Purchases + Transfer In - Transfer Out
      // Purchases: 100, Transfer In: 0, Transfer Out: 25 -> Net Movement = 75
      expect(summary.purchases).toBe(100);
      expect(summary.transferOut).toBe(25);
      expect(summary.netMovement).toBe(75);

      // Formula: Closing Balance = Opening + Net Movement - Expended (20) -> 55
      expect(summary.expended).toBe(20);
      expect(summary.closingBalance).toBe(55);

      // Formula: Available = Closing Balance - Assigned (30) -> 25
      expect(summary.assigned).toBe(30);
      expect(summary.available).toBe(25);
    });
  });
});
