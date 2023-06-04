require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;

// MongoDB 연결 문자열
const connectionString =
  'mongodb+srv://Cheeky:Cheeky@cluster0.jdswbvy.mongodb.net/Cheeky?retryWrites=true&w=majority';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 세션 설정
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

// MongoDB 연결 함수
const connectMongoDB = async () => {
  const MongoClient = require('mongodb').MongoClient;
  const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// 회원 가입 요청 처리
app.post('/signup', async (req, res) => {
  // 사용자 입력 받기
  const lastname = req.body.lastname;
  const firstname = req.body.firstname;
  const nickname = req.body.nickname;
  const call = req.body.call;
  const username = req.body.username;
  const password = req.body.password;

  try {
    // MongoDB 연결
    const client = await connectMongoDB();
    const db = client.db('Cheeky');
    const collection = db.collection('users');

    // 사용자 데이터 저장
    const result = await collection.insertOne({
      lastname,
      firstname,
      nickname,
      call,
      username,
      password,
    });

    console.log('데이터 저장 성공:', result.insertedId);
    res.status(200).send('가입 완료');

    client.close();
  } catch (err) {
    console.error('데이터 저장 오류:', err);
    res.status(500).send('서버 오류');
  }
});

// 로그인 요청 처리
app.post('/login', async (req, res) => {
  // 사용자 입력 받기
  const username = req.body.username;
  const password = req.body.password;

  try {
    // MongoDB 연결
    const client = await connectMongoDB();
    const db = client.db('Cheeky');
    const collection = db.collection('users');

    // 사용자 데이터 조회
    const user = await collection.findOne({ username, password });

    if (user) {
      // 세션에 사용자 정보 저장
      req.session.user = user;
      // 로그인 성공 후 index.html로 리다이렉트
      res.redirect('/index');
    } else {
      console.log('인증 실패');
      res.status(401).send('인증 실패');
    }
  } catch (err) {
    console.error('데이터 조회 오류:', err);
    res.status(500).send('서버 오류');
  }
});

// 로그아웃 요청 처리
app.post('/logout', (req, res) => {
  // 세션 삭제
  req.session.destroy();

  console.log('로그아웃');
  res.status(200).send('로그아웃 완료');
});

// 홈페이지 라우트
app.get('/index', (req, res) => {
  // 세션에서 사용자 정보 가져오기
  const user = req.session.user;

  if (user) {
    // 로그인 상태인 경우 홈페이지 렌더링
    res.sendFile(__dirname + '/index.html');
  } else {
    // 로그인 상태가 아닌 경우 로그인 페이지로 리다이렉트
    res.redirect('/login');
  }
});

app.use(express.static(__dirname + '/public'));

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
