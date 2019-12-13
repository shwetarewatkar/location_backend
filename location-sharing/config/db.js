// var mongoUrl = "mongodb+srv://user:password1234@cluster0-nmkja.mongodb.net/locationsharing?retryWrites=true&w=majority";
// var mongoUrl = "mongodb://locationsharing:mYvb73VAcnyYTe@localhost:27017/locationsharing";
var mongoUrl = "mongodb+srv://user1:pass123456@cluster0-rzmux.mongodb.net/new-server?retryWrites=true&w=majority"

if (!mongoUrl) {
    console.log('PLease export mongoUrl');
    console.log('Use following commmand');
    console.log('*********');
    console.log('export MONGODB_URI=YOUR_MONGO_URL');
}

var mongoose = require('mongoose');
mongoose.connect(mongoUrl);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
    console.log("Connected to DB");
});

module.exports = db;
