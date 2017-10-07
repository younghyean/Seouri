const express = require('express');
const aws = require('aws-sdk');
const router = express.Router();
const pool = require('../config/db_pool.js');
const s3 = new aws.S3();
const multer = require('multer');
const multerS3 = require('multer-s3');
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'seouri',
    acl: 'public-read', //이미지 읽기만 허용
    key: function(req, file, cb){
      cb(null, Date.now() + '.' + file.originalname.split('.').pop());
    }
  })
});

//회원가입 (카카오톡 토큰(id 로 사용), 회원정보 받기) (name, userId, profile)
router.post('/', upload.single('profile'), async(req, res) => {
  try{
    if(!(req.body.name && req.body.userId)){
      res.status(403).send({ message: 'please input all of name, userId.'});
    }else{
      var profileUrl = null;
      if(req.file) profileUrl = req.file.location;

      var connection = await pool.getConnection();
      let query = 'insert into user set ?';
      let record = {
        "userId" : req.body.userId,
        "name" : req.body.name,
        "profile" : profileUrl
      };

      await connection.query(query, record);
      res.status(200).send({
        "message" : "Succeed in inserting memberInfo."
      });
    }
  }catch(err){
    console.log("server err : " + err);
    res.status(500).send({ "message" : "syntax error" });
  }finally{
    pool.releaseConnection(connection);
  }
});

//token validation test
router.post('/login', async(req, res) =>{
  try{
    if(!req.body.userId){
      res.status(403).send({ message: 'please input userId(token).'});
    }else{
      var connection = await pool.getConnection();
      let query = 'select * from user where userId=?';
      var userInfo = await connection.query(query, req.body.userId);
      if(!userInfo.length){
        res.status(401).send({ "message" : "userId(token) authorization err"});
      } else{
        res.status(200).send({
          "message" : "Succeed into userId authorization",
          "userInfo" : userInfo[0]
        });
      }
    }
  }catch(err){
    console.log("server err : " + err);
    res.status(500).send({ "message" : "syntax error" });
  }finally{
    pool.releaseConnection(connection);
  }
});

module.exports = router;