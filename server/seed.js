require("dotenv").config();const mongoose=require("mongoose"),bcrypt=require("bcryptjs");
const User=require("./models/User"),Quiz=require("./models/Quiz"),Question=require("./models/Question");
(async()=>{await mongoose.connect(process.env.MONGO_URI||"mongodb://127.0.0.1:27017/quiz_examination_db");
await User.deleteMany({});await Quiz.deleteMany({});await Question.deleteMany({});
const admin=await User.create({name:"Demo Admin",email:"admin@quizsphere.dev",passwordHash:await bcrypt.hash("Admin@123",10),role:"admin"});
await User.create({name:"Demo Student",email:"student@quizsphere.dev",passwordHash:await bcrypt.hash("Student@123",10)});
const data=[["JavaScript Fundamentals",[["Which keyword declares a block-scoped variable?",["var","let","function","global"],1],["What does === check?",["Value only","Type only","Value and type","Nothing"],2]]],["React.js Essentials",[["Which hook manages local state?",["useEffect","useState","useRef","useMemo"],1]]],["MongoDB Basics",[["MongoDB stores data in which format?",["XML","BSON documents","CSV","Plain text"],1]]]];
for(const [title,questions] of data){const q=await Quiz.create({title,category:title,description:"Test your knowledge",durationMinutes:15,status:"published",createdBy:admin._id});await Question.insertMany(questions.map(([questionText,options,correctOption])=>({quizId:q._id,questionText,options,correctOption,marks:2,topic:title})))}
console.log("Seed complete. Admin admin@quizsphere.dev / Admin@123; Student student@quizsphere.dev / Student@123");await mongoose.disconnect()})().catch(e=>{console.error(e);process.exit(1)});
