const CryptoJS = require("crypto-js");

// Generate random number for invite code
function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

module.exports = {

  CheckUser: (socket, UserData, Cb) => {

    console.log("userdata:- ", UserData);

    // var bytes_lat = CryptoJS.AES.decrypt(UserData.latitude, 'Location-Sharing');
    // var lat = JSON.parse(bytes_lat.toString(CryptoJS.enc.Utf8));
    // var lenoflat = lat.length;

    // console.log("checking:- ", lenoflat);


    let userId = UserData.uid;
    let Socket_id = socket.id;
    socket.uid = userId;


    if (UserData.calloption) {
      console.log("not update");
    } else {
      UserData["socket_id"] = Socket_id;
    }

    // let latitude = UserData.latitude;
    // let longitude = UserData.longitude;

    // common.GroupinfoLocation(userId.toString(), latitude, longitude);

    let Db_query = UserData;
    delete Db_query.uid;
    delete Db_query.email;
    delete Db_query.calloption;

    Db_query = { $set: Db_query };
    let Conditon = { uid: userId };

    db.collection("userdetails").findOneAndUpdate(
      Conditon,
      Db_query,
      (err, DbResp) => {
        if (err) throw err;
        let status = DbResp.lastErrorObject.n;
        let user_info = DbResp.value;
        if (status == 1) {
          delete user_info._id;
          delete user_info.uid;
          logger(
            "__________________user connected to socket____________",
            Db_query,
            "______________________________________________________"
          );

          // if (UserData.status) {

          //   db.collection("user_location")
          //     .find({
          //       uid: userId.toString(),
          //       latitude: UserData.latitude,
          //       longitude: UserData.longitude
          //     })
          //     .toArray(function (e, checkExistance) {
          //       if (e)
          //         console.log("Error in find location query before insert ", e);
          //       else {
          //         // console.log("\nCheckUserExsists ---------", checkExistance);
          //         if (checkExistance.length == 0) {

          //           db.collection("user_location").insertOne(
          //             {
          //               uid: userId.toString(),
          //               latitude: UserData.latitude,
          //               longitude: UserData.longitude,
          //               cd: new Date()
          //             },
          //             function (er, inserted) {
          //               if (er) console.log("error in insertation ", er);
          //               else {
          //                 if (inserted.ops[0]) {
          //                   // console.log("data is inserted successfully");
          //                 }
          //               }
          //             }
          //           );
          //         }
          //       }
          //     });

          // }

          Cb({ user_status: true, user_info: user_info });

          } else {
            logger("__________________userid not matched____________");
            Cb({ user_status: false, user_info: user_info });
          }
        }
      );

      

  },

  GetUserGroups: (socket, Cb) => {
    if (socket.uid) {
      // db.collection("groups")
      //   .find({ uid: socket.uid })
      //   .toArray((err, DbResp) => {
      //     if (err) throw err;
      //     logger("_____________________groups fetched_____________________");
      //     Cb({ groups: DbResp, error: null });
      //   });

      db.collection('groups').find({ members: { $in: [socket.uid.toString()] } }).toArray(function (err, DbResp) {

        if (err) {
          throw err;
        }
        Cb({ groups: DbResp, error: null });

      });

    } else {
      logger("______________________user not loggedin__________________");
      Cb({ error: "user not loggedin" });
    }
  },

  groupKeys:(socket, data, Cb) => {
    console.log("groupKey data",data);

    console.log("groupKeys Socket.uid",socket.uid);
    if(socket.uid){
      let uid = data.uid;
      var bytes_uid = CryptoJS.AES.decrypt(uid.toString(), 'Location-Sharing');
      var userid = JSON.parse(bytes_uid.toString(CryptoJS.enc.Utf8));
      console.log("userid",userid);
      
      UserLogin.GetUserGroups(socket, GroupsData => {
        if (GroupsData.error == null) {
          logger("user_groups", GroupsData.groups);
          
          var groups = GroupsData.groups;
          var g_ids = [];
          
          for(var i=0;i<groups.length;i++){
            var gid = groups[i]._id.toString()
            g_ids.push(gid);
          }
          logger("--gids---",g_ids);

          db.collection("member_start_kv").find({$and: [{ gid: { $in : g_ids }},{uid: userid}]}).toArray(function(err,DbRespa){
            if(err)throw err;
            let groups_kv = []
            let start_kv_arr = []
            DbRespa.forEach(element => {
              // element['kv'] = element.startKv;
              start_kv_arr.push({gid:element.gid, startKv:element.startKv});
              delete element.startKv;
              delete element._id;
              delete element.uid;
              groups_kv.push(element);
            });

            logger("GROUP_KEYS", groups_kv);

            db.collection("groupkey_info").find({
              $or: groups_kv
            }).toArray(function(err,DbRespb){
              if(err){
                throw err;
              }
              let FinalResponse = []
              logger("[groupkeys] DbRespb-----------",DbRespb);
              logger("[groupkeys] DbRespb-----------",start_kv_arr);
              start_kv_arr.forEach(mem_start => {
                DbRespb.forEach(gkeyinfo => {

                  if(mem_start.gid == gkeyinfo.gid && gkeyinfo.kv >= mem_start.startKv){
                    FinalResponse.push(gkeyinfo);
                  }  
                });
              });
              // console.log("\nmembers list ", sendData);
              logger("groupKey-----------",FinalResponse);
              Cb({groups: FinalResponse, error: null});

            })

          })

          // db.collection("groupkey_info").find({
          //   $or: g_ids
          // }).toArray(function(err,DbResp){
          //   if(err){
          //     throw err;
          //   } 
        }

      });


      
    }
    else{
      logger("______________________user not logged in__________________");
      Cb({ error: "user not logged in" });
    }
  },

  AddGroup: (socket, groupInfo, Cb) => {
    let uid = groupInfo.uid;
    let GrpName = groupInfo.GroupName;
    
    if (uid == socket.uid) {
      common.CheckUserExsists(uid, Exsists => {
        if (Exsists == true) {

          var randomno = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

          db.collection("groups").insertOne(
            {
              uid: uid,
              groupname: GrpName,
              default: false,
              members: [uid],
              shareid: randomno,
              latest_kv: 0,
              date: new Date()
            },
            (err, DbResp) => {
              if (err) throw err;

              // var bytes_lat = CryptoJS.AES.decrypt(groupInfo.plain_lat.toString(), 'Location-Sharing');
              // var get_lat = JSON.parse(bytes_lat.toString(CryptoJS.enc.Utf8));

              // var bytes_long = CryptoJS.AES.decrypt(groupInfo.plain_long.toString(), 'Location-Sharing');
              // var get_long = JSON.parse(bytes_long.toString(CryptoJS.enc.Utf8));

              // var group_ciphertext_key = CryptoJS.AES.encrypt(JSON.stringify(DbResp.insertedId), 'Location-Sharing');
              // var group_key = group_ciphertext_key.toString();



              // var latitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(get_lat), group_key);
              // var new_latitude = latitude_ciphertext.toString();

              // var longitude_ciphertext = CryptoJS.AES.encrypt(JSON.stringify(get_long), group_key);
              // var new_longitude = longitude_ciphertext.toString();

              var gid = DbResp.insertedId.toString();

              
              var randomno2 = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
              var groupKey = CryptoJS.AES.encrypt(JSON.stringify(randomno2),'Location-Sharing');
              var encrypted_groupKey = groupKey.toString();

              var groupKeyInfo = {
                uid: uid, // uid of last added/removed  member
                gid: gid,
                gkey: encrypted_groupKey,
                kv: 0
              }

              db.collection('groupkey_info').insertOne(groupKeyInfo, function(err,groupKeyInfo_response){});

              var memberStartKv ={
                uid: uid,
                gid: gid,
                startKv: 0
              }

              db.collection('member_start_kv').insertOne(memberStartKv, function(err,groupKeyInfo_response){});

              UserLogin.GetUserGroups(socket, GroupsData => {
                if (GroupsData.error == null) {
                  logger(
                    "______________________Added to group__________________",
                    GrpName
                  );
                  logger(
                    "+++++++++++++++++++++ Response Sent AddGroup +++++++++++++++++++++"
                  );
                  socket.emit("res", {
                    event: "GroupList",
                    data: GroupsData.groups
                  });
                }
              });
            }
          );
        } else {
          // console.log("=> User Does Not exsists <=");
        }
      });
    }
  },

  RemoveGroup: (socket, groupInfo, Cb) => {
    // console.log("hp040", groupInfo);

    let GrpId = ObjectId(groupInfo.groupId);
    // console.log("sfsdfsdfsf=====>>", GrpId);

    db.collection("groups").deleteOne(
      { $and: [{ _id: GrpId }, { default: false }] },
      (err, DbResp) => {
        if (err) throw err;
        UserLogin.GetUserGroups(socket, GroupsData => {
          if (GroupsData.error == null) {
            logger("______________________group removed__________________");
            logger(
              "+++++++++++++++++++++ Response Sent RemoveGroup +++++++++++++++++++++"
            );
            
            
            

            socket.emit("res", {
              event: "GroupList",
              data: GroupsData.groups
            });
          }
        });
        // Cb();
      }

    );


  },

  AddMember: (socket, GroupInfo, Cb) => {
    let uid = socket.uid;
    if (uid) {
      let GroupId = ObjectId(GroupInfo.GroupId);
      // let InviteCode = parseInt(GroupInfo.InviteCode);
      // let InviteCode = GroupInfo.InviteCode;
  
      // let AddMemberId = uid;

      console.log("[ADD MEMBER] uid: ",uid);
      console.log("[ADD MEMBER] gid: ",GroupId);

      db.collection("groups").updateOne(
        { _id: GroupId },
        { $addToSet: { members: uid }, $inc: { latest_kv: 1 } },
        (err, DbResp) => {
          console.log("groups update",DbResp.result);

          db.collection("groups").find({_id: GroupId}).toArray((err,DbResp)=>{
            if(err)console.log(err);

            console.log("[ADD MEMBER] new group obj ",DbResp[0]);
            var latest_kv = parseInt(DbResp[0].latest_kv);
            var randomno2 = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
            
            var groupKey = CryptoJS.AES.encrypt(JSON.stringify(randomno2),'Location-Sharing');
            var encrypted_groupKey = groupKey.toString();
            
            new_groupkeyinfo = {
              uid: uid,
              gid: GroupInfo.GroupId,
              gkey: encrypted_groupKey,
              kv: latest_kv
            }

            db.collection("groupkey_info").insertOne(new_groupkeyinfo);
            memberStartKv_data = {
              uid: uid,
              gid: GroupInfo.GroupId,
              startKv: latest_kv
            }
            db.collection("member_start_kv").insertOne(memberStartKv_data);
          });
            }); 
            

          logger(
            "______________________member Added to group__________________"
          );
          Cb({ error: null });
        }
    },

  GetGroupMembers: (socket, GroupInfo, Cb) => {
    let uid = GroupInfo.uid;
    let GrpId = ObjectId(GroupInfo.GroupId);
    if (uid == socket.uid) {
      db.collection("groups")
        .find({ _id: GrpId })
        .toArray((err, DbResp) => {
          if (err) throw err;
          console.log("%%%%", DbResp);

          let members = DbResp[0].members.map(Member_id => {
            let temp = { uid: Member_id };
            return temp;
          });
          logger(
            "______________________Members__________________",
            members
          );
          if (members.length > 0) {
            common.GetUserById(members, GrpId, MemberList => {
              

              // remove all member locations with older kv than current users startkv for that group.
              common.getUsersStartkv(uid, GrpId, startkv =>{
                logger(
                  "______________________getStartKv__________________",
                  startkv
                );
                var FinalResult = []
                MemberList.forEach(element => {
                // getUsersStartkv(gid);  
                if(startkv <= element.latest_kv){
                    FinalResult.push(element);
                 }
                });

                var sendData = {
                  MemberList: FinalResult,
                  members: DbResp[0].members
                };
                logger(
                  "______________________Member List__________________",
                  FinalResult
                );

                // console.log("\nmembers list ", sendData);
                Cb(sendData);

              })
              
            });
          }
        });
    }
  },

  RemoveMember: (socket, Member_Info, Cb) => {
    let uid = Member_Info.uid;
    let RmId = Member_Info.RmId;
    if (socket.uid == uid && uid != RmId) {
      let GrpId = ObjectId(Member_Info.GroupId);
      let Conditon = {
        // , { uid: { $ne: uid } }
        $and: [{ _id: GrpId }, { uid: uid }]
      };
      let Db_query = { $pull: { members: RmId }, $inc: {latest_kv: 1} };
      db.collection("groups").findOneAndUpdate(
        Conditon,
        Db_query,
        (err, DbResp) => {
          if (err) throw err;

          logger(
            "______________________Member removed__________________",
            RmId
          );
          
          // kv=+1
            // change Group Key
          new_groupkeyinfo = {
            uid: uid,
            gid: GroupInfo.GroupId,
            gkey: encrypted_groupKey,
            kv: latest_kv
          }

          db.collection("groupkey_info").insertOne(new_groupkeyinfo);
          memberStartKv_data = {
            uid: uid,
            gid: GroupInfo.GroupId
          }
          db.collection("member_start_kv").deleteOne(memberStartKv_data);

          Cb({ data: DbResp, uid: uid, GroupId: Member_Info.GroupId });
        }
      );
    }
  },

  GetPopleList: (socket, UserInfo, Cb) => {
    console.log(UserInfo);

    let uid = UserInfo.uid;
    // socket.uid = uid; //for now only
    if (socket.uid == uid) {
      let Conditon = { $and: [{ uid: uid }, { default: true }] };
      db.collection("groups")
        .find(Conditon)
        .toArray((err, DbResp) => {
          if (err) throw err;
          // console.log("i am here", DbResp);
          if (DbResp.length > 0) {
            let MemberIdList = new Set();
            DbResp.map(Group_info => {
              Group_info.members.map(Member_Id => {
                if (Member_Id != uid) {
                  MemberIdList.add({ uid: Member_Id });
                  //multiple entry error
                }
              });
            });
            // Cb([...MemberIdList]);
            // console.log("list", [...MemberIdList]);
            if ([...MemberIdList].length > 0) {
              common.GetUserById([...MemberIdList], MemberList => {
                logger(
                  "______________________Peoples__________________",
                  MemberList
                );
                Cb(MemberList);
              });
            } else {
              Cb([...MemberIdList]);
            }
            //  else {
            //   Cb({ ERROR: "No Users Found" });
            // }
          }
        });
    }
  },

  RemovePeople: (socket, PeopleInfo, Cb) => {
    let uid = PeopleInfo.uid;
    let RmId = PeopleInfo.RmId;

    if (socket.uid == uid && uid != RmId) {
      db.collection("groups").updateMany(
        { $and: [{ uid: uid }, { default: true }] },
        { $pull: { members: RmId } },
        (err, DbResp) => {
          if (err) throw err;
          logger(
            "______________________People removed__________________",
            RmId
          );
          Cb(DbResp);
        }
      );
    }
  },

  DeleteAccount: (socket, AccountInfo, Cb) => {
    let uid = AccountInfo.uid;

    if (socket.uid == uid) {
      db.collection("groups").updateMany(
        {},
        { $pull: { members: uid } },
        (err, DbResp) => {
          if (err) throw err;
          db.collection("groups").deleteMany({ uid: uid }, (err, DbResp) => {
            if (err) throw err;
            db.collection("userdetails").deleteOne(
              { uid: uid },
              (err, DbResp) => {
                if (err) throw err;
                logger(
                  "______________________user Deleted__________________",
                  uid
                );
                Cb("Deleted");
              }
            );
          });
        }
      );
    }
  },

  AddToDefault: (socket, UserInfo, Cb) => {
    // console.log("user infos", UserInfo);

    let uid = UserInfo.uid;

    if (socket.uid == uid) {
      let InviteCode = UserInfo.InviteCode;
      // let InviteCode = parseInt(UserInfo.InviteCode);
      common.GetUserByInvite(InviteCode, DbResp => {
        if (DbResp.length > 0) {
          let Conditon = [{ uid: socket.uid }, { default: true }];

          let AddMemberId = DbResp[0].uid;
          let DbQuery = { $addToSet: { members: AddMemberId } };
          db.collection("groups").updateOne(
            { $and: Conditon },
            DbQuery,
            (err, DbResp) => {
              // console.log("########## ", DbResp);

              if (err) throw err;
              logger(
                "______________________member Added to Default group__________________"
              );
              if (DbResp.result.nModified == 1) {
                Cb({ message: "added to Default Group", status: true });
              } else if (DbResp.result.nModified == 0) {
                Cb({ message: "User Allready Exsists", status: false });
              }
            }
          );
        } else {
          logger("______________________member not found__________________");
          Cb({ message: "Member Not Found", status: false });
        }
      });
    }
  },

  CheckUserByEmail: (socket, UserEmail, Cb) => {
    common.EmailExsists(UserEmail.email, DbResp => {
      Cb(DbResp);
    });
  }

};
