const UserSchema = require("../schema/user.schema");
const os = require("node-machine-id");
const luxon = require("luxon");
const { extractTime } = require("./helper");
const DateTime = luxon.DateTime;
async function verifyUser(email){

    const osId = await os.machineId();
    const user = await UserSchema.findOne({email}).exec().catch(()=>{
        throw new Error("Some Thing Went Wrong");
    });

    if(!user) {
        throw new Error("User Have Not Enabled !!!");
    }

    if(DateTime.now().toFormat('yyyy-MM-dd') > DateTime.fromJSDate(user.expiredAt).toFormat('yyyy-MM-dd')) {
        throw new Error("Account User Is Expired !!!");
    }

    if(!user.macAddress.length) {
        await UserSchema.updateOne({_id: user._id}, {$push: {macAddress: osId}}).exec().catch(()=>{
            throw new Error("Some Thing Went Wrong");
        })
    }

    if(user.macAddress.length && !user.macAddress.includes(osId)) {
        throw new Error("Account User Have Been Registered In Other Device !!!");
    }

    return Math.round(Math.abs(extractTime(DateTime.fromJSDate(user.expiredAt).toISO(), DateTime.now(), 'days')));
}

module.exports = {
    verifyUser
}