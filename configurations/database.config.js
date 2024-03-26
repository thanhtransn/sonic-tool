const mongoose = require("mongoose");
const UserSchema = require("../schema/user.schema");
mongoose.Promise = global.Promise
class Database {
    instance=null
    url=null
    constructor({url}){
        this.url = url
    }

    async connection(){
        await mongoose.connect(this.url).then(()=>{
            console.log("Database is connected....!");
        }).catch((error)=>{console.log("error", error);})
    }

    async getInstance(){
        if(!Database.instance){
            await this.connection();
            Database.instance = this;
        }
        return Database.instance;
    }
}

module.exports = Database