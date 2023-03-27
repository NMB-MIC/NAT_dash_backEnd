const express = require("express");
const router = express.Router();
const users = require("../model/users");
const constant = require("../constance/constance");

// Auto Line up 

router.post("/list_machine", async (req, res) => {
    let result = await users.sequelize.query(
        `
        SELECT [mc_name]  FROM [counter].[dbo].[app_counter_machineno]
        where left([mc_name],2) = 'AL'
       `
    );
    res.json({ result: result[0] });
});

router.post("/find_ct", async (req, res) => {
    var command_shift = ``;
    var command_final = ``;
    if (req.body.shift == "All") {
        command_final = `select [registered_at]
          ,format(sum([work_hour]), '#,##0') as [work_hour]
          ,format(sum([accum_output]), '#,##0') as [accum_output]
          ,cast(cast(sum([work_hour]) AS DECIMAL(10,2))/cast(sum([accum_output]) AS DECIMAL(10,2)) AS DECIMAL(10,2))  as [ct]
          from tb3 group by [registered_at]`;
    } else {
        command_final = `select [registered_at]
          ,format([work_hour], '#,##0') as [work_hour]
          ,format([accum_output], '#,##0') as [accum_output]
          ,[shift]
    
          ,cast(cast([work_hour] AS DECIMAL(10,2))/cast([accum_output] AS DECIMAL(10,2)) AS DECIMAL(10,2))  as [ct]
          from tb3 where [shift] = '${req.body.shift}'`;
    }
    let result = await users.sequelize.query(
        ` with tb1 as(
            SELECT 
            [app_counter_accumoutput].[mfg_date]  as [registered_at]		
            ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,0,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
                  ,[accum_output]
  
             FROM [counter].[dbo].[app_counter_accumoutput]
             left join [counter].[dbo].[app_counter_machineno] 
                      on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]       
                       left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin       
                       where [app_counter_accumoutput].[mfg_date]  = '${req.body.date}' /*---*/
                       and [accum_output] >0
                       and [mc_name] = '${req.body.machine}' /*---*/
                       and process = 'AL'/*---*/
                       and [accum_output] >0
                       and [app_counter_accumoutput].[pin] = 'D306'
            )
      ,tb2 as (select [registered_at],[hour],IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift],[accum_output]
        from tb1
        )
      ,tb3 as (
      select [registered_at],3600*count([hour]) as [work_hour],[shift] ,max([accum_output]) as [accum_output]
        from tb2 group by [registered_at],[shift]
        )
           ` + command_final
    );
    res.json({ result: result[0] });
});
router.post("/output_sum", async (req, res) => {

    let result = await users.sequelize.query(
        `
      with tb1 as(
        SELECT
        [app_counter_accumoutput].[mfg_date] as [registered_at]
       ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,0,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
       ,[accum_output]
        FROM [counter].[dbo].[app_counter_accumoutput]
                  left join [counter].[dbo].[app_counter_machineno]
                           on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
                            left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin
  where [app_counter_accumoutput].[mfg_date]  = '${req.body.date}'
          and [mc_name] = '${req.body.machine}'
          and [accum_output] >0
          --and process = 'GD'/*---*/
                       and [accum_output] >0
                       and [app_counter_accumoutput].[pin] = 'D306'
                       )
   ,tb2 as ( select  CASE wHEN [hour] = 8 THEN 1
    WHEN [hour] = 9 THEN 2
    WHEN [hour] = 10 THEN 3
    WHEN [hour] = 11 THEN 4
    WHEN [hour] = 12 THEN 5
    WHEN [hour] = 13 THEN 6
    WHEN [hour] = 14 THEN 7
    WHEN [hour] = 15 THEN 8
    WHEN [hour] = 16 THEN 9
    WHEN [hour] = 17 THEN 10
    WHEN [hour] = 18 THEN 11
    WHEN [hour] = 19 THEN 12
    WHEN [hour] = 20 THEN 13
    WHEN [hour] = 21 THEN 14
    WHEN [hour] = 22 THEN 15
    WHEN [hour] = 23 THEN 16
    WHEN [hour] = 0 THEN 17
   WHEN [hour] = 1 THEN 18
   WHEN [hour] = 2 THEN 19
    WHEN [hour] = 3 THEN 20
    WHEN [hour] = 4 THEN 21
    WHEN [hour] = 5 THEN 22
    WHEN [hour] = 6 THEN 23
   WHEN [hour] = 7 THEN 24
                  else 0   end as [row]
                  ,[registered_at],[hour],IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift],[accum_output]
        from tb1
        )
      
  
   ,tb2_2 as ( select [row],[registered_at],[hour],[shift],max([accum_output]) as[accum_output] from tb2
   group by [row],[registered_at],[hour],[shift])
  
  
  ,tb3 as (select [row],[registered_at],[hour],[shift],[accum_output],LAG([accum_output],1) OVER (ORDER BY [row]) as [prev]  from tb2_2 )
  
  ,tb_target_1 as( select [process],[target],[hour]
  ,[target]-iif(LAG([target],1) OVER (ORDER BY [target]) is null,0,LAG([target],1) OVER (ORDER BY [target])) as [target_hour] 
  FROM [counter].[dbo].[app_counter_target] 
  where [process] = 'AL'
  )
  --select * from tb_target_1
  
  select [row],tb3.[registered_at],tb3.[hour],[shift],[accum_output],iif([prev] is null,0,[prev]) as [prev] 
  ,[accum_output]-iif([prev] is null,0,[prev]) as [output_hour] 
   ,sum([accum_output]-iif([prev] is null,0,[prev]) ) over (ORDER BY [row]) as [output_accum]
  
   ,[target_hour] 
   ,[target] as [target_accum]
  from tb3
  left join tb_target_1 on tb3.[hour] = tb_target_1.[hour]
         `
    );
    //console.log({ result });
    res.json({ result: result[0] });
});
router.post("/ct_byHour", async (req, res) => {
    let result = await users.sequelize.query(
        `
      SELECT
      --convert(varchar, [app_counter_accumoutput].[registered_at], 23) as [registered_at]
         [app_counter_accumoutput].[mfg_date] as [registered_at]
         ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,0,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
          --,[accum_output] 
         ,([accum_output]/100) as ct
         ,2.40 as target
         --,[app_counter_pin].pin
          FROM [counter].[dbo].[app_counter_accumoutput]
          left join [counter].[dbo].[app_counter_machineno]
          on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
          left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin
          where   [app_counter_accumoutput].[mfg_date]  = '${req.body.date}' /*---*/
          and [accum_output] >0
          and [mc_name] = '${req.body.machine}' /*---*/
          and process = 'AL'/*---*/
          and [app_counter_accumoutput].[pin] ='D304'
        `
    );
    res.json({ result: result[0] });
});





// router.post("/UTL", async (req, res) => {
//     let result = await users.sequelize.query(
//         `
//       SELECT
//       --convert(varchar, [app_counter_accumoutput].[registered_at], 23) as [registered_at]
//       [app_counter_accumoutput].[mfg_date] as [registered_at]
//       ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) as [hour]
//       --,cast(avg(([accum_output]/10)) AS DECIMAL(18,2)) as utl 
//      --,[app_counter_pin].name
//      ,([accum_output]/100) as utl
//       FROM [counter].[dbo].[app_counter_accumoutput]
//       left join [counter].[dbo].[app_counter_machineno]
//       on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no] left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin
//       where   [app_counter_accumoutput].[mfg_date]  = '${req.body.date}'  /*---*/
//       and [accum_output] >0
//       and ([name] like  '%UTL%') 
//       and [mc_name] = '${req.body.machine}' /*---*/
//       and process = 'AL'/*---*/
//      and [app_counter_accumoutput].[pin] = 'D5240'
//      --group by [mfg_date]
//     --,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1)
  
//         `
//     );
//     console.log("***************************utl AN **********************", result);
//     res.json({ result: result[0] });
// });






module.exports = router;