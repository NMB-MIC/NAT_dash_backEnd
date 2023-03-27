//Reference
const { Sequelize, DataTypes } = require("sequelize");
const database = require("../DB/Instance");
const topic_master = database.define(
  // table name
  "topic_master",
  {
    // column list >>>>>>>
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      //allowNull: false,
      primaryKey: true,
    },
    machine: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Required",
        },
      },
    },
    Topic: {
      type: Sequelize.STRING,
      allowNull: false,
      // unique: true,
      validate: {
        notEmpty: {
          args: true,
          msg: "Required",
        },
      },
    },
    responsible: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "Required",
          },
        },
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
  await topic_master.sync({ force: false });
})();

module.exports = topic_master;
