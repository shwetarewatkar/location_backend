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

                                            var bytes_lat = CryptoJS.AES.decrypt(postdata.latitude, 'Location-Sharing');
                                            var get_lat = JSON.parse(bytes_lat.toString(CryptoJS.enc.Utf8));

                                            var bytes_long = CryptoJS.AES.decrypt(postdata.longitude, 'Location-Sharing');
                                            var get_long = JSON.parse(bytes_long.toString(CryptoJS.enc.Utf8));

                                            var group_ciphertext_key = CryptoJS.AES.encrypt(JSON.stringify(groupData.insertedId), 'Location-Sharing');
                                            var group_key = group_ciphertext_key.toString();

                                            var latitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(get_lat), group_key);
                                            var new_latitude = latitude_ciphertext.toString();

                                            var longitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(get_long), group_key);
                                            var new_longitude = longitude_ciphertext.toString();

                                            // console.log("latitude:- ", postdata.plain_lat);
                                            // console.log("longitude:- ", postdata.plain_long);

                                            var newgroupdata = {
                                                uid: postdata.uid,
                                                gid: group_key,
                                                latitude: new_latitude,
                                                longitude: new_longitude,
                                            }

                                            db.collection('groupsinfo').insertOne(newgroupdata, function (err, newGroupData) { });

                                            var location_history_data = {
                                                uid: postdata.uid,
                                                gid: group_key,
                                                latitude: new_latitude,
                                                longitude: new_longitude,
                                                cd: new Date()
                                            }

                                            db.collection('userhistory').insertOne(location_history_data, function (err, inserted_id) { });

                                            res.status(200).json({ status: true, message: 'Registration succesfully', userdata: alldata });
                                            return;
                                        }

                                    });

                                });

                            }
                        });

                    } else {
                        res.status(200).json({ status: false, message: 'User allready exist!' });
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
                                            res.status(200).json({ status: false, message: 'Error for Created Group' });
                                            return;
                                        } else {

                                            var bytes_lat = CryptoJS.AES.decrypt(postdata.latitude, 'Location-Sharing');
                                            var get_lat = JSON.parse(bytes_lat.toString(CryptoJS.enc.Utf8));

                                            var bytes_long = CryptoJS.AES.decrypt(postdata.longitude, 'Location-Sharing');
                                            var get_long = JSON.parse(bytes_long.toString(CryptoJS.enc.Utf8));

                                            var group_ciphertext_key = CryptoJS.AES.encrypt(JSON.stringify(groupData.insertedId), 'Location-Sharing');
                                            var group_key = group_ciphertext_key.toString();

                                            var latitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(get_lat), group_key);
                                            var new_latitude = latitude_ciphertext.toString();

                                            var longitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(get_long), group_key);
                                            var new_longitude = longitude_ciphertext.toString();

                                            // console.log("latitude:- ", postdata.plain_lat);
                                            // console.log("longitude:- ", postdata.plain_long);

                                            var newgroupdata = {
                                                uid: postdata.uid,
                                                gid: group_key,
                                                latitude: new_latitude,
                                                longitude: new_longitude,
                                            }

                                            db.collection('groupsinfo').insertOne(newgroupdata, function (err, newGroupData) { });

                                            var location_history_data = {
                                                uid: postdata.uid,
                                                gid: group_key,
                                                latitude: new_latitude,
                                                longitude: new_longitude,
                                                cd: new Date()
                                            }

                                            db.collection('userhistory').insertOne(location_history_data, function (err, inserted_id) { });

                                            res.status(200).json({ status: true, message: 'Registration succesfully', userdata: alldata });
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

                        res.status(200).json({ status: false, message: 'Login Successfully', userdata: getuser });
                        return;
                    }

                });

                break;

            default:

                res.status(200).json({ status: false, message: 'Something want to wrong' });
                return;

        }

    }
}
