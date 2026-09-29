require('dotenv').config();
const mongoose = require('mongoose');
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
} = require('../models');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/miltrack';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding operation.');

    // Clear existing data cleanly
    console.log('[Seed] Clearing existing collections...');
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

    // 1. Seed Bases
    console.log('[Seed] Creating 4 Fictional Base Installations...');
    const bases = await Base.create([
      {
        name: 'Base Alpha',
        code: 'HQ-ALPHA',
        location: 'Sector 4 Central Command Depot',
        type: 'HQ Central Depot',
        capacity: 35000,
        description: 'Primary strategic command hub with central ammunition depot and heavy fleet hangars.',
        commanderName: 'Gen. Tyler Vance',
        isActive: true,
      },
      {
        name: 'Base Bravo',
        code: 'AV-BRAVO',
        location: 'Northern Ridge Aviation Command',
        type: 'Aviation Command',
        capacity: 22000,
        description: 'Air-wing tactical staging facility with advanced avionics and rapid response assets.',
        commanderName: 'Col. Sarah Jenkins',
        isActive: true,
      },
      {
        name: 'Base Charlie',
        code: 'FWD-CHARLIE',
        location: 'Forward Logistics Outpost Delta',
        type: 'Forward Logistics',
        capacity: 18000,
        description: 'Forward operating tactical depot providing rapid frontline material provisioning.',
        commanderName: 'Maj. Marcus Reynolds',
        isActive: true,
      },
      {
        name: 'Base Delta',
        code: 'LOG-DELTA',
        location: 'Coastal Tactical Outpost Hub',
        type: 'Logistics Outpost',
        capacity: 15000,
        description: 'Maritime logistics interface and strategic reserve buffer station.',
        commanderName: 'Capt. Elena Rostova',
        isActive: true,
      },
    ]);

    const baseAlpha = bases[0];
    const baseBravo = bases[1];
    const baseCharlie = bases[2];
    const baseDelta = bases[3];

    // 2. Seed Users
    console.log('[Seed] Provisioning Users across roles (Admin, Base Commander, Logistics Officer)...');
    const commonPassword = 'Password123!';
    const passwordHash = await User.hashPassword(commonPassword);

    const users = await User.create([
      {
        fullName: 'Chief Administrator Vance',
        email: 'admin@miltrack.local',
        passwordHash,
        role: 'ADMIN',
        baseId: null, // Network-wide clearance
        rank: 'Chief Admin',
        serviceId: 'CAC-99001-HQ',
        isActive: true,
      },
      {
        fullName: 'Maj. Tyler Vance',
        email: 'commander@miltrack.local',
        passwordHash,
        role: 'BASE_COMMANDER',
        baseId: baseAlpha._id, // Scoped to Base Alpha
        rank: 'Maj. Commander',
        serviceId: 'CAC-44102-CMD',
        isActive: true,
      },
      {
        fullName: 'Lt. John Davis',
        email: 'logistics@miltrack.local',
        passwordHash,
        role: 'LOGISTICS_OFFICER',
        baseId: baseAlpha._id,
        rank: 'Lt. Logistics',
        serviceId: 'CAC-18294-LOG',
        isActive: true,
      },
      {
        fullName: 'Col. Sarah Jenkins',
        email: 'commander.bravo@miltrack.local',
        passwordHash,
        role: 'BASE_COMMANDER',
        baseId: baseBravo._id,
        rank: 'Col. Commander',
        serviceId: 'CAC-77310-CMD',
        isActive: true,
      },
    ]);

    const adminUser = users[0];
    const cmdAlpha = users[1];
    const logOfficer = users[2];

    // 3. Seed Equipment (11 diverse items across 6 categories)
    console.log('[Seed] Cataloging Military Equipment Registry...');
    const equipmentList = await Equipment.create([
      {
        name: 'Heavy Transport Truck MK-IV',
        type: 'VEHICLE',
        code: 'EQ-VEH-001',
        description: 'Multi-axle 10-ton tactical transport vehicle for bulk supplies and equipment deployment.',
        isSerialized: true,
        unitOfMeasure: 'vehicles',
        standardCost: 85000,
      },
      {
        name: 'Armored Patrol Vehicle L-ATV',
        type: 'VEHICLE',
        code: 'EQ-VEH-002',
        description: 'Joint light tactical armored vehicle with ballistic blast resistance and remote turret.',
        isSerialized: true,
        unitOfMeasure: 'vehicles',
        standardCost: 145000,
      },
      {
        name: 'Light Recon Utility Vehicle',
        type: 'VEHICLE',
        code: 'EQ-VEH-003',
        description: 'High-mobility tactical buggy engineered for forward scout operations.',
        isSerialized: true,
        unitOfMeasure: 'vehicles',
        standardCost: 48000,
      },
      {
        name: 'Service Rifle Carbine M4A1',
        type: 'WEAPON',
        code: 'EQ-WPN-001',
        description: 'Standard issue 5.56x45mm NATO selective fire assault carbine.',
        isSerialized: true,
        unitOfMeasure: 'units',
        standardCost: 1200,
      },
      {
        name: 'Heavy Machine Gun .50 Cal M2',
        type: 'WEAPON',
        code: 'EQ-WPN-002',
        description: 'Belt-fed air-cooled automatic heavy crew-served weapon platform.',
        isSerialized: true,
        unitOfMeasure: 'units',
        standardCost: 14500,
      },
      {
        name: '5.56mm Ball Ammunition Crate',
        type: 'AMMUNITION',
        code: 'EQ-AMM-001',
        description: 'Standard ammunition crate containing 1,000 rounds of M855A1 Enhanced Performance ammo.',
        isSerialized: false,
        unitOfMeasure: 'crates',
        standardCost: 650,
      },
      {
        name: '7.62mm Linked Ordnance Box',
        type: 'AMMUNITION',
        code: 'EQ-AMM-002',
        description: 'Linked ammunition box with 800 rounds for vehicle-mounted weapons.',
        isSerialized: false,
        unitOfMeasure: 'boxes',
        standardCost: 850,
      },
      {
        name: 'Tactical Radio Transceiver VHF-X',
        type: 'COMMUNICATION',
        code: 'EQ-COM-001',
        description: 'Multi-band secure frequency-hopping tactical communication transceiver.',
        isSerialized: true,
        unitOfMeasure: 'units',
        standardCost: 4800,
      },
      {
        name: 'C4ISR Satellite Terminal Field Pack',
        type: 'COMMUNICATION',
        code: 'EQ-COM-002',
        description: 'Ruggedized man-portable beyond-line-of-sight satellite uplink terminal.',
        isSerialized: true,
        unitOfMeasure: 'sets',
        standardCost: 24000,
      },
      {
        name: 'Modular Tactical Ballistic Vest',
        type: 'PROTECTIVE',
        code: 'EQ-PRO-001',
        description: 'Level IV ceramic composite body armor system with MOLLE attachment array.',
        isSerialized: false,
        unitOfMeasure: 'vests',
        standardCost: 950,
      },
      {
        name: 'Advanced Combat Helmet ACH',
        type: 'PROTECTIVE',
        code: 'EQ-PRO-002',
        description: 'High-cut ballistic Kevlar helmet with night vision mounting shroud.',
        isSerialized: false,
        unitOfMeasure: 'helmets',
        standardCost: 520,
      },
    ]);

    const [
      truckEq,
      latvEq,
      reconEq,
      m4Eq,
      m2Eq,
      ammo556Eq,
      ammo762Eq,
      radioEq,
      satEq,
      vestEq,
      helmetEq,
    ] = equipmentList;

    // Helper to calculate date offsets
    const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 4. Seed Purchases & Ledger Transactions
    console.log('[Seed] Recording historical & recent procurement lots...');
    const purchasePlans = [
      // Base Alpha Purchases
      {
        num: 'PO-2025-001',
        date: daysAgo(50),
        base: baseAlpha,
        eq: truckEq,
        qty: 40,
        unitCost: 85000,
        supplier: 'Oshkosh Defense Dynamics',
        ref: 'MF-8801-DEF',
      },
      {
        num: 'PO-2025-002',
        date: daysAgo(45),
        base: baseAlpha,
        eq: latvEq,
        qty: 25,
        unitCost: 145000,
        supplier: 'General Dynamics Land Systems',
        ref: 'MF-8804-DEF',
      },
      {
        num: 'PO-2025-003',
        date: daysAgo(40),
        base: baseAlpha,
        eq: m4Eq,
        qty: 500,
        unitCost: 1200,
        supplier: 'Colt Defense Ordnance',
        ref: 'MF-8910-WPN',
      },
      {
        num: 'PO-2025-004',
        date: daysAgo(35),
        base: baseAlpha,
        eq: m2Eq,
        qty: 40,
        unitCost: 14500,
        supplier: 'FN Herstal Tactical',
        ref: 'MF-8922-WPN',
      },
      {
        num: 'PO-2025-005',
        date: daysAgo(30),
        base: baseAlpha,
        eq: ammo556Eq,
        qty: 2500,
        unitCost: 650,
        supplier: 'Lake City Ammunition Plant',
        ref: 'MF-9001-AMM',
      },
      {
        num: 'PO-2025-006',
        date: daysAgo(25),
        base: baseAlpha,
        eq: ammo762Eq,
        qty: 1200,
        unitCost: 850,
        supplier: 'Federal Ordnance Corp',
        ref: 'MF-9020-AMM',
      },
      {
        num: 'PO-2025-007',
        date: daysAgo(20),
        base: baseAlpha,
        eq: radioEq,
        qty: 150,
        unitCost: 4800,
        supplier: 'L3Harris Technologies',
        ref: 'MF-9104-COM',
      },
      {
        num: 'PO-2025-008',
        date: daysAgo(15),
        base: baseAlpha,
        eq: satEq,
        qty: 20,
        unitCost: 24000,
        supplier: 'Viasat Defense Networks',
        ref: 'MF-9180-SAT',
      },
      {
        num: 'PO-2025-009',
        date: daysAgo(10),
        base: baseAlpha,
        eq: vestEq,
        qty: 600,
        unitCost: 950,
        supplier: 'Point Blank Protective Armor',
        ref: 'MF-9201-PRO',
      },
      {
        num: 'PO-2025-010',
        date: daysAgo(5),
        base: baseAlpha,
        eq: helmetEq,
        qty: 600,
        unitCost: 520,
        supplier: 'Gentex Ballistic Helmets',
        ref: 'MF-9250-PRO',
      },
      {
        num: 'PO-2025-011',
        date: daysAgo(2),
        base: baseAlpha,
        eq: reconEq,
        qty: 15,
        unitCost: 48000,
        supplier: 'Polaris Defense Systems',
        ref: 'MF-9300-VEH',
      },

      // Base Bravo Purchases
      {
        num: 'PO-2025-012',
        date: daysAgo(42),
        base: baseBravo,
        eq: truckEq,
        qty: 20,
        unitCost: 85000,
        supplier: 'Oshkosh Defense Dynamics',
        ref: 'MF-BR-101',
      },
      {
        num: 'PO-2025-013',
        date: daysAgo(38),
        base: baseBravo,
        eq: m4Eq,
        qty: 300,
        unitCost: 1200,
        supplier: 'Colt Defense Ordnance',
        ref: 'MF-BR-102',
      },
      {
        num: 'PO-2025-014',
        date: daysAgo(28),
        base: baseBravo,
        eq: ammo556Eq,
        qty: 1500,
        unitCost: 650,
        supplier: 'Lake City Ammunition Plant',
        ref: 'MF-BR-103',
      },
      {
        num: 'PO-2025-015',
        date: daysAgo(18),
        base: baseBravo,
        eq: radioEq,
        qty: 80,
        unitCost: 4800,
        supplier: 'L3Harris Technologies',
        ref: 'MF-BR-104',
      },

      // Base Charlie Purchases
      {
        num: 'PO-2025-016',
        date: daysAgo(32),
        base: baseCharlie,
        eq: latvEq,
        qty: 15,
        unitCost: 145000,
        supplier: 'General Dynamics Land Systems',
        ref: 'MF-CH-201',
      },
      {
        num: 'PO-2025-017',
        date: daysAgo(22),
        base: baseCharlie,
        eq: m4Eq,
        qty: 250,
        unitCost: 1200,
        supplier: 'Colt Defense Ordnance',
        ref: 'MF-CH-202',
      },
      {
        num: 'PO-2025-018',
        date: daysAgo(14),
        base: baseCharlie,
        eq: ammo556Eq,
        qty: 1000,
        unitCost: 650,
        supplier: 'Lake City Ammunition Plant',
        ref: 'MF-CH-203',
      },

      // Base Delta Purchases
      {
        num: 'PO-2025-019',
        date: daysAgo(36),
        base: baseDelta,
        eq: truckEq,
        qty: 15,
        unitCost: 85000,
        supplier: 'Oshkosh Defense Dynamics',
        ref: 'MF-DL-301',
      },
      {
        num: 'PO-2025-020',
        date: daysAgo(12),
        base: baseDelta,
        eq: vestEq,
        qty: 200,
        unitCost: 950,
        supplier: 'Point Blank Protective Armor',
        ref: 'MF-DL-302',
      },
    ];

    for (const p of purchasePlans) {
      const purchase = await Purchase.create({
        purchaseNumber: p.num,
        purchaseDate: p.date,
        baseId: p.base._id,
        equipmentId: p.eq._id,
        assetDescription: p.eq.name,
        quantity: p.qty,
        unitCost: p.unitCost,
        totalCost: Math.round(p.qty * p.unitCost * 100) / 100,
        supplier: p.supplier,
        referenceNumber: p.ref,
        notes: `Procured for strategic installation supply line at ${p.base.name}.`,
        status: 'COMPLETED',
        createdBy: logOfficer._id,
      });

      // Record in ledger
      await InventoryTransaction.create({
        transactionType: 'PURCHASE',
        baseId: p.base._id,
        equipmentId: p.eq._id,
        quantity: p.qty,
        direction: 'IN',
        referenceType: 'Purchase',
        referenceId: purchase._id,
        transactionDate: p.date,
        createdBy: logOfficer._id,
        metadata: {
          purchaseNumber: purchase.purchaseNumber,
          supplier: purchase.supplier,
        },
      });
    }

    // 5. Seed Transfers
    console.log('[Seed] Establishing Inter-Base Asset Transfers (Completed, In-Transit, Pending)...');
    const transferPlans = [
      // Completed: Alpha -> Charlie (100 M4s)
      {
        num: 'TR-2025-001',
        from: baseAlpha,
        to: baseCharlie,
        eq: m4Eq,
        qty: 100,
        date: daysAgo(20),
        status: 'COMPLETED',
        applied: true,
        reason: 'Forward detachment tactical reinforcement lot.',
      },
      // Completed: Alpha -> Bravo (5 Latv vehicles)
      {
        num: 'TR-2025-002',
        from: baseAlpha,
        to: baseBravo,
        eq: latvEq,
        qty: 5,
        date: daysAgo(16),
        status: 'COMPLETED',
        applied: true,
        reason: 'Northern perimeter patrol capability expansion.',
      },
      // Completed: Bravo -> Delta (40 M4s)
      {
        num: 'TR-2025-003',
        from: baseBravo,
        to: baseDelta,
        eq: m4Eq,
        qty: 40,
        date: daysAgo(10),
        status: 'COMPLETED',
        applied: true,
        reason: 'Coastal station armor security upgrade.',
      },
      // In-Transit: Alpha -> Charlie (120 M4s)
      {
        num: 'TR-2025-004',
        from: baseAlpha,
        to: baseCharlie,
        eq: m4Eq,
        qty: 120,
        date: daysAgo(1),
        status: 'IN_TRANSIT',
        applied: false,
        reason: 'Scheduled rotational ordnance transfer via Convoy A-3.',
      },
      // In-Transit: Alpha -> Delta (5 Heavy Trucks)
      {
        num: 'TR-2025-005',
        from: baseAlpha,
        to: baseDelta,
        eq: truckEq,
        qty: 5,
        date: daysAgo(1),
        status: 'IN_TRANSIT',
        applied: false,
        reason: 'Coastal logistics transport capacity augmentation.',
      },
      // Pending: Charlie -> Alpha (2 Recon Buggies for overhaul)
      {
        num: 'TR-2025-006',
        from: baseCharlie,
        to: baseAlpha,
        eq: latvEq,
        qty: 2,
        date: daysAgo(0),
        status: 'PENDING',
        applied: false,
        reason: 'Scheduled depot transmission overhaul at Central HQ.',
      },
    ];

    for (const t of transferPlans) {
      const transfer = await Transfer.create({
        transferNumber: t.num,
        fromBaseId: t.from._id,
        toBaseId: t.to._id,
        equipmentId: t.eq._id,
        assetDescription: t.eq.name,
        quantity: t.qty,
        transferDate: t.date,
        expectedArrival: new Date(t.date.getTime() + 2 * 24 * 60 * 60 * 1000),
        reason: t.reason,
        status: t.status,
        initiatedBy: cmdAlpha._id,
        approvedBy: t.status === 'COMPLETED' ? adminUser._id : null,
        completedAt: t.status === 'COMPLETED' ? t.date : null,
        inventoryApplied: t.applied,
      });

      if (t.applied && t.status === 'COMPLETED') {
        // Source base debit
        await InventoryTransaction.create({
          transactionType: 'TRANSFER_OUT',
          baseId: t.from._id,
          equipmentId: t.eq._id,
          quantity: t.qty,
          direction: 'OUT',
          referenceType: 'Transfer',
          referenceId: transfer._id,
          transactionDate: t.date,
          createdBy: adminUser._id,
          metadata: {
            transferNumber: transfer.transferNumber,
            toBaseId: t.to._id,
          },
        });

        // Destination base credit
        await InventoryTransaction.create({
          transactionType: 'TRANSFER_IN',
          baseId: t.to._id,
          equipmentId: t.eq._id,
          quantity: t.qty,
          direction: 'IN',
          referenceType: 'Transfer',
          referenceId: transfer._id,
          transactionDate: t.date,
          createdBy: adminUser._id,
          metadata: {
            transferNumber: transfer.transferNumber,
            fromBaseId: t.from._id,
          },
        });
      }
    }

    // 6. Seed Unit Assignments (Reduces AVAILABLE, not closing balance)
    console.log('[Seed] Deploying Unit Personnel Assignments...');
    const assignmentPlans = [
      {
        num: 'ASG-2025-001',
        base: baseAlpha,
        eq: truckEq,
        qty: 15,
        personnel: '3rd Transportation Battalion (Capt. Miller)',
        date: daysAgo(25),
        purpose: 'Regional supply run escort duty.',
      },
      {
        num: 'ASG-2025-002',
        base: baseAlpha,
        eq: latvEq,
        qty: 10,
        personnel: 'Echo Quick Reaction Recon (Lt. Vance Jr.)',
        date: daysAgo(20),
        purpose: 'Perimeter patrol & surveillance rotation.',
      },
      {
        num: 'ASG-2025-003',
        base: baseAlpha,
        eq: m4Eq,
        qty: 180,
        personnel: '1st Infantry Brigade Bravo Company',
        date: daysAgo(18),
        purpose: 'Standard personal sidearm deployment.',
      },
      {
        num: 'ASG-2025-004',
        base: baseAlpha,
        eq: radioEq,
        qty: 45,
        personnel: 'Tactical Signal Corps Detachment 4',
        date: daysAgo(14),
        purpose: 'Tactical command radio field deployment.',
      },
      {
        num: 'ASG-2025-005',
        base: baseAlpha,
        eq: vestEq,
        qty: 200,
        personnel: 'Rapid Deployment Force Element A',
        date: daysAgo(12),
        purpose: 'Standard protective gear outfitting.',
      },
      {
        num: 'ASG-2025-006',
        base: baseAlpha,
        eq: helmetEq,
        qty: 200,
        personnel: 'Rapid Deployment Force Element A',
        date: daysAgo(12),
        purpose: 'Ballistic headgear issuance.',
      },
      // Returned Assignment Example
      {
        num: 'ASG-2025-007',
        base: baseAlpha,
        eq: latvEq,
        qty: 4,
        personnel: 'VIP Escort Security Detail',
        date: daysAgo(30),
        returnedDate: daysAgo(10),
        status: 'RETURNED',
        purpose: 'Diplomatic delegation convoy protection.',
      },
    ];

    for (const a of assignmentPlans) {
      await Assignment.create({
        assignmentNumber: a.num,
        baseId: a.base._id,
        equipmentId: a.eq._id,
        personnelName: a.personnel,
        quantity: a.qty,
        assignmentDate: a.date,
        purpose: a.purpose,
        status: a.status || 'ACTIVE',
        returnedAt: a.returnedDate || null,
        assignedBy: cmdAlpha._id,
      });
    }

    // 7. Seed Expenditures (Live fire exercises, maintenance, write-offs)
    console.log('[Seed] Recording Ordnance & Consumables Expenditures...');
    const expenditurePlans = [
      {
        num: 'EXP-2025-001',
        date: daysAgo(18),
        base: baseAlpha,
        eq: ammo556Eq,
        qty: 350,
        reason: 'Annual Brigade Marksmanship Qualification & Live-Fire Drills',
        personnel: 'Live Fire Range Master Capt. Holt',
      },
      {
        num: 'EXP-2025-002',
        date: daysAgo(12),
        base: baseAlpha,
        eq: ammo762Eq,
        qty: 120,
        reason: 'Heavy Weapon Turret Calibration Exercise',
        personnel: 'Range Safety Officer Lt. Gable',
      },
      {
        num: 'EXP-2025-003',
        date: daysAgo(6),
        base: baseAlpha,
        eq: ammo556Eq,
        qty: 200,
        reason: 'Night Vision Tactical CQB Training Exercise',
        personnel: 'Special Tactics Group Lead Sgt. Cole',
      },
      {
        num: 'EXP-2025-004',
        date: daysAgo(15),
        base: baseBravo,
        eq: ammo556Eq,
        qty: 150,
        reason: 'Air Wing Perimeter Defense Readiness Test',
        personnel: 'Air Base Security Sgt. Adams',
      },
    ];

    for (const e of expenditurePlans) {
      const exp = await Expenditure.create({
        expenditureNumber: e.num,
        date: e.date,
        baseId: e.base._id,
        equipmentId: e.eq._id,
        assetDescription: e.eq.name,
        quantity: e.qty,
        reason: e.reason,
        personnelName: e.personnel,
        recordedBy: cmdAlpha._id,
      });

      // Record in ledger
      await InventoryTransaction.create({
        transactionType: 'EXPENDITURE',
        baseId: e.base._id,
        equipmentId: e.eq._id,
        quantity: e.qty,
        direction: 'OUT',
        referenceType: 'Expenditure',
        referenceId: exp._id,
        transactionDate: e.date,
        createdBy: cmdAlpha._id,
        metadata: {
          expenditureNumber: exp.expenditureNumber,
          reason: exp.reason,
        },
      });
    }

    // 8. Seed Audit Log Trail
    console.log('[Seed] Compiling Cryptographic Audit Trail...');
    const auditEvents = [
      {
        action: 'USER_CREATED',
        entityType: 'User',
        userId: adminUser._id,
        userName: adminUser.fullName,
        role: 'ADMIN',
        baseId: baseAlpha._id,
        time: daysAgo(55),
        notes: 'Initial master administrator account bootstrapped.',
      },
      {
        action: 'BASE_CREATED',
        entityType: 'Base',
        userId: adminUser._id,
        userName: adminUser.fullName,
        role: 'ADMIN',
        baseId: baseAlpha._id,
        time: daysAgo(54),
        notes: 'Commissioned Strategic HQ Base Alpha.',
      },
      {
        action: 'EQUIPMENT_CREATED',
        entityType: 'Equipment',
        userId: adminUser._id,
        userName: adminUser.fullName,
        role: 'ADMIN',
        baseId: null,
        time: daysAgo(52),
        notes: 'Cataloged Service Rifle Carbine M4A1 in defense inventory database.',
      },
      {
        action: 'PURCHASE_CREATED',
        entityType: 'Purchase',
        userId: logOfficer._id,
        userName: logOfficer.fullName,
        role: 'LOGISTICS_OFFICER',
        baseId: baseAlpha._id,
        time: daysAgo(40),
        notes: 'Procurement manifest PO-2025-003 received and verified by depot logistics.',
      },
      {
        action: 'TRANSFER_COMPLETED',
        entityType: 'Transfer',
        userId: adminUser._id,
        userName: adminUser.fullName,
        role: 'ADMIN',
        baseId: baseAlpha._id,
        time: daysAgo(20),
        notes: 'Manifest TR-2025-001 executed: 100x M4A1 routed to Base Charlie.',
      },
      {
        action: 'ASSIGNMENT_CREATED',
        entityType: 'Assignment',
        userId: cmdAlpha._id,
        userName: cmdAlpha.fullName,
        role: 'BASE_COMMANDER',
        baseId: baseAlpha._id,
        time: daysAgo(18),
        notes: 'Allocated 180 units of M4A1 to 1st Infantry Brigade Bravo Company.',
      },
      {
        action: 'EXPENDITURE_CREATED',
        entityType: 'Expenditure',
        userId: cmdAlpha._id,
        userName: cmdAlpha.fullName,
        role: 'BASE_COMMANDER',
        baseId: baseAlpha._id,
        time: daysAgo(12),
        notes: 'Depot written off 120 crates 7.62mm linked ordnance during turret calibration.',
      },
      {
        action: 'LOGIN',
        entityType: 'User',
        userId: cmdAlpha._id,
        userName: cmdAlpha.fullName,
        role: 'BASE_COMMANDER',
        baseId: baseAlpha._id,
        time: daysAgo(0),
        notes: 'Base Commander authenticated to terminal terminal.',
      },
    ];

    for (const a of auditEvents) {
      await AuditLog.create({
        timestamp: a.time,
        userId: a.userId,
        userName: a.userName,
        role: a.role,
        action: a.action,
        entityType: a.entityType,
        baseId: a.baseId,
        ipAddress: '10.0.4.12',
        userAgent: 'MILTRACK/Terminal v2.4 (DoD Secure Node)',
        status: 'SUCCESS',
        notes: a.notes,
      });
    }

    console.log('[Seed] Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('TEST CREDENTIALS DOCUMENTATION:');
    console.log('Common Password for all accounts: Password123!');
    console.log('  1. ADMIN:              admin@miltrack.local');
    console.log('  2. BASE COMMANDER:     commander@miltrack.local  (Base Alpha)');
    console.log('  3. LOGISTICS OFFICER:  logistics@miltrack.local  (Base Alpha)');
    console.log('  4. BASE COMMANDER (B): commander.bravo@miltrack.local (Base Bravo)');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to populate database:', error);
    process.exit(1);
  }
};

seedData();
