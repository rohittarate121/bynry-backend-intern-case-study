const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('InventoryLog', {
    reason: DataTypes.STRING
  });
};
