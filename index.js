const express = require("express");
const {startTrading} = require("./controller/startTrading")

const app = express();
const port = 3000;

startTrading();

app.listen(port, (err)=>{
    if(err){
        console.log("error in listening the port")
    }
    console.log("server is listening the port", port)
})
