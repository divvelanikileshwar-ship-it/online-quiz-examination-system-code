require("dotenv").config();
const express=require("express"),cors=require("cors"),helmet=require("helmet"),cookieParser=require("cookie-parser"),rateLimit=require("express-rate-limit");
const connectDB=require("./config/db"),api=require("./routes/api");
const app=express();app.use(helmet());app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173",credentials:true}));app.use(express.json());app.use(cookieParser());app.use(rateLimit({windowMs:15*60*1000,max:300}));
app.get("/api/health",(req,res)=>res.json({success:true,message:"QuizSphere API is running"}));app.use("/api",api);
const port=process.env.PORT||5000;connectDB().then(()=>app.listen(port,()=>console.log(`API running at http://localhost:${port}`))).catch(e=>{console.error(e);process.exit(1)});
