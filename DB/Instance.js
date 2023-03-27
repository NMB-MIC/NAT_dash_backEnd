const Sequelize = require("sequelize");
const sequelize = new Sequelize("counter", "sa", "sa@admin", {
   host: "localhost",     // IP database
   dialect: "mssql",         // connect with MSSQL
   dialectOptions: {
      //requestTimeout: 30000 ,
      options: {
         instanceName: "SQLEXPRESS",

      },
   },
});


(async () => {
   await sequelize.authenticate();
})();
module.exports = sequelize;
