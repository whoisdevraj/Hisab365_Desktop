export const schema = {
  // 1. USERS
  users: `
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    organization_name TEXT,
    organization_gst_no TEXT,
    organization_pan_no TEXT,
    organization_phone_no TEXT,
    organization_address TEXT,
    organization_logo TEXT
  );

  `,

  // 2. BANKS
  banks: `
    CREATE TABLE IF NOT EXISTS banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  account_holder TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  branch TEXT,
  account_type TEXT,
  virtual_payment_address TEXT,
  balance REAL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
  `,

  // 3. BANK TRANSACTIONS
  bank_transactions: `
    CREATE TABLE IF NOT EXISTS bank_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT CHECK(transaction_type IN ('credit', 'debit')) NOT NULL,
        related_vendor_id INTEGER,
        related_customer_id INTEGER,
        reference_invoice_id INTEGER,
        reference_invoice_type TEXT CHECK(reference_invoice_type IN ('purchase', 'sales')),
        transaction_date TEXT,
        description TEXT,
        reference_no TEXT,
        FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
        FOREIGN KEY (related_vendor_id) REFERENCES vendors(id),
        FOREIGN KEY (related_customer_id) REFERENCES customers(id)
      );
  `,

  // 4. TRANSPORTERS
  transporters: `
    CREATE TABLE IF NOT EXISTS transporters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      address TEXT,
      phone_no TEXT
    );
  `,

  // 5. VENDORS
  vendors: `
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      gst_no TEXT,
      pan_no TEXT,
      address TEXT,
      pincode TEXT,
      phone_no TEXT,
      total_amount_payment_due REAL DEFAULT 0
    );
  `,

  // 6. CUSTOMERS
  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      gst_no TEXT,
      pan_no TEXT,
      address TEXT,
      pincode TEXT,
      phone_no TEXT,
      total_amount_receivable REAL DEFAULT 0
    );
  `,

  // 7. INVENTORY ITEMS
  inventory_items: `
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      hsn_code TEXT,
      gst_percent REAL,
      adValoremCess REAL,
      nonAdValoremCess REAL,
      product_code TEXT,
      seeding_product_code TEXT,
      unit TEXT,
      rate REAL,
      latest_selling_rate REAL,
      latest_purchasing_rate REAL,
      quantity INTEGER DEFAULT 0,
      excess_qty INTEGER DEFAULT 0,
      rejected_qty INTEGER DEFAULT 0
    );

  `,

  services: `
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      sac_code TEXT,
      gst_percent REAL,
      adValoremCess REAL,
      nonAdValoremCess REAL,
      unit TEXT,
      rate REAL
    );
  `,

  // 8. PURCHASE ORDERS
  purchase_orders: `
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_name TEXT UNIQUE,
      user_id INTEGER, -- links to issuing organization's user
      vendor_id INTEGER,
      vendor_name TEXT,
      vendor_gst_no TEXT,
      vendor_phone_no TEXT,
      vendor_address TEXT,
      shipped_to_address TEXT,     -- NEW: For delivery location
      status TEXT DEFAULT 'pending', -- pending / partially_delivered / delivered
      gstin_type TEXT,               -- SGST_CGST / IGST
      sgst_amount REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      ad_valorem_cess_amount REAL DEFAULT 0,      
      non_ad_valorem_cess_amount REAL DEFAULT 0, 
      amount_excl_gst REAL,
      
      total_amount REAL,
      ref_quotation_no TEXT,         -- NEW: Reference quotation
      created_at TEXT,
      delivery_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

  `,

  purchase_order_items: `
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER,
      item_id INTEGER,
      quantity INTEGER,
      rate REAL,
      discount REAL DEFAULT 0,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    );

  `,

  purchase_order_services: `
    CREATE TABLE IF NOT EXISTS purchase_order_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_order_id INTEGER,
        service_id INTEGER,
        quantity INTEGER,
        rate REAL,
        discount REAL DEFAULT 0,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
        FOREIGN KEY (service_id) REFERENCES services(id)
      );

  `,

  transporter_invoices: `
  CREATE TABLE IF NOT EXISTS transporter_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_invoice_id INTEGER,
    customer_invoice_id INTEGER,
    mode TEXT,
    lr_or_awb_no TEXT,
    transporter_name TEXT,
    vehicle_no TEXT,
    transporter_bill_no TEXT,
    transporter_amount REAL,
    shipped_from TEXT,
    delivered_at TEXT,
    created_at TEXT,
    FOREIGN KEY (customer_invoice_id) REFERENCES customer_invoices(id),
    FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id)
  );
`,

  // 9. GOODS INSPECTION REPORT (GIR)
  goods_inspection_reports: `
    CREATE TABLE IF NOT EXISTS goods_inspection_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_invoice_id INTEGER,
      transporter_invoice_id INTEGER,
      shipped_from TEXT,
      delivered_at TEXT,
      packing_good_intact INTEGER DEFAULT 0,
      packing_partial_damage INTEGER DEFAULT 0,
      packing_full_damage INTEGER DEFAULT 0,
      arrival_date TEXT,
      created_at TEXT,
      FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id),
      FOREIGN KEY (transporter_invoice_id) REFERENCES transporter_invoices(id)
    );
  `,

  gir_items: `
    CREATE TABLE IF NOT EXISTS gir_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gir_id INTEGER,
      item_id INTEGER,
      ordered_qty INTEGER,
      delivered_qty INTEGER,
      remaining_qty INTEGER,
      missing_qty INTEGER,
      rejected_qty INTEGER,
      rejection_reason TEXT,
      accepted_qty INTEGER,
      excess_qty INTEGER,
      FOREIGN KEY (gir_id) REFERENCES goods_inspection_reports(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    );
  `,

  // 10. PURCHASE INVOICES
  purchase_invoices: `
    CREATE TABLE IF NOT EXISTS purchase_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT UNIQUE,
  vendor_id INTEGER,
  purchase_order_id INTEGER,
  ref_vendor_invoice_no TEXT,
  total_amount REAL,
  gst_amount REAL,
  amount_paid REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'incomplete', -- options: complete, partial, incomplete
  created_at TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
);
  `,

  purchase_invoice_items: `
    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_invoice_id INTEGER,
      item_id INTEGER,
      quantity INTEGER,
      rate REAL,
      discount REAL DEFAULT 0,
      FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
    );
  `,

  purchase_invoice_services: `
    CREATE TABLE IF NOT EXISTS purchase_invoice_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_invoice_id INTEGER,
        service_id INTEGER,
        quantity INTEGER,
        rate REAL,
        discount REAL DEFAULT 0,
        FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id),
        FOREIGN KEY (service_id) REFERENCES services(id)
      );

  `,

  // 11. CUSTOMER QUOTATIONS
  quotations: `
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_no TEXT UNIQUE,
      user_id INTEGER,                       -- issuing organization
      customer_id INTEGER,
      customer_name TEXT,
      customer_gst_no TEXT,
      customer_phone_no TEXT,
      customer_address TEXT,
      shipped_to_address TEXT,              -- delivery location
      gstin_type TEXT,                      -- SGST_CGST or IGST
      sgst_amount REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      ad_valorem_cess_amount REAL DEFAULT 0,     -- 👈 Added header tracking
      non_ad_valorem_cess_amount REAL DEFAULT 0,
      amount_excl_gst REAL,
      total_amount REAL,
      ref_enquiry_no TEXT,                  -- optional reference to an enquiry
      created_at TEXT,
      expected_delivery_date TEXT,         -- like PO delivery date
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
);

  `,

  quotation_items: `
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER,
      item_id INTEGER,
      quantity INTEGER,
      rate REAL,
      discount REAL DEFAULT 0,
      gst_percent REAL,
      cess_percent REAL DEFAULT 0,       -- 👈 Lock in custom line CESS %
      cess_flat REAL DEFAULT 0,
      amount_excl_gst REAL,
      cess_amount REAL DEFAULT 0,
      gst_amount REAL,
      total_amount REAL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);
  `,

  quotation_services: `
    CREATE TABLE IF NOT EXISTS quotation_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER,
      service_id INTEGER,
      quantity INTEGER,
      rate REAL,
      discount REAL DEFAULT 0,
      gst_percent REAL,
      cess_percent REAL DEFAULT 0,       -- 👈 Lock in custom service CESS %
      cess_flat REAL DEFAULT 0,          -- 👈 Lock in custom service flat CESS
      amount_excl_gst REAL,
      gst_amount REAL,
      cess_amount REAL DEFAULT 0,
      total_amount REAL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );
  `,

  // 12. PROFORMA INVOICES
  proforma_invoices: `
    CREATE TABLE IF NOT EXISTS proforma_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER,
      proforma_no TEXT UNIQUE,
      customer_id INTEGER,
      customer_po_no TEXT,
      transporter_id INTEGER,
      amount_excl_gst REAL,
      gst_percent REAL,
      gst_amount REAL,
      ad_valorem_cess_amount REAL DEFAULT 0,     -- 👈 Added
      non_ad_valorem_cess_amount REAL DEFAULT 0,
      total_amount REAL,
      created_at TEXT,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (transporter_id) REFERENCES transporters(id)
    );
  `,

  proforma_invoice_items: `
  CREATE TABLE IF NOT EXISTS proforma_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proforma_invoice_id INTEGER,
  item_id INTEGER,
  quantity INTEGER,
  rate REAL,
  discount REAL DEFAULT 0,
  gst_percent REAL,
  cess_percent REAL DEFAULT 0,
    cess_flat REAL DEFAULT 0,
      amount_excl_gst REAL,
      gst_amount REAL,
      cess_amount REAL DEFAULT 0,
  total_amount REAL,
  FOREIGN KEY (proforma_invoice_id) REFERENCES proforma_invoices(id),
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);
  `,

  proforma_invoice_services: `
    CREATE TABLE IF NOT EXISTS proforma_invoice_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proforma_invoice_id INTEGER,
      service_id INTEGER,
      quantity INTEGER,
      rate REAL,
      discount REAL DEFAULT 0,
      gst_percent REAL,
      cess_percent REAL DEFAULT 0,
      cess_flat REAL DEFAULT 0,
      amount_excl_gst REAL,
      gst_amount REAL,
      cess_amount REAL DEFAULT 0,
      total_amount REAL,
      FOREIGN KEY (proforma_invoice_id) REFERENCES proforma_invoices(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );
  `,

  // 13. FINAL CUSTOMER INVOICES
  customer_invoices: `
  CREATE TABLE IF NOT EXISTS customer_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no TEXT UNIQUE,
  customer_id INTEGER,
  quotation_id INTEGER,
  ref_customer_Po_no TEXT,
  amount_excl_gst REAL,
  gst_amount REAL,
  ad_valorem_cess_amount REAL DEFAULT 0,
      non_ad_valorem_cess_amount REAL DEFAULT 0,
  total_amount REAL,
  amount_paid REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'incomplete', -- options: complete, partial, incomplete
  delivery_terms TEXT,                      
  payment_terms TEXT,                       
  created_at TEXT,
  ewaybill_no TEXT,
  
  FOREIGN KEY (customer_id) REFERENCES customers(id)
  
);

`,

  customer_invoice_items: `
  CREATE TABLE IF NOT EXISTS customer_invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_invoice_id INTEGER,
    item_id INTEGER,
    quantity INTEGER,
    rate REAL,
    discount REAL DEFAULT 0,
    gst_percent REAL,
    cess_percent REAL DEFAULT 0,
      cess_flat REAL DEFAULT 0,
      amount_excl_gst REAL,
      gst_amount REAL,
      cess_amount REAL DEFAULT 0,
      total_amount REAL,
    FOREIGN KEY (customer_invoice_id) REFERENCES customer_invoices(id),
    FOREIGN KEY (item_id) REFERENCES inventory_items(id)
  );
`,
  customer_invoice_services: `
    CREATE TABLE IF NOT EXISTS customer_invoice_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_invoice_id INTEGER,
      service_id INTEGER,
      quantity INTEGER,
      rate REAL,
      discount REAL DEFAULT 0,
      gst_percent REAL,
      cess_percent REAL DEFAULT 0,
      cess_flat REAL DEFAULT 0,
      amount_excl_gst REAL,
      gst_amount REAL,
      cess_amount REAL DEFAULT 0,
      total_amount REAL,
      FOREIGN KEY (customer_invoice_id) REFERENCES customer_invoices(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );
  `,

  delivery_challans: `
CREATE TABLE IF NOT EXISTS delivery_challans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challan_no TEXT UNIQUE,
  quotation_id INTEGER,
  customer_id INTEGER,
  amount_excl_gst REAL,
  gst_amount REAL,
  total_amount REAL,
  ad_valorem_cess_amount REAL DEFAULT 0,      
  non_ad_valorem_cess_amount REAL DEFAULT 0,
  ref_po_no TEXT, -- reference PO from customer if any
  delivery_date TEXT,
  created_at TEXT,
  delivery_status TEXT DEFAULT 'pending', -- options: pending, delivered, partial
  transport_mode TEXT,
  vehicle_no TEXT,
  delivery_address TEXT,
  amount_paid REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'incomplete', -- options: complete, partial, incomplete

  FOREIGN KEY (customer_id) REFERENCES customers(id)
  
);
`,

  delivery_challan_items: `
CREATE TABLE IF NOT EXISTS delivery_challan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_challan_id INTEGER,
  item_id INTEGER,
  quantity INTEGER,
  rate REAL,
  discount REAL DEFAULT 0,
  gst_percent REAL,
  amount_excl_gst REAL,
  gst_amount REAL,
  total_amount REAL,
  FOREIGN KEY (delivery_challan_id) REFERENCES delivery_challans(id),
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);
`,

  delivery_challan_services: `
CREATE TABLE IF NOT EXISTS delivery_challan_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_challan_id INTEGER,
  service_id INTEGER,
  quantity INTEGER,
  rate REAL,
  discount REAL DEFAULT 0,
  gst_percent REAL,
  amount_excl_gst REAL,
  gst_amount REAL,
  total_amount REAL,
  FOREIGN KEY (delivery_challan_id) REFERENCES delivery_challans(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);
`
}
