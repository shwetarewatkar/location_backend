const { ObjectId } = require('mongodb');
var fs = require('fs');
var bcrypt = require('bcryptjs');
var CryptoJS = require("crypto-js");

// Generate random number for invite code
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

// Start Add 
exports.addLocation = function (req, res) {
    postdata = req.body;

    if (JSON.stringify(postdata) === '{}') {

        res.status(200).json({ status: false, message: 'Body data is required' });
        return;

    } else {

        x = postdata.keyword;

        switch (x) {

            // Registration api

            case 'registration':

                db.collection('userdetails').find({ "email": parseInt(postdata.email) }).toArray(function (err, getuser) {

                    if (getuser == "") {

                        var InRegistrationData = {
                            uid: postdata.uid,
                            email: postdata.email,
                            username: postdata.username,
                            invitecode: randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                            flag: postdata.flag,
                            socket_id: "",
                            profile: postdata.profile,
                            date: new Date()
                        }

                        db.collection('userdetails').insertOne(InRegistrationData, function (err, result) {

                            if (err) {
                                res.status(200).json({ status: false, message: 'Error for Registration' });
                                return;
                            } else {

                                db.collection('userdetails').find({ _id: ObjectId(result.insertedId) }).toArray(function (err, alldata) {

                                    var randomno = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

                                    var ingroupdata = {
                                        uid: postdata.uid,
                                        groupname: postdata.username + "_" + "Default Group",
                                        default: true,
                                        members: [postdata.uid],
                                        shareid: randomno,
                                        date: new Date()
                                    }

                                    db.collection('groups').insertOne(ingroupdata, function (err, groupData) {
                                        if (err) {
                                            res.status(200).json({ status: false, message: 'Error for Created Group' });
                                            return;
                                        } else {
                                            
                                            var gid = groupData.insertedId.toString();
                                            var latest_location_data = {
                                                uid: postdata.uid,
                                                gid: gid, //gid => grp _id
                                                latitude: "",
                                                longitude: "",
                                                latest_kv: 0
                                            }

                                            db.collection('latest_location').insertOne(latest_location_data, function (err, latest_location_response) { });
                                            var randomno2 = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                                            var groupKey = CryptoJS.AES.encrypt(JSON.stringify(randomno2),'Location-Sharing');
                                            var encrypted_groupKey = groupKey.toString();

                                            var groupKeyInfo = {
                                                uid: postdata.uid, // uid of last added/removed  member
                                                gid: gid,
                                                gkey: encrypted_groupKey,
                                                kv: 0
                                            }

                                            db.collection('groupkey_info').insertOne(groupKeyInfo, function(err,groupKeyInfo_response){});

                                            var memberStartKv ={
                                                uid: postdata.uid,
                                                gid: gid,
                                                startKv: 0
                                            }

                                            db.collection('member_start_kv').insertOne(memberStartKv, function(err,groupKeyInfo_response){});

                                            // var location_history_data = {
                                            //     uid: postdata.uid,
                                            //     gid: gid,
                                            //     latitude: "",
                                            //     longitude: "",
                                            //     cd: new Date()
                                            // }

                                            // db.collection('userhistory').insertOne(location_history_data, function (err, inserted_id) { });

                                            res.status(200).json({ status: true, message: 'Registration succesfuly', userdata: alldata });
                                            return;
                                        }

                                    });

                                });

                            }
                        });

                    } else {
                        res.status(200).json({ status: false, message: 'User already exist!' });
                        return;
                    }

                });

                break;

            // login api ( When login with google at that time )

            case 'googlelogin':

                db.collection('userdetails').find({ "email": postdata.email }).toArray(function (err, getuser) {

                    if (getuser == "") {

                        var InRegistrationData = {
                            uid: postdata.uid,
                            email: postdata.email,
                            username: postdata.username,
                            invitecode: randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                            flag: postdata.flag,
                            socket_id: "",
                            profile: postdata.profile,
                            date: new Date()
                        }

                        db.collection('userdetails').insertOne(InRegistrationData, function (err, result) {

                            if (err) {
                                res.status(200).json({ status: false, message: 'Error for Registration' });
                                return;
                            } else {

                                db.collection('userdetails').find({ _id: ObjectId(result.insertedId) }).toArray(function (err, alldata) {

                                    var randomno = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

                                    var ingroupdata = {
                                        uid: postdata.uid,
                                        groupname: postdata.username + "_" + "Default Group",
                                        default: true,
                                        members: [postdata.uid],
                                        shareid: randomno,
                                        date: new Date()
                                    }

                                    db.collection('groups').insertOne(ingroupdata, function (err, groupData) {
                                        if (err) {
                                            res.status(200).json({ status: false, message: 'Error for Created Group' });
                                            return;
                                        } else {
                                            var gid = groupData.insertedId.toString();
                                            var latest_location_data = {
                                                uid: postdata.uid,
                                                gid: gid, //gid => grp _id
                                                latitude: "",
                                                longitude: "",
                                                latest_kv: 0
                                            }
                                            db.collection('latest_location').insertOne(latest_location_data, function (err, latest_location_response) { });
                                            var randomno2 = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
                                            var groupKey = CryptoJS.AES.encrypt(JSON.stringify(randomno2),'Location-Sharing');
                                            var encrypted_groupKey = groupKey.toString();
                                            
                                            var groupKeyInfo = {
                                                uid: postdata.uid, // uid of last added/removed  member
                                                gid: gid,
                                                gkey: encrypted_groupKey,
                                                kv: 0
                                            }

                                            db.collection('groupkey_info').insertOne(groupKeyInfo, function(err,groupKeyInfo_response){});

                                            var memberStartKv ={
                                                uid: postdata.uid,
                                                gid: gid,
                                                startKv: 0
                                            }

                                            db.collection('member_start_kv').insertOne(memberStartKv, function(err,groupKeyInfo_response){});
                                            // var location_history_data = {
                                            //     uid: postdata.uid,
                                            //     gid: gid,
                                            //     latitude: "",
                                            //     longitude: "",
                                            //     cd: new Date()
                                            // }

                                            // db.collection('userhistory').insertOne(location_history_data, function (err, inserted_id) { });

                                            res.status(200).json({ status: true, message: 'Registration succesfull', userdata: alldata });
                                            return;
                                        }

                                    });

                                });

                            }
                        });

                    } else {

                        // var locationdata = {
                        //     uid: postdata.uid,
                        //     latitude: postdata.latitude,
                        //     longitude: postdata.longitude,
                        //     cd: new Date()
                        // }

                        // db.collection('user_location').insertOne(locationdata, function (err, result) { });

                        res.status(200).json({ status: false, message: 'Login Successfull', userdata: getuser });
                        return;
                    }

                });

                break;

            default:

                res.status(200).json({ status: false, message: 'Something went wrong' });
                return;

        }

    }
}
