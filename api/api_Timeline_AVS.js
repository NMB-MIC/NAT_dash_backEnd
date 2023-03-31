const express = require("express");
const router = express.Router();
const Sequelize = require("Sequelize");
const users = require("../model/users");
const constance = require("../constance/constance");



router.post("/mc_list", async (req, res) => {
    try {
        let result = await users.sequelize.query(
            `
            SELECT [mc_no]
            FROM [counter].[dbo].[mms]
            where left([mc_no],2) = 'AVS' 
            group by [mc_no]
            order by [mc_no]
            `
        );
        return res.json({
            result: result[0],
            api_result: constance.OK
        });
    } catch (error) {
        console.log("************error***************");
        res.json({
            result: error,
            api_result: constance.NOK
        });
    }

});




module.exports = router;