//Reference
const { Sequelize, DataTypes } = require("sequelize");

//SQL Connection
const database = require("../DB/Instance");

//Create Table in SQL
//ชื่อตั่วแปร Const ต้องตรงกับข้างล่าง
const user_table = database.define(
  // table name
  "user",
  {
    // column list >>>>>>>
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    empNumber: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          args: true,
          msg: "Required",
        },
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    levelUser: {
      type: Sequelize.STRING,
      defaultValue: "Guest",
      allowNull: false,
    },
  },
  {
    //option
    // do not delete
    timestamps: false,
  }
);

//True : Delete then Create 
//False : Only Check then Create 

//ชื่อตั่วแปร await,module.exports  ต้องตรงกับข้างบน
(async () => {
  await user_table.sync({ force: false });
})();

module.exports = user_table;
