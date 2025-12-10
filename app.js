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

// ※ ワードリストは words.js に分離

// ===== 状態管理 =====
let currentCertificate = {
  who: WORDS.who[0],
  what: WORDS.what[0],
  award: WORDS.award[0]
};

// 連続送信防止用
let isProcessing = false;

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
  document.getElementById('btn-exchange').addEventListener('click', () => {
    showScreen('exchange-screen');
    // 交換画面に来たら受け取り済み表示をリセット
    document.getElementById('received-certificate').classList.add('hidden');
    resetReceiveButton();
  });
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

// 表彰状のキー生成（重複チェック用）
function getCertificateKey(cert) {
  return `${cert.who}|${cert.what}|${cert.award}`;
}

// 今日の日付を取得（YYYY-MM-DD形式）
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Firebase用の安全なキーを生成（インデックスベース）
function getSafeKeyByIndex(whoIdx, whatIdx, awardIdx) {
  return `${whoIdx}_${whatIdx}_${awardIdx}`;
}

// 文字列からインデックスを取得
function getWordIndex(word, category) {
  const index = WORDS[category].indexOf(word);
  return index >= 0 ? index : 0;
}

// ローカルに保存
function saveCertificate() {
  if (isProcessing) return;
  
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.created) || '[]');
  
  // 重複チェック
  const currentKey = getCertificateKey(currentCertificate);
  const isDuplicate = saved.some(cert => getCertificateKey(cert) === currentKey);
  
  if (isDuplicate) {
    alert('📝 この組み合わせは既に保存済みです！');
    return;
  }

  const certificate = {
    ...currentCertificate,
    date: new Date().toISOString(),
    id: Date.now()
  };

  saved.unshift(certificate);
  localStorage.setItem(STORAGE_KEYS.created, JSON.stringify(saved));

  alert('💾 保存しました！');
}

// 交換に出す（Firebaseに送信）
function shareCertificate() {
  if (isProcessing) return;
  isProcessing = true;

  const btnShare = document.getElementById('btn-share');
  btnShare.disabled = true;
  btnShare.textContent = '🔄 送信中...';

  // インデックスを取得
  const whoIndex = getWordIndex(currentCertificate.who, 'who');
  const whatIndex = getWordIndex(currentCertificate.what, 'what');
  const awardIndex = getWordIndex(currentCertificate.award, 'award');

  const todayKey = getTodayKey();
  const certKey = getSafeKeyByIndex(whoIndex, whatIndex, awardIndex);
  const dbPath = `certificates/${todayKey}/${certKey}`;

  // Firebaseにはインデックスのみ保存
  const certificateData = {
    whoIndex: whoIndex,
    whatIndex: whatIndex,
    awardIndex: awardIndex,
    date: new Date().toISOString()
  };

  // まず同じ組み合わせが今日既にあるか確認
  database.ref(dbPath).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        alert('📝 この組み合わせは今日すでに交換に出されています！\n別の組み合わせを試してみてね');
        resetShareButton();
        return;
      }

      // なければ保存
      return database.ref(dbPath).set(certificateData)
        .then(() => {
          // ローカルにも保存（重複チェック、文字列で保存）
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.created) || '[]');
          const currentKey = getCertificateKey(currentCertificate);
          const isDuplicate = saved.some(cert => getCertificateKey(cert) === currentKey);
          
          if (!isDuplicate) {
            saved.unshift({ ...currentCertificate, date: new Date().toISOString(), shared: true, id: Date.now() });
            localStorage.setItem(STORAGE_KEYS.created, JSON.stringify(saved));
          }

          alert('🔄 交換に出しました！\n誰かがこの表彰状を受け取るかも！');
          resetShareButton();
        });
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('エラーが発生しました。もう一度試してください。');
      resetShareButton();
    });
}

function resetShareButton() {
  const btnShare = document.getElementById('btn-share');
  btnShare.disabled = false;
  btnShare.textContent = '🔄 交換に出す';
  isProcessing = false;
}

// 表彰状を受け取る
function receiveCertificate() {
  if (isProcessing) return;
  isProcessing = true;

  const btnReceive = document.getElementById('btn-receive');
  btnReceive.disabled = true;
  btnReceive.textContent = '🔄 取得中...';

  database.ref('certificates').once('value')
    .then((snapshot) => {
      const data = snapshot.val();
      if (!data) {
        alert('まだ交換に出された表彰状がありません。\n最初の一人になってみませんか？');
        resetReceiveButton();
        return;
      }

      // 全ての表彰状を配列に変換
      const allCertificates = [];
      Object.keys(data).forEach(dateKey => {
        const dateCerts = data[dateKey];
        Object.keys(dateCerts).forEach(certKey => {
          allCertificates.push({
            ...dateCerts[certKey],
            dateKey: dateKey
          });
        });
      });

      if (allCertificates.length === 0) {
        alert('まだ交換に出された表彰状がありません。\n最初の一人になってみませんか？');
        resetReceiveButton();
        return;
      }

      // ランダムに1つ選ぶ
      const certData = allCertificates[Math.floor(Math.random() * allCertificates.length)];

      // インデックスから文字列に変換（範囲外ならデフォルト値）
      const who = WORDS.who[certData.whoIndex] || WORDS.who[0];
      const what = WORDS.what[certData.whatIndex] || WORDS.what[0];
      const award = WORDS.award[certData.awardIndex] || WORDS.award[0];

      // 表示用オブジェクト
      const certificate = { who, what, award, date: certData.date };

      // 表示
      const contentEl = document.getElementById('received-content');
      contentEl.innerHTML = `
  		<span>${certificate.who}</span><span class="no-break">は</span><br>
  		<span>${certificate.what}</span><span class="no-break">ので</span><br>
  		<span>${certificate.award}</span><span class="no-break">を授与します</span>
	  `;

      const dateEl = document.getElementById('received-date');
      const date = new Date(certificate.date);
      dateEl.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

      document.getElementById('received-certificate').classList.remove('hidden');
      document.getElementById('btn-image-received').classList.remove('hidden');

      // ローカルに保存
      const received = JSON.parse(localStorage.getItem(STORAGE_KEYS.received) || '[]');
      received.unshift({
        ...certificate,
        receivedAt: new Date().toISOString(),
        localId: Date.now()
      });
      localStorage.setItem(STORAGE_KEYS.received, JSON.stringify(received));

      // ボタンを「もう一度受け取る」に変更
      btnReceive.textContent = '🎁 もう一度受け取る';
      btnReceive.disabled = false;
      isProcessing = false;
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('エラーが発生しました。もう一度試してください。');
      resetReceiveButton();
    });
}

function resetReceiveButton() {
  const btnReceive = document.getElementById('btn-receive');
  btnReceive.disabled = false;
  btnReceive.textContent = '🎁 受け取る';
  isProcessing = false;
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

  listEl.innerHTML = certificates.map((cert, index) => `
  <div class="certificate-wrapper">
    <div class="certificate" id="cert-${type}-${index}">
      <div class="certificate-inner">
        <div class="certificate-title">表 彰 状</div>
        <div class="certificate-content">
          <span>${cert.who}</span><span class="no-break">は</span><br>
		  <span>${cert.what}</span><span class="no-break">ので</span><br>
		  <span>${cert.award}</span><span class="no-break">を授与します</span>
        </div>
        <div class="certificate-date">${formatDate(cert.date)}</div>
      </div>
    </div>
    <div class="cert-buttons">
      <button class="image-btn" onclick="saveCertificateAsImage('cert-${type}-${index}')">📷 画像</button>
      <button class="delete-btn" onclick="deleteCertificate('${type}', ${index})">🗑️ 削除</button>
    </div>
  </div>
`).join('');
}

// 表彰状を削除
function deleteCertificate(type, index) {
  if (!confirm('この表彰状を削除しますか？')) return;

  const key = type === 'created' ? STORAGE_KEYS.created : STORAGE_KEYS.received;
  const certificates = JSON.parse(localStorage.getItem(key) || '[]');
  
  certificates.splice(index, 1);
  localStorage.setItem(key, JSON.stringify(certificates));
  
  loadCollection(type);
}

// 日付フォーマット
function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 表彰状を画像として保存
function saveCertificateAsImage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  html2canvas(element, {
    backgroundColor: '#fff',
    scale: 2
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = '表彰状.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}
