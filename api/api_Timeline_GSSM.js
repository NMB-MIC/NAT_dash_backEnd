const express = require("express");
const router = express.Router();
// const Sequelize = require("Sequelize");
const users = require("../model/users");
const constance = require("../constance/constance");



router.post("/mc_list", async (req, res) => {
    try {
        let result = await users.sequelize.query(
            `
            SELECT [mc_no]
            FROM [counter].[dbo].[mms]
            where [mc_no] like  'GSSM%' 
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
router.post("/mc_status_log", async (req, res) => {
    try {
        let Result = await users.sequelize.query(
            `
            /* get status_log*/
        with tb1 as (
            SELECT format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
            ,IIF(CAST(DATEPART(HOUR, [mc_status].[occurred]) AS int)=0,23,CAST(DATEPART(HOUR, [mc_status].[occurred]) AS int)) as [hour]     
             --,iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as [occurred]
             ,[occurred]
            --,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
            ,[mc_status]
            ,[mc_no]
            FROM [counter].[dbo].[mc_status]
           ) ,tb2 as (
             select  mfg_date,[occurred] 
                  --,[NextTimeStamp]
                   ,lead([occurred]) over(partition by [mc_no] order by [mc_no],[occurred]) AS [NextTimeStamp]
                  ,[mc_status]
                  ,[mc_no] 
                  from tb1
                  where [mc_no] ='${req.body.machine}' and  mfg_date = '${req.body.date}'
           )
             select mfg_date,convert(varchar,[occurred],120) as [occurred]
             ,convert(varchar,[NextTimeStamp] ,120) as [NextTimeStamp],[mc_status] from tb2 where [NextTimeStamp] is not null
      `
        );
        return res.json({ result: Result[0] ,api_result: constance.OK,});
    } catch (error) {
        res.json({
            error,
            api_result: constance.NOK,
        })
    }
});

router.post("/Timeline_GSSM", async (req, res) => {
    var  command_process  = ``; 
    if (req.body.responsible == "All") {
        command_process = ``;
    } else {
        command_process = ` and [responsible] = '${req.body.responsible}'`;
    }
    let result = await users.sequelize.query(
        `
        with tb1 as(
            select [topic],
                   format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
                   ,[occurred]
                   ,[restored]
                  --,convert(varchar, [mms].[occurred],120) as [occurred]
                  --,convert(varchar, [mms].[restored],120) as [restored]
                  ,IIF(CAST(DATEPART(HOUR, [mms].[occurred]) AS int)=0,23,CAST(DATEPART(HOUR, [mms].[occurred]) AS int)) as [hour]
                  ,[mc_no]
                  ,left([mc_no],2) as propcess 
                  ,[sum]
                  FROM [counter].[dbo].[mms]
               ) 
               ,tb2 as (
             select tb1.mfg_date,tb1.[topic],tb1.[occurred] ,tb1.[restored],tb1.[hour],tb1.propcess ,tb1.[sum],tb1.[mc_no]
             ,[topic_masters].[responsible]
             from tb1 left join [topic_masters]
             on tb1.[topic] = [topic_masters].[Topic]
             )
               select  mfg_date,[topic]
                    ,convert(varchar,[occurred],120) as [occurred]
                    ,convert(varchar,[restored],120) as [restored],[hour],[sum]
                    ,[responsible],[mc_no]
                    from tb2
                    where mfg_date = '${req.body.date}'
                    and [mc_no] = '${req.body.machine}'
                    ` +
                    command_process +
    `
                    order by CASE
                                  WHEN [hour] = 7 THEN 1
                                  WHEN [hour] = 8 THEN 2
                                  WHEN [hour] = 9 THEN 3
                                  WHEN [hour] = 10 THEN 4
                                  WHEN [hour] = 11 THEN 5
                                  WHEN [hour] = 12 THEN 6
                                  WHEN [hour] = 13 THEN 7
                                  WHEN [hour] = 14 THEN 8
                                  WHEN [hour] = 15 THEN 9
                                  WHEN [hour] = 16 THEN 10
                                  WHEN [hour] = 17 THEN 11
                                  WHEN [hour] = 18 THEN 12
                                  WHEN [hour] = 19 THEN 13
                                  WHEN [hour] = 20 THEN 14
                                  WHEN [hour] = 21 THEN 15
                                  WHEN [hour] = 22 THEN 16
                                  WHEN [hour] = 23 THEN 17
                                  WHEN [hour] = 0 THEN 18
                                  WHEN [hour] = 1 THEN 19
                                  WHEN [hour] = 2 THEN 20
                                  WHEN [hour] = 3 THEN 21
                                  WHEN [hour] = 4 THEN 22
                                  WHEN [hour] = 5 THEN 23
                                 WHEN [hour] = 6 THEN 24
                           else 0   end ,[occurred]
      `
    );
    return res.json({ result: result[0] });
});
router.post("/AlarmTopic_time", async (req, res) => {
    try {
        let Result = await users.sequelize.query(
            `
            /* count time HH:mm:ss */
            with tb1 as(
                select [topic],
                format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd') as mfg_date
                ,iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]) as occur_new
                ,iif(DATEPART(HOUR, [restored])<7,dateadd(day,-1,[restored]),[restored]) as [restored]
               --,convert(varchar, [mms].[occurred],120) as [occurred]
               --,convert(varchar, [mms].[restored],120) as [restored]
               ,IIF(CAST(DATEPART(HOUR, [mms].[occurred]) AS int)=0,23,CAST(DATEPART(HOUR, [mms].[occurred]) AS int)) as [hour]
               ,[mc_no]
               ,[sum]
               FROM [counter].[dbo].[mms]
               )
              ,tb2 as ( 
              select  [topic]
               ,sum([sum]) as [Time]
               from tb1
               where mfg_date = '${req.body.date}'
               and [mc_no] = '${req.body.machine}'
               group by [topic]
               ) 
              select top(3) [topic]
              ,[Time]
              ,convert(varchar,DATEADD(s,[Time],0),8) as Alarm
              from tb2
              order by convert(varchar,DATEADD(s,[Time],0),8) desc 
      `
        );
        return res.json({ result: Result[0] });
    } catch (error) {
        res.json({
            error,
            api_result: constance.NOK,
        })
    }
});
router.post("/Stop_time", async (req, res) => {
    try {
        let Result = await users.sequelize.query(
            `
            with tb_a as(
                SELECT  [registered_at]
                      ,[topic]
                      ,[occurred]
                      , convert(varchar, [occurred], 23) as [occurred_date]
                      ,[restored]
                      ,[topic_group]
                      ,[sum]
                      ,[mc_no]
                    ,CAST(DATEPART(HOUR, [occurred]) AS int) as [Hour]
                  FROM [counter].[dbo].[mms]
                where format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd')  = '${req.body.date}' 
                and [mc_no] =  '${req.body.machine}'
                )
                ,tb_b as (
                select [occurred],[mc_status].[mc_status]
                ,CAST(DATEPART(HOUR, [occurred]) AS int) as [Hour]
                ,[master_mc_status].[status]
                ,[mc_no]  FROM [counter].[dbo].[mc_status]
                   left join [counter].[dbo].[master_mc_status] 
                   on [mc_status].[mc_status] = [master_mc_status].[mc_status] 
                --where format (iif(DATEPART(HOUR, [occurred])<7,dateadd(day,-1,[occurred]),[occurred]),'yyyy-MM-dd')  = '2023-01-20'    
                   
                   )
                ,tb_c as (
                select [occurred],[Hour],[topic_group],[topic] from tb_a
                union all select [occurred],[Hour],[status],'' from tb_b
                )
                --,tb_d as (
                
                --order by [occurred]
                --)
                 
                 /* get status_log*/
                       , tb1 as (
                            select convert(varchar, [occurred], 23)   as mfg_date
                ,[Hour]
                , [occurred]
                
                ,[topic_group] as [status]
                ,[topic]
                from tb_c 
                where [topic_group] <> 'ALARM' or [topic] <> '') 
                
                -- select * from tb1
                ,tb2 as ( 
                             select  mfg_date,[occurred]
                    ,LEAD([occurred],1) OVER (ORDER BY [occurred]) AS [NextTimeStamp]
                             ,[status]
                    --,iif ([status] = 'ALARM' , 'STOP',[status]) as [status]
                        ,[topic]
                              from tb1
                           
                           ) 
                   -- select * from tb2
                     ,tb3 as (
                             select mfg_date
                    ,convert(varchar,[occurred],120) as [occurred]
                     ,convert(varchar,[NextTimeStamp] ,120) as [NextTimeStamp]
                    --,[occurred]
                    ,[status] 
                 ,[topic]
                    from tb2
                    where [NextTimeStamp] is not null
                 )
                 --  select * from tb3
                 ,tb4 as (
                 select mfg_date
                 ,[occurred]
                 ,[NextTimeStamp]
                 ,[status] 
                 ,[topic]
                 --,[duration] 
                 --,isnull(lag([status]) OVER (ORDER BY[occurred]),[status])
                ,iif([status] = lag([status]) OVER (ORDER BY[occurred]),2,1) as[chk]
                
                --,iif() as [row_display] 
                 from tb3
                 ) 
                 --select * from tb4
                ------
                 ,tb5 as (
                 select  mfg_date
                 --,[occurred]
                 ,[NextTimeStamp] as [stop]
                 
                 ,[status]
                 ,[topic]
                 ,[chk]
                 --,iif([chk]=2,lag([occurred]) OVER (ORDER BY[occurred]),[occurred]) as [time_start]
                 ,iif(lead([chk]) OVER (ORDER BY[occurred])>1,'no','yes') as [row_display]
                 ,iif([chk]=2,lag([occurred]) OVER (ORDER BY[occurred]),[occurred]) as [start]
                
                 --,LEAD([NextTimeStamp],1) OVER (ORDER BY [occurred]) AS [stop]
                 from tb4
                 )
                --select * from tb
                ,final_tb as (select tb5.mfg_date
                 --,[time_start]
                 ,[start]
                 ,[stop]
                 ,tb5.[status]
                 --,[chk]
                 ,DATEDIFF(ss, [start] ,[stop]) as [duration]
                 ,[topic]
                 ,iif([status] = 'STOP',lag([topic],1) OVER (ORDER BY [start]),'') as [topic2]
                 --,[row_display]
                 from tb5
                 where [row_display]  = 'yes'
                 --ORDER BY [start] 
                 ) 
                 select [topic2],max([duration]), convert(varchar,DATEADD(s,max([duration]),0),8)as[Time] from final_tb
                 where [status] = 'STOP' and [topic2] <> ''  group by [topic2]
                 ORDER BY convert(varchar,DATEADD(s,max([duration]),0),8)  desc             
      `
        );
        return res.json({ result: Result[0] });
    } catch (error) {
        res.json({
            error,
            api_result: constance.NOK,
        })
    }
});


module.exports = router;