const express = require("express");
const router = express.Router();
const users = require("../model/users");
const constant = require("../constance/constance");

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
//get process
router.get("/process", async (req, res) => {
  //function respone and request
  try {
    let getData = await users.sequelize.query(
      ` SELECT distinct [process]
            FROM [counter].[dbo].[app_counter_pin]
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

//get machine
router.get("/machine", async (req, res) => {
  //function respone and request
  try {
    let getData = await users.sequelize.query(
      `SELECT [mc_name]
            FROM [counter].[dbo].[app_counter_machineno]

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

router.post("/daily_out_machine", async (req, res) => {
  // console.log(req.body);
  try {
    var list_date = [];

    var command_mc = "";
    list_date = getDatesInRange(new Date(req.body.date_start), new Date(req.body.date_end));
    let date_text = list_date.toString();
    let date_text_replaced = `[` + date_text.replace(/,/g, `],[`) + `]`
    let date_text_concat = date_text_replaced.replace(/,/g, `,',',`)
    for (let index = 0; index < req.body.selected_mc.length; index++) {
      command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `
    }

    let result = await users.sequelize.query(
      `
        with tb1 as(
          SELECT
          IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour],
          IIF(IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) >= 8
          and IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) <=19 ,'M','N') as [shift]
                ,[mfg_date]
                ,[pin]
                ,[accum_output]
                ,[node_no_id]
            FROM [counter].[dbo].[app_counter_accumoutput]
            where ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}')
            and pin = 'D6002'     
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
             -- and tb1.[hour]  = [app_counter_target].[hour]
    
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
    and ([mc_name] = '' `+ command_mc + ` )
    group by [mfg_date],[mc_name]
    ) ,tb_pvt as (
    select [mc_name],[target],`+ date_text_replaced + `
    from tb4 
    pivot (sum([Qty_output]) 
    for [mfg_date] in(`+ date_text_replaced + `))as pvt 
    )
    select [mc_name],[target],concat(`+ date_text_concat + `) as [date_data]
    from tb_pvt
    
        `
    );
    console.log({ result });
    res.json({
      result: result[0],
      my_list: list_date,
      api_result: constant.OK
    });
  } catch (error) {
    res.json({
      result: error,
      api_result: constant.NOK
    });
  }

  // console.log({ result });
  // res.json({ result: result[0], my_list: list_date });
});

router.post("/daily_total", async (req, res) => {
  var list_date = [];

  var command_mc = "";
  // list_date = generateDateList(req.body.date_start, req.body.date_end);
  // let date_text = list_date.toString();
  // let date_text_replaced = `[`+date_text.replace(/,/g,`],[`) + `]`
  // let date_text_concat = date_text_replaced.replace(/,/g,`,',',`)
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `
  }
  let result = await users.sequelize.query(
    `
      with tb1 as(
        SELECT
        IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour],
        IIF(IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) >= 8
        and IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) <=19 ,'M','N') as [shift]
              ,[mfg_date]
              ,[pin]
              ,[accum_output]
              ,[node_no_id]
          FROM [counter].[dbo].[app_counter_accumoutput]
          where ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}')
          and pin = 'D6002'
      
          ),tb2 as(
            select [mfg_date],[shift],[node_no_id],max([accum_output]) as daily_output
            ,[app_counter_pin].[process]
            ,max([app_counter_target].[target]) as TTLtarget
            from tb1
            left join [counter].[dbo].[app_counter_pin]
            on tb1.pin = [app_counter_pin].pin
            left join  [counter].[dbo].[app_counter_target]
            on [app_counter_pin].[process] = [app_counter_target].[process]
          -- and tb1.[hour]  = [app_counter_target].[hour]
  
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
   and ([mc_name] = '' `+ command_mc + ` )
     group by [mfg_date],[mc_name]
     --order by mfg_date
   )
   select [mfg_date],sum([target]) as [target] , sum([Qty_output]) as [Qty_output]
   from tb4
   group by [mfg_date]
      `
  );
  console.log({ result });
  res.json({
    result: result[0],
    api_result: constant.OK
  });
});

router.post("/TTL_yield", async (req, res) => {
  try {
    var command_mc = "";
    for (let index = 0; index < req.body.selected_mc.length; index++) {
      command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `
    }
    let result = await users.sequelize.query(
      `
with tb1 as(
      SELECT IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) 
as [hour]
            ,[app_counter_accumoutput].[registered_at]
            ,[app_counter_accumoutput].[pin]
      ,[app_counter_pin].[process]
            ,[accum_output]
          , [app_counter_pin].[name]
    ,[app_counter_accumoutput].[mfg_date]
        FROM [counter].[dbo].[app_counter_accumoutput]
         left join [counter].[dbo].[app_counter_machineno]
        on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
         left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin

        --where  [mfg_date]  = '2022-09-15' /*---*/ 
    where  ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}' /*---*/ )
        and [accum_output] >0
        and ([mc_name] = '' `+ command_mc + `) /*---*/
        and process = '${req.body.process}'/*---*/
       and ([app_counter_pin].[name] LIKE '%NG%' or [app_counter_pin].[name] LIKE '%OK%')
       )
       ,tb2 as(
       select [mfg_date],[hour],IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift],[pin],[accum_output],[process]
       ,iif([name] LIKE '%OK%','ok','ng') as [result]
       --,IIF(left(process,1) ='M',cast(tb1.[accum_output] as int)*6,[accum_output]) as [accum_output1]
       from tb1
       --where IIF([hour] >= 8 and [hour] <=19 ,'M','N') = '${req.body.selected_shift}'/*---*/
       )
       ,tb3 as(
       select [mfg_date],[hour],[result],sum([accum_output]) as qty ,[process]
       from tb2
       group by [mfg_date],[hour],[result],[process]
       )
        ,tb4 as(
       select max([hour]) as [hour]  
      ,[result],max(qty) as qty
     , [mfg_date]
     ,[process]
     ,95 as yield_target
      from tb3
      group by [mfg_date], [process],[result]
      )
      --////pivot
      select [mfg_date]
      --,[hour] 
      ,[process]
      --,format(isnull(ok,0)+isnull(ng,0), '#,##0') as [input]
      --,format(isnull(ok,0), '#,##0') as [ok]
      --,format(isnull(ng,0), '#,##0') as [ng]
      ,cast(100*CAST(isnull(ok,0) AS DECIMAL(15,2) )/(isnull(ok,0)+isnull(ng,0)) AS DECIMAL(15,2) ) AS [yield] 
      ,yield_target
      from tb4
      pivot (sum(qty) for [result] in (ok,ng)
      ) as pvt
        `
    );
    console.log( "result*************");
    res.json({
      result: result[0],
      api_result: constant.OK
    });
  } catch (error) {

    res.json({
      result: error,
      api_result: constant.NOK
    });
  }
});

router.post("/TTL_Yield_data", async (req, res) => {
  try {
    var command_mc = "";
    for (let index = 0; index < req.body.selected_mc.length; index++) {
      command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `
    }
    let result = await users.sequelize.query(
      `--ตาราง
with tb1 as(
      SELECT IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) 
as [hour]
            ,[app_counter_accumoutput].[registered_at]
            ,[app_counter_accumoutput].[pin]
            ,[app_counter_pin].[process]
            ,[accum_output]
            ,[app_counter_pin].[name]  
            ,[app_counter_accumoutput].[mfg_date]
        FROM [counter].[dbo].[app_counter_accumoutput]
         left join [counter].[dbo].[app_counter_machineno]
        on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]

         left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin

        --where  [mfg_date]  = '2022-09-15' /*---*/ 
      where  ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}' /*---*/ )
        and [accum_output] >0
        and ([mc_name] = '' `+ command_mc + `) /*---*/
        and process = '${req.body.process}'/*---*/
       and ([app_counter_pin].[name] LIKE '%NG%' or [app_counter_pin].[name] LIKE '%OK%')
       )
       ,tb2 as(
       select [mfg_date],[hour],IIF([hour] >= 8 and [hour] <=19 ,'M','N') as [shift],[pin],[accum_output],[process]
       ,iif([name] LIKE '%OK%','ok','ng') as [result]
       --,IIF(left(process,1) ='M',cast(tb1.[accum_output] as int)*6,[accum_output]) as [accum_output1]
       from tb1
       --where IIF([hour] >= 8 and [hour] <=19 ,'M','N') = '${req.body.selected_shift}'/*---*/
       )
       ,tb3 as(
       select [mfg_date],[hour],[result],sum([accum_output]) as qty ,[process]
       from tb2
       group by [mfg_date],[hour],[result],[process]
       )
        ,tb4 as(
       select max([hour]) as [hour]  
      ,[result],max(qty) as qty
      ,[mfg_date]
      ,[process]
      from tb3
      group by [mfg_date], [process],[result]
      )
      --////pivot
      select [mfg_date]
      --,[hour] 
      ,[process]
      ,format(isnull(ok,0)+isnull(ng,0), '#,##0') as [input]
      ,format(isnull(ok,0), '#,##0') as [ok]
      ,format(isnull(ng,0), '#,##0') as [ng]
      ,cast(100*CAST(isnull(ok,0) AS DECIMAL(15,2) )/(isnull(ok,0)+isnull(ng,0)) AS DECIMAL(15,2) ) AS [yield] 
      from tb4
      pivot (sum(qty) for [result] in (ok,ng)
      ) as pvt
        `
    );
    console.log({ result });
    res.json({
      result: result[0],
      api_result: constant.OK
    });
  } catch (error) {

    res.json({
      result: error,
      api_result: constant.NOK
    });
  }
});

router.post("/NG_ratio", async (req, res) => {
  try {

    var command_mc = "";
    for (let index = 0; index < req.body.selected_mc.length; index++) {
      command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `
    }
    let result = await users.sequelize.query(
      `
    with tb_ng as (
      SELECT  [app_counter_accumoutput].[id]
      ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23
,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]          
,[app_counter_accumoutput].[registered_at]
            ,[mfg_date]
            ,[app_counter_accumoutput].[pin]
            ,[accum_output]
            ,[node_no_id]
            ,[app_counter_machineno].[mc_name]
            ,[app_counter_pin].[plc_output]
            ,[app_counter_pin].[name]
    ,[app_counter_pin].[process]
        FROM [counter].[dbo].[app_counter_accumoutput]
         left join [counter].[dbo].[app_counter_machineno]
        on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
          left join [counter].[dbo].[app_counter_pin]
        on [app_counter_accumoutput].pin = [app_counter_pin].[pin]
      where 
--[app_counter_pin].[name] LIKE '%NG%'
       ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}'  /*---*/ )
       and ([mc_name] = '' `+ command_mc +`) /*---*/
        and process = '${req.body.process}'/*---*/
      and [accum_output] >0
      ),
  tb1 as(
  select [mfg_date]
  --,[hour]
  ,[process]
  ,[name]
  ,max([accum_output]) as [accum_output]
  from tb_ng
  --where IIF(tb_ng.[hour] >= 7 and tb_ng.[hour] <=18 ,'M','N') = '${req.body.selected_shift}'/*---*/
  group by [mfg_date],[name],[process]
        )
      --select * from tb1
   ,tb2 as (
   select [mfg_date]
   ,[name]
   ,[accum_output]
   from tb1 
 --where accum_output > 0 
   ) --select * from tb2

  SELECT [mfg_date]
  --,ISNULL([Assembly Retainer OK],0)+ISNULL([Assembly Ball NG (Pallet)],0)+ISNULL([Assembly Ball NG (Turn table)],0)+ISNULL([Assembly Retainer NG],0)+ISNULL([Camera NG],0) as [input]
  --,ISNULL([Assembly Retainer OK],0) AS [Assembly_Retainer_OK]
  --,ISNULL([Assembly Ball NG (Pallet)],0) AS [Assembly_Ball_NG_Pallet]
  --,ISNULL([Assembly Ball NG (Turn table)],0) AS  [Assembly_Ball_NG_Turn_table]
  --,ISNULL([Assembly Retainer NG],0) AS [Assembly_Retainer_NG]
  --,ISNULL([Camera NG],0) AS  [Camera_NG]
,cast(100*cast((ISNULL([C1 NG],0))AS DECIMAL(5,2))/ (ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0)) AS DECIMAL(5,2)) as C1_NG
  ,cast(100*cast((ISNULL([C2 NG],0))AS DECIMAL(5,2))/ (ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0)) AS DECIMAL(5,2)) as C2_NG
  ,cast(100*cast((ISNULL([C3 NG],0))AS DECIMAL(5,2))/ (ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0)) AS DECIMAL(5,2)) as C3_NG
  ,cast(100*cast((ISNULL([C4 NG],0))AS DECIMAL(5,2))/ (ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0)) AS DECIMAL(5,2)) as C4_NG
  ,cast(100*cast((ISNULL([C5 NG],0))AS DECIMAL(5,2))/ (ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0)) AS DECIMAL(5,2)) as C5_NG
  ,cast(100*cast((ISNULL([Ball check camera qty(TURN NG)],0))AS DECIMAL(5,2))/ (ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0)) AS DECIMAL(5,2)) as [TURN_NG]
  ,cast(100*cast((ISNULL([Press check NG (RTNR NG)],0))AS DECIMAL(5,2))/ (ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0)) AS DECIMAL(5,2)) as [RTNR_NG]
  ,cast(100*cast((ISNULL([RTNR camera NG (CAMERA NG)],0))AS DECIMAL(5,2))/ (ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0)) AS DECIMAL(5,2)) as [CAMERA_NG]

FROM tb2
        pivot (sum([accum_output])
        for [name] in( [Daily OK],[C1 NG],[C2 NG],[C3 NG],[C4 NG],[C5 NG],[Ball check camera qty(TURN NG)],[Press check NG (RTNR NG)],[RTNR camera NG (CAMERA NG)])
        ) as pvt
  where ISNULL([Daily OK],0)+ISNULL([C1 NG],0)+ISNULL([C2 NG],0)+ISNULL([C3 NG],0)+ISNULL([C4 NG],0)+ISNULL([C5 NG],0)+ISNULL([Ball check camera qty(TURN NG)],0)+ISNULL([Press check NG (RTNR NG)],0)+ISNULL([RTNR camera NG (CAMERA NG)],0) >0
  order by  [mfg_date]

      ` )
    console.log({ result });
    res.json({
      result: result[0],
      api_result: constant.OK
    });

  } catch (error) {

    res.json({
      result: error,
      api_result: constant.NOK
    });
  }

});

router.post("/ct", async (req, res) => {
  try {
    var command_mc = "";
    for (let index = 0; index < req.body.selected_mc.length; index++) {
      command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `
    }
    let result = await users.sequelize.query(
      `
      with tb1 as(
        select convert(varchar,[app_counter_accumoutput].[registered_at], 23) as [registered_at]
       ,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
             ,[accum_output],[mc_name]
        FROM [counter].[dbo].[app_counter_accumoutput]
        left join [counter].[dbo].[app_counter_machineno] 
                 on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]       
                  left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin       
               where  [mfg_date] between '${req.body.date_start}' and '${req.body.date_end}'  /*---*/
               and [accum_output] >0
               and ([mc_name] = '' `+ command_mc +`) /*---*/
               and process = '${req.body.process}'/*---*/                
               and [accum_output] >0
               and [app_counter_accumoutput].[pin] = 'D13'
       ),tb2 as (
       select [registered_at],[hour],[accum_output],[mc_name]
 ,3600*ROW_NUMBER() OVER(PARTITION BY [registered_at] ORDER BY [registered_at] ASC) as [accum_time]
       from tb1
       where IIF([hour] >= 8 and [hour] <=19 ,'M','N') = '${req.body.selected_shift}'/*---*/
       )
--select * from tb2 
select [registered_at] as mfg_date
,[mc_name]
,max(cast(cast([accum_time] AS DECIMAL(7,2))/cast([accum_output] AS DECIMAL(7,2)) AS DECIMAL(7,2))) AS [ct] from tb2
group by [registered_at],[mc_name]
      ` )
    console.log({ result });
    res.json({
      result: result[0],
      api_result: constant.OK
    });

  } catch (error) {

    res.json({
      result: error,
      api_result: constant.NOK
    });
  }

});

router.post("/mc_log", async (req, res) => { 
  var command_mc = "";
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
  }
  let result = await users.sequelize.query(
    `--Machine Log by Daily -----------------------------------------------
with tb1 as(
      select [status]
      ,convert(varchar, [app_counter_machinelog].[registered_at], 120) as [Time]
  ,[mfg_date]
      ,IIF(CAST(DATEPART(HOUR, [app_counter_machinelog].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_machinelog].[registered_at]) AS int)) as [hour]
       FROM [counter].[dbo].[app_counter_machinelog]
       left join [counter].[dbo].[app_counter_machineno]
        on [app_counter_machinelog].node_no_id = [app_counter_machineno].[node_no]
       where [mfg_date] between '${req.body.date_start}' and '${req.body.date_end}'		
       and ([mc_name] = '' ` + command_mc +` )
      )
,tb2 as (select [status],[mfg_date],[Time],isnull(Abs(DATEDIFF(SECOND, [Time], LEAD([Time],1) OVER (ORDER BY [Time]))),0) AS [DateDiff] from tb1)
,tb3 as(
select [status],[mfg_date],sum([DateDiff]) as [DateDiff] from tb2
group by [status],[mfg_date])

select   [mfg_date]
,cast(isnull(cast([START]as decimal)/3600,0) as decimal(10,2)) as [START]
,cast(isnull(cast([STOP]as decimal)/3600,0) as decimal(10,2)) as [STOP]
,cast(isnull(cast([WPART]as decimal)/3600,0) as decimal(10,2)) as [WPART]
,cast(isnull(cast([ALARM]as decimal)/3600,0) as decimal(10,2)) as [ALARM]
,CAST(cast(isnull(cast([START]as decimal)/3600,0) as decimal(10,2)) AS varchar)
+','+CAST(cast(isnull(cast([STOP]as decimal)/3600,0) as decimal(10,2)) AS varchar)
+','+CAST(cast(isnull(cast([WPART]as decimal)/3600,0) as decimal(10,2)) AS varchar)
+','+CAST(cast(isnull(cast([ALARM]as decimal)/3600,0) as decimal(10,2)) AS varchar) as [combine]
FROM tb3 pivot (sum([DateDiff]) for [status] in ([START],[STOP],[WPART],[ALARM]) ) as pvt     
       `
  );
  console.log({ result } , '######');
  res.json({ result: result[0] });
});

// ball usage 
router.post("/ball_use_date", async (req, res) => { 
  var command_mc = "";
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
  }
  let result = await users.sequelize.query(
    `--ball usage by Daily -----------------------------------------------
    with tb1 as (
      SELECT 
            [mfg_date]
            ,[app_counter_accumoutput].[pin]
            ,[accum_output]
            ,[node_no_id]
          ,[app_counter_pin].[process]
            ,[app_counter_pin].[plc_output]
            ,[app_counter_pin].[name]
          ,[mc_name]
        FROM [counter].[dbo].[app_counter_accumoutput]
        left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].[pin] = [app_counter_pin].pin
        left join  [counter].[dbo].[app_counter_machineno] on [app_counter_accumoutput].[node_no_id] = [app_counter_machineno].[node_no]
        where [app_counter_pin].[process] = 'MBR'
      and [app_counter_accumoutput].[mfg_date] between '${req.body.date_start}' and '${req.body.date_end}'   
      and ([mc_name] = '' ` + command_mc +` )
        and ([app_counter_accumoutput].pin = 'D6010'
        or [app_counter_accumoutput].pin = 'D6020'
        or [app_counter_accumoutput].pin = 'D6030'
        or [app_counter_accumoutput].pin = 'D6040'
        or [app_counter_accumoutput].pin = 'D6050'
		)
   )
   ,tb2 as(
   select [mfg_date],max([accum_output]) as qty,[name]
   from tb1 group by [mfg_date],[name]
   ) --select * from tb2 order by mfg_date
   ,tb_pvt as(
    SELECT [mfg_date]
      ,ISNULL([Ball usage(-5.0)],0) AS [-5.0]
      ,ISNULL([Ball usage(-2.5)],0) AS  [-2.5]
      ,ISNULL([Ball usage(0.0)],0) AS [±0.0]
      ,ISNULL([Ball usage(+2.5)],0) AS  [+2.5]
      ,ISNULL([Ball usage(+5)],0) AS  [+5]
        FROM tb2
        pivot (sum([qty])
        for [name] in([Ball usage(-5.0)]
                  ,[Ball usage(-2.5)]
                  ,[Ball usage(0.0)]
                  ,[Ball usage(+2.5)]
                  ,[Ball usage(+5)]
				)
        ) as pvt 
    )  --select * from tb_pvt
    SELECT [mfg_date]
    ,sum([-5.0]) as [C5]
    ,sum([-2.5]) as [C4]
    ,sum([±0.0]) as [C3]
    ,sum([+2.5]) as [C2]
    ,sum([+5]) as [C1]
    from tb_pvt
    group by [mfg_date]
       `
  );
  //console.log({ result });
  res.json({ result: result[0] });
});

router.post("/ball_use_month", async (req, res) => { 
  var command_mc = "";
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
  }
  let result = await users.sequelize.query(
    `--ball usage by Monthly -----------------------------------------------
    with tb1 as (
      SELECT FORMAT([mfg_date], 'yyyy-MM') as [month]
            ,[mfg_date]
            ,[app_counter_accumoutput].[pin]
            ,[accum_output]
            ,[node_no_id]
            ,[app_counter_pin].[process]
            ,[app_counter_pin].[plc_output]
            ,[app_counter_pin].[name]
            ,[mc_name]
        FROM [counter].[dbo].[app_counter_accumoutput]
        left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].[pin] = [app_counter_pin].pin
        left join  [counter].[dbo].[app_counter_machineno] on [app_counter_accumoutput].[node_no_id] = [app_counter_machineno].[node_no]
        where [app_counter_pin].[process] = 'MBR'
        and ([mc_name] = '' ` + command_mc +` )
        and ([app_counter_accumoutput].[mfg_date] between DATEADD(yy,-1,CONVERT(DATE,GETDATE())) and GETDATE())
        and ([app_counter_accumoutput].pin = 'D6010'
        or [app_counter_accumoutput].pin = 'D6020'
        or [app_counter_accumoutput].pin = 'D6030'
        or [app_counter_accumoutput].pin = 'D6040'
        or [app_counter_accumoutput].pin = 'D6050') 
	--and [app_counter_pin].[name] = 'Ball usage(-5.0)'
		
)
      ,tb2 as(
      select [month],[mfg_date],max([accum_output]) as qty,[name]
      from tb1 group by [month],[mfg_date],[name]
      )  --select * from tb2
      ,tb3 as(
      select [month],[name],sum(qty) as qty
      from tb2 group by [month],[name]
      )-- select * from tb3
      ,tb_pvt as(
      SELECT [month]
      ,ISNULL([Ball usage(-5.0)],0) AS [-5.0]
      ,ISNULL([Ball usage(-2.5)],0) AS  [-2.5]
      ,ISNULL([Ball usage(0.0)],0) AS [±0.0]
      ,ISNULL([Ball usage(+2.5)],0) AS  [+2.5]
      ,ISNULL([Ball usage(+5)],0) AS  [+5]
                  FROM tb3
                  pivot (sum([qty])
                  for [name] in([Ball usage(-5.0)]
                  ,[Ball usage(-2.5)]
                  ,[Ball usage(0.0)]
                  ,[Ball usage(+2.5)]
                  ,[Ball usage(+5)])
                  ) as pvt 
      ) --select * from tb_pvt
      SELECT [month]
    ,sum([-5.0]) as [C5]
    ,sum([-2.5]) as [C4]
    ,sum([±0.0]) as [C3]
    ,sum([+2.5]) as [C2]
    ,sum([+5]) as [C1]
	
      from tb_pvt
      group by [month]
       `
  );
  //console.log({ result });
  res.json({ result: result[0] });
});

router.post("/defect", async (req, res) => { 
  var command_mc = "";
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
  }
  let result = await users.sequelize.query(
    `--defect by monthly -----------------------------------------------
with tb_ng as (
  SELECT FORMAT([mfg_date], 'yyyy-MM') as [month],
  [mfg_date],[app_counter_accumoutput].[pin]
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
      and ([app_counter_accumoutput].[mfg_date] between DATEADD(yy,-1,CONVERT(DATE,GETDATE())) and GETDATE())
      and ([mc_name] = '' ` + command_mc +` )
  )
  ,tb1 as(
      select [month],[pin],max([accum_output]) as [accum_output],[node_no_id],[mc_name],[plc_output],[name] from tb_ng
      group by [month],[pin],[node_no_id],[mc_name],[plc_output],[name]
      
      ),tb_pvt as(
      SELECT [month]
          ,ISNULL([C1 NG],0) AS [C1_NG]
    ,ISNULL([C2 NG],0) AS [C2_NG]
    ,ISNULL([C3 NG],0) AS [C3_NG]
    ,ISNULL([C4 NG],0) AS [C4_NG]
    ,ISNULL([C5 NG],0) AS [C5_NG]
          ,ISNULL([Ball check camera qty(TURN NG)],0) AS  [Turn_NG]
          ,ISNULL([Press check NG (RTNR NG)],0) AS [Retainer_NG]
          ,ISNULL([RTNR camera NG (CAMERA NG)],0) AS  [Camera_NG]
          FROM tb1
           pivot (sum([accum_output])
           for [name] in([C1 NG],[C2 NG],[C3 NG],[C4 NG],[C5 NG],[Ball check camera qty(TURN NG)],[Press check NG (RTNR NG)],[RTNR camera NG (CAMERA NG)])
        ) as pvt
      )
         select  [month]
         ,sum([C1_NG]) as [C1_NG]
         ,sum([C2_NG]) as [C2_NG]
         ,sum([C3_NG]) as [C3_NG]
         ,sum([C4_NG]) as [C4_NG]
         ,sum([C5_NG]) as [C5_NG]
   ,sum([Turn_NG]) as [Turn_NG]
   ,sum([Retainer_NG]) as [Retainer_NG]
   ,sum([Camera_NG]) as [Camera_NG]
         from tb_pvt   
         group by [month]
       `
  );
  //console.log({ result });
  res.json({ result: result[0] });
});

router.post("/mc_log_month", async (req, res) => { 
  var command_mc = "";
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
  }
  let result = await users.sequelize.query(
    `--Machine Log by monthly -----------------------------------------------
with tb1 as(
      select [status], FORMAT([mfg_date], 'yyyy-MM') as [month]
      ,convert(varchar, [app_counter_machinelog].[registered_at], 120) as [Time]
  ,[mfg_date]
      ,IIF(CAST(DATEPART(HOUR, [app_counter_machinelog].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_machinelog].[registered_at]) AS int)) as [hour]
       FROM [counter].[dbo].[app_counter_machinelog]
       left join [counter].[dbo].[app_counter_machineno]
        on [app_counter_machinelog].node_no_id = [app_counter_machineno].[node_no]
        and ([app_counter_machinelog].[mfg_date] between DATEADD(yy,-1,CONVERT(DATE,GETDATE())) and GETDATE())
       and ([mc_name] = '' ` + command_mc +` )
      )
      ,tb2 as (select [status],[month],[Time],isnull(Abs(DATEDIFF(SECOND, [Time], LEAD([Time],1) OVER (ORDER BY [Time]))),0) AS [DateDiff] from tb1)
      ,tb3 as(
      select [status],[month],sum([DateDiff]) as [DateDiff] from tb2
      group by [status],[month])
      
      select   [month]
      ,cast(isnull(cast([START]as decimal)/3600,0) as decimal(10,2)) as [START]
      ,cast(isnull(cast([STOP]as decimal)/3600,0) as decimal(10,2)) as [STOP]
      ,cast(isnull(cast([WPART]as decimal)/3600,0) as decimal(10,2)) as [WPART]
      ,cast(isnull(cast([ALARM]as decimal)/3600,0) as decimal(10,2)) as [ALARM]
      ,CAST(cast(isnull(cast([START]as decimal)/3600,0) as decimal(10,2)) AS varchar)
      +','+CAST(cast(isnull(cast([STOP]as decimal)/3600,0) as decimal(10,2)) AS varchar)
      +','+CAST(cast(isnull(cast([WPART]as decimal)/3600,0) as decimal(10,2)) AS varchar)
      +','+CAST(cast(isnull(cast([ALARM]as decimal)/3600,0) as decimal(10,2)) AS varchar) as [combine]
      FROM tb3 pivot (sum([DateDiff]) for [status] in ([START],[STOP],[WPART],[ALARM]) ) as pvt
       `
  );
  //console.log({ result });
  res.json({ result: result[0] });
});

router.post("/total_output_month", async (req, res) => {

  var command_mc = "";
  for (let index = 0; index < req.body.selected_mc.length; index++) {
    command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
  }
  let result = await users.sequelize.query(
    `--total_output by monthly -----------------------------------------------
    with tb1 as(
      SELECT 
            FORMAT([mfg_date], 'yyyy-MM') as [month]
           --,[mfg_date]
            ,[app_counter_accumoutput].[pin]
            ,max([accum_output]) as  [accum_output] 
        FROM [counter].[dbo].[app_counter_accumoutput]
        left join [counter].[dbo].[app_counter_machineno]
                                   on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
                          left join [counter].[dbo].[app_counter_pin]
                                  on [app_counter_accumoutput].pin = [app_counter_pin].[pin]
      
        where [mfg_date] between DATEADD(yy,-1,CONVERT(DATE,GETDATE())) and GETDATE()
      --and [app_counter_accumoutput].pin = 'D13' /*MBR*/
        --and pin = 'D202' /*ARP*/
        and [app_counter_pin].[name] LIKE '%OK%'
       and ([mc_name] = '' ` + command_mc +` )
              -- and ([mc_name] = 'MBR01'  )
      
          group by FORMAT([mfg_date], 'yyyy-MM'),[mfg_date],[app_counter_accumoutput].[pin]
          )
      select [month],[pin],sum([accum_output]) as qty
      from tb1 group by [month],[pin]
      `
  );
  res.json({ result: result[0] });
});



module.exports = router;
