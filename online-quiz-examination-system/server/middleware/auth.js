const jwt=require("jsonwebtoken"),User=require("../models/User");
exports.auth=async(req,res,next)=>{try{const token=req.cookies.token;if(!token)return res.status(401).json({message:"Please log in"});const d=jwt.verify(token,process.env.JWT_SECRET);req.user=await User.findById(d.id).select("-passwordHash");if(!req.user||!req.user.isActive)return res.status(401).json({message:"Invalid session"});next()}catch(e){res.status(401).json({message:"Invalid session"})}};
exports.admin=(req,res,next)=>req.user?.role==="admin"?next():res.status(403).json({message:"Admin access required"});
