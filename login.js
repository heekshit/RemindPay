var express = require('express');
var multer = require('multer');
var excelToJson = require('convert-excel-to-json');
var fs = require('fs-extra');
var path = require('path')
var ndm = require('nodemailer');
var cron = require('node-cron');
const mongoose = require('mongoose');
const coll = require('./mongo');

const app = express();
app.use(express.static('public'));
app.use(express.static('views'));
app.set('views',path.join(__dirname,'views'));
app.set('veiw engine','ejs');

// app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended:true}));


mongoose.connect('mongodb://127.0.0.1:27017/');
var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(callback){
	console.log("db connected");
});

app.get('/features',function(req,res){
    res.render('features.ejs');
})

app.get('/login',function(req,res){
    return res.render('home.ejs');
})
//loginpage
app.get('/',function(req,res) 
{
    res.render('login.ejs');
});
//signup page
app.get('/signup',function(req,res){
    res.render('signup.ejs');
    
});
//registration successful
app.post('/signup',async function(req,res){
     var login_Data = {
        name:req.body.name,
        gmail:req.body.gmail,
        password:req.body.pass
     }
     await coll.insertMany(login_Data).then(function(){
        console.log("Login Data inserted")  // Success
    }).catch(function(error){
        console.log(error)      // Failure
    });
    res.render("signup.ejs",{message:'User Registered Successfully'})

    
})
//home page routing
app.post('/login',async function(req,res){
    try{
        
         const check = await coll.findOne({gmail:req.body.email});
         if(check === null){
            res.render('login.ejs',{message:'User Not Found'});
         }
         else if(check.password ===  req.body.Password) 
         {
            return res.render("home.ejs");
    
         }
         else 
         {
             
           return res.render('login.ejs',{message:' Incorrect Credentials'});
         }
         
         
        
    }
    catch(err){

        res.send(err);
    }
})
app.get('/index' ,function(req,res){
    res.render('remind.ejs');
})
var upload = multer({dest:'uploads/'});
//getting home page data
app.post('/index',upload.single("file"), function(req,res){
        
    try{
        if(req.file?.filename == null || req.file?.filename == "undefined"){
            res.status(400).json("No File");
        }
        else{
            var filePath = "uploads/"+req.file.filename;
            const excelData = excelToJson({
                sourceFile:filePath,
                header:{
                    rows:1,
                },
                columnToKey:{
                    "*":"{{columnHeader}}",
                },
                });
                 console.log(excelData);
                fs.remove(filePath);
                res.status(200).sendFile(__dirname+"/signup_success.html")
                
                // const json = JSON.stringify(excelData);
                // console.log(json);
                // const objData = JSON.parse(json);

                // User model
const Data = mongoose.model('datas', {
    Name: { type: String },
    Mail: { type: String },
    Diameter:{type : String}

});
  
// Function call
Data.insertMany(excelData.Sheet1).then(function(){
    console.log("Data inserted")  // Success
}).catch(function(error){
    console.log(error)      // Failure
});


                 var name = "";
                 var mail = "";
                 var senderMail = req.body.email;
                 var key = req.body.key;
                 var mail = ndm.createTransport(
                    {
                        service:'gmail' ,
                        auth:
                        {
                            user: req.body.email,
                            pass: key
                        }
                    });
                   
                try{
                     cron.schedule("*/5 * * * * *",async function(){
                      
 
                for(let i = 0;i<=excelData.Sheet1.length;i++)
                {
                    console.log(excelData.Sheet1[i].Name);
                    console.log(excelData.Sheet1[i].Mail);
                    name = excelData.Sheet1[i].Name;
                    var mailoptions = 
                        {
                            from: senderMail,
                            to: excelData.Sheet1[i].Mail ,
                            subject : req.body.sub,
                            text:req.body.msg
                        }
                        await mail.sendMail(mailoptions,function(err,info)
                        {
                            console.log('mail has been Sent');
                        });


                 
                }});
        }
        catch(err){console.log(err);}
    }
        }catch(err)
        {
            res.status(500);
        }
            


        });
app.listen(8000,(err)=>
{
    if(err){console.log(err)}
    else{console.log("Listening to Port 8000",)}
});