const mongoose = require("mongoose");
module.exports = mongoose.model("Result",new mongoose.Schema({
 attemptId:{type:mongoose.Schema.Types.ObjectId,ref:"Attempt",unique:true},userId:mongoose.Schema.Types.ObjectId,quizId:mongoose.Schema.Types.ObjectId,
 score:Number,totalMarks:Number,percentage:Number,correctAnswers:Number,incorrectAnswers:Number,skippedAnswers:Number,completedAt:Date
},{timestamps:true}));
