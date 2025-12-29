Backend Engineering Intern – Case Study
Name: Rohit Tarate
Email Id: rohit.tarate123@gmail.com

Part 1: Code Review & Debugging
I reviewed the given API endpoint as if I were joining the team and checking an existing production API. Below are the issues I identified, their possible impact in production, and how I would fix them using a simple Node.js (Express) approach.

Issues Identified
No input validation
The API directly uses request data without checking if required fields are present or valid.
SKU uniqueness is not checked
The code does not verify whether a product with the same SKU already exists, even though SKUs must be unique across the platform.
Decimal price handling is missing
Price values are accepted without validation or proper decimal handling, which can cause precision issues.
Optional fields are not handled safely
The code assumes all fields are always present and does not handle missing or optional values.
No error handling or proper response codes
The API always returns a success message even when errors occur.
No transaction safety
Product and inventory are saved using two separate database commits instead of a single transaction.

Impact in Production
Missing validation can cause API crashes and server errors.
Duplicate SKUs can break inventory tracking, reporting, and order processing.
Partial database commits can result in products without inventory records.
Incorrect price handling can lead to financial calculation errors.
Lack of proper error responses makes it difficult for frontend systems to react correctly.

Proposed Fix and Updated Code
To address these issues, I added basic input validation, enforced SKU uniqueness, used a single database transaction, handled decimal pricing properly, and added basic error handling.
const { Product, Inventory, sequelize } = require('../models');

const createProduct = async (req, res) => {
  const data = req.body;

  // Basic validation
  if (
    !data.name ||
    !data.sku ||
    !data.price ||
    !data.warehouse_id ||
    data.initial_quantity === undefined
  ) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  try {
    // Check if SKU already exists
    const existingProduct = await Product.findOne({
      where: { sku: data.sku }
    });

    if (existingProduct) {
      return res.status(409).json({
        error: 'SKU already exists'
      });
    }

    // Use transaction to keep data safe
    const result = await sequelize.transaction(async (t) => {
      const product = await Product.create(
        {
          name: data.name,
          sku: data.sku,
          price: parseFloat(data.price)
        },
        { transaction: t }
      );

      await Inventory.create(
        {
          product_id: product.id,
          warehouse_id: data.warehouse_id,
          quantity: data.initial_quantity
        },
        { transaction: t }
      );

      return product;
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product_id: result.id
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Something went wrong while creating product'
    });
  }
};

module.exports = { createProduct };


Explanation of Fixes
Added basic validation to ensure required data is present
Checked SKU uniqueness before creating a product
Used a database transaction so product and inventory are saved together
Converted price to a numeric value to support decimals
Returned proper HTTP status codes for success and errors
Kept the logic simple and readable for maintainability
I chose Node.js (Express) for this solution because I am comfortable with JavaScript on the backend. The same logic can be applied in other frameworks as well.

Part 2: Database Design (Simple & Practical)
Based on the given requirements, I designed a simple and scalable database structure for an inventory management system. Since some requirements are intentionally incomplete, I made reasonable assumptions and noted the questions I would ask the product team.

Core Tables and Their Purpose
1. Companies
Stores information about businesses using the platform.
Column
Type
Description
id
INT (PK)
Company ID
name
VARCHAR
Company name
created_at
TIMESTAMP
Record creation time

Reasoning:
Each company can own multiple warehouses and products.

2. Warehouses
Stores warehouse details for each company.
Column
Type
Description
id
INT (PK)
Warehouse ID
company_id
INT (FK)
Owning company
name
VARCHAR
Warehouse name
location
VARCHAR
Warehouse location

Reasoning:
A company can have many warehouses, but each warehouse belongs to one company.

3. Products
Stores product master data.
Column
Type
Description
id
INT (PK)
Product ID
company_id
INT (FK)
Owning company
name
VARCHAR
Product name
sku
VARCHAR (UNIQUE)
Unique SKU
price
DECIMAL
Product price
product_type
VARCHAR
Used for thresholds
created_at
TIMESTAMP
Created time

Reasoning:
Product data is stored once and linked to inventory through a separate table.

4. Inventory
Tracks product quantity per warehouse.
Column
Type
Description
id
INT (PK)
Inventory ID
product_id
INT (FK)
Product
warehouse_id
INT (FK)
Warehouse
quantity
INT
Current stock

Constraint: Unique (product_id, warehouse_id)
Reasoning:
This allows the same product to exist in multiple warehouses with different quantities.

5. Inventory_Logs
Tracks inventory changes over time.
Column
Type
Description
id
INT (PK)
Log ID
inventory_id
INT (FK)
Inventory record
change_qty
INT
Quantity change
reason
VARCHAR
Sale, restock, adjustment
created_at
TIMESTAMP
Change time

Reasoning:
Helps in auditing, tracking stock movement, and calculating usage trends.

6. Suppliers
Stores supplier details.
Column
Type
Description
id
INT (PK)
Supplier ID
name
VARCHAR
Supplier name
contact_email
VARCHAR
Contact email


7. Product_Suppliers
Maps products to suppliers.
Column
Type
Description
product_id
INT (FK)
Product
supplier_id
INT (FK)
Supplier

Reasoning:
A product can have multiple suppliers, and a supplier can supply multiple products.

8. Product_Bundles
Supports bundled products.
Column
Type
Description
bundle_id
INT (FK)
Parent product
child_product_id
INT (FK)
Included product
quantity
INT
Quantity in bundle

Reasoning:
Allows one product to contain multiple other products.

Relationships Summary
Company → Warehouses (1 to many)
Company → Products (1 to many)
Product → Warehouses (many to many via inventory)
Product → Suppliers (many to many)
Inventory → Inventory Logs (1 to many)
Product → Product Bundles (self-referencing)

Missing Requirements / Questions for Product Team
Can a product belong to multiple companies or only one?
Is SKU unique globally or per company?
How is “recent sales activity” defined (time-based or count-based)?
Can a product have multiple suppliers with priority?
How should bundle inventory be calculated?
Are negative inventory values allowed?
Should inventory thresholds be configurable per product or per product type?

Design Decisions & Justification
Inventory is separated from products to support multiple warehouses
Inventory logs are used for tracking changes and analytics
Unique constraints prevent duplicate product entries in a warehouse
Indexes should be added on product_id, warehouse_id, and sku

Assumptions Made
Each product belongs to one company
SKU is unique within the platform
Inventory quantity is always non-negative
Bundles do not directly store stock; stock is calculated from child products

Part 3: Low Stock Alerts API (Node.js – Express)
The goal of this API is to return low-stock alerts for a company so that users know which products need to be reordered. The API considers product-specific thresholds, recent sales activity, multiple warehouses, and supplier information.

Endpoint
GET /api/companies/{company_id}/alerts/low-stock

Assumptions Made
Each product belongs to one company
Low-stock threshold is stored at the product or product-type level
Recent sales activity means at least one sale record exists
Alerts are generated per warehouse
Each product has at least one supplier
Days until stockout is calculated using average daily sales
For simplicity, the implementation checks for the existence of a sale record. In a production system, this would be filtered by date.

High-Level Approach
Fetch all products for the company
Fetch inventory across warehouses
Check stock against threshold
Verify recent sales activity
Calculate days until stockout
Attach supplier details
Return alerts

Database Tables Used
products
warehouses
inventory
inventory_logs
suppliers
product_suppliers

Node.js (Express) Implementation
const {
  Product,
  Inventory,
  Warehouse,
  Supplier,
  InventoryLog
} = require('../models');

const getLowStockAlerts = async (req, res) => {
  const companyId = req.params.company_id;

  try {
    const alerts = [];

    const products = await Product.findAll({
      where: { company_id: companyId },
      include: [Supplier]
    });

    for (const product of products) {
      const inventories = await Inventory.findAll({
        where: { product_id: product.id },
        include: [Warehouse]
      });

      for (const inventory of inventories) {
        const threshold = product.low_stock_threshold || 10;

        if (inventory.quantity >= threshold) continue;

        const recentSale = await InventoryLog.findOne({
          where: {
            inventory_id: inventory.id,
            reason: 'sale'
          }
        });

        if (!recentSale) continue;

        const averageDailySales = 1;
        const daysUntilStockout = Math.floor(
          inventory.quantity / averageDailySales
        );

        alerts.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          warehouse_id: inventory.warehouse_id,
          warehouse_name: inventory.Warehouse.name,
          current_stock: inventory.quantity,
          threshold,
          days_until_stockout: daysUntilStockout,
          supplier: product.Suppliers.length
            ? {
                id: product.Suppliers[0].id,
                name: product.Suppliers[0].name,
                contact_email: product.Suppliers[0].contact_email
              }
            : null
        });
      }
    }

    return res.status(200).json({
      alerts,
      total_alerts: alerts.length
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Failed to fetch low stock alerts'
    });
  }
};

module.exports = { getLowStockAlerts };


Edge Cases Considered
Products with no recent sales are ignored
Products with enough stock are not included
Products without suppliers return supplier as null
Multiple warehouses are handled separately
Missing thresholds fall back to default values

Why This Design Works
Simple and readable logic
Covers real-world inventory scenarios
Easy to improve later
Clear separation of concerns

