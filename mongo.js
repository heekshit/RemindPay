var mongo = require('mongoose')
const loginschema = new mongo.Schema({

    name:{
        type:String,
       
    },
    gmail:{
        type:String,
        
    },
    password:{
        type:String,

    }
});
var coll = new mongo.model("login_data",loginschema);
module.exports = coll;
