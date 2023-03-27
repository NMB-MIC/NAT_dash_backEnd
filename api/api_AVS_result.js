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

router.post("/list_machine_AVS", async (req, res) => {
    //function respone and request
    try {
        let getData = await users.sequelize.query(
            `
            SELECT [mc_name]  FROM [counter].[dbo].[app_counter_machineno]
            where [mc_name] LIKE 'AVS%' 
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
            IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) as [hour],
            IIF(IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) >= 7
            and IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) <=18 ,'M','N') as [shift]
                  ,[mfg_date]
                  ,[pin]
                  ,[accum_output]
                  ,[node_no_id]
              FROM [counter].[dbo].[app_counter_accumoutput]
              where ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}')   /*----*/
              and pin = 'D312'
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
       --select * from  tb2
          ,tb3 as (
                select [mfg_date],[node_no_id] ,[process] 
                ,TTLtarget,[shift]
                ,sum(daily_output) as qty
                from tb2
          group by [mfg_date],[node_no_id],[process] 
          ,TTLtarget,[shift]
         )  
        --select * from  tb3
         ,tb4 as (
         select [mfg_date]
         ,max(TTLtarget) as [target] 
         ,sum(qty) as [Qty_output]
        ,[mc_name]
         from tb3	 
       left join [counter].[dbo].[app_counter_machineno] on tb3.[node_no_id] = [app_counter_machineno].node_no
      -- where process = '${req.body.process}' /*----*/
       and ([mc_name] = '' `+ command_mc + ` ) /*----*/
         group by [mfg_date],[mc_name]
         --order by mfg_date
       ) 
      --select * from  tb4
       select [mfg_date]
       ,sum([target]) as [target] 
       ,sum([Qty_output]) as [Qty_output]
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

router.post("/daily_out_By_machine", async (req, res) => {
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
        console.log("-------");
        console.log(date_text);
  
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
              and pin = 'D312'     
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

router.post("/TTL_yield", async (req, res) => {
    try {
        var command_mc = "";
        for (let index = 0; index < req.body.selected_mc.length; index++) {
            command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `
        }
        let result = await users.sequelize.query(
            `
        with tb1 as(
            SELECT IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) 
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
              and ([mc_name] =  '' `+ command_mc + `) /*---*/
              and process = '${req.body.process}'/*---*/
             and ([app_counter_pin].[name] LIKE '%NG%' or [app_counter_pin].[name] LIKE '%OK%')
             and ([app_counter_pin].pin = 'D312' or  [app_counter_pin].pin = 'D318')
             )
             ,tb2 as(
             select [mfg_date],[hour],IIF([hour] >= 7 and [hour] <=18 ,'M','N') as [shift],[pin],[accum_output],[process]
             ,iif([name] LIKE '%OK%','ok','ng') as [result]
             --,IIF(left(process,1) ='M',cast(tb1.[accum_output] as int)*6,[accum_output]) as [accum_output1]
             from tb1
             --where IIF([hour] >= 7 and [hour] <=18 ,'M','N') = '${req.body.selected_shift}'/*---*/
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
           , 95 as yield_target
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
        console.log("result*************");
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
            SELECT IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) 
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
          where  ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}'/*---*/ )
              and [accum_output] >0
              and ([mc_name] = '' `+ command_mc + `) /*---*/
              and process = '${req.body.process}'/*---*/
             and ([app_counter_pin].[name] LIKE '%NG%' or [app_counter_pin].[name] LIKE '%OK%')
             and ([app_counter_pin].pin = 'D312' or  [app_counter_pin].pin = 'D318')
             )
             ,tb2 as(
             select [mfg_date],[hour],IIF([hour] >= 7 and [hour] <=18 ,'M','N') as [shift],[pin],[accum_output],[process]
             ,iif([name] LIKE '%OK%','ok','ng') as [result]
             --,IIF(left(process,1) ='M',cast(tb1.[accum_output] as int)*6,[accum_output]) as [accum_output1]
             from tb1
             --where IIF([hour] >= 7 and [hour] <=18 ,'M','N') = '${req.body.selected_shift}'/*---*/
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
           , 95 as yield_target
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
            --,yield_target
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
      ,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)-1) as [hour]
      ,[app_counter_accumoutput].[registered_at]
                  ,[mfg_date]
                  ,[app_counter_accumoutput].[pin]
                  ,[accum_output]
                  --,[node_no_id]
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
             ([mfg_date] between '${req.body.date_start}' and '${req.body.date_end}'/*---*/ )
          and ([mc_name] =  '' `+ command_mc + ` )
       and  ([app_counter_pin].[pin] = 'D318' or [app_counter_pin].[pin] = 'D310' )
       and [accum_output] >0
            )
        ,tb1 as(
        select [mfg_date]
        --,[hour]
        ,[process]
        ,[name]
        ,max([accum_output]) as [accum_output]
        from tb_ng
        group by [mfg_date],[name],[process]
        )
         ,tb2 as (
      select [mfg_date]
         ,[name]
         ,[accum_output]
         from tb1
      )
      ,tb_pvt as(
        SELECT [mfg_date]
            ,ISNULL([Shift Total],0) AS [Shift Total]
            ,ISNULL([Shift NG],0) AS  [Shift_NG]
            FROM tb2 
            pivot (sum([accum_output])
             for [name] in([Shift Total],[Shift NG])
             ) as pvt)
    
            --select * from tb_pvt
        select [mfg_date]
        --,[Shift Total]
        ,cast(100*cast([Shift_NG]as decimal(10,3))/[Shift Total]as decimal(10,3)) as [Shift_NG]
        from tb_pvt
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

router.post("/AVS_total_output_month", async (req, res) => {

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
            and [app_counter_accumoutput].pin = 'D312'  /*pin*/
            --and [app_counter_pin].[name] LIKE '%Production X1%'
            and ([mc_name] = '' ` + command_mc + ` )
            -- and ([mc_name] = 'MBR01'  )
          
              group by FORMAT([mfg_date], 'yyyy-MM'),[mfg_date],[app_counter_accumoutput].[pin]
              )
          select [month],sum([accum_output]) as qty
          from tb1 group by [month]
          `
    );
    res.json({ result: result[0] });
  });
  
  router.post("/daily_CT", async (req, res) => {

    var command_mc = "";
    for (let index = 0; index < req.body.selected_mc.length; index++) {
      command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
    }
    let result = await users.sequelize.query(
      `/* CT */
        SELECT 
        --convert(varchar, [app_counter_accumoutput].[registered_at], 23) as [registered_at]
              [app_counter_accumoutput].[mfg_date] as [registered_at]
              --,IIF(CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)=0,23,CAST(DATEPART(HOUR, [app_counter_accumoutput].[registered_at]) AS int)) as [hour]
              --,[accum_output] 
              ,round(Avg([accum_output]/100),2 )as ct
              ,1.70 as target
              --,[app_counter_pin].pin
               FROM [counter].[dbo].[app_counter_accumoutput]
               left join [counter].[dbo].[app_counter_machineno]
               on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
               left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin
               where   ([app_counter_accumoutput].[mfg_date]  between '${req.body.date_start}' and '${req.body.date_end}')  /*---*/
               and [accum_output] >0
               and ([mc_name] = '' ` + command_mc + ` ) /*---*/
               and process = 'AVS'/*---*/
               and [app_counter_accumoutput].[pin] ='D300'  /* CT Month */
           group by [app_counter_accumoutput].[mfg_date] 

            `
    );
    res.json({ result: result[0] });
  });

  router.post("/CT_month", async (req, res) => {

    var command_mc = "";
    for (let index = 0; index < req.body.selected_mc.length; index++) {
      command_mc = command_mc + ` or [mc_name] = '${req.body.selected_mc[index]}' `;
    }
    let result = await users.sequelize.query(
      `/* CT avg by month */
      with tb1 as (
        SELECT 
      [app_counter_accumoutput].[mfg_date] as [registered_at]
      ,FORMAT([mfg_date], 'yyyy-MM') as [month]
      ,[accum_output]/100 as ct
      ,1.70 as target
      --,[app_counter_pin].pin
      FROM [counter].[dbo].[app_counter_accumoutput]
      left join [counter].[dbo].[app_counter_machineno]
      on [app_counter_accumoutput].node_no_id = [app_counter_machineno].[node_no]
      left join [counter].[dbo].[app_counter_pin] on [app_counter_accumoutput].pin = [app_counter_pin].pin
      where [mfg_date] between DATEADD(yy,-1,CONVERT(DATE,GETDATE())) and GETDATE()
      and [accum_output] >0
      and ([mc_name] = '' ` + command_mc + ` ) /*---*/
      and process = 'AVS'/*---*/
      and [app_counter_accumoutput].[pin] = 'D300'  /*  CT */
      --group by FORMAT([mfg_date], 'yyyy-MM'),[mfg_date]
      )
      select [month],round(avg(ct),2)as ct
      from tb1 group by [month]
            `
    );
    res.json({ result: result[0] });
  });
  

module.exports = router;
