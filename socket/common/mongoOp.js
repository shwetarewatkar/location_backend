const CryptoJS = require("crypto-js");

module.exports = {
  getUsersStartkv: (uid, gid, Cb) =>{
    logger("[getUserStartKV] uid ,gid",uid, gid);
    db.collection("member_start_kv")
    .find({ uid: uid.toString(), gid: gid.toString() })
      .toArray((err, DbResp) => {
        if (err) throw err;
        logger("[GETUSER startKv ]", DbResp[0]);
        Cb(DbResp[0].startKv);
      });
  },

  GetUserByInvite: (invite, Cb) => {
    db.collection("userdetails")
      .find({ invitecode: invite })
      .toArray((err, DbResp) => {
        if (err) throw err;
        Cb(DbResp);
      });
  },
  GetUserByUid: (uid, Cb) => {
    db.collection("userdetails")
      .find({ uid: uid })
      .toArray((err, DbResp) => {
        if (err) throw err;
        Cb(DbResp);
      });
  },

  GetUserById: (Members, groupId, Cb) => {
    
    db.collection("latest_location").aggregate([
      // Join with user_info table
        {
          $lookup:{
              from: "userdetails",       // other table name
              localField: "uid",   // name of users table field
              foreignField: "uid", // name of userinfo table field
              as: "userdetails"         // alias for userinfo table
          }
        },
        {   $unwind:"$userdetails" },     // $unwind used for getting data in object or for one record only

        {
          $match:{
            $and:
              [{$or: Members},
              {gid: groupId.toString()}],
              // {$gte: {latest_kv: $members_startkv.kv} }
          }
        },

        // define which fields are you want to fetch
        {   
          $project:{
              uid : 1,
              username : '$userdetails.username',
              email: '$userdetails.email',
              profile: '$userdetails.profile',
              gid: 1,
              latitude: 1,
              longitude: 1,
              latest_kv: 1
          } 
        }

    ]).toArray((err, DbResp) => {
      logger("--------->> DBresp <<-----",DbResp);
      Cb(DbResp);  
    });
  },

  CheckUserExsists: (UserId, Cb) => {
    db.collection("userdetails")
      .find({ uid: UserId })
      .toArray((err, DbResp) => {
        console.log("CheckUserExsists DBResp",DbResp);

        if (DbResp.length == 1) {
          Cb(true);
        } else {
          Cb(false);
        }
      });
  },

  EmailExsists: (UserEmail, Cb) => {
    db.collection("userdetails")
      .find({ email: UserEmail })
      .toArray((err, DbResp) => {
        // console.log(DbResp.length);

        DbResp.length == 1 ? Cb(true) : Cb(false);
      });
  },

  BroadcastMemberList: (UserId, Cb) => {

    console.log("user id:- ", UserId);

    db.collection("groups")
      .find({
        members: { $in: [UserId] }
      })
      .project({ _id: 1, uid: 1, groupname: 1 })
      .toArray((err, temp) => {

        console.log("temp data:- ", temp);

        // console.log(DbResp);
        let uid = [];
        let group = [];
        DbResp = temp.map(elem => {
          console.log("element:- ", elem.uid);
          if (uid.includes(elem.uid) == false) {
            uid.push(elem.uid);
            console.log("inside if:- ", uid);
            let tmp = {};
            tmp[elem.groupname] = elem._id;
            group.push(tmp);
            return {
              uid: elem.uid
            };
          }
        });

        DbResp = __.compact(DbResp);
        console.log("dbresp: ", DbResp);

        // var tamp_resp = [{uid:"O7csU9a4BmhIs6FGtcR8qFvUXUC2"},{uid:"Hgl7ErGFYnMGUf621KAnTZjkzgi2"}];
        db.collection("userdetails").distinct(
          "socket_id",
          { $or: DbResp, socket_id: { $ne: "" } },
          (err, DbRespsocket) => {

            db.collection("latest_location").find({})
            console.log("db response:- ", DbRespsocket);

            Cb(DbRespsocket);

          }
        );
      });
  },

  SocketDisconnect: (Socket_id, Socket_Uid, Cb) => {
    // console.log("Socket Disconnected", Socket_id);
    // console.log(
    //   "%%%%%%%%%%%%%%%%%%%%%%%%%% trying to delete socket id  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"
    // );
    console.log({ $and: [{ socket_id: Socket_id }, { uid: Socket_Uid }] });

    db.collection("userdetails").findOneAndUpdate(
      { $and: [{ socket_id: Socket_id }, { uid: Socket_Uid }] },
      { $set: { socket_id: "" } },
      (err, DbResp) => {
        if (err) throw err;
        // console.log(DbResp);
        Cb(DbResp);
      }
    );
  },

  SocketDisconnect_err: (Socket_id, Cb) => {
    // console.log("Socket Disconnected", Socket_id);
    // console.log(
    //   "%%%%%%%%%%%%%%%%%%%%%%%%%% trying to delete socket id  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"
    // );
    // console.log({ socket_id: Socket_id });

    db.collection("userdetails").findOneAndUpdate(
      { socket_id: Socket_id },
      { $set: { socket_id: "" } },
      (err, DbResp) => {
        if (err) throw err;
        console.log(DbResp);
        Cb(DbResp);
      }
    );
  },

  GroupinfoLocation: (userid, latitude, longitude) => {
    logger("-----------GroupinfoLocation data", data);
    db.collection("groupsinfo")
      .find({
        uid: userid
      })
      .toArray(function (err, checkExistanceInfo) {
        if (err)
          console.log("Error in find location query before insert ", err);
        else {

          console.log("latitude latitude:- ", latitude);
          console.log("latitude longitude:- ", longitude);

          var bytes_lat = CryptoJS.AES.decrypt(latitude, 'Location-Sharing');
          var lat = JSON.parse(bytes_lat.toString(CryptoJS.enc.Utf8));

          var bytes_long = CryptoJS.AES.decrypt(longitude, 'Location-Sharing');
          var long = JSON.parse(bytes_long.toString(CryptoJS.enc.Utf8));

          console.log("latitude length:- ", latitude.length);

          console.log("checkExistanceInfo here", checkExistanceInfo);

          if (latitude.length != 0) {
            checkExistanceInfo.forEach((elm, i) => {

              let decryptedData_lat = elm.latitude;
              var bytes_lat = CryptoJS.AES.decrypt(decryptedData_lat.toString(), elm.gid);
              var get_lat = JSON.parse(bytes_lat.toString(CryptoJS.enc.Utf8));

              let decryptedData_long = elm.longitude;
              var bytes_long = CryptoJS.AES.decrypt(decryptedData_long.toString(), elm.gid);
              var get_long = JSON.parse(bytes_long.toString(CryptoJS.enc.Utf8));


              console.log("new lat:- " + lat.length, lat);
              console.log("old lat:- ", get_lat);

              console.log("new long:- " + long.length, long);
              console.log("old long:- ", get_long);

              if (lat.length != 0) {
                if (lat != get_lat && long != get_long) {

                  

                  var latitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(lat), elm.gid);
                  var new_latitude = latitude_ciphertext.toString();

                  var longitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(long), elm.gid);
                  var new_longitude = longitude_ciphertext.toString();

                  var updata = {
                    latitude: new_latitude,
                    longitude: new_longitude,
                  }

                  console.log("update data:- ", updata);

                  db.collection('groupsinfo').findOneAndUpdate({ _id: ObjectId(elm._id.toString()) }, { $set: updata }, function (err, resp) {
                    if (err) {
                      console.log("groupsinfo is not updated");
                    } else {
                      console.log("groupsinfo update succesfully");
                    }
                  });


                  var location_history_data = {
                    uid: userid,
                    gid: elm.gid,
                    latitude: new_latitude,
                    longitude: new_longitude,
                    cd: new Date()
                  }

                  db.collection('userhistory').insertOne(location_history_data, function (err, inserted_id) { });


                } else {
                  console.log("not update");
                }
              } else {
                console.log("new latitude and longitude is wrong");
              }

            });
          } else {
            console.log("latitude latitude:- ", latitude);
          }

          // let decryptedData_lat = checkExistanceInfo[0].latitude;
          // var bytes_lat = CryptoJS.AES.decrypt(decryptedData_lat.toString(), checkExistanceInfo[0].gid);
          // var get_lat = JSON.parse(bytes_lat.toString(CryptoJS.enc.Utf8));

          // let decryptedData_long = checkExistanceInfo[0].longitude;
          // var bytes_long = CryptoJS.AES.decrypt(decryptedData_long.toString(), checkExistanceInfo[0].gid);
          // var get_long = JSON.parse(bytes_long.toString(CryptoJS.enc.Utf8));

          // if (value.plain_lat != get_lat && value.plain_long != get_long) {


          //   var latitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(value.plain_lat), checkExistanceInfo[0].gid);
          //   var new_latitude = latitude_ciphertext.toString();

          //   var longitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(value.plain_long), checkExistanceInfo[0].gid);
          //   var new_longitude = longitude_ciphertext.toString();

          //   var updata = {
          //     latitude: new_latitude,
          //     longitude: new_longitude,
          //   }

          //   console.log("update data:- ", updata);

          //   db.collection('groupsinfo').findOneAndUpdate({ uid: value.uid }, { $set: updata }, { multi: true }, function (err, resp) {
          //     if (err) {
          //       console.log("groupsinfo is not updated");
          //     } else {
          //       console.log("groupsinfo update succesfully");
          //     }
          //   });

          // }
        }
      });
  }

};
