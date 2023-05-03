const express = require("express");
const router = express.Router();
const users = require("../model/users");
const constant = require("../constance/constance");

// ORH 
function getDatesInRange(startDate, endDate) {
    const date = new Date(startDate.getTime());

    const dates = [];

    while (date <= endDate) {
        dates.push(formatDate(new Date(date)));
        date.setDate(date.getDate() + 1);
    }

    return dates;
}
function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}


router.post("/MC_MMS", async (req, res) => {
    //function respone and request
    try {
        let getData = await users.sequelize.query(
            `
            SELECT [mc_name]  FROM [counter].[dbo].[app_counter_machineno]
              `
        );
        return res.json({
            result: getData[0],
            api_result: constant.OK
        });
    } catch (error) {
        console.log("************error***************");
        res.json({
            result: error,
            api_result: constant.NOK
        });
    }
});

router.post("/topic_count", async (req, res) => {
    var command_process = ``;
    if (req.body.responsible == "All") {
        command_process = ``;
    } else {
        command_process = ` and [responsible] = '${req.body.responsible}'`;
    }
    try {
        let getData = await users.sequelize.query(
            `
                with tb1 as(
                    select [topic], 
                    format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
                    ,[occurred],[restored],[mc_no],left([mc_no],2) as propcess
                    ,[sum]
                    FROM [counter].[dbo].[mms]
                     ),tb2 as (
                     select tb1.mfg_date,tb1.[topic],tb1.[occurred] ,tb1.[restored],tb1.propcess ,tb1.[sum],tb1.[mc_no]
                     ,[topic_masters].[responsible]
                     from tb1 left join [topic_masters]
                     on tb1.[topic] = [topic_masters].[Topic]
                     ),tb3 as (select  mfg_date
                       ,count([topic]) as [frequency] 
                       ,[topic],[responsible]
                       from tb2
                       where mfg_date between  '${req.body.date_start}' and '${req.body.date_end}'
                       and [mc_no] =  '${req.body.machine}'
                       group by mfg_date,topic,[responsible]
                     )
                    ,tb_pvt as ( select mfg_date,topic,[LINE TURNING],[MAINTENANCE TURNING] from tb3 
                     Pivot (sum([frequency])
                     for [responsible] IN ([LINE TURNING],[MAINTENANCE TURNING] )
                     )as pvt 
                     )
                     select mfg_date,topic, ISNULL([LINE TURNING],0) AS [LINE_TURNING]
                     ,ISNULL([MAINTENANCE TURNING],0) AS [MAINTENANCE_TURNING] 
                     from tb_pvt 
                     order by mfg_date
               `
        );
        console.log(getData);
        return res.json({
            result: getData[0],
            api_result: constant.OK
        });
    } catch (error) {
        console.log("************error***************");
        res.json({
            result: error,
            api_result: constant.NOK
        });
    }
});

router.post("/topic_count_test", async (req, res) => {
    try {
        let getData = await users.sequelize.query(
            `
            -- query 1

            DECLARE @cols AS NVARCHAR(MAX),
                  @query  AS NVARCHAR(MAX);
             SET @cols = STUFF((SELECT distinct ',' + QUOTENAME(topic) 
                        FROM [counter].[dbo].[mms] 
               where format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd')  between  '${req.body.date_start}' and '${req.body.date_end}'
                        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)') ,1,1,'')
            
            select @cols as my_col
               `
        );
        // console.log(getData);
        return res.json({
            result: getData[0],
            api_result: constant.OK
        });
    } catch (error) {
        console.log("************error***************");
        res.json({
            result: error,
            api_result: constant.NOK
        });
    }
});

router.post("/getResult", async (req, res) => {
    try {

        list_date = getDatesInRange(new Date(req.body.date_start), new Date(req.body.date_end));
        console.log(list_date);

        let date_text = list_date.toString();
        console.log('date_text', date_text);

        let date_text_replaced = `[` + date_text.replace(/,/g, `],[`) + `]`;
        console.log('date_text_replaced', date_text_replaced);

        let date_text_concat = date_text_replaced.replace(/,/g, `,',',`);
        console.log('date_text_concat', date_text_concat);
        var Responsible = ``;
        if (req.body.responsible == "All") {
            Responsible = ``;
        } else {
            Responsible = ` and [responsible] = '${req.body.responsible}'`;
        }
        let getData = await users.sequelize.query(
            `
    -- query 2
    with tb1 as(
                select [topic], 
                format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
                ,[occurred],[restored],[mc_no],left([mc_no],2) as propcess
                ,[sum]
                FROM [counter].[dbo].[mms]  
                 )
        ,tb2 as (
                 select tb1.mfg_date,tb1.[topic],tb1.[occurred] ,tb1.[restored],tb1.propcess ,tb1.[sum],tb1.[mc_no]
                 ,[topic_masters].[responsible]
                 from tb1 left join [topic_masters]
                 on tb1.[topic] = [topic_masters].[Topic]
                 )
        ,tb3 as (select  mfg_date
          ,count([topic]) as [frequency] 
          ,[topic],[responsible]
          from tb2
          where mfg_date between   '${req.body.date_start}' and '${req.body.date_end}'
                   and [mc_no] =  '${req.body.machine}'   
                   ` +
                   Responsible +
   `
          group by mfg_date,topic,[responsible]
        )
        select topic ,[responsible]
       -- ,concat(isnull([2023-03-01],0), ',',isnull([2023-03-02],0), ',',isnull([2023-03-03],0))  as [count]
       ,concat(`+ date_text_concat + `)  as [count]
        from tb3
         Pivot (sum([frequency])
          for [mfg_date] IN (`+ date_text_replaced + `)
            )as pvt order by topic
       `
        );

        // console.log(getData);
        return res.json({
            result: getData[0],
            list_date: list_date,
            api_result: constant.OK
        });
    } catch (error) {
        console.log("************error***************");
        res.json({
            result: error,
            api_result: constant.NOK
        });
    }
});


module.exports = router;