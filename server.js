const express = require("express"); //constant
const app = express(); // constant app
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "./files")));
app.use(cors());


app.use("/NAT_Dashboard/user", require("./api/api_user"));

app.use("/NAT_Dashboard/Summary", require("./api/api_MBR_result")); //MBR assy
app.use("/NAT_Dashboard/query", require("./api/api_query"));   //MBR

app.use("/NAT_Dashboard/tun", require("./api/api_dash_turning")); //dash turning
app.use("/NAT_Dashboard/Turning_result", require("./api/api_turning_result")) //PR turning

 // IRH GD
app.use("/NAT_Dashboard/IRH_result", require("./api/api_grinding_result")) 
app.use("/NAT_Dashboard/gd", require("./api/api_dash_grinding"));

//ORH  GD
app.use("/NAT_Dashboard/ORH_result", require("./api/api_ORH_result")) 
app.use("/NAT_Dashboard/ORH_dash", require("./api/api_dash_ORH")) 

app.use("/NAT_Dashboard/IRB_dash", require("./api/api_dash_IRB"))
app.use("/NAT_Dashboard/IRB_result", require("./api/api_IRB_result"))

//ARP process 
app.use("/NAT_Dashboard/ARP_result", require("./api/api_ARP_result")) 
app.use("/NAT_Dashboard/ARP_dash", require("./api/api_dash_ARP")) 

//AVS process 
app.use("/NAT_Dashboard/AVS_result", require("./api/api_AVS_result")) 
app.use("/NAT_Dashboard/AVS_dash", require("./api/api_dash_AVS")) 

//AUTO NOISE process 
app.use("/NAT_Dashboard/AN_dash", require("./api/api_dash_auto_noise")) 
app.use("/NAT_Dashboard/AN_result", require("./api/api_AN_result")) 
// AL 
app.use("/NAT_Dashboard/AL_dash", require("./api/api_dash_AL")) 
app.use("/NAT_Dashboard/AL_result", require("./api/api_AL_result")) 
app.use("/NAT_Dashboard/Timeline_AL", require("./api/api_Timeline_AL"))    // chart mms
app.use("/NAT_Dashboard/Timeline_TB", require("./api/api_Timeline_TB"))    //  chart mms 
app.use("/NAT_Dashboard/Timeline_ARP", require("./api/api_Timeline_ARP"))    //  chart mms 
app.use("/NAT_Dashboard/Timeline_AVS", require("./api/api_Timeline_AVS"))    //  chart mms 
app.use("/NAT_Dashboard/Timeline_GSSM", require("./api/api_Timeline_GSSM"))    //  chart mms 
app.use("/NAT_Dashboard/Timeline_AOD", require("./api/api_Timeline_AOD")) 
app.use("/NAT_Dashboard/Timeline_GN", require("./api/api_Timeline_GN")) 
app.use("/NAT_Dashboard/master_topic", require("./api/api_master_topic"))  
app.use("/NAT_Dashboard/MMS", require("./api/api_MMS"))    

app.listen(4001, () => { // ให้รันที่พอต 

  console.log("Backend is running...");
});





