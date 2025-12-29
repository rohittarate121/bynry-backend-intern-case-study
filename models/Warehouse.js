const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Warehouse', {
    name: DataTypes.STRING,
    company_id: DataTypes.INTEGER
  });
};
