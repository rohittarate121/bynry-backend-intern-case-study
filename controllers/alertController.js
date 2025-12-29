const {
  Product,
  Inventory,
  Warehouse,
  Supplier,
  InventoryLog,
} = require("../models");

const getLowStockAlerts = async (req, res) => {
  const companyId = req.params.company_id;

  try {
    const alerts = [];

    const products = await Product.findAll({
      where: { company_id: companyId },
      include: [Supplier],
    });

    for (const product of products) {
      const inventories = await Inventory.findAll({
        where: { product_id: product.id },
        include: [Warehouse],
      });

      for (const inventory of inventories) {
        const threshold = product.low_stock_threshold || 10;

        if (inventory.quantity >= threshold) continue;

        const recentSale = await InventoryLog.findOne({
          where: {
            inventory_id: inventory.id,
            reason: "sale",
          },
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
                contact_email: product.Suppliers[0].contact_email,
              }
            : null,
        });
      }
    }

    return res.status(200).json({
      alerts,
      total_alerts: alerts.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch low stock alerts",
    });
  }
};

module.exports = { getLowStockAlerts };
