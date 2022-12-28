const { ObjectId } = require("mongodb");
var socketConnection = null;
 module.exports = {
    sendNotification:function(data,socketData){
      sendClientNotification(data,socketData);
    },
    getSocket:()=>{
      return socketConnection;
    },
    AppSocket: (io) => {
     /** Manage chat request */
     let roomJoinedUsers=[];
     io.on('connection', client => {
      socketConnection = client;
       client.on('chat_notifications',function(data){
        const joinedUserIndex = roomJoinedUsers.indexOf(data.receiver_id);
        if(joinedUserIndex == -1){
          const notification = db.collection('notifications');
          let insertData = {
            user_id : ObjectId(data.receiver_id),
            message : data.notification_message,
            is_readonly : NOT_READ_ONLY,
            go_to : data.notification_path,
            params : data.params,
            is_seen : NOT_SEEN,
            is_read : NOT_READ,
            role: ROLE_ID_USER,
            created : getUtcDate(),
            is_deleted : NOT_DELETED,
            modified: getUtcDate()
          };
          notification.insertOne(
            insertData,
            (error,result)=>{
              if(!error){
                const notificationData = {
                  is_read :  NOT_READ,
                  is_readonly : NOT_READ_ONLY,
                  params : insertData.params,
                  go_to : insertData.go_to,
                  message : insertData.message,
                  created : insertData.created,
                  receiver_id : insertData.user_id
                }
                client.broadcast.emit('chat_notifications', notificationData);
              }
            }
          );
        }
       })

       client.on('notification',(data)=>{
        sendClientNotification(data,client);
       })


        /*** Join room */
        client.on('join_room', function(data){
          if (data){
            client.join(data.conversation_id);
            const joinedUserIndex = roomJoinedUsers.indexOf(data.sender_id);
            if(joinedUserIndex == -1){
              roomJoinedUsers.push(data.sender_id);
            }
          }
        });
        
        /*** Join get notification count */
        client.on('get_notification_count', userId => {
          if (userId) {
            const collection = db.collection("notifications");
            collection.countDocuments({ user_id: ObjectId(userId), is_seen: NOT_SEEN }, {}, (err, result) => {
              client.emit('notification_count', { result: result });
            })
          }
        });

        /*** Join get notification count */
        client.on('user_joined', (data) => {
          if (data) {
            client.broadcast.emit('user_joined',data);
          }
        });

        /*** Emit data  */
        client.on('send_message', data => {
          let senderId = (data.sender_id) ? ObjectId(data.sender_id) : '';
          let receiverId = (data.receiver_id) ? ObjectId(data.receiver_id) : '';
          let productId = (data.product_id) ? ObjectId(data.product_id) : '';
          let message = (data.message) ? data.message : '';
          let messageId = (data.message_id) ? ObjectId(data.message_id) : '';
          let messageType = (data.type) ? data.type : '';
          let productQuantity = Number(data.ordered_product_quantity);
          let __id = ObjectId();
          let action = NOT;
          let conversationId = (data.conversation_id) ? ObjectId(data.conversation_id) : '';
          
          if(senderId && receiverId && productId && conversationId && messageType && message){
            let insertData = {
              _id:__id,
              conversation_id: conversationId,
              sender_id  : senderId,
              receiver_id : receiverId,
              product_id : productId,
              message : message,
              type : messageType,
              action: action,
              ordered_product_quantity : productQuantity,
              is_seen : NOT_SEEN,
              created : getUtcDate(),
              is_active: ACTIVE,
              is_deleted: NOT_DELETED,
            }
            const messages = db.collection("messages");
            messages.insertOne(insertData,function(messageError,messageResult){
              let messageData = {
                _id:__id,
                ...data,
                action: action,
                created: insertData.created
              }
              if(!messageError){
                io.in(data.conversation_id).emit('last_message', messageData);
                client.broadcast.emit('update_recent_chat', {receiver_id:insertData.receiver_id});
              }
              // if(action==0){
              //   if(!messageError){
              //     io.in(data.conversation_id).emit('last_message', messageData);
              //     client.broadcast.emit('update_recent_chat', {receiver_id:insertData.receiver_id});
              //   }
              // }else{
              //   messages.updateOne(
              //     {_id:messageId},
              //     {
              //       $set:{
              //         action : action
              //       }
              //     },
              //     (err,res)=>{
              //       if(!err){
              //         io.in(data.conversation_id).emit('last_message', messageData);
              //         client.broadcast.emit('update_recent_chat', {receiver_id:insertData.receiver_id});
              //       }
              //     }
              //   )
              // }
            })
          }
        });

        /*** leave room  */
        client.on('leave_room', data => {
          client.leave(data.conversation_id);
          const leavedUserIndex = roomJoinedUsers.indexOf(data.sender_id);
          if(leavedUserIndex !== -1){
            roomJoinedUsers.splice(leavedUserIndex,1);
          }
        });
        client.on('go_offline',(data)=>{
          client.broadcast.emit('go_offline',data);
        })
        /*** Emit data  */
        client.on('get_all_messages', data => {
          let activePage = (data.skip) ? data.skip : NOT;
          let conversationId = (data.conversation_id) ? data.conversation_id : '';
          skip = activePage * DEFAULT_API_LIMIT - DEFAULT_API_SKIP;
          const collection = db.collection("user_chats");
          const async = require("async");
          async.parallel(
            {
              list: (callback) => {
                collection.aggregate([
                  { $match: { conversation_id: ObjectId(conversationId) } },
                  { $unwind: '$messages' },
                  {
                    $project: {
                      conversation_id: 1,
                      sender_id: '$messages.sender_id',
                      is_read: '$messages.is_read',
                      message: '$messages.message',
                      message_id: '$messages.message_id',
                      created_at: '$messages.created_at'
                    }
                  },
                  { $sort: { 'created_at': -1 } },
                  { $skip: skip },
                  { $limit: DEFAULT_API_LIMIT },
                  { $sort: { 'created_at': 1 } },
                ]).toArray((error, result) => {
                  callback(error, result);
                })
              },
              recordsTotol: (callback) => {
                collection.findOne({ conversation_id: ObjectId(conversationId) }, { projection: { messages: 1 } }, (err, result) => {
                  let recordTotal = (!err && result && result.messages) ? result.messages.length : NOT
                  callback(err, recordTotal);
                });
              }
            }, (err, response) => {
              let records = (response.list) ? response.list : [];
              let records_total = (response.recordsTotol) ? response.recordsTotol : NOT;
              io.in(conversationId).emit('get_message', { records: records, records_total: records_total });
            }
          )
        });

        client.on('notify_superadmin',(data)=>{
          db.collection('users').findOne({role_id:ROLE_ID_ADMIN},(error,result)=>{
            if(!error){
              const superAdminId = result._id ? result._id : "";
              const message = data.type ? ADMIN_NOTIFICATION[data.type]['message'] : "";
              const isReadonly = data.is_readonly ? data.is_readonly : "";
              const goTo = data.go_to ? data.go_to : "";
              const params = data.params ? data.params : "";
              const title = data.type ? ADMIN_NOTIFICATION[data.type]['title'] : "";
              if(superAdminId && message && title){
                const formateData = new Promise((resolve)=>{
                  let notification = {
                    user_id: superAdminId,
                    title:title,
                    message: message,
                    is_readonly: isReadonly,
                    is_seen: NOT_SEEN,
                    is_read: NOT_READ,
                    is_deleted : NOT_DELETED,
                    go_to: goTo,
                    role: ROLE_ID_ADMIN,
                    params: params,
                    created: getUtcDate(),
                    modified:getUtcDate()
                  };
                  resolve(notification);
                });
              formateData.then((notification)=>{
                const notificationCollection  = db.collection('notifications');
                notificationCollection.insertOne(
                  notification,
                  (err,resultInsert)=>{
                    if(!err){
                      client.broadcast.emit('notify_superadmin',notification);
                    }
                  }
                );
              });
              }
            }
          });
        });
      });
   },
 };
 
function sendClientNotification(data, socketData) {
  const userId = data.user_id ? getObjectIdArray(data.user_id) : "";
  const message = data.message ? data.message : "";
  const isReadonly = data.is_readonly;
  const go_to = data.go_to ? data.go_to : "";
  const params = data.params ? data.params : "";
  if (data && userId.length > 0) {
    checkEmailNotifications(userId,message).then(()=>{
      const notificationCollection = db.collection('notifications');
      const formateData = new Promise((resolve) => {
        let notifications = [];
        userId.forEach((item, i) => {
          notifications.push({
            user_id: item,
            message: message,
            is_readonly: isReadonly,
            is_seen: NOT_SEEN,
            is_read: NOT_READ,
            go_to: go_to,
            role: ROLE_ID_USER,
            params: params,
            created: getUtcDate(),
            is_deleted: NOT_DELETED,
            modified: getUtcDate()
          });
          if (i == (userId.length - 1)) {
            resolve(notifications);
          }
        });
      });
      formateData.then((notifications) => {
        notificationCollection.insertMany(
          notifications,
          (err, result) => {
            if (!err) {
              socketData.broadcast.emit('notification', data);
            }
          }
        );
      });
    })
  }
}

function checkEmailNotifications(userIdArray,message){
  return new Promise((resolve)=>{
    const users = db.collection('users');
    const idLength = userIdArray.length;
    let i = 0;
    function recursiveLoop(){
      users.findOne({_id:userIdArray[i]},{projection:{email_notifications:1,email:1,full_name:1}},(err,result)=>{
        if(!err && result){
          let action = "user_notifications";
          let subject = "Asic mango notification";
          let fullName = result.full_name;
          if(result.email_notifications === ACTIVE){
            let emailOptions = {
              to: result.email,
              rep_array: [fullName,message],
              action: action,
              subject: subject,
            };
            /** Send Email */
            sendEmail(null, null, emailOptions);
            if(i >= (idLength - 1)){
              resolve();
            }else{
              i++;
              recursiveLoop();
            }
          }else{
            resolve();
          }
        }else{
          resolve();
        }
      })
    }
    recursiveLoop();
  })
}