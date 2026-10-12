/**
 * CASA Real Estate — Dynamic Property Forms & RERA Compliance
 * Final Integration Audit & Live End-to-End Verification Script
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('================================================================');
  console.log(' CASA PROPERTY DYNAMIC FORMS & RERA COMPLIANCE LIVE AUDIT ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // STEP 1: AUTHENTICATION
    // ----------------------------------------------------
    console.log('--- 1. Authenticating Roles ---');
    // Super Admin (designated admin mobile +919925843531)
    const superAdminMobile = '+919925843531';
    await request('POST', '/auth/otp/request', { mobile: superAdminMobile });
    const superAdminAuth = await request('POST', '/auth/otp/verify', { mobile: superAdminMobile, otp: '123456' });
    assert(superAdminAuth.status === 200 || superAdminAuth.status === 201, 'Super Admin authenticated');
    const adminToken = superAdminAuth.data?.tokens?.accessToken || superAdminAuth.data?.data?.tokens?.accessToken;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Regular Agent / Owner (must have AGENT accountType for property:create permission)
    const agentMobile = '+919123456789';
    await request('POST', '/auth/otp/request', { mobile: agentMobile, role: 'AGENT' });
    const agentAuth = await request('POST', '/auth/otp/verify', { mobile: agentMobile, otp: '123456', role: 'AGENT', name: 'Audit Agent' });
    assert(agentAuth.status === 200 || agentAuth.status === 201, 'Regular Agent authenticated');
    const agentToken = agentAuth.data?.tokens?.accessToken || agentAuth.data?.data?.tokens?.accessToken;
    const agentHeaders = { Authorization: `Bearer ${agentToken}` };

    // ----------------------------------------------------
    // STEP 2: RESIDENTIAL FOR SALE WITH RERA REGISTRATION
    // ----------------------------------------------------
    console.log('\n--- 2. Creating Residential Listing For Sale (RERA Registered) ---');
    const resSalePayload = {
      title: { en: 'Audit Luxury 4 BHK Sky Villa in Gomti Nagar Ext' },
      description: { en: 'Premium verified residential apartment with 4 BHK, luxury finish, and RERA filing.' },
      category: 'Residential',
      subcategory: 'Flat/Apartment',
      listingType: 'SALE',
      price: {
        amount: 14500000,
        currency: 'INR',
        priceUnit: 'TOTAL',
        isNegotiable: true,
        bookingAmount: 500000,
        pricePerSqFt: 5800,
        maintenance: 4500,
      },
      location: {
        country: 'India',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        city: 'Lucknow',
        locality: 'Gomti Nagar Extension, Sector 7',
        pincode: '226010',
        coordinates: [80.9462, 26.8467],
      },
      specs: {
        bedrooms: 4,
        bathrooms: 4,
        balconies: 3,
        area: 2500,
        areaUnit: 'SQ_FT',
        carpetArea: 2150,
        builtUpArea: 2350,
        superBuiltUpArea: 2500,
        furnishing: 'SEMI_FURNISHED',
        facing: 'North-East',
        parking: '2 Covered',
        floorLevel: '12th Floor',
        totalFloors: 24,
        constructionStatus: 'READY_TO_MOVE',
        propertyAge: '0-1 years',
        possessionStatus: 'READY_TO_MOVE',
        ownershipType: 'Freehold',
      },
      rera: {
        isReraRegistered: 'YES',
        reraNumber: 'UPRERAPRJ887766',
        authority: 'UPRERA',
        projectName: 'Eldeco Sky Terraces Phase 1',
        certificateUrl: 'https://uprera.org/certificates/887766.pdf',
        // Normal user attempts to self-verify -> must be overridden to PENDING
        verificationStatus: 'VERIFIED',
      },
      amenities: ['24/7 Gated Security & CCTV', '100% Power Backup', 'Swimming Pool & Jacuzzi'],
      media: {
        thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
      },
      status: 'DRAFT',
    };

    const resSaleCreate = await request('POST', '/properties', resSalePayload, agentHeaders);
    assert(resSaleCreate.status === 200 || resSaleCreate.status === 201, 'Residential For Sale created');
    const resSaleId = resSaleCreate.data?.id || resSaleCreate.data?.data?.id || resSaleCreate.data?._id;
    const resSaleData = resSaleCreate.data?.data || resSaleCreate.data;

    // Verify self-certification prevention: verificationStatus must NOT be VERIFIED
    assert(
      resSaleData?.rera?.verificationStatus === 'PENDING',
      'Normal user CANNOT self-certify RERA: verificationStatus set to PENDING',
    );
    assert(resSaleData?.subcategory === 'Flat/Apartment', 'Subcategory "Flat/Apartment" persisted in MongoDB');
    assert(resSaleData?.specs?.balconies === 3, 'Balconies (3) persisted');
    assert(resSaleData?.price?.bookingAmount === 500000, 'Booking amount (500,000) persisted');

    // ----------------------------------------------------
    // STEP 3: RESIDENTIAL FOR RENT (RERA EXEMPTION)
    // ----------------------------------------------------
    console.log('\n--- 3. Creating Residential Listing For Rent (RERA Exempt) ---');
    const resRentPayload = {
      title: { en: 'Audit Furnished 2 BHK Apartment for Family Rent' },
      description: { en: 'Immediate move-in rental property with modular kitchen and covered car parking.' },
      category: 'Residential',
      subcategory: 'Flat/Apartment',
      listingType: 'RENT',
      price: {
        amount: 28000,
        currency: 'INR',
        rentPeriod: 'MONTHLY',
        securityDeposit: 56000,
        maintenance: 2500,
        maintenancePayer: 'TENANT',
        leaseDurationMonths: 11,
        noticePeriodMonths: 1,
        lockInPeriodMonths: 3,
        rentEscalationPercentage: 5,
        preferredTenantType: 'FAMILY',
        brokerageAmount: 0,
      },
      location: {
        country: 'India',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        city: 'Lucknow',
        locality: 'Indira Nagar',
        coordinates: [80.9462, 26.8467],
      },
      specs: {
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        areaUnit: 'SQ_FT',
        furnishing: 'FULLY_FURNISHED',
        floorLevel: '2nd Floor',
        totalFloors: 4,
      },
      rera: {
        isReraRegistered: 'NO',
        exemptionReason: 'Rental or lease listing of an existing constructed building',
      },
      status: 'DRAFT',
    };

    const resRentCreate = await request('POST', '/properties', resRentPayload, agentHeaders);
    assert(resRentCreate.status === 200 || resRentCreate.status === 201, 'Residential For Rent created');
    const resRentData = resRentCreate.data?.data || resRentCreate.data;
    assert(
      resRentData?.rera?.verificationStatus === 'NOT_APPLICABLE',
      'Exempt rental verificationStatus is NOT_APPLICABLE',
    );
    assert(
      resRentData?.price?.securityDeposit === 56000,
      'Security deposit (56,000) persisted',
    );
    assert(
      resRentData?.price?.preferredTenantType === 'FAMILY',
      'Preferred tenant type (FAMILY) persisted',
    );

    // ----------------------------------------------------
    // STEP 4: PG / CO-LIVING LISTING
    // ----------------------------------------------------
    console.log('\n--- 4. Creating PG / Co-living Listing ---');
    const pgPayload = {
      title: { en: 'Audit Executive Girls PG with Food & Wi-Fi' },
      description: { en: 'Hygienic double sharing PG accommodation for female students and working professionals.' },
      category: 'Residential',
      subcategory: 'Studio Apartment',
      listingType: 'PG_COLIVING',
      price: {
        amount: 8500,
        currency: 'INR',
        rentPeriod: 'MONTHLY',
        securityDeposit: 8500,
        pgPricingModel: 'PER_BED',
        occupancyType: 'DOUBLE',
        mealsIncluded: 'ALL_MEALS',
        foodPreferences: 'VEG_ONLY',
        genderAccommodation: 'FEMALE_ONLY',
        includedFacilities: ['High-Speed Wi-Fi', 'Daily Room Cleaning', 'RO Purified Drinking Water', 'Air Conditioning (AC)'],
      },
      location: {
        country: 'India',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        city: 'Lucknow',
        locality: 'Hazratganj',
        coordinates: [80.9462, 26.8467],
      },
      specs: {
        area: 400,
        areaUnit: 'SQ_FT',
        furnishing: 'FULLY_FURNISHED',
      },
      rera: {
        isReraRegistered: 'NOT_APPLICABLE',
        exemptionReason: 'Individual private residence / Not part of a promoter layout',
      },
      status: 'DRAFT',
    };

    const pgCreate = await request('POST', '/properties', pgPayload, agentHeaders);
    assert(pgCreate.status === 200 || pgCreate.status === 201, 'PG / Co-living listing created');
    const pgData = pgCreate.data?.data || pgCreate.data;
    assert(pgData?.listingType === 'PG_COLIVING', 'Listing type PG_COLIVING persisted');
    assert(pgData?.price?.pgPricingModel === 'PER_BED', 'PG pricing model (PER_BED) persisted');
    assert(pgData?.price?.occupancyType === 'DOUBLE', 'Occupancy type (DOUBLE) persisted');
    assert(pgData?.price?.genderAccommodation === 'FEMALE_ONLY', 'Gender accommodation (FEMALE_ONLY) persisted');
    assert(
      Array.isArray(pgData?.price?.includedFacilities) && pgData?.price?.includedFacilities.length === 4,
      'Included PG facilities (4 items) persisted',
    );

    // ----------------------------------------------------
    // STEP 5: COMMERCIAL LEASE LISTING
    // ----------------------------------------------------
    console.log('\n--- 5. Creating Commercial Lease Listing (Office Space) ---');
    const commPayload = {
      title: { en: 'Audit Furnished IT Office Suite with 25 Workstations' },
      description: { en: 'Plug and play commercial office with private cabins, conference room, and 100% DG backup.' },
      category: 'Commercial',
      subcategory: 'Office Space',
      listingType: 'COMMERCIAL_LEASE',
      price: {
        amount: 95000,
        currency: 'INR',
        rentPeriod: 'MONTHLY',
        securityDeposit: 285000,
        maintenance: 8000,
        leaseDurationMonths: 36,
        lockInPeriodMonths: 12,
        noticePeriodMonths: 3,
        rentEscalationPercentage: 7,
      },
      location: {
        country: 'India',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        city: 'Lucknow',
        locality: 'Vibhuti Khand, IT Park',
        coordinates: [80.9462, 26.8467],
      },
      specs: {
        area: 3200,
        areaUnit: 'SQ_FT',
        cabins: 4,
        workstations: 25,
        washrooms: 2,
        pantry: 'WET',
        powerBackupKva: 40,
        suitableFor: ['IT Company', 'Call Center', 'Corporate Office'],
        floorLevel: '5th Floor',
        totalFloors: 10,
      },
      rera: {
        isReraRegistered: 'YES',
        reraNumber: 'UPRERAPRJ112233',
        authority: 'UPRERA',
        projectName: 'Cyber Heights Tower B',
      },
      status: 'DRAFT',
    };

    const commCreate = await request('POST', '/properties', commPayload, agentHeaders);
    assert(commCreate.status === 200 || commCreate.status === 201, 'Commercial Lease listing created');
    const commData = commCreate.data?.data || commCreate.data;
    assert(commData?.listingType === 'COMMERCIAL_LEASE', 'Listing type COMMERCIAL_LEASE persisted');
    assert(commData?.specs?.cabins === 4, 'Commercial cabins (4) persisted');
    assert(commData?.specs?.workstations === 25, 'Commercial workstations (25) persisted');
    assert(commData?.specs?.powerBackupKva === 40, 'Power backup kVA (40) persisted');

    // ----------------------------------------------------
    // STEP 6: AGRICULTURAL & LAND LISTING
    // ----------------------------------------------------
    console.log('\n--- 6. Creating Agricultural / Land Listing ---');
    const landPayload = {
      title: { en: 'Audit Gated 5 Bigha Fertile Farmland with Deep Borewell' },
      description: { en: 'Levelled agricultural land with black soil, road frontage, and clean freehold title.' },
      category: 'Agricultural & Land',
      subcategory: 'Agricultural Land',
      listingType: 'SALE',
      price: {
        amount: 6000000,
        currency: 'INR',
        isNegotiable: true,
      },
      location: {
        country: 'India',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        city: 'Lucknow',
        locality: 'Mohan Road Rural Belt',
        coordinates: [80.9462, 26.8467],
      },
      specs: {
        area: 5,
        areaUnit: 'BIGHAS',
        plotLength: 300,
        plotBreadth: 150,
        openSides: 2,
        boundaryWall: true,
        cornerPlot: true,
        roadWidthFt: 30,
        soilType: 'Alluvial Loam',
        landZone: 'Agricultural',
        ownershipType: 'Freehold',
      },
      rera: {
        isReraRegistered: 'NOT_APPLICABLE',
        exemptionReason: 'Agricultural / Non-plotted rural land holding',
      },
      status: 'DRAFT',
    };

    const landCreate = await request('POST', '/properties', landPayload, agentHeaders);
    assert(landCreate.status === 200 || landCreate.status === 201, 'Agricultural Land listing created');
    const landData = landCreate.data?.data || landCreate.data;
    assert(landData?.specs?.areaUnit === 'BIGHAS', 'Area unit BIGHAS persisted');
    assert(landData?.specs?.cornerPlot === true, 'Corner plot (true) persisted');
    assert(landData?.specs?.roadWidthFt === 30, 'Road width (30 ft) persisted');
    assert(landData?.specs?.bedrooms === undefined, 'Agricultural land has NO bedrooms field');

    // ----------------------------------------------------
    // STEP 7: RERA ADMIN VERIFICATION & SECURITY ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- 7. Testing RERA Admin Verification & RBAC Security ---');
    // Non-admin attempts to verify RERA -> must fail (403 Forbidden)
    const unauthorizedVerify = await request(
      'POST',
      `/admin/properties/${resSaleId}/rera-verify`,
      { remarks: 'Unauthorized user trying to self-verify' },
      agentHeaders,
    );
    assert(
      unauthorizedVerify.status === 403,
      `Non-admin direct call to /admin/properties/:id/rera-verify blocked with 403 Forbidden (status: ${unauthorizedVerify.status})`,
    );

    // Admin verifies RERA -> must succeed (200/201)
    const adminVerify = await request(
      'POST',
      `/admin/properties/${resSaleId}/rera-verify`,
      { remarks: 'Verified against UP-RERA state portal registry' },
      adminHeaders,
    );
    assert(adminVerify.status === 200 || adminVerify.status === 201, 'Admin verified RERA credentials successfully');
    const verifiedProp = adminVerify.data?.property || adminVerify.data?.data || adminVerify.data;
    assert(
      verifiedProp?.rera?.verificationStatus === 'VERIFIED',
      'RERA verificationStatus changed to VERIFIED',
    );
    assert(
      Array.isArray(verifiedProp?.rera?.auditHistory) && verifiedProp?.rera?.auditHistory.length >= 2,
      'Audit history tracked creation and verification events',
    );

    // Admin rejects RERA on commercial property -> must succeed
    const commId = commCreate.data?.id || commCreate.data?.data?.id || commCreate.data?._id;
    const adminReject = await request(
      'POST',
      `/admin/properties/${commId}/rera-reject`,
      { reason: 'INVALID_PROJECT_NAME', remarks: 'Project name does not match state registry' },
      adminHeaders,
    );
    assert(adminReject.status === 200 || adminReject.status === 201, 'Admin rejected RERA credentials successfully');
    const rejectedProp = adminReject.data?.property || adminReject.data?.data || adminReject.data;
    assert(
      rejectedProp?.rera?.verificationStatus === 'REJECTED',
      'RERA verificationStatus changed to REJECTED',
    );

    // ----------------------------------------------------
    // STEP 8: EDITING & REOPENING EXISTING LISTINGS
    // ----------------------------------------------------
    console.log('\n--- 8. Testing Editing and Reopening Existing Listings ---');
    const updateRes = await request(
      'PUT',
      `/properties/${resSaleId}`,
      {
        specs: {
          ...resSaleData.specs,
          parking: '3 Covered Slots',
        },
        price: {
          ...resSaleData.price,
          amount: 14800000,
        },
      },
      agentHeaders,
    );
    assert(updateRes.status === 200 || updateRes.status === 201, 'Property edited successfully');

    // Fetch by ID to confirm persistence
    const fetchUpdated = await request('GET', `/properties/${resSaleId}`);
    assert(fetchUpdated.status === 200, 'Reopened and fetched updated property');
    const fetchedData = fetchUpdated.data?.data || fetchUpdated.data;
    assert(fetchedData?.price?.amount === 14800000, 'Updated price (14,800,000) loaded correctly');
    assert(fetchedData?.specs?.parking === '3 Covered Slots', 'Updated parking slots loaded correctly');
    assert(fetchedData?.rera?.verificationStatus === 'VERIFIED', 'Existing VERIFIED status preserved on general specs update');

    // ----------------------------------------------------
    // STEP 9: QUERY & SEARCH FILTER VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 9. Testing Query & Search Filters ---');
    // Filter by subcategory
    const subcatSearch = await request('GET', '/properties?subcategory=Flat/Apartment');
    assert(subcatSearch.status === 200, 'Search by subcategory "Flat/Apartment" returned 200');

    // Filter by listingType PG_COLIVING
    const pgSearch = await request('GET', '/properties?listingType=PG_COLIVING');
    assert(pgSearch.status === 200, 'Search by listingType "PG_COLIVING" returned 200');

    // Filter by reraVerifiedOnly=true
    const reraVerifiedSearch = await request('GET', '/properties?reraVerifiedOnly=true');
    assert(reraVerifiedSearch.status === 200, 'Search by reraVerifiedOnly=true returned 200');

    // Filter by reraStatus=VERIFIED
    const reraStatusSearch = await request('GET', '/properties?reraStatus=VERIFIED');
    assert(reraStatusSearch.status === 200, 'Search by reraStatus=VERIFIED returned 200');

    // ----------------------------------------------------
    // STEP 10: RERA MANDATORY SUBMISSION VALIDATION
    // ----------------------------------------------------
    console.log('\n--- 10. Testing Mandatory RERA Number Submission Check ---');
    // Create uncompleted listing with RERA = YES but empty reraNumber
    const invalidReraDraft = await request(
      'POST',
      '/properties',
      {
        title: { en: 'Invalid RERA Test Property' },
        description: { en: 'Test listing without RERA number' },
        category: 'Residential',
        listingType: 'SALE',
        price: { amount: 5000000 },
        location: { city: 'Lucknow', state: 'Uttar Pradesh', locality: 'Gomti Nagar' },
        rera: {
          isReraRegistered: 'YES',
          reraNumber: '', // Missing
        },
        status: 'DRAFT',
      },
      agentHeaders,
    );
    const invalidId = invalidReraDraft.data?.id || invalidReraDraft.data?.data?.id || invalidReraDraft.data?._id;

    // Submitting for review must fail with 400 Bad Request
    const submitInvalid = await request('POST', `/properties/${invalidId}/submit`, {}, agentHeaders);
    assert(
      submitInvalid.status === 400,
      `Submission without mandatory RERA registration number rejected with 400 Bad Request (status: ${submitInvalid.status})`,
    );

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n================================================================');
    console.log(` FINAL INTEGRATION AUDIT RESULT: ${failed === 0 ? 'ALL PASSED' : 'FAILURES DETECTED'} `);
    console.log(` Passed: ${passed} | Failed: ${failed}`);
    console.log('================================================================\n');

    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAudit();
