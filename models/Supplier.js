const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Supplier', {
    name: DataTypes.STRING,
    contact_email: DataTypes.STRING
  });
};
