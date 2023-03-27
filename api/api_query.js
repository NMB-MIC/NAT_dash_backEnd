//Reference
const express = require("express");
const router = express.Router();
const Sequelize = require("Sequelize");
//Create constance and link to model
// จะทำงาน แม้ว่ายังไม่มีการกด link ก็ตาม
const users = require("./../model/users");

const constance = require("./../constance/constance");
const bcrypt = require("bcryptjs");
const { constants } = require("fs-extra");

function generateDateList(from, to) {
  var getDate = function (date) {
    //Mysql Format
    var m = date.getMonth(),
      d = date.getDate();
    return date.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
  };
  var fs = from.split("-"),
    startDate = new Date(fs[0], fs[1], fs[2]),
    result = [getDate(startDate)],
    start = startDate.getTime(),
    ts,
    end;

  if (typeof to == "undefined") {
    end = new Date().getTime();
  } else {
    ts = to.split("-");
    end = new Date(ts[0], ts[1], ts[2]).getTime();
  }
  while (start < end) {
    start += 86400000;
    startDate.setTime(start);
    result.push(getDate(startDate));
  }
  return result;
}

router.post("/machine_timeline", async (req, res) => {
  var command_shift = ``;
  if (req.body.shift == "All") {
    command_shift = ``;
  } else {
    command_shift = `where   IIF([hour] >= 7 and [hour] <=18 ,'M','N') = '${req.body.shift}'`;
  }
  let result = await users.sequelize.query(
    `
    with tb1 as(
        select [status]
        ,convert(varchar, [app_counter_machinelog].[registered_at], 120) as [Time]
   
        ,IIF(CAST(DATEPART(HOUR, [app_counter_machinelog].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_machinelog].[registered_at]) AS int)) as [hour]
         FROM [counter].[dbo].[app_counter_machinelog]
         left join [counter].[dbo].[app_counter_machineno] 
          on [app_counter_machinelog].node_no_id = [app_counter_machineno].[node_no]
         where [mfg_date] = '${req.body.date}'
         and [mc_name] = '${req.body.machine}' 
         and left([mc_name],3) = '${req.body.process}'
        )
        ,tb2 as (
            select 
            [status]
            ,iif(LAG([status],1) OVER (ORDER BY [Time]) is null,'',LAG([status],1) OVER (ORDER BY [Time]) ) as [prev]
            ,[Time],[hour] 
            ,CASE
				wHEN [hour] = 7 THEN 1
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
    else 0   end
 as [work_hour]
            from tb1  
          ` +
    command_shift +
    `
            )
            select  [status],[hour],[work_hour]
            ,[Time] as [start]
            ,iif(LEAD([Time],1) OVER (ORDER BY [Time]) is null,[Time],LEAD([Time],1) OVER (ORDER BY [Time]) ) as [stop]

            from tb2
             where [status]<>[prev]
			 order by [work_hour]
      `
  );
  res.json({ result: result[0] });
});

router.post("/machine_wasteTime", async (req, res) => {
  var command_shift = ``;
  if (req.body.shift == "All") {
    command_shift = ``;
  } else {
    command_shift = `where   IIF([hour] >= 7 and [hour] <=18 ,'M','N') = '${req.body.shift}'`;
  }
  let result = await users.sequelize.query(
    `
    with tb1 as(
        select [status]
        ,convert(varchar, [app_counter_machinelog].[registered_at], 120) as [Time]
   
        ,IIF(CAST(DATEPART(HOUR, [app_counter_machinelog].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_machinelog].[registered_at]) AS int)) as [hour]
         FROM [counter].[dbo].[app_counter_machinelog]
         left join [counter].[dbo].[app_counter_machineno] 
          on [app_counter_machinelog].node_no_id = [app_counter_machineno].[node_no]
         where [mfg_date] = '${req.body.date}'
         and [mc_name] = '${req.body.machine}' 
         and left([mc_name],3) = '${req.body.process}'
        )
        ,tb2 as (
            select 
            [status]
            ,iif(LAG([status],1) OVER (ORDER BY [Time]) is null,'',LAG([status],1) OVER (ORDER BY [Time]) ) as [prev]
            ,[Time],[hour] 
            ,CASE
				wHEN [hour] = 7 THEN 1
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
    else 0   end
 as [work_hour]
            from tb1  
          ` +
    command_shift +
    `
            )
            ,tb3 as (
              select  [status],[hour],[work_hour]
                   ,[Time] as [start]
                   ,iif(LEAD([Time],1) OVER (ORDER BY [Time]) is null,[Time],LEAD([Time],1) OVER (ORDER BY [Time]) ) as [stop]
             ,DATEDIFF (SECOND,[Time],iif(LEAD([Time],1) OVER (ORDER BY [Time]) is null,[Time],LEAD([Time],1) OVER (ORDER BY [Time]) )) as diffSEC
                   from tb2
                   where [status]<>[prev]
                   --order by [work_hour]
             )
             select [status]
             ,CONVERT(varchar, DATEADD(s,sum(diffSEC), 0),8) as waste_time 
             ,sum(diffSEC) as TTLSec
             from tb3 
             group by [status]
       
      `
  );
  res.json({ result: result[0] });
});

router.post("/total_output", async (req, res) => {
  var command_shift = ``;

  if (req.body.shift == "All") {
    command_shift = ``;
  } else {
    command_shift = `where [shift] = '${req.body.shift}'`;
  }

  let result = await users.sequelize.query(
    `
    with tb1 as(
      SELECT IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
      ,[app_counter_accumoutput].[mfg_date] as [registered_at]	  
            ,[app_counter_accumoutput].[pin]
            ,[accum_output]
          , [app_counter_pin].[name]
        FROM [counter].[dbo].[app_counter_accumoutput]
         left join [counter].[dbo].[app_counter_machineno] 
        on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
      
         left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin
      
         where  [app_counter_accumoutput].[mfg_date] = '${req.body.date}' /*---*/
        and [accum_output] >0
        and [mc_name] = '${req.body.machine}' /*---*/
        and process = '${req.body.process}'/*---*/
       and ([app_counter_pin].[name] LIKE '%NG%' or [app_counter_pin].[name] LIKE '%OK%')
       )
       ,tb2 as(
        select [registered_at],[hour],IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift],[pin],[accum_output]
        ,iif([name] LIKE '%OK%','ok','ng') as [result]
        from tb1
        )
        ,tb3 as(
          select [registered_at],[result],max([accum_output]) as qty
          from tb2
     ` +
    command_shift +
    `
          group by [registered_at],[result]
          ) 
          --////pivot
          select [registered_at]
          ,format(isnull(ok,0)+isnull(ng,0), '#,##0') as [input]
  ,format(isnull(ok,0), '#,##0') as [ok]
  ,format(isnull(ng,0), '#,##0') as [ng]
  ,cast(100*cast(isnull(ok,0) AS DECIMAL(10,2))/(isnull(ok,0)+isnull(ng,0)) AS DECIMAL(10,2)) as [yield]
          from tb3
          pivot (sum(qty) for [result] in (ok,ng)
          ) as pvt
      `
  );
  res.json({ result: result[0] });
});

router.post("/output_sum", async (req, res) => {
  // var command_shift = ``;
  var command_final = ``;
  if (req.body.shift == "All") {
    // command_shift = ``
    command_final = ` ,tb_target2.[day_target]as [accum_target],[accum_output_day] as [accum_output] `
  } else {
    // command_shift = `where tb4.[shift] = '${req.body.shift}'`
    command_final = ` ,tb_target2.[shift_target]as [accum_target],tb4.[accum_output_shift]as [accum_output] `
  }
  let result = await users.sequelize.query(
    ` -- Output sum +++++++++++++++++++++++++
    with tb_accum_output as (
      SELECT [app_counter_accumoutput].id
  ,[app_counter_accumoutput].[mfg_date] as [registered_at]
           ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,0,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
           ,[accum_output] as [accum_output_shift]
     
           ,pin ,[mc_name]
       FROM [counter].[dbo].[app_counter_accumoutput] 
       left join [counter].[dbo].[app_counter_machineno] 
on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
where [app_counter_accumoutput].[mfg_date]= '${req.body.date}'
        and [mc_name] = '${req.body.machine}'
        and [pin] = 'D6002' /*Daily OK*/
        )
        ,tb_target as (
          SELECT ROW_NUMBER() OVER (
          ORDER BY [id]
  ) row_num,[id],[model],[process],[target] as [shift_target],[hour],IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift]
     ,iif([target] - iif(LAG([target],1) OVER (ORDER BY id) is null ,0,LAG([target],1) OVER (ORDER BY id))<0,[target],[target] - iif(LAG([target],1) OVER (ORDER BY id) is null ,0,LAG([target],1) OVER (ORDER BY id))) as [hour_target]
    FROM [counter].[dbo].[app_counter_target]
    where [process] = '${req.body.process}'
            )
            ,tb_target2 as (select  [shift_target],[hour],[shift],[hour_target],row_num*[hour_target] as [day_target]  from tb_target)
            ,tb2 as (
            select [registered_at],[hour],IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift],[accum_output_shift]
             ,CASE
             wHEN [hour] = 8 THEN 1
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
            
            from tb_accum_output
            )
            ,tb3 as (
            select [row],[registered_at],[hour],[shift],[accum_output_shift]
            ,iif([hour] = 8 ,0,iif([hour] = 19 ,0,LAG([accum_output_shift],1) OVER (ORDER BY [row]))) as previous
            ,[accum_output_shift]-iif([hour] = 8 ,0,iif([hour] = 19 ,0,LAG([accum_output_shift],1) OVER (ORDER BY row))) as [accum_output_hour]
            from tb2
            )
            ,tb4 as (
            select [row],[registered_at],[shift],[hour],[accum_output_shift],[accum_output_hour]
            ,sum([accum_output_hour]) over (ORDER BY [row]) as [accum_output_day]
            from tb3
            )
            select
            [registered_at]
            ,tb_target2.[hour]
            ,IIF(tb4.[hour] >= 8 and tb4.[hour] <=19 ,'M','N') as [shift]
            ,tb_target2.[hour_target]
			,iif([accum_output_hour]<0,null,[accum_output_hour])  as hour_output
          ,tb_target2.[day_target]as [accum_target]
		,[accum_output_day] as [accum_output]
        from tb_target2 left join tb4 on tb4.[hour] = tb_target2.[hour]
       `
  );
  //console.log({ result });
  res.json({ result: result[0] });
});

router.post("/list_machine", async (req, res) => {
  let result = await users.sequelize.query(
    `
    SELECT [mc_name]  FROM [counter].[dbo].[app_counter_machineno]
    where left([mc_name],4) = 'MBRC'
    `
  );
  return res.json({ result: result[0] });
});

router.post("/list_machine_ARP", async (req, res) => { 
  let result = await users.sequelize.query(
    `
    SELECT [mc_name]  FROM [counter].[dbo].[app_counter_machineno]
where [mc_name] LIKE 'ARP%'

    `
  );
  return res.json({ result: result[0] });
});

router.post("/list_machine_MBR", async (req, res) => {
  let result = await users.sequelize.query(
    `
    SELECT [mc_name]  FROM [counter].[dbo].[app_counter_machineno]
    where [mc_name] LIKE 'MBRC%'
    `
  );
  return res.json({ result: result[0] });
});

router.post("/defect_pie", async (req, res) => {
  var command_shift = ``;

  if (req.body.shift == "All") {
    command_shift = ``;
  } else {
    command_shift = `where IIF([hour] >= 7 and [hour] <=18 ,'M','N') = '${req.body.shift}'`;
  }

  let result = await users.sequelize.query(
    `
    with tb_ng as (
      SELECT  [app_counter_accumoutput].[id]
      ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) as [hour]
      ,[app_counter_accumoutput].[mfg_date] as [registered_at]
                 
                    ,[app_counter_accumoutput].[pin]
                    ,[accum_output]
                    ,[node_no_id]
              
                    ,[app_counter_machineno].[mc_name]
              
                  ,[app_counter_pin].[plc_output]
                  ,[app_counter_pin].[name]
              
                FROM [counter].[dbo].[app_counter_accumoutput]
                 left join [counter].[dbo].[app_counter_machineno]
                           on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
                  left join [counter].[dbo].[app_counter_pin] 
                          on [app_counter_accumoutput].pin = [app_counter_pin].[pin]        
          where [app_counter_pin].[name] LIKE '%NG%'
          and [app_counter_accumoutput].[mfg_date] = '${req.body.date}'
                and [mc_name] = '${req.body.machine}'
                and [app_counter_pin].[process] = '${req.body.process}'
                  and [accum_output] >0
        )
        ,tb_ng2 as(
          select [hour],[registered_at],[pin],IIF([hour] >= 7 and [hour] <=18 ,'M','N') as [shift]
                        ,[accum_output]
                        ,[node_no_id],[mc_name],[plc_output],[name]
                  from tb_ng
            `+ command_shift + `
          )
          ,final1 as(
             select [name],[shift]
              ,max([accum_output]) as qty
                  from tb_ng2 
                  group by [name],[shift]
          )
          select [name],sum(qty) as qty from final1 group by [name]
      `
  );
  res.json({ result: result[0] });
});

router.post("/defect_stack", async (req, res) => {
  var command_shift = ``;

  if (req.body.shift == "All") {
    command_shift = ``;
  } else {
    command_shift = `where IIF([hour] >= 7 and [hour] <=18 ,'M','N') = '${req.body.shift}'`;
  }

  let result = await users.sequelize.query(
    `
    with tb_ng as (
      SELECT  [app_counter_accumoutput].[id]
      ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,0,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
      ,[app_counter_accumoutput].[mfg_date] as [registered_at]
                 
                    ,[app_counter_accumoutput].[pin]
                    ,[accum_output]
                    ,[node_no_id]
              
                    ,[app_counter_machineno].[mc_name]
              
                  ,[app_counter_pin].[plc_output]
                  ,[app_counter_pin].[name]
              
                FROM [counter].[dbo].[app_counter_accumoutput]
                 left join [counter].[dbo].[app_counter_machineno]
                           on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
                  left join [counter].[dbo].[app_counter_pin] 
                          on [app_counter_accumoutput].pin = [app_counter_pin].[pin]        
          where [app_counter_pin].[name] LIKE '%NG%'
          and [app_counter_accumoutput].[mfg_date] = '${req.body.date}'
                and [mc_name] = '${req.body.machine}'
                and [app_counter_pin].[process] = '${req.body.process}'
                  and [accum_output] >0
        )
        ,tb1 as(
          select CASE
                        wHEN  [hour] = 8 THEN 1
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
                    else 0   end as [row],[hour],[name],[accum_output], IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift]
                from tb_ng
           `+ command_shift + `
                )
        
    
                ,tb_pvt  as (
                  SELECT [row],[hour] ,  [shift]
      , ISNULL([Daily NG],0) AS [Daily_NG] 
      , ISNULL([C1 NG],0) AS  [C1_NG]
      ,ISNULL([C2 NG],0) AS [C2_NG]
      , ISNULL([C3 NG],0) AS  [C3_NG]
    , ISNULL([C4 NG],0) AS  [C4_NG]
    , ISNULL([C5 NG],0) AS  [C5_NG]
    , ISNULL([Ball check camera qty(TURN NG)],0) AS  [TURN_NG]
    , ISNULL([Press check NG (RTNR NG)],0) AS  [RTNR_NG]
    , ISNULL([RTNR camera NG (CAMERA NG)],0) AS  [CAMERA_NG]
                  FROM tb1
                  pivot (sum([accum_output])
                  for [name] in([Daily NG],[C1 NG],[C2 NG],[C3 NG],[C4 NG],[C5 NG],[Ball check camera qty(TURN NG)],[Press check NG (RTNR NG)],[RTNR camera NG (CAMERA NG)])
                  ) as pvt
      )
      
      ,tb_hour  as (
      select [row],[shift],[hour] 
      ,[Daily_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([Daily_NG],1) OVER (ORDER BY [row]))) as [Daily_NG]
      ,[C1_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([C1_NG],1) OVER (ORDER BY [row]))) as [C1_NG]
      ,[C2_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([C2_NG],1) OVER (ORDER BY [row]))) as [C2_NG]
      ,[C3_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([C3_NG],1) OVER (ORDER BY [row]))) as [C3_NG]
    ,[C4_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([C4_NG],1) OVER (ORDER BY [row]))) as [C4_NG]
    ,[C5_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([C5_NG],1) OVER (ORDER BY [row]))) as [C5_NG]
    ,[TURN_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([TURN_NG],1) OVER (ORDER BY [row]))) as [TURN_NG]
    ,[RTNR_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([RTNR_NG],1) OVER (ORDER BY [row]))) as [RTNR_NG]
      ,[CAMERA_NG]-iif([hour] = 7 ,0,iif([hour] = 19 ,0,LAG([CAMERA_NG],1) OVER (ORDER BY [row]))) as [CAMERA_NG]
  
      from tb_pvt 
      )
      ,tb_hour2  as (
      select
      [row],[shift],[hour]
      ,iif([Daily_NG]<0,0,[Daily_NG]) as [Daily_NG]
      ,iif([C1_NG]<0,0,[C1_NG]) as [C1_NG]
      ,iif([C2_NG]<0,0,[C2_NG]) as [C2_NG]
      ,iif([C3_NG]<0,0,[C3_NG]) as [C3_NG]
    ,iif([C4_NG]<0,0,[C4_NG]) as [C4_NG]
    ,iif([C5_NG]<0,0,[C4_NG]) as [C5_NG]
    ,iif([TURN_NG]<0,0,[C4_NG]) as [TURN_NG]
    ,iif([RTNR_NG]<0,0,[C4_NG]) as [RTNR_NG]
    ,iif([CAMERA_NG]<0,0,[C4_NG]) as [CAMERA_NG]
      from tb_hour
      )
      select 
      [row],[shift],[hour]
      ,sum([Daily_NG]) over (ORDER BY [row]) as [Daily_NG]
      ,sum([C1_NG]) over (ORDER BY [row]) as [C1_NG]
      ,sum([C2_NG]) over (ORDER BY [row]) as [C2_NG]
      ,sum([C3_NG]) over (ORDER BY [row]) as [C3_NG]
    ,sum([C4_NG]) over (ORDER BY [row]) as [C4_NG]
    ,sum([C5_NG]) over (ORDER BY [row]) as [C5_NG]
    ,sum([TURN_NG]) over (ORDER BY [row]) as [TURN_NG]
    ,sum([RTNR_NG]) over (ORDER BY [row]) as [RTNR_NG]
    ,sum([CAMERA_NG]) over (ORDER BY [row]) as [CAMERA_NG]
      from tb_hour2
        `
  );
  res.json({ result: result[0] });
});

router.post("/find_ct", async (req, res) => {
  var command_shift = ``;
  var command_final = ``;
  if (req.body.shift == "All") {
    command_final = `select [registered_at] ,sum([work_hour]) as [work_hour],sum([accum_output]) as [accum_output]
    ,cast(cast(sum([work_hour]) AS DECIMAL(10,2))/cast(sum([accum_output]) AS DECIMAL(10,2)) AS DECIMAL(10,2))  as [ct]
    from tb3 group by [registered_at]`;
  } else {
    command_final = `select [registered_at],[work_hour],[shift],[accum_output]
    ,cast(cast([work_hour] AS DECIMAL(10,2))/cast([accum_output] AS DECIMAL(10,2)) AS DECIMAL(10,2))  as [ct]
    from tb3 where [shift] = '${req.body.shift}'`;
  }
  let result = await users.sequelize.query(
    ` with tb1 as(
      SELECT 
      [app_counter_accumoutput].[mfg_date] as [registered_at]		
      ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,0,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
            ,[accum_output]



       FROM [counter].[dbo].[app_counter_accumoutput]
       left join [counter].[dbo].[app_counter_machineno] 
                on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]       
                 left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin       
              where  [app_counter_accumoutput].[mfg_date] = '${req.body.date}' /*---*/
              and [accum_output] >0
              and [mc_name] = '${req.body.machine}' /*---*/
              and process = '${req.body.process}'/*---*/                
              and [accum_output] >0
              and [app_counter_accumoutput].[pin] = 'D6002'
      )
,tb2 as	(	select [registered_at],[hour],IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift],[accum_output]
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






//-----------------------------------------

router.post("/daily_out_machine", async (req, res) => {
  // console.log(req.body);
  var list_date = [];

  var command_mc = "";
  list_date = generateDateList(req.body.date_start, req.body.date_end);
  let date_text = list_date.toString();
  let date_text_replaced = `[` + date_text.replace(/,/g, `],[`) + `]`;
  let date_text_concat = date_text_replaced.replace(/,/g, `,',',`);
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
  }

  let result = await users.sequelize.query(
    `
    with tb1 as(
      SELECT
      IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) as [hour],
      IIF(IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) >= 7
      and IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) <=18 ,'M','N') as [shift]
            ,[mfg_date]
            ,[pin]
            ,[accum_output]
            ,[node_no_id]
        FROM [counter].[dbo].[app_counter_accumoutput]
        where ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}')
        and pin = 'D13'     
        )
,tb2 as(
          select [mfg_date],[shift],[node_no_id],max([accum_output]) as daily_output
          ,[app_counter_pin].[process]
          ,max([app_counter_target].[target]) as TTLtarget
          from tb1
          left join [counter].[dbo].[app_counter_pin]
          on tb1.pin = [app_counter_pin].pin
          left join  [counter].[dbo].[app_counter_target]
          on [app_counter_pin].[process] = [app_counter_target].[process]
         and tb1.[hour]  = [app_counter_target].[hour]

       group by [mfg_date],[shift],[node_no_id],[app_counter_pin].[process]
)
,tb3 as (
  select [mfg_date],[node_no_id] ,[process] , TTLtarget,[shift]
  ,sum(daily_output) as qty
  from tb2
group by [mfg_date],[node_no_id],[process] ,TTLtarget,[shift]
),tb4 as (
select [mfg_date],max(TTLtarget) as [target] , sum(qty) as [Qty_output]
,[mc_name]
from tb3	 
left join [counter].[dbo].[app_counter_machineno] on tb3.[node_no_id] = [app_counter_machineno].node_no
where process = '${req.body.process}'
and ([mc_name] = '' ` +
    command_mc +
    ` )
group by [mfg_date],[mc_name]
) ,tb_pvt as (
select [mc_name],[target],` +
    date_text_replaced +
    `
from tb4 
pivot (sum([Qty_output]) 
for [mfg_date] in(` +
    date_text_replaced +
    `))as pvt 
)
select [mc_name],[target],concat(` +
    date_text_concat +
    `) as [date_data]
from tb_pvt

    `
  );
  res.json({ result: result[0], my_list: list_date });
});
router.post("/daily_total", async (req, res) => {
  var list_date = [];

  var command_mc = "";
  // list_date = generateDateList(req.body.date_start, req.body.date_end);
  // let date_text = list_date.toString();
  // let date_text_replaced = `[`+date_text.replace(/,/g,`],[`) + `]`
  // let date_text_concat = date_text_replaced.replace(/,/g,`,',',`)
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
  }
  let result = await users.sequelize.query(
    `
    with tb1 as(
      SELECT
      IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) as [hour],
      IIF(IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) >= 7
      and IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) <=18 ,'M','N') as [shift]
            ,[mfg_date]
            ,[pin]
            ,[accum_output]
            ,[node_no_id]
        FROM [counter].[dbo].[app_counter_accumoutput]
        where ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}')
        and pin = 'D13'
    
        ),tb2 as(
          select [mfg_date],[shift],[node_no_id],max([accum_output]) as daily_output
          ,[app_counter_pin].[process]
          ,max([app_counter_target].[target]) as TTLtarget
          from tb1
          left join [counter].[dbo].[app_counter_pin]
          on tb1.pin = [app_counter_pin].pin
          left join  [counter].[dbo].[app_counter_target]
          on [app_counter_pin].[process] = [app_counter_target].[process]
         and tb1.[hour]  = [app_counter_target].[hour]

       group by [mfg_date],[shift],[node_no_id],[app_counter_pin].[process]
)
  
    ,tb3 as (
          select [mfg_date],[node_no_id] ,[process] , TTLtarget,[shift]
          ,sum(daily_output) as qty
          from tb2
       -- where [node_no_id] =''   or [node_no_id] = 'MC01'  or [node_no_id] = 'MC02'
    group by [mfg_date],[node_no_id],[process] ,TTLtarget,[shift]
   ),tb4 as (
   select [mfg_date],max(TTLtarget) as [target] , sum(qty) as [Qty_output]
 ,[mc_name]
   from tb3	 
 left join [counter].[dbo].[app_counter_machineno] on tb3.[node_no_id] = [app_counter_machineno].node_no
 where process = '${req.body.process}'
 and ([mc_name] = '' ` +
    command_mc +
    ` )
   group by [mfg_date],[mc_name]
   --order by mfg_date
 )
 select [mfg_date],sum([target]) as [target] , sum([Qty_output]) as [Qty_output]
 from tb4
 group by [mfg_date]
    `
  );
  res.json({ result: result[0] });
});


module.exports = router;
