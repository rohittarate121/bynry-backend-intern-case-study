const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Product', {
    name: DataTypes.STRING,
    sku: { type: DataTypes.STRING, unique: true },
    price: DataTypes.FLOAT,
    company_id: DataTypes.INTEGER,
    low_stock_threshold: DataTypes.INTEGER
  });
};
