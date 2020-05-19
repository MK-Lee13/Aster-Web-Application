var express = require('express');
var fs = require('fs');
var http = require('http');
var bodyParser = require("body-parser");
var path = require("path");
var mysql = require('mysql');
var multer = require("multer");
var session = require('express-session');
var multipart = require('connect-multiparty');
var multiparty = require('multiparty');
var ba64 = require("ba64")
const crypto = require('crypto'); // 암호화를 위해서 사용
var app = express();
var multipartMiddleware = multipart();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended : false }));
let upload = multer({
  dest: "upload/"
})

//////////세션유지/////////////
app.use(session({
    secret : "1q2w3e4r", // 이 값을 이용해 암호화옵션
    resave : false, // 세션이 수정되지 않아도 항상 저장할지 확인하는 옵션
    saveUninitialized : true, // 세션이 uninitalized 상태로 미리 만들어서 저장하는지 묻는 옵션
    cookie : { // 쿠키에 들어가는 세션 ID값의 옵션
        maxAge : 1000 * 60 * 30 // 30분후 폭파
    }
}));
///////////////////////////////////////////

var connection = mysql.createConnection({
  host: "localhost", // 우리집 와이파이 localhost
  port: 3306,
  user: "user",
  password: "6486",
  database: "web_db" // 로그인용 DB
})

connection.on('error', function(err) {
  console.log("[mysql error]",err);
});


////////매인페이지/////////////(로그인전)
app.get('/in', (req, res) => { // 매인 라우터
  if(req.session.author!=undefined){
    res.redirect("/main")
  }else{
    fs.readFile('./public/pages/basic-grid.html',((err,data) =>{ /// 나중에 매인페이지 올림
      if(err)console.log(err);
      else{
        console.log("Connected(MainPage)!!");
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data);
      }
    }))
  }
});

app.get('/in/:field', (req, res) => { // 매인 라우터
  console.log(req.session);
  var field = req.params.field;
  if(req.session.author!=undefined){
    res.redirect("/main")
  }else{
    fs.readFile('./public/pages/'+field+'.html',((err,data) =>{ /// 나중에 매인페이지 올림
      if(err)console.log(err);
      else{
        console.log("Connected(MainPage)!!");
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data);
      }
    }))
  }
});
///////////////////////

/////매인페이지///////(로그인후)
app.get('/main', (req, res) => { // 매인 라우터
  console.log(req.session);
  if(req.session.author==undefined){
    res.redirect("/login")
  }else{
    fs.readFile('./public/pages/main.html',((err,data) =>{ /// 나중에 매인페이지 올림
      if(err)console.log(err);
      else{
        console.log("Connected(MainPage)!!");
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data);
      }
    }))
  }
});

app.get('/main/:field', (req, res) => { // 매인 라우터
  console.log(req.session);
  var field = req.params.field;
  if(field.indexOf("upload") != -1) {
    if(req.session.author != 0){
      res.redirect("/main")
    }else{
      fs.readFile('./public/pages/'+field+'.html',((err,data) =>{ /// 나중에 매인페이지 올림
        if(err)console.log(err);
        else{
          console.log("Connected(MainPage)!!");
          res.writeHead(200,{'Content-Type':'text/html'});
          res.end(data);
        }
      }))
    }
  }
  else if(req.session.author==undefined){
    res.redirect("/login")
  }else{
    fs.readFile('./public/pages/'+field+'.html',((err,data) =>{ /// 나중에 매인페이지 올림
      if(err)console.log(err);
      else{
        console.log("Connected(MainPage)!!");
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data);
      }
    }))
  }
});
///////////////////////////////

////////회원가입////////
app.post('/main/checkin/register', (req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  //////파라미터로 디비에 저장할 정보들 보내면 됌
  var id = req.param("id");
	var pw = req.param("pw");
  var mail = req.param("mail");
  id = crypto.createHash('sha512').update(id).digest('base64');
  pw = crypto.createHash('sha512').update(pw).digest('base64');
  console.log(id+pw+mail);
  console.log(id+ "\n" +pw);
  connection.query("INSERT INTO userdata (id,pw,email,auth) VALUES ('"+id+"', '"+pw+"', '"+mail+"',1)",(err,result,fields)=>{
    if(err){
      //res.send(0);
    }else{
      console.log("user 삽입성공");
      res.send("/login");
    }
  })
});
//////////////////////


////////로그인페이지////////
app.get('/login', (req, res) => {// login 라우터
  console.log(req.session.author);
  if(req.session.author!=undefined){
    res.redirect("/main")
  }else{
    fs.readFile('./public/pages/login2.html',((err,data) =>{
      if(err)console.log(err);
      else{
        console.log("Connected(LoginPage)!!");
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(data);
      }
    }))
  }
});
///////////////////////////
//////로그인 확인///////////
app.post('/main/login/check', (req, res) => { // 확인
  console.log("checking id/pw");
  console.log(req.session.author);
  //////나중에 디비 접속 및 해야지 그런거
  // 디비 작성란
  ////////
  var id = req.param("id");
	var pw = req.param("pw");
  id = crypto.createHash('sha512').update(id).digest('base64');
  pw = crypto.createHash('sha512').update(pw).digest('base64');
  console.log(id+ "\n" +pw);
  /// 디비에 있는 정보인지 확인하고 파라미터 보냄
  connection.query(`SELECT * FROM userdata WHERE id = '${id}' AND pw = '${pw}'`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        console.log("faile");
        res.send('0');
      }else{
        console.log("success");
        console.log(result[0]);
        req.session.author = result[0].auth
        res.send("/main");
      }
    }
  })
});
///////////////////

/////////////////로그아웃///////////
app.get('/logout', (req, res) => {// login 라우터
  console.log(req.session.author);
  req.session.destroy(function(){
    req.session;
  });
  res.redirect("/in");
});
///////////////////////////////

/////////테이블 값 전송받기/////////////
app.post('/upload/repost',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  var title = req.param("title");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+uidx);
  var idx;
  connection.query("INSERT INTO repost (title,uidx) VALUES ('"+title+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("0");
    }else{
      res.send("1");
    }
  })
});

app.post('/upload/video',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM video ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO video (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/video/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});

app.post('/upload/data4',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  //////파라미터로 디비에 저장할 정보들 보내면 됌
  //console.log(req.query);

  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM data4 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO data4 (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/data4/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});

app.post('/upload/data3',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  //////파라미터로 디비에 저장할 정보들 보내면 됌
  //console.log(req.query);

  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM data3 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO data3 (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/data3/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});

app.post('/upload/data2',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM data2 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO data2 (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/data2/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});

app.post('/upload/data1',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM data1 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO data1 (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/data1/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});

app.post('/upload/table3',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  //////파라미터로 디비에 저장할 정보들 보내면 됌
  //console.log(req.query);

  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM datatablen3 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO datatablen3 (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/Files3/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});

app.post('/upload/table2',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  //////파라미터로 디비에 저장할 정보들 보내면 됌
  //console.log(req.query);

  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM datatablen2 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO datatablen2 (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/Files2/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});

app.post('/upload/table1',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  //////파라미터로 디비에 저장할 정보들 보내면 됌
  //console.log(req.query);

  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM datatablen1 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO datatablen1 (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/Files1/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});


app.post('/upload/table',multipartMiddleware ,(req, res) => { // 회원가입 정보 받음
  console.log("Regist Complete");
  //////파라미터로 디비에 저장할 정보들 보내면 됌
  //console.log(req.query);

  var files = req.files.files;
  console.log(files);
  var title = req.param("title");
	var desc = req.param("desc");
  var uidx = req.param("uidx");
  //var files = req.param("files");
  console.log(title+desc+uidx);
  var idx;
  connection.query('SELECT * FROM datatable1 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        //console.log(result);
        idx= result[0].idx + 1;
      }
    }
  })
  connection.query("INSERT INTO datatable1 (title,description,uidx) VALUES ('"+title+"', '"+desc+"', '"+uidx+"')",(err,result,fields)=>{
    if(err){
      res.send("error");
    }
    var dirname = "./public/Files/"+idx
    fs.mkdir(dirname, 0666, function(err){
      if(err){
        res.send("error")}
      });
    //var files = req.files;
    dirname += "/";
    console.log(files);
    if (files != undefined){
      var result = {
        originalFileName : files.originalFilename,
        size : files.size,
      };
      //const base64Data = new Buffer(files, 'base64')
      var file=fs.readFileSync(files.path);
      fs.writeFileSync(dirname+files.originalFilename,file,'base64',(err)=>{
        if(err) throw err;
        console.log("finished");
        console.log(result);
        //res.json(result);
      })
      console.log("finished");
      console.log(result);
      res.send(files);
    }else{
      res.send("1");
    }
  })
});
////////////////////////


/////////테이블 정보 전송////////////

app.get('/table1', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블1");
  connection.query('SELECT * FROM datatable1 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/t1/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블1detial");
  fs.readFile('./public/pages/table1d.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});


app.get('/image/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/Files/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});

/////테이블 상세 정보 전송///////////////////////
app.post('/download/ppa', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/Files/" + num;
  connection.query(`SELECT * FROM datatable1 where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});

////////////1/////////////////
app.get('/tablen1', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블1");
  connection.query('SELECT * FROM datatablen1 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/tt1/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블1detial");
  fs.readFile('./public/pages/table1n.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});

app.post('/download/ppa1', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/Files1/" + num;
  connection.query(`SELECT * FROM datatablen1 where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});
/////////////////////////////
//////////2/////////////////
app.get('/tablen2', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블2");
  connection.query('SELECT * FROM datatablen2 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/tt2/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블2detial");
  fs.readFile('./public/pages/table2n.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});

app.post('/download/ppa2', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/Files2/" + num;
  connection.query(`SELECT * FROM datatablen2 where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});
///////////////////////////

//////////3///////////////////
app.get('/tablen3', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블3");
  connection.query('SELECT * FROM datatablen3 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/tt3/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블3detial");
  fs.readFile('./public/pages/table3n.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});

app.post('/download/ppa3', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/Files3/" + num;
  connection.query(`SELECT * FROM datatablen3 where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});
////////////////////////
/////자료실////////////////
app.get('/data1', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블1");
  connection.query('SELECT * FROM data1 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/d1/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블1detial");
  fs.readFile('./public/pages/tabled1.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});

app.post('/download/data1', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/data1/" + num;
  connection.query(`SELECT * FROM data1 where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});

app.get('/data2', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블2");
  connection.query('SELECT * FROM data2 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/d2/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블2detial");
  fs.readFile('./public/pages/tabled2.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});

app.post('/download/data2', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/data2/" + num;
  connection.query(`SELECT * FROM data2 where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});

app.get('/data3', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블3");
  connection.query('SELECT * FROM data3 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/d3/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블3detial");
  fs.readFile('./public/pages/tabled3.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});

app.post('/download/data3', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/data3/" + num;
  connection.query(`SELECT * FROM data3 where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});

app.get('/data4', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블4");
  connection.query('SELECT * FROM data4 ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/d4/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("테이블4detial");
  fs.readFile('./public/pages/tabled4.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});

app.post('/download/data4', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/data4/" + num;
  connection.query(`SELECT * FROM data4 where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});
////////////////////////////////////////


////////////////////////////
///////칭찬건의////////////
app.get('/repost', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("칭찬");
  connection.query('SELECT * FROM repost ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

/////////////////////////
////비디오////////////
app.get('/video', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("video");
  connection.query('SELECT * FROM video ORDER BY idx DESC',(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        res.send(result);
      }
    }
  })
});

app.get('/vid/:para', (req, res) => { // 테이블 전체 정보를 줍니다
  console.log("videodetial");
  fs.readFile('./public/pages/vid.html',((err,data) =>{
    if(err)console.log(err);
    else{
      res.writeHead(200,{'Content-Type':'text/html'});
      res.end(data);
    }
  }))
});
///////이미지 url////////
app.get('/image1/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/Files1/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});

app.get('/image2/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/Files2/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});

app.get('/image3/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/Files3/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});
/////////////////.///////


///////파일 url/////
app.get('/video/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/video/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});

app.get('/data1/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/data1/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});

app.get('/data2/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/data2/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});

app.get('/data3/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/data3/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});

app.get('/data4/url/:idx/:file', (req, res) => { //이미지를 줍니다
  var num = req.params.idx;
  var filename = req.params.file
  var dirname = "./public/data4/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});
////////////
app.post('/download/video', (req, res) => { // 테이블 상세정보
  var num = req.param("num");
  var dirname = "./public/video/" + num;
  connection.query(`SELECT * FROM video where idx = ${parseInt(num)}`,(err,result,fields)=>{
    if(err)res.send("err: " + err);
    else{
      if(result[0]==null){
        res.send("error");
      }else{
        console.log(result);
        fs.readdir(dirname, function(error, filelist){
          console.log(filelist);
          var data = new Object();
          data.idx = result[0].idx;
          data.title = result[0].title;
          data.description = result[0].description;
          data.uidx = result[0].uidx;
          data.datetime = result[0].datetime;
          if(filelist == null) {
            data.filelist = "0";
            res.send(data);
          } else {
            data.filelist = filelist;
            res.send(data);
          }
        })
      }
    }
  })
});
/////////////////////
app.post('/download/url', (req, res) => { // 회원가입 정보 받음
  var num = req.param("num");
  var filename = req.param("fn");
  var dirname = "./public/Files/" + num + "/" + filename;
  var file = fs.readFileSync(dirname, 'binary');
  res.setHeader('Content-Length', file.length);
  res.write(file, 'binary');
  res.end();
});

app.post('/download/list', (req, res) => { // 회원가입 정보 받음
  var num = req.param("num");
  var dirname = "./public/Files/" + num;
  fs.readdir(dirname, function(error, filelist){
    console.log(filelist);
    res.send(filelist);
  })
});

var server = http.createServer(app).listen(8080,function(){
   console.log("웹 서버 실행 : "+ "8080");
});
