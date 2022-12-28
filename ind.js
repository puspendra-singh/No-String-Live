function g(r){
    const digits=[1,2,3,4,5,6,7,8,9];
    const digits2=[0,1,2,3,4,5,6,7,8,9];
    let otp="";
    return new Promise((resolve,reject)=>{
        if(r>=4){
            for(let i=0;i<r;i++){
                if(i==0){
                    let ra=(Math.floor(Math.random()*9));
                    otp+=digits[ra];
                }else{
                    let ra=(Math.floor(Math.random()*10));
                    otp+=digits2[ra];
                    if(i==r-1){
                        resolve(Number(otp));
                    }
                }
            }
        }else{
            reject({
                error:"OTP must have at least 4 digits"
            })
        }
    });
}


const { MongoClient, ObjectId } = require('mongodb');
function getDatabase(){
    return new Promise((resolve)=>{
        MongoClient.connect("mongodb://localhost:27017/prac11", function (
            err,
            connection
          ) {
            if(!err){
                resolve(connection);
                console.log('connected');
            }
          });
    })
}
// getDatabase().then((mydb)=>{
//     insertCoun(mydb);
// })
// const data = require('./data.json')

function insertCoun(mydb){
    const collection = mydb.db().collection('masters');
    data.Countries.forEach((country)=>{
        let countryId = ObjectId();
        collection.insertOne({
            key:'country',
            country_id:countryId,
            name:country.CountryName
        })
        let stateId = ObjectId();
        country.States.forEach((state)=>{
            collection.insertOne({
                key:'state',
                country_id:countryId,
                state_id:stateId,
                name:state.StateName
            })
            state.Cities.forEach((city)=>{
                collection.insertOne({
                    key:'city',
                    country_id:countryId,
                    state_id:stateId,
                    name:city
                })
            })
        })
    })
}

var arr1 = [8,6,5,9,6,4,2,8,4,5,3,6,8,1,3];

function getLastIndex(value,index){
    for(let i =0 ; i<index-1; i++){
        arr1= arr1.slice(0,arr1.lastIndexOf(value))
    }
    console.log(arr1.lastIndexOf(value));
}

// getLastIndex(6,2);



// const abdd = {
//     "ddd.cc":"kkkkk"
// }
// let addd=JSON.stringify(abdd)
// let addd2=JSON.parse(addd)
// console.log(addd2)
// console.log(addd['ddd.cc'])
// console.log(addd2['ddd.cc'])



// function one(){
//     return new Promise((resolve)=>{
//         setTimeout(() => {
//             resolve({one:true})
//         }, 2000);
//     })
// }
// const two = new Promise((resolve)=>{
//     setTimeout(() => {
//         resolve({two:false})
//     }, 2000);
// })
// const three = new Promise((resolve)=>{
//     setTimeout(() => {
//         resolve({three:true})
//     }, 2000);
// })
// // one.then((data)=>{
// //         console.log(data)
// //     })
// Promise.all([one()]).then((data)=>{
//     console.log(data)
// })