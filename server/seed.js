require("dotenv").config();
const mongoose=require("mongoose"),bcrypt=require("bcryptjs");
const User=require("./models/User"),Quiz=require("./models/Quiz"),Question=require("./models/Question");
(async()=>{
  await mongoose.connect(process.env.MONGO_URI||"mongodb://127.0.0.1:27017/quiz_examination_db");
  // Idempotent seed: preserve existing users, quizzes and student attempts.
  const admin=await User.findOneAndUpdate({email:"admin@quizsphere.dev"},{
    $setOnInsert:{name:"Demo Admin",email:"admin@quizsphere.dev",passwordHash:await bcrypt.hash("Admin@123",12),role:"admin"}
  },{upsert:true,new:true});
  await User.findOneAndUpdate({email:"student@quizsphere.dev"},{
    $setOnInsert:{name:"Demo Student",email:"student@quizsphere.dev",passwordHash:await bcrypt.hash("Student@123",12),role:"student"}
  },{upsert:true,new:true});
  const data=[
    ["JavaScript Fundamentals",[
      ["Which keyword declares a block-scoped variable?",["var","let","function","global"],1],
      ["What does === check?",["Value only","Type only","Value and type","Nothing"],2],
      ["Which method converts JSON text to an object?",["JSON.parse()","JSON.stringify()","Object.toJSON()","parse.JSON()"],0]
    ]],
    ["React.js Essentials",[
      ["Which hook manages local component state?",["useEffect","useState","useRef","useMemo"],1],
      ["What prop is used to uniquely identify list items?",["key","idOnly","indexKey","unique"],0]
    ]],
    ["MongoDB Basics",[
      ["MongoDB stores records as which structure?",["XML files","BSON documents","CSV rows","Plain text"],1],
      ["Which method finds multiple documents?",["find()","findOne()","selectAll()","getMany()"],0]
    ]]
  ];
  for(const [title,items] of data){
    let quiz=await Quiz.findOne({title});
    if(!quiz) quiz=await Quiz.create({title,category:title,description:"Practice core concepts and review your result.",durationMinutes:10,difficulty:"medium",status:"published",allowedAttempts:3,createdBy:admin._id});
    if(!(await Question.exists({quizId:quiz._id}))) await Question.insertMany(items.map(([questionText,options,correctOption])=>({quizId:quiz._id,questionText,options,correctOption,marks:2,topic:title})));
  }
  console.log("Seed complete. Demo admin: admin@quizsphere.dev / Admin@123; student: student@quizsphere.dev / Student@123");
  await mongoose.disconnect();
})().catch(async e=>{console.error(e);await mongoose.disconnect();process.exit(1)});
