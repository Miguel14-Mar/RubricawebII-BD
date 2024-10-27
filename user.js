const { DataTypes } = require('sequelize');
const sequelize = require('./bd');

const User = sequelize.define('user', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
});

module.exports = User;