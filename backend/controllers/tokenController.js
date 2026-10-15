// controllers/tokenController.js
const Token = require("../models/Token");
const QRCode = require("qrcode");
// =================================
// Generate Single Token
// =================================
exports.generateToken = async (req,res)=>{
try{
const {
category,
validUpto
}=req.body;
const now = new Date();
const batchNumber =
"B"+
now.getFullYear()+
("0"+(now.getMonth()+1)).slice(-2)+
("0"+now.getDate()).slice(-2)+
Math.floor(1000 + Math.random()*9000);
const tokenNumber =
"TKN"+
Date.now()+
Math.floor(100+Math.random()*900);
const qrCode =
await QRCode.toDataURL(tokenNumber);
const token =
new Token({
tokenNumber,
batchNumber,
category,
validUpto,
qrCode,
paymentStatus:"Unpaid"
});
await token.save();
res.json(token);
}catch(err){
console.error(err);
res.status(500).json({
error:err.message
});
}
};
// =================================
// Generate Bulk Tokens
// =================================
exports.generateBulkTokens = async(req,res)=>{
try{
const {
category,
count,
validUpto
}=req.body;
const total = Number(count);
const now = new Date();
const batchNumber =
"B"+
now.getFullYear()+
("0"+(now.getMonth()+1)).slice(-2)+
("0"+now.getDate()).slice(-2)+
Math.floor(1000+Math.random()*9000);
let tokens=[];
for(let i=0;i<total;i++){
const tokenNumber =
"TKN"+
Date.now()+
Math.floor(
1000+
Math.random()*9000
);
const qrCode =
await QRCode.toDataURL(
tokenNumber
);
const token =
new Token({
tokenNumber,
batchNumber,
category,
validUpto,
qrCode,
paymentStatus:"Unpaid"
});
await token.save();
tokens.push(token);
}
res.json({
batchNumber,
count:tokens.length,
tokens
});
}catch(err){
console.error(err);
res.status(500).json({
error:err.message
});
}
};
// =================================
// Verify Token
// =================================
exports.getToken = async(req,res)=>{
try{
const tokenNumber =
String(req.params.id)
.trim();
const token =
await Token.findOne({
tokenNumber
});
if(!token){
return res.status(404).json({
message:"Invalid Token"
});
}
res.json(token);
}catch(err){
res.status(500).json({
error:err.message
});
}
};
// =================================
// Mark Paid
// =================================
exports.markPaid = async(req,res)=>{
try{
const tokenNumber=req.params.id.trim();
const token=await Token.findOne({
tokenNumber
});
if(!token){
return res.status(404).json({
message:"Token not found"
});
}
// FIX OLD TOKENS
if(!token.batchNumber){
const date=new Date();
token.batchNumber =
"B"+
date.getFullYear()+
("0"+(date.getMonth()+1)).slice(-2)+
("0"+date.getDate()).slice(-2)+
"OLD";
}
token.paymentStatus="Paid";
token.paidAt=new Date();
await token.save();
res.json(token);
}catch(err){
console.error(err);
res.status(500).json({
error:err.message
});
}
};
// =================================
// Dashboard Report
// =================================
exports.getReport = async(req,res)=>{
try{
const total =
await Token.countDocuments();
const paid =
await Token.countDocuments({
paymentStatus:"Paid"
});
const unpaid =
await Token.countDocuments({
paymentStatus:"Unpaid"
});
const today =
new Date();
today.setHours(
0,0,0,0
);
const todayPaid =
await Token.countDocuments({
paymentStatus:"Paid",
paidAt:{
$gte:today
}
});
// CATEGORY REPORT
const categoryReport =
await Token.aggregate([
{
$group:{
_id:"$category",
total:{
$sum:1
},
paid:{
$sum:{
$cond:[
{
$eq:[
"$paymentStatus",
"Paid"
]
},
1,
0
]
}
}
}
}
]);
// BATCH REPORT
const batchReport =
await Token.aggregate([
{
$group:{
_id:"$batchNumber",
category:{
$first:"$category"
},
total:{
$sum:1
},
paid:{
$sum:{
$cond:[
{
$eq:[
"$paymentStatus",
"Paid"
]
},
1,
0
]
}
},
createdAt:{
$first:"$createdAt"
}
}
},
{
$project:{
_id:0,
batchNumber:"$_id",
category:1,
total:1,
paid:1,
unpaid:{
$subtract:[
"$total",
"$paid"
]
},
createdAt:1
}
},
{
$sort:{
createdAt:-1
}
}
]);
res.json({
total,
paid,
unpaid,
todayPaid,
categoryReport,
batchReport
});
}catch(err){
console.error(err);
res.status(500).json({
error:err.message
});
}
};
// =================================
// Regenerate Token QR
// =================================
exports.regenerateToken = async(req,res)=>{
try{
const token =
await Token.findOne({
tokenNumber:req.params.id
});
if(!token){
return res.status(404).json({
message:"Token not found"
});
}
token.qrCode =
await QRCode.toDataURL(
token.tokenNumber
);
await token.save();
res.json(token);
}catch(err){
res.status(500).json({
error:err.message
});
}
};
// =================================
// Get Tokens By Batch
// =================================
exports.getBatchTokens = async(req,res)=>{
try{
const batchNumber =
String(
req.params.batchNumber ||
req.params.batch
)
.trim();
console.log(
"SEARCH BATCH:",
batchNumber
);
const tokens =
await Token.find({
batchNumber
})
.sort({
createdAt:1
});
if(tokens.length===0){
return res.status(404).json({
message:"Batch not found"
});
}
res.json({
batchNumber,
count:tokens.length,
tokens
});
}catch(err){
console.error(err);
res.status(500).json({
error:err.message
});
}
};