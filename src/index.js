
import dotenv from "dotenv"
import ConnectDB from "./dataBase/index.js";
import { app } from "./app.js";
const PORT = process.env.PORT || 6000

dotenv.config({
    path :"./env"
})

ConnectDB()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`server is Running at port ${process.env.PORT} `);
    })
})
.catch((err)=>{
  console.log("MONGO CONNECION WITH APP FAILED", err);
})
 

