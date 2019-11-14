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

exports.addLocation = function (req, res) {
    postdata = req.body;
    if (JSON.stringify(postdata) === '{}') {
        res.status(200).json({ status: false, message: 'Body data is required' });
        return;
    } else {
        x = postdata.keyword;

        switch (x) {
            // Registration api(email and password)
            case 'registration':
                db.collection('userdetails').find({ "email": parseInt(postdata.email) }).toArray(function (err, getuser) {
                    if (getuser == "") {
                        var InRegistrationData = {
                            uid: postdata.uid,
                            email: postdata.email,
                            username: postdata.username,
                            latitude: postdata.latitude,
                            longitude: postdata.longitude,
                            invitecode: randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                            flage: postdata.flage,
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
                                    var ingroupdata = {
                                        uid: postdata.uid,
                                        groupname: postdata.username + "_" + "Default Group",
                                        default: true,
                                        members: [postdata.uid],
                                        date: new Date()
                                    }
                                    db.collection('groups').insertOne(ingroupdata, function (err, groupData) {
                                        if (err) {
                                            res.status(200).json({ status: false, message: 'Error for Created Group' });
                                            return;
                                        } else {
                                            console.log("groupsData",groupData);
                                            console.log("groups insertedID",groupData.insertedId);
                                            var group_ciphertext_key = CryptoJS.AES.encrypt(JSON.stringify(groupData.insertedId), 'Location-Sharing');
                                            var group_key = group_ciphertext_key.toString();

                                            var latitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(postdata.plain_lat), group_key);
                                            var new_latitude = latitude_ciphertext.toString();

                                            var longitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(postdata.plain_long), group_key);
                                            var new_longitude = longitude_ciphertext.toString();

                                            var newgroupdata = {
                                                uid: postdata.uid,
                                                gid: group_key,
                                                latitude: new_latitude,
                                                longitude: new_longitude,
                                            }

                                            db.collection('groupsinfo').insertOne(newgroupdata, function (err, newGroupData) { });

                                            var userhistorydata = {
                                                uid: postdata.uid,
                                                latitude: postdata.latitude,
                                                longitude: postdata.longitude,
                                                cd: new Date()
                                            }

                                            db.collection('userhistory').insertOne(userhistorydata, function (err, userHistoryData) { });

                                            res.status(200).json({ status: true, message: 'Registration succesfull', userdata: alldata });
                                            return;
                                        }

                                    });

                                });

                            }
                        });

                    } else {
                        res.status(200).json({ status: false, message: 'User already exists!' });
                        return;
                    }

                });

                break;

            // google login api 
            case 'googlelogin':
                db.collection('userdetails').find({ "email": postdata.email }).toArray(function (err, getuser) {
                    if (getuser == "") {
                        var InRegistrationData = {
                            uid: postdata.uid,
                            email: postdata.email,
                            username: postdata.username,
                            latitude: postdata.latitude,
                            longitude: postdata.longitude,
                            invitecode: randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
                            flage: postdata.flage,
                            socket_id: "",
                            profile: postdata.profile,
                            date: new Date()
                        }
                        db.collection('userdetails').insertOne(InRegistrationData, function (err, result) {
                            if (err) {
                                res.status(200).json({ status: false, message: 'Error for Registration' });
                                return;
                            } else {
                                var locationdata = {
                                    uid: postdata.uid,
                                    latitude: postdata.latitude,
                                    longitude: postdata.longitude,
                                    cd: new Date()
                                }
                                db.collection('user_location').insertOne(locationdata, function (err, result) { });
                                db.collection('userdetails').find({ _id: ObjectId(result.insertedId) }).toArray(function (err, alldata) {

                                    var ingroupdata = {
                                        uid: postdata.uid,
                                        groupname: postdata.username + "_" + "Default Group",
                                        default: true,
                                        members: [postdata.uid],
                                        date: new Date()
                                    }
                                    db.collection('groups').insertOne(ingroupdata, function (err, groupData) {
                                        if (err) {
                                            res.status(200).json({ status: false, message: 'Error for Group Creation' });
                                            return;
                                        } else {

                                            var group_ciphertext_key = CryptoJS.AES.encrypt(JSON.stringify(groupData.insertedId), 'Location-Sharing');
                                            var group_key = group_ciphertext_key.toString();

                                            var latitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(postdata.plain_lat), group_key);
                                            var new_latitude = latitude_ciphertext.toString();

                                            var longitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(postdata.plain_long), group_key);
                                            var new_longitude = longitude_ciphertext.toString();

                                            var newgroupdata = {
                                                uid: postdata.uid,
                                                gid: group_key,
                                                latitude: new_latitude,
                                                longitude: new_longitude,
                                            }

                                            db.collection('groupsinfo').insertOne(newgroupdata, function (err, newGroupData) { });

                                            var userhistorydata = {
                                                uid: postdata.uid,
                                                latitude: postdata.latitude,
                                                longitude: postdata.longitude,
                                                cd: new Date()
                                            }

                                            db.collection('userhistory').insertOne(userhistorydata, function (err, userHistoryData) { });

                                            res.status(200).json({ status: true, message: 'Registration succesfull', userdata: alldata });
                                            return;
                                        }

                                    });

                                });

                            }
                        });
                    } else {
                        var locationdata = {
                            uid: postdata.uid,
                            latitude: postdata.latitude,
                            longitude: postdata.longitude,
                            cd: new Date()
                        }
                        db.collection('user_location').insertOne(locationdata, function (err, result) { });

                        res.status(200).json({ status: false, message: 'Login Successfull', userdata: getuser });
                        return;
                    }
                });
                break;
            default:
                res.status(200).json({ status: false, message: 'Something went to wrong' });
                return;
        }
    }
}
