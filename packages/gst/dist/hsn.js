// Top 100+ HSN codes relevant to Indian MSMEs
const HSN_TABLE = [
    // Food & Agriculture (0% / 5%)
    { hsnCode: '0101', description: 'Live horses, asses, mules', gstRate: 5 },
    { hsnCode: '0102', description: 'Live bovine animals', gstRate: 5 },
    { hsnCode: '0201', description: 'Fresh or chilled meat of bovine animals', gstRate: 0 },
    { hsnCode: '0202', description: 'Frozen meat of bovine animals', gstRate: 0 },
    { hsnCode: '0301', description: 'Live fish', gstRate: 0 },
    { hsnCode: '0302', description: 'Fresh or chilled fish', gstRate: 0 },
    { hsnCode: '0401', description: 'Milk and cream', gstRate: 5 },
    { hsnCode: '0402', description: 'Powdered milk, condensed milk', gstRate: 5 },
    { hsnCode: '0405', description: 'Butter and other fats from milk', gstRate: 12 },
    { hsnCode: '0406', description: 'Cheese and curd', gstRate: 12 },
    { hsnCode: '0407', description: 'Eggs in shell, fresh', gstRate: 0 },
    { hsnCode: '0701', description: 'Fresh or chilled potatoes', gstRate: 0 },
    { hsnCode: '0702', description: 'Fresh or chilled tomatoes', gstRate: 0 },
    { hsnCode: '0703', description: 'Onions, garlic, leeks', gstRate: 0 },
    { hsnCode: '0801', description: 'Coconuts, Brazil nuts, cashew nuts', gstRate: 5 },
    { hsnCode: '0803', description: 'Bananas including plantains', gstRate: 0 },
    { hsnCode: '0804', description: 'Dates, figs, pineapples, avocados', gstRate: 5 },
    { hsnCode: '0805', description: 'Citrus fruit, fresh or dried', gstRate: 5 },
    { hsnCode: '0901', description: 'Coffee, roasted or ground', gstRate: 5 },
    { hsnCode: '0902', description: 'Tea', gstRate: 5 },
    { hsnCode: '0904', description: 'Pepper, chillies, spices', gstRate: 5 },
    { hsnCode: '1001', description: 'Wheat and meslin', gstRate: 0 },
    { hsnCode: '1005', description: 'Maize (corn)', gstRate: 0 },
    { hsnCode: '1006', description: 'Rice', gstRate: 5 },
    { hsnCode: '1101', description: 'Wheat or meslin flour', gstRate: 5 },
    { hsnCode: '1201', description: 'Soya beans', gstRate: 5 },
    { hsnCode: '1507', description: 'Soya-bean oil', gstRate: 5 },
    { hsnCode: '1509', description: 'Olive oil', gstRate: 5 },
    { hsnCode: '1511', description: 'Palm oil', gstRate: 5 },
    { hsnCode: '1512', description: 'Sunflower-seed, safflower oil', gstRate: 5 },
    { hsnCode: '1513', description: 'Coconut oil', gstRate: 5 },
    { hsnCode: '1517', description: 'Margarine, edible mixtures', gstRate: 12 },
    { hsnCode: '1701', description: 'Cane or beet sugar', gstRate: 5 },
    { hsnCode: '1702', description: 'Jaggery (gur)', gstRate: 5 },
    { hsnCode: '1704', description: 'Sugar confectionery', gstRate: 18 },
    { hsnCode: '1801', description: 'Cocoa beans, whole or broken', gstRate: 5 },
    { hsnCode: '1806', description: 'Chocolate and food preparations with cocoa', gstRate: 18 },
    { hsnCode: '1902', description: 'Pasta, noodles', gstRate: 18 },
    { hsnCode: '1905', description: 'Bread, biscuits, cakes, pastries', gstRate: 5 },
    { hsnCode: '2001', description: 'Vegetables, fruit preparations', gstRate: 12 },
    { hsnCode: '2009', description: 'Fruit juices', gstRate: 12 },
    { hsnCode: '2101', description: 'Coffee, tea extracts and preparations', gstRate: 12 },
    { hsnCode: '2102', description: 'Yeasts, baking powders', gstRate: 18 },
    { hsnCode: '2103', description: 'Sauces, seasonings, mixed condiments', gstRate: 18 },
    { hsnCode: '2104', description: 'Soups and broths', gstRate: 12 },
    { hsnCode: '2105', description: 'Ice cream and edible ice', gstRate: 18 },
    { hsnCode: '2106', description: 'Food preparations not elsewhere specified', gstRate: 18 },
    { hsnCode: '2201', description: 'Waters, natural or artificial', gstRate: 5 },
    { hsnCode: '2202', description: 'Soft drinks, flavored waters', gstRate: 12 },
    { hsnCode: '2208', description: 'Spirituous beverages (IMFL)', gstRate: 18 },
    // Beverages & Tobacco
    { hsnCode: '2401', description: 'Unmanufactured tobacco', gstRate: 5 },
    { hsnCode: '2402', description: 'Cigars, cheroots, cigarettes', gstRate: 28 },
    // Mineral Products
    { hsnCode: '2501', description: 'Salt', gstRate: 0 },
    { hsnCode: '2523', description: 'Cement', gstRate: 28 },
    { hsnCode: '2701', description: 'Coal', gstRate: 5 },
    // Chemicals
    { hsnCode: '2801', description: 'Fluorine, chlorine, bromine', gstRate: 18 },
    { hsnCode: '2836', description: 'Carbonates', gstRate: 18 },
    { hsnCode: '2840', description: 'Borates', gstRate: 18 },
    { hsnCode: '3003', description: 'Medicaments', gstRate: 12 },
    { hsnCode: '3004', description: 'Medicaments for retail sale', gstRate: 12 },
    { hsnCode: '3102', description: 'Mineral or chemical fertilizers (nitrogenous)', gstRate: 5 },
    { hsnCode: '3105', description: 'Mineral or chemical fertilizers (mixed)', gstRate: 5 },
    { hsnCode: '3204', description: 'Synthetic organic coloring matter', gstRate: 18 },
    { hsnCode: '3401', description: 'Soap and organic surface-active products', gstRate: 18 },
    { hsnCode: '3402', description: 'Washing preparations', gstRate: 18 },
    { hsnCode: '3808', description: 'Insecticides, fungicides, herbicides', gstRate: 18 },
    { hsnCode: '3809', description: 'Finishing agents, dye carriers', gstRate: 18 },
    // Plastics & Rubber
    { hsnCode: '3923', description: 'Plastic articles for packing goods', gstRate: 18 },
    { hsnCode: '3924', description: 'Plastic tableware and kitchenware', gstRate: 18 },
    { hsnCode: '3926', description: 'Other plastic articles', gstRate: 18 },
    // Leather
    { hsnCode: '4104', description: 'Leather of bovine or equine animals', gstRate: 5 },
    { hsnCode: '4202', description: 'Trunks, suitcases, bags', gstRate: 18 },
    { hsnCode: '4203', description: 'Leather apparel and accessories', gstRate: 12 },
    // Wood
    { hsnCode: '4403', description: 'Wood in the rough', gstRate: 5 },
    { hsnCode: '4410', description: 'Particle board', gstRate: 18 },
    { hsnCode: '4411', description: 'Fibreboard of wood', gstRate: 18 },
    // Paper
    { hsnCode: '4801', description: 'Newsprint', gstRate: 5 },
    { hsnCode: '4802', description: 'Writing, printing paper', gstRate: 12 },
    { hsnCode: '4818', description: 'Toilet paper, handkerchiefs', gstRate: 18 },
    { hsnCode: '4820', description: 'Registers, account books, notebooks', gstRate: 12 },
    { hsnCode: '4821', description: 'Paper or paperboard labels', gstRate: 12 },
    // Textiles
    { hsnCode: '5007', description: 'Woven fabrics of silk', gstRate: 5 },
    { hsnCode: '5101', description: 'Greasy wool', gstRate: 5 },
    { hsnCode: '5201', description: 'Cotton, not carded or combed', gstRate: 5 },
    { hsnCode: '5208', description: 'Woven fabrics of cotton', gstRate: 5 },
    { hsnCode: '5407', description: 'Woven fabrics of synthetic filament', gstRate: 12 },
    { hsnCode: '5607', description: 'Twine, cordage, ropes', gstRate: 12 },
    { hsnCode: '5701', description: 'Carpets of textile materials', gstRate: 5 },
    { hsnCode: '5801', description: 'Woven pile fabrics', gstRate: 12 },
    { hsnCode: '6109', description: 'T-shirts, singlets', gstRate: 5 },
    { hsnCode: '6204', description: 'Women\'s suits, dresses, skirts', gstRate: 5 },
    { hsnCode: '6205', description: 'Men\'s shirts', gstRate: 5 },
    { hsnCode: '6206', description: 'Women\'s blouses', gstRate: 5 },
    { hsnCode: '6302', description: 'Bed linen, table linen', gstRate: 5 },
    { hsnCode: '6309', description: 'Worn clothing', gstRate: 5 },
    // Footwear
    { hsnCode: '6401', description: 'Waterproof footwear', gstRate: 18 },
    { hsnCode: '6402', description: 'Footwear with rubber soles', gstRate: 5 },
    { hsnCode: '6403', description: 'Footwear with leather soles', gstRate: 5 },
    { hsnCode: '6404', description: 'Sports footwear', gstRate: 18 },
    // Stone, Ceramics, Glass
    { hsnCode: '6802', description: 'Marble, granite', gstRate: 12 },
    { hsnCode: '6901', description: 'Bricks, blocks, tiles', gstRate: 5 },
    { hsnCode: '6911', description: 'Porcelain tableware, kitchenware', gstRate: 12 },
    { hsnCode: '7010', description: 'Glass bottles for packing', gstRate: 12 },
    // Iron & Steel
    { hsnCode: '7208', description: 'Flat-rolled iron products', gstRate: 18 },
    { hsnCode: '7210', description: 'Flat-rolled iron, coated', gstRate: 18 },
    { hsnCode: '7217', description: 'Iron or steel wire', gstRate: 18 },
    { hsnCode: '7306', description: 'Iron or steel pipes', gstRate: 18 },
    { hsnCode: '7318', description: 'Screws, bolts, nuts', gstRate: 18 },
    { hsnCode: '7323', description: 'Iron or steel tableware', gstRate: 12 },
    { hsnCode: '7326', description: 'Other iron or steel articles', gstRate: 18 },
    // Machinery & Electronics
    { hsnCode: '8205', description: 'Hand tools', gstRate: 18 },
    { hsnCode: '8207', description: 'Interchangeable tools', gstRate: 18 },
    { hsnCode: '8413', description: 'Pumps for liquids', gstRate: 18 },
    { hsnCode: '8414', description: 'Air or vacuum pumps', gstRate: 18 },
    { hsnCode: '8415', description: 'Air conditioning machines', gstRate: 28 },
    { hsnCode: '8418', description: 'Refrigerators, freezers', gstRate: 28 },
    { hsnCode: '8421', description: 'Centrifuges, filtering machinery', gstRate: 18 },
    { hsnCode: '8430', description: 'Earth moving, excavating machinery', gstRate: 18 },
    { hsnCode: '8443', description: 'Printing machinery', gstRate: 18 },
    { hsnCode: '8450', description: 'Household washing machines', gstRate: 28 },
    { hsnCode: '8467', description: 'Power tools', gstRate: 18 },
    { hsnCode: '8471', description: 'Computers and laptops', gstRate: 18 },
    { hsnCode: '8473', description: 'Parts for office machines', gstRate: 18 },
    { hsnCode: '8501', description: 'Electric motors and generators', gstRate: 18 },
    { hsnCode: '8504', description: 'Electric transformers', gstRate: 18 },
    { hsnCode: '8507', description: 'Electric accumulators (batteries)', gstRate: 18 },
    { hsnCode: '8513', description: 'Portable electric lamps', gstRate: 18 },
    { hsnCode: '8517', description: 'Telephone sets, smartphones', gstRate: 18 },
    { hsnCode: '8525', description: 'Transmission apparatus', gstRate: 18 },
    { hsnCode: '8528', description: 'Monitors and projectors', gstRate: 18 },
    { hsnCode: '8536', description: 'Switches, relays, fuses', gstRate: 18 },
    { hsnCode: '8537', description: 'Control panels', gstRate: 18 },
    { hsnCode: '8539', description: 'LED lamps and tubes', gstRate: 12 },
    { hsnCode: '8541', description: 'Diodes, transistors', gstRate: 18 },
    { hsnCode: '8542', description: 'Integrated circuits', gstRate: 18 },
    // Vehicles
    { hsnCode: '8702', description: 'Motor vehicles for transport', gstRate: 28 },
    { hsnCode: '8703', description: 'Cars', gstRate: 28 },
    { hsnCode: '8711', description: 'Motorcycles, scooters', gstRate: 28 },
    { hsnCode: '8712', description: 'Bicycles', gstRate: 12 },
    // Furniture & Stationery
    { hsnCode: '9401', description: 'Chairs, seats', gstRate: 18 },
    { hsnCode: '9403', description: 'Wooden furniture', gstRate: 18 },
    { hsnCode: '9404', description: 'Mattresses, bedding', gstRate: 12 },
    { hsnCode: '9405', description: 'Luminaires and lighting fittings', gstRate: 18 },
    { hsnCode: '9506', description: 'Sports equipment', gstRate: 12 },
    { hsnCode: '9608', description: 'Ball point pens', gstRate: 12 },
    { hsnCode: '9609', description: 'Pencils, crayons', gstRate: 12 },
    { hsnCode: '9619', description: 'Sanitary napkins', gstRate: 0 },
    { hsnCode: '9801', description: 'Gold (unwrought or semi-manufactured)', gstRate: 3 },
    { hsnCode: '9802', description: 'Silver (unwrought or semi-manufactured)', gstRate: 3 },
];
const HSN_MAP = new Map(HSN_TABLE.map(e => [e.hsnCode, e]));
/** Default GST rate when HSN code is not found */
export const DEFAULT_GST_RATE = 18;
/**
 * Look up an HSN code and return its entry (description + GST rate).
 * Returns `undefined` if the code is not in the table.
 */
export function lookupHSN(hsnCode) {
    return HSN_MAP.get(hsnCode.trim());
}
/**
 * Get the GST rate for a given HSN code.
 * Falls back to 18% (default rate) if not found.
 */
export function getGSTRateByHSN(hsnCode) {
    return lookupHSN(hsnCode)?.gstRate ?? DEFAULT_GST_RATE;
}
/**
 * Fuzzy search HSN codes by product name or description keyword.
 * Returns up to `limit` matches.
 */
export function searchHSN(keyword, limit = 5) {
    const lower = keyword.toLowerCase();
    const direct = HSN_TABLE.filter(e => e.hsnCode === keyword || e.description.toLowerCase().includes(lower));
    // Boost exact HSN matches, then sort by relevance
    direct.sort((a, b) => {
        if (a.hsnCode === keyword)
            return -1;
        if (b.hsnCode === keyword)
            return 1;
        return a.description.toLowerCase().indexOf(lower) - b.description.toLowerCase().indexOf(lower);
    });
    return direct.slice(0, limit);
}
/** Exempt goods that have 0% GST (fresh vegetables, milk, eggs, etc.) */
const EXEMPT_HSN_CODES = new Set([
    '0201', '0202', '0301', '0302',
    '0407',
    '0701', '0702', '0703',
    '0803',
    '1001', '1005',
    '2501',
    '9619',
]);
/**
 * Check if an HSN code corresponds to an exempt good (0% GST).
 */
export function isExemptGood(hsnCode) {
    return EXEMPT_HSN_CODES.has(hsnCode.trim());
}
/**
 * Validate Indian state code (2-letter code).
 */
export function isValidStateCode(code) {
    const valid = new Set([
        'AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL', 'DN',
        'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD',
        'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ',
        'SK', 'TG', 'TN', 'TR', 'UP', 'UK', 'WB',
    ]);
    return valid.has(code.toUpperCase());
}
//# sourceMappingURL=hsn.js.map