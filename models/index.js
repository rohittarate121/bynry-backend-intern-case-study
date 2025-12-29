const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

const Product = require('./Product')(sequelize);
const Inventory = require('./Inventory')(sequelize);
const Warehouse = require('./Warehouse')(sequelize);
const Supplier = require('./Supplier')(sequelize);
const InventoryLog = require('./InventoryLog')(sequelize);

// Associations
Product.hasMany(Inventory);
Inventory.belongsTo(Product);

Warehouse.hasMany(Inventory);
Inventory.belongsTo(Warehouse);

Product.belongsToMany(Supplier, { through: 'ProductSuppliers' });
Supplier.belongsToMany(Product, { through: 'ProductSuppliers' });

Inventory.hasMany(InventoryLog);
InventoryLog.belongsTo(Inventory);

module.exports = {
  sequelize,
  Product,
  Inventory,
  Warehouse,
  Supplier,
  InventoryLog
};
