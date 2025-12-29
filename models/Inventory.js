const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Inventory', {
    quantity: DataTypes.INTEGER
  });
};
