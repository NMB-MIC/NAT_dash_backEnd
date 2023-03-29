const express = require("express");
const router = express.Router();
const Sequelize = require("Sequelize");
const topic_master = require("../model/master_alarm_topic");
const constance = require("../constance/constance");

router.post("/list_mc", async (req, res) => {
    let result = await topic_master.sequelize.query(
        `
      SELECT left([mc_no],2) as process
      FROM [counter].[dbo].[mms] 
      group by left([mc_no],2) 
        `
    );
    return res.json({ result: result[0] });
});

router.post("/Add_item", async (req, res) => {
    try {
        let result = await topic_master.create(req.body)
        res.json({ result: result, api_result: constance.OK });
    } catch (error) {
        res.json({ result: error, api_result: constance.NOK });
    }
});

router.get("/get_topic_list", async (req, res) => {
    try {
        let result = await topic_master.sequelize.query(
            `
            SELECT [machine]
            ,[Topic]
            ,[responsible]
        FROM [counter].[dbo].[topic_masters]
            `
        );
        res.json({ result: result[0], api_result: constance.OK });
    } catch (error) {
        res.json({ result: error, api_result: constance.NOK });
    }
});

router.get("/edit_respon", async (req, res) => {
    try {
        let result = await topic_master.sequelize.query(
            `
            SELECT [responsible]
            FROM [counter].[dbo].[topic_masters] 
            group by [responsible]  
            `
        );
        res.json({ result: result[0], api_result: constance.OK });
    } catch (error) {
        res.json({ result: error, api_result: constance.NOK });
    }
});
router.put("/update_respon", async (req, res) => {
    console.log("update_respon");
    try {
        let result = await topic_master.update(req.body, {
            where: { Topic: req.body.Topic },
        });
        res.json({ result, api_result: constance.OK });
    } catch (error) {
        res.json({ error, api_result: constance.NOK });
    }
});

router.post("/upload/:machine/:Topic/:responsible", async (req, res) => {
    console.log("upload check");
    try {
        const { machine, Topic, responsible } = req.params
        let result = await topic_master.sequelize.query(
            `INSERT INTO [topic_masters]
           ([machine],[Topic],[responsible]) VALUES ('${machine}', '${Topic}','${responsible}') `
        );
        // console.log( result );
        res.json({ result, api_result: constance.OK });
    } catch (error) {
        console.log("=====error=====");
        res.json({ error, api_result: constance.NOK });
    }
});


module.exports = router;
