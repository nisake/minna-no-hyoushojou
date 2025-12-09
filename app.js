// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCPHPYN6cybQiFvQoN9U0X3qe1wDPfO52M",
  authDomain: "minna-no-hyoushojou.firebaseapp.com",
  databaseURL: "https://minna-no-hyoushojou-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "minna-no-hyoushojou",
  storageBucket: "minna-no-hyoushojou.firebasestorage.app",
  messagingSenderId: "321945212692",
  appId: "1:321945212692:web:d8f66169d8f9c2dc7dd401"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===== ワードリスト =====
const WORDS = {
  who: [
    "あなた",
    "きみ",
    "そこのあなた",
    "今これを見ている人",
    "がんばり屋さん",
    "やさしい人",
    "すごい人"
  ],
  what: [
    "毎日がんばっている",
    "今日も生きている",
    "ちゃんと息をしている",
    "えらすぎる",
    "よく寝た",
    "ごはんを食べた",
    "お風呂に入った",
    "起きることができた",
    "やさしい心を持っている",
    "存在しているだけで価値がある",
    "誰かを笑顔にした",
    "つらい日を乗り越えた",
    "自分を大切にしようとした",
    "ちょっとだけがんばった",
    "何もしなかったけど最高"
  ],
  award: [
    "最高で賞",
    "えらいで賞",
    "がんばったで賞",
    "すごいで賞",
    "天才で賞",
    "やさしいで賞",
    "生きてるだけで偉いで賞",
    "今日も最高で賞",
    "よくやったで賞",
    "自分を褒めていいで賞",
    "無限の可能性で賞",
    "世界一で賞",
    "ナンバーワンで賞",
    "オンリーワンで賞",
    "存在感謝で賞"
  ]
};

// ===== 状態管理 =====
let currentCertificate = {
  who: WORDS.who[0],
  what: WORDS.what[0],
  award: WORDS.award[0]
};

// ローカルストレージのキー
const STORAGE_KEYS = {
  created: 'minna_certificates_created',
  received: 'minna_certificates_received'
};

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
  initSelectors();
  initEventListeners();
  updatePreview();
  updateDate();
});

// セレクターの初期化
function initSelectors() {
  const selectWho = document.getElementById('select-who');
  const selectWhat = document.getElementById('select-what');
  const selectAward = document.getElementById('select-award');

  WORDS.who.forEach(word => {
    const option = document.createElement('option');
    option.value = word;
    option.textContent = word;
    selectWho.appendChild(option);
  });

  WORDS.what.forEach(word => {
    const option = document.createElement('option');
    option.value = word;
    option.textContent = word;
    selectWhat.appendChild(option);
  });

  WORDS.award.forEach(word => {
    const option = document.createElement('option');
    option.value = word;
    option.textContent = word;
    selectAward.appendChild(option);
  });
}

// イベントリスナーの設定
function initEventListeners() {
  // メニューボタン
  document.getElementById('btn-create').addEventListener('click', () => showScreen('create-screen'));
  document.getElementById('btn-exchange').addEventListener('click', () => showScreen('exchange-screen'));
  document.getElementById('btn-collection').addEventListener('click', () => {
    showScreen('collection-screen');
    loadCollection('created');
  });

  // 戻るボタン
  document.getElementById('btn-back-create').addEventListener('click', () => showScreen('main-menu'));
  document.getElementById('btn-back-exchange').addEventListener('click', () => showScreen('main-menu'));
  document.getElementById('btn-back-collection').addEventListener('click', () => showScreen('main-menu'));

  // セレクター変更
  document.getElementById('select-who').addEventListener('change', (e) => {
    currentCertificate.who = e.target.value;
    updatePreview();
  });
  document.getElementById('select-what').addEventListener('change', (e) => {
    currentCertificate.what = e.target.value;
    updatePreview();
  });
  document.getElementById('select-award').addEventListener('change', (e) => {
    currentCertificate.award = e.target.value;
    updatePreview();
  });

  // シャッフルボタン
  document.getElementById('btn-shuffle').addEventListener('click', shuffle);

  // 保存ボタン
  document.getElementById('btn-save').addEventListener('click', saveCertificate);

  // 交換に出すボタン
  document.getElementById('btn-share').addEventListener('click', shareCertificate);

  // 受け取るボタン
  document.getElementById('btn-receive').addEventListener('click', receiveCertificate);

  // コレクションタブ
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      loadCollection(e.target.dataset.tab);
    });
  });
}

// 画面切り替え
function showScreen(screenId) {
  document.getElementById('main-menu').classList.add('hidden');
  document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
  
  if (screenId === 'main-menu') {
    document.getElementById('main-menu').classList.remove('hidden');
  } else {
    document.getElementById(screenId).classList.remove('hidden');
  }
}

// プレビュー更新
function updatePreview() {
  document.getElementById('preview-who').textContent = currentCertificate.who;
  document.getElementById('preview-what').textContent = currentCertificate.what;
  document.getElementById('preview-award').textContent = currentCertificate.award;
}

// 日付更新
function updateDate() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  document.getElementById('preview-date').textContent = dateStr;
}

// シャッフル
function shuffle() {
  const randomWho = WORDS.who[Math.floor(Math.random() * WORDS.who.length)];
  const randomWhat = WORDS.what[Math.floor(Math.random() * WORDS.what.length)];
  const randomAward = WORDS.award[Math.floor(Math.random() * WORDS.award.length)];

  currentCertificate = { who: randomWho, what: randomWhat, award: randomAward };

  document.getElementById('select-who').value = randomWho;
  document.getElementById('select-what').value = randomWhat;
  document.getElementById('select-award').value = randomAward;

  updatePreview();
}

// ローカルに保存
function saveCertificate() {
  const certificate = {
    ...currentCertificate,
    date: new Date().toISOString(),
    id: Date.now()
  };

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.created) || '[]');
  saved.unshift(certificate);
  localStorage.setItem(STORAGE_KEYS.created, JSON.stringify(saved));

  alert('💾 保存しました！');
}

// 交換に出す（Firebaseに送信）
function shareCertificate() {
  const certificate = {
    ...currentCertificate,
    date: new Date().toISOString(),
    id: Date.now()
  };

  database.ref('certificates').push(certificate)
    .then(() => {
      // ローカルにも保存
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.created) || '[]');
      saved.unshift({ ...certificate, shared: true });
      localStorage.setItem(STORAGE_KEYS.created, JSON.stringify(saved));

      alert('🔄 交換に出しました！\n誰かがこの表彰状を受け取るかも！');
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('エラーが発生しました。もう一度試してください。');
    });
}

// 表彰状を受け取る
function receiveCertificate() {
  database.ref('certificates').once('value')
    .then((snapshot) => {
      const data = snapshot.val();
      if (!data) {
        alert('まだ交換に出された表彰状がありません。\n最初の一人になってみませんか？');
        return;
      }

      // ランダムに1つ選ぶ
      const keys = Object.keys(data);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const certificate = data[randomKey];

      // 表示
      const contentEl = document.getElementById('received-content');
      contentEl.innerHTML = `
        <span>${certificate.who}</span>は<br>
        <span>${certificate.what}</span>ので<br>
        <span>${certificate.award}</span>を授与します
      `;

      const dateEl = document.getElementById('received-date');
      const date = new Date(certificate.date);
      dateEl.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

      document.getElementById('received-certificate').classList.remove('hidden');

      // ローカルに保存
      const received = JSON.parse(localStorage.getItem(STORAGE_KEYS.received) || '[]');
      received.unshift({
        ...certificate,
        receivedAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.received, JSON.stringify(received));
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('エラーが発生しました。もう一度試してください。');
    });
}

// コレクション読み込み
function loadCollection(type) {
  const key = type === 'created' ? STORAGE_KEYS.created : STORAGE_KEYS.received;
  const certificates = JSON.parse(localStorage.getItem(key) || '[]');
  const listEl = document.getElementById('collection-list');

  if (certificates.length === 0) {
    listEl.innerHTML = '<p style="text-align: center; color: #999;">まだありません</p>';
    return;
  }

  listEl.innerHTML = certificates.map(cert => `
    <div class="certificate">
      <div class="certificate-inner">
        <div class="certificate-title">表 彰 状</div>
        <div class="certificate-content">
          <span>${cert.who}</span>は<br>
          <span>${cert.what}</span>ので<br>
          <span>${cert.award}</span>を授与します
        </div>
        <div class="certificate-date">${formatDate(cert.date)}</div>
      </div>
    </div>
  `).join('');
}

// 日付フォーマット
function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
