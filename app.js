// Google Form Entry Mapping Constants
const FORM_BASE_URL = "https://docs.google.com/forms/d/e/1FAIpQLSergjQh4HM1lwohyMpl_Sn2g5MiLCW-pFZEtGNuHKVEnIsvjg/viewform";

const ENTRIES = {
  firstTime: "entry.1312759299",          // 是, 否
  parentName: "entry.786917290",         // Text
  parentPhone: "entry.956896327",        // Text
  
  // Adults counts grid
  adultMale: "entry.769504061",          // 1, 2, 3, 4, 5
  adultFemale: "entry.1805724435",       // 1, 2, 3, 4, 5
  
  // Identity grid (rows)
  statusParent: "entry.94044281",        // 1, 2, 3, 4, 5
  statusGrand: "entry.1507371668",       // 1, 2, 3, 4, 5
  statusRelative: "entry.1538950231",    // 1, 2, 3, 4, 5
  statusAgency: "entry.675512628",       // 1, 2, 3, 4, 5
  statusNanny: "entry.732773088",        // 1, 2, 3, 4, 5
  statusOther: "entry.238767652",        // 1, 2, 3, 4, 5
  
  // Kids gender count grid (rows)
  childMale: "entry.1437734244",         // 1, 2, 3, 4, 5
  childFemale: "entry.459537519",        // 1, 2, 3, 4, 5
  
  // Kids age count grid (rows)
  age0_1: "entry.107456503",             // 1, 2, 3, 4, 5
  age1_2: "entry.873126324",             // 1, 2, 3, 4, 5
  age2_3: "entry.90201756",              // 1, 2, 3, 4, 5
  age3_4: "entry.2146866817",            // 1, 2, 3, 4, 5
  age4_6: "entry.562968710",             // 1, 2, 3, 4, 5
  age6_school: "entry.66029017",         // 1, 2, 3, 4, 5
  
  // Address
  district: "entry.1872414498",          // Dropdown selection (e.g. 楊梅區)
  village: "entry.1388195758"            // Dropdown selection for Yangmei (e.g. 四維里)
};

// Village lists for Yangmei District
const YANGMEI_VILLAGES = [
  '三民里', '三湖里', '上田里', '上湖里', '大平里', '大同里', '中山里', '仁美里', '水美里', '四維里',
  '永平里', '永寧里', '光華里', '秀才里', '東流里', '金溪里', '金龍里', '青山里', '紅梅里', '員本里',
  '埔心里', '高上里', '高山里', '高榮里', '梅新里', '梅溪里', '富岡里', '富豐里', '新榮里', '楊江里',
  '楊明里', '楊梅里', '瑞坪里', '瑞原里', '瑞塘里', '瑞溪里', '裕成里', '裕新里', '頭湖里', '豐野里', '雙榮里'
];

// Default profile structure
const DEFAULT_PROFILE = {
  firstTime: "否",
  parents: {
    dadName: "",
    dadPhone: "",
    momName: "",
    momPhone: "",
    grandpaName: "",
    grandpaPhone: "",
    grandmaName: "",
    grandmaPhone: ""
  },
  children: [
    { gender: "男", ageRange: "1歲 - 2歲" }
  ],
  address: {
    district: "楊梅區",
    village: "四維里"
  },
  settings: {
    bothPhoneMode: "dad", // dad, mom
    grandBothPhoneMode: "grandma" // grandma, grandpa
  }
};

function loadStoredProfile() {
  const saved = localStorage.getItem('parenting_profile');
  if (!saved) return DEFAULT_PROFILE;
  try {
    const parsed = JSON.parse(saved);
    return {
      firstTime: parsed.firstTime || "否",
      parents: {
        dadName: parsed.parents?.dadName || "",
        dadPhone: parsed.parents?.dadPhone || "",
        momName: parsed.parents?.momName || "",
        momPhone: parsed.parents?.momPhone || "",
        grandpaName: parsed.parents?.grandpaName || (parsed.parents?.otherGender === '男' ? parsed.parents?.otherName || '' : ''),
        grandpaPhone: parsed.parents?.grandpaPhone || (parsed.parents?.otherGender === '男' ? parsed.parents?.otherPhone || '' : ''),
        grandmaName: parsed.parents?.grandmaName || (parsed.parents?.otherGender !== '男' ? parsed.parents?.otherName || '' : ''),
        grandmaPhone: parsed.parents?.grandmaPhone || (parsed.parents?.otherGender !== '男' ? parsed.parents?.otherPhone || '' : '')
      },
      children: Array.isArray(parsed.children) && parsed.children.length > 0 ? parsed.children : DEFAULT_PROFILE.children,
      address: {
        district: parsed.address?.district || "楊梅區",
        village: parsed.address?.village || "四維里"
      },
      settings: {
        bothPhoneMode: parsed.settings?.bothPhoneMode || "dad",
        grandBothPhoneMode: parsed.settings?.grandBothPhoneMode || "grandma"
      }
    };
  } catch (e) {
    return DEFAULT_PROFILE;
  }
}

let currentProfile = loadStoredProfile();



// Initialize PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('Service Worker registered successfully');
        reg.update(); // Trigger immediate update check
      })
      .catch(err => console.log('Service Worker registration failed', err));
  });

  // Automatically reload the page when a new service worker takes over (skipWaiting)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Facebook Closure Posts Dataset (Top 3 Posts from FB Search)
const FB_CLOSURE_POSTS = [
  {
    id: "post_1",
    author: "台灣玩具圖書館",
    authorTag: "營運總部 / 四維等據點",
    date: "07/11 (六)",
    badgeType: "typhoon",
    badgeText: "🌀 颱風停班課休館",
    title: "【 🌀 巴威颱風來襲休館公告 】",
    highlights: [
      "因應 07/11 桃園市停班停課一天，全館臨時休館 1 天",
      "風強雨大在家防颱，捐玩具、做志工與入館遊憩先緩緩",
      "楊梅四維親子館、平鎮親子館、桃園物流中心等據點同步暫停服務"
    ],
    fullContent: `【 🌀 巴威颱風來襲休館公告 】
展開內文看更多 #玩圖據點資訊

因應 07/11 桃園市停班停課一天
桃園總部物流中心將臨時休館 1 天
風強雨大 我們在家好好防颱
捐玩具、做志工都先緩緩喔～

若有捐贈、志工、合作等相關問題
歡迎善加利用我們的 FB / email 詢問
我們將於上班日盡快回覆
感謝大家的體諒！

#服務時間異動：
桃園總部物流中心 (桃園市楊梅區中興路133號) 07/11 (六) 休館

| 查詢全台各館舍休館時間 |
北部：
<桃園>
桃園總部物流中心 @台灣玩具圖書館
共享園區實驗據點 玩具藏寶箱/玩具盒子修惜站
平鎮親子館
楊梅四維親子館
復興行動親子車
<雙北>
新北市玩具銀行
臺北玩具轉運站

中部：
<台中> 臺中市大雅國小玩具圖書館
<彰化> Formosa玩具基地

南部：
台灣玩具圖書館-高雄玩具碼頭

東部：
玩具圖書館-花蓮東華玩具樂園物流中心`,
    link: "https://www.facebook.com/profile/61570213655087/search/?q=休館"
  },
  {
    id: "post_2",
    author: "楊梅四維親子館",
    authorTag: "官方粉專",
    date: "07/28 (二) - 07/29 (三)",
    badgeType: "disinfect",
    badgeText: "🧴 消毒日休館",
    title: "【楊梅四維親子館 • 7月份休館公告】",
    highlights: [
      "07/28 (二) 至 07/29 (三) 全日進行環境深度清潔消毒作業",
      "消毒期間暫停開放入館與各項親子課程，請家長留意避免白跑",
      "如有入館疑問請洽詢楊梅四維親子館專線：03-4822207"
    ],
    fullContent: `【楊梅四維親子館 • 7月份休館公告】

07/28 (二) - 07/29 (三) 消毒日休館

煩請家長留意，不要白跑一趟囉!
造成不便敬請見諒
如有疑問請洽楊梅四維親子館 03-4822207`,
    link: "https://www.facebook.com/profile/61570213655087/search/?q=休館"
  },
  {
    id: "post_3",
    author: "楊梅四維親子館",
    authorTag: "官方粉專",
    date: "115/07/11 (六)",
    badgeType: "special",
    badgeText: "⚠️ 臨時休館與活動取消",
    title: "【楊梅四維親子館 • 臨時休館公告】",
    highlights: [
      "因巴威颱風來襲市府發佈停班停課，115/07/11 (六) 本館休館一日",
      "外展活動（楊梅故事園區）、奇異創作家（登登！星球任務站）取消辦理",
      "圖書教玩具借閱服務暫停一次，颱風天請家長幼兒安心待在家防颱"
    ],
    fullContent: `【楊梅四維親子館 • 臨時休館公告】

因巴威颱風來襲
桃園市政府發佈停班停課

115/07/11 (六) 本館休館一日
明日 外展活動 • 楊梅故事園區、親子活動 奇異創作家 • 登登！星球任務站 #取消辦理
圖書教玩具借閱服務暫停一次

造成不便敬請見諒
請親子們留意，不要白跑一趟喲!

#颱風風雨大 #大家要乖乖待在家裡哦`,
    link: "https://www.facebook.com/profile/61570213655087/search/?q=休館"
  }
];

// DOM elements
const settingsModal = document.getElementById('settingsModal');
const settingsTrigger = document.getElementById('settingsTrigger');
const settingsClose = document.getElementById('settingsClose');
const settingsForm = document.getElementById('settingsForm');
const childrenContainer = document.getElementById('childrenContainer');
const btnAddChild = document.getElementById('btnAddChild');

const districtSelect = document.getElementById('district');
const villageGroup = document.getElementById('villageGroup');
const villageSelect = document.getElementById('village');

const calendarModal = document.getElementById('calendarModal');
const calendarClose = document.getElementById('calendarClose');
const btnOpenCalendarModal = document.getElementById('btnOpenCalendarModal');
const calendarBottomCard = document.getElementById('calendarBottomCard');
const monthlyCalendarLink = document.getElementById('monthlyCalendarLink');

// FB Closure Notice DOM elements
const closureModal = document.getElementById('closureModal');
const closureClose = document.getElementById('closureClose');
const btnOpenClosureModal = document.getElementById('btnOpenClosureModal');
const btnTopClosureNotice = document.getElementById('btnTopClosureNotice');
const closurePostsPreviewList = document.getElementById('closurePostsPreviewList');
const closureFullPostsList = document.getElementById('closureFullPostsList');



// Helper to determine age range entry ID
function getAgeEntryId(ageRange) {
  switch (ageRange) {
    case '0歲 - 1歲': return ENTRIES.age0_1;
    case '1歲 - 2歲': return ENTRIES.age1_2;
    case '2歲 - 3歲': return ENTRIES.age2_3;
    case '3歲 - 4歲': return ENTRIES.age3_4;
    case '4歲 - 6歲': return ENTRIES.age4_6;
    case '6歲以上 (未上小學)': return ENTRIES.age6_school;
    default: return null;
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // Bind Settings trigger
  settingsTrigger.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', closeSettings);
  
  // District change event to show/hide village list
  districtSelect.addEventListener('click', handleDistrictChange);
  districtSelect.addEventListener('change', handleDistrictChange);
  
  // Add child button
  btnAddChild.addEventListener('click', () => addChildRow());
  
  // Form submission
  settingsForm.addEventListener('submit', handleSettingsSave);

  // Calendar Modal triggers
  if (monthlyCalendarLink) {
    monthlyCalendarLink.addEventListener('click', (e) => {
      e.preventDefault();
      openCalendarModal();
    });
  }
  if (btnOpenCalendarModal) {
    btnOpenCalendarModal.addEventListener('click', (e) => {
      e.stopPropagation();
      openCalendarModal();
    });
  }
  if (calendarBottomCard) {
    calendarBottomCard.addEventListener('click', () => {
      openCalendarModal();
    });
  }
  if (calendarClose) {
    calendarClose.addEventListener('click', closeCalendarModal);
  }
  if (calendarModal) {
    calendarModal.addEventListener('click', (e) => {
      if (e.target === calendarModal) closeCalendarModal();
    });
  }

  // Closure Modal triggers
  if (btnTopClosureNotice) {
    btnTopClosureNotice.addEventListener('click', (e) => {
      e.preventDefault();
      openClosureModal();
    });
  }
  if (btnOpenClosureModal) {
    btnOpenClosureModal.addEventListener('click', (e) => {
      e.stopPropagation();
      openClosureModal();
    });
  }
  if (closureClose) {
    closureClose.addEventListener('click', closeClosureModal);
  }
  if (closureModal) {
    closureModal.addEventListener('click', (e) => {
      if (e.target === closureModal) closeClosureModal();
    });
  }
  
  // Render views
  populateDistrictDropdown();
  renderProfileSummary();
  updateMonthlyCalendarLink();
  
  // Load & sync latest announcements (Calendar & FB Closure notices)
  fetchLatestAnnouncements();
  
  // If the profile is fresh (names are empty), open settings automatically
  if (!currentProfile.parents.dadName && !currentProfile.parents.momName && !currentProfile.parents.grandpaName && !currentProfile.parents.grandmaName) {
    setTimeout(openSettings, 300);
  }
});

// Fetch latest announcements from data/announcements.json with cache fallback
async function fetchLatestAnnouncements() {
  // First, check if we have cached announcements in localStorage
  let cachedData = null;
  try {
    const localSaved = localStorage.getItem('parenting_announcements');
    if (localSaved) {
      cachedData = JSON.parse(localSaved);
      applyAnnouncementsData(cachedData);
    } else {
      // Use default bundled data
      renderClosurePosts(FB_CLOSURE_POSTS);
    }
  } catch (err) {
    renderClosurePosts(FB_CLOSURE_POSTS);
  }

  // Next, fetch the latest live JSON from GitHub with cache-busting timestamp
  try {
    const response = await fetch(`./data/announcements.json?t=${Date.now()}`);
    if (response.ok) {
      const liveData = await response.json();
      localStorage.setItem('parenting_announcements', JSON.stringify(liveData));
      applyAnnouncementsData(liveData);
      console.log('[Live Sync] Successfully updated announcements from GitHub Actions feed:', liveData.updatedAt);
    }
  } catch (fetchErr) {
    console.log('[Live Sync] Using offline cached announcements:', fetchErr);
  }
}

// Apply announcements data to UI modals
function applyAnnouncementsData(data) {
  if (!data) return;

  if (data.calendar) {
    renderCalendarModal(data.calendar);
  }
  if (data.closures && Array.isArray(data.closures)) {
    renderClosurePosts(data.closures);
  }
}

// Render dynamic Calendar modal content
function renderCalendarModal(calendarData) {
  if (!calendarData) return;

  const imagesContainer = document.getElementById('calendarImagesList');
  const textBoxContainer = document.getElementById('calendarTextBox');
  const textEl = document.getElementById('calendarLinkText');
  const modalHeaderTitle = document.getElementById('calendarModalHeaderTitle');
  const modalExtLink = document.getElementById('calendarModalExtLink');
  const monthlyLink = document.getElementById('monthlyCalendarLink');

  const bottomTitleEl = document.getElementById('bottomCalendarCardTitle');

  if (textEl && calendarData.year && calendarData.month) {
    textEl.textContent = `${calendarData.year}年${calendarData.month}月行事曆`;
  }
  if (bottomTitleEl && calendarData.year && calendarData.month) {
    bottomTitleEl.textContent = `${calendarData.year}年${calendarData.month}月 活動行事曆`;
  }
  if (modalHeaderTitle && calendarData.title) {
    modalHeaderTitle.textContent = `📅 ${calendarData.title}`;
  }
  if (modalExtLink && calendarData.searchUrl) {
    modalExtLink.href = calendarData.searchUrl;
  }
  if (monthlyLink && calendarData.searchUrl) {
    monthlyLink.href = calendarData.searchUrl;
  }

  // Render Calendar Images
  if (imagesContainer && Array.isArray(calendarData.images) && calendarData.images.length > 0) {
    imagesContainer.innerHTML = calendarData.images.map(img => `
      <a href="${img.url}" target="_blank" rel="noopener noreferrer" class="calendar-img-link" title="點擊檢視高畫質大圖">
        <img src="${img.url}" alt="${img.alt || '活動行事曆'}" class="calendar-full-img" loading="lazy">
        <span class="img-zoom-tip">🔍 點擊開新分頁看原圖</span>
      </a>
    `).join('');
  }

  // Render Announcement Text Box
  if (textBoxContainer) {
    const activitiesHtml = Array.isArray(calendarData.activities) ? calendarData.activities.map(act => `
      <li><span class="act-name">${act.name}</span><span class="act-age">${act.age}</span></li>
    `).join('') : '';

    const timeSlotsHtml = Array.isArray(calendarData.timeSlots) ? calendarData.timeSlots.map((ts, idx) => `
      <div class="time-slot-card" style="${idx > 0 ? 'margin-top: 6px;' : ''}">
        <strong>${ts.category === '自由入館遊憩' ? '🏡' : '🎨'} ${ts.category}</strong>（${ts.quota}）
        ${ts.slots.map(s => `<div>▫️ ${s}</div>`).join('')}
        ${ts.note ? `<small style="color: var(--text-muted);">${ts.note}</small>` : ''}
      </div>
    `).join('') : '';

    const rulesHtml = Array.isArray(calendarData.rules) ? calendarData.rules.map(r => `
      <li>${r}</li>
    `).join('') : '';

    textBoxContainer.innerHTML = `
      <div class="calendar-announcement-card">
        <h3 class="announcement-title">${calendarData.title}</h3>
        <p class="announcement-greeting">${(calendarData.greeting || '').replace(/\n/g, '<br>')}</p>
        
        <div class="announcement-group">
          <div class="group-title">👶 活動類型與參與年齡</div>
          <ul class="activity-age-list">
            ${activitiesHtml}
          </ul>
        </div>

        <div class="announcement-group">
          <div class="group-title">⏰ 入館與活動時段</div>
          ${timeSlotsHtml}
        </div>

        <div class="announcement-group">
          <div class="group-title">☄️ 報名方式與入館須知</div>
          <ul class="rule-list">
            ${rulesHtml}
          </ul>
          <div class="contact-phone-badge">
            📞 洽詢電話：<a href="tel:${calendarData.phone || '034822207'}">${calendarData.phone || '03-482-2207'}</a>
          </div>
        </div>
      </div>
    `;
  }
}

// Render Closure Posts on both Card and Modal
function renderClosurePosts(postsList = FB_CLOSURE_POSTS) {
  const currentList = Array.isArray(postsList) && postsList.length > 0 ? postsList : FB_CLOSURE_POSTS;

  if (closurePostsPreviewList) {
    closurePostsPreviewList.innerHTML = '';
    currentList.forEach((post) => {
      const item = document.createElement('div');
      item.className = 'closure-post-item';
      
      const highlightsHtml = Array.isArray(post.highlights) ? post.highlights.map(h => `
        <li class="closure-highlight-row">
          <span class="bullet">▫️</span>
          <span>${h}</span>
        </li>
      `).join('') : '';

      item.innerHTML = `
        <div class="closure-item-header">
          <div class="closure-item-meta">
            <span class="closure-badge ${post.badgeType}">${post.badgeText}</span>
            <span class="closure-item-author">${post.author}</span>
          </div>
          <span class="closure-item-date">${post.date}</span>
        </div>
        <div class="closure-item-title">${post.title}</div>
        <ul class="closure-highlights">
          ${highlightsHtml}
        </ul>
        <div class="closure-card-actions">
          <button type="button" class="btn-toggle-post-body" onclick="togglePostFullText('${post.id}', this)">
            <span class="toggle-icon">🔽</span> 展開貼文全文
          </button>
        </div>
        <div class="closure-post-fulltext" id="fullText_${post.id}">
          ${post.fullContent}
        </div>
      `;
      closurePostsPreviewList.appendChild(item);
    });
  }

  if (closureFullPostsList) {
    closureFullPostsList.innerHTML = '';
    currentList.forEach((post) => {
      const card = document.createElement('div');
      card.className = 'closure-modal-post-card';
      
      card.innerHTML = `
        <div class="closure-modal-post-header">
          <div class="closure-item-meta">
            <span class="closure-badge ${post.badgeType}">${post.badgeText}</span>
            <span class="closure-item-author">${post.author} (${post.authorTag || '官方粉專'})</span>
          </div>
          <span class="closure-item-date">${post.date}</span>
        </div>
        <div class="closure-modal-post-title">${post.title}</div>
        <div class="closure-modal-post-body">${post.fullContent}</div>
      `;
      closureFullPostsList.appendChild(card);
    });
  }
}

// Toggle inline post full text accordion
window.togglePostFullText = function(postId, btnEl) {
  const fullTextEl = document.getElementById(`fullText_${postId}`);
  if (!fullTextEl) return;
  
  const isOpen = fullTextEl.classList.contains('open');
  if (isOpen) {
    fullTextEl.classList.remove('open');
    if (btnEl) {
      btnEl.innerHTML = '<span class="toggle-icon">🔽</span> 展開貼文全文';
    }
  } else {
    fullTextEl.classList.add('open');
    if (btnEl) {
      btnEl.innerHTML = '<span class="toggle-icon">🔼</span> 收合貼文全文';
    }
  }
};

// Closure Modal open/close functions
function openClosureModal() {
  if (closureModal) {
    closureModal.classList.add('open');
  }
}

function closeClosureModal() {
  if (closureModal) {
    closureModal.classList.remove('open');
  }
}

// Update dynamic monthly calendar link (Taoyuan Babycare Search)
function updateMonthlyCalendarLink(calendarData) {
  let minguoYear, month;
  
  if (calendarData && calendarData.year && calendarData.month) {
    minguoYear = calendarData.year;
    month = calendarData.month;
  } else {
    try {
      const localSaved = localStorage.getItem('parenting_announcements');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (parsed.calendar && parsed.calendar.year && parsed.calendar.month) {
          minguoYear = parsed.calendar.year;
          month = parsed.calendar.month;
        }
      }
    } catch (e) {}
    
    if (!month) {
      const now = new Date();
      minguoYear = now.getFullYear() - 1911;
      month = now.getMonth() + 1;
    }
  }

  const keyword = `楊梅四維親子館 · ${minguoYear}年${month}月活動行事曆`;
  const url = `https://babycare.tycg.gov.tw//#/search?keyword=${encodeURIComponent(keyword)}`;
  
  const linkEl = document.getElementById('monthlyCalendarLink');
  const textEl = document.getElementById('calendarLinkText');
  const bottomTitleEl = document.getElementById('bottomCalendarCardTitle');
  const modalHeaderTitle = document.getElementById('calendarModalHeaderTitle');
  const modalExtLink = document.getElementById('calendarModalExtLink');
  
  if (linkEl) {
    linkEl.href = url;
  }
  if (textEl) {
    textEl.textContent = `${minguoYear}年${month}月行事曆`;
  }
  if (bottomTitleEl) {
    bottomTitleEl.textContent = `${minguoYear}年${month}月 活動行事曆`;
  }
  if (modalHeaderTitle) {
    modalHeaderTitle.textContent = (calendarData && calendarData.title) 
      ? `📅 ${calendarData.title}` 
      : `📅 楊梅四維親子館 • ${minguoYear}年${month}月活動行事曆`;
  }
  if (modalExtLink) {
    modalExtLink.href = (calendarData && calendarData.searchUrl) ? calendarData.searchUrl : url;
  }
}

// Calendar Modal open/close functions
function openCalendarModal() {
  if (calendarModal) {
    calendarModal.classList.add('open');
  }
}

function closeCalendarModal() {
  if (calendarModal) {
    calendarModal.classList.remove('open');
  }
}

// Populate district options
function populateDistrictDropdown() {
  const districts = ['桃園區', '八德區', '龜山區', '蘆竹區', '大園區', '大溪區', '中壢區', '平鎮區', '楊梅區', '龍潭區', '新屋區', '觀音區', '復興區', '外縣市'];
  districtSelect.innerHTML = '';
  districts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    districtSelect.appendChild(opt);
  });
}

// Populate village options
function populateVillageDropdown() {
  villageSelect.innerHTML = '';
  YANGMEI_VILLAGES.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    villageSelect.appendChild(opt);
  });
}

// Handle District change
function handleDistrictChange() {
  if (districtSelect.value === '楊梅區') {
    villageGroup.style.display = 'flex';
    if (villageSelect.children.length === 0) {
      populateVillageDropdown();
    }
  } else {
    villageGroup.style.display = 'none';
  }
}

// Modal management
function openSettings() {
  // Populate form with current values
  document.getElementById('firstTime').checked = currentProfile.firstTime === '是';
  document.getElementById('dadName').value = currentProfile.parents.dadName || '';
  document.getElementById('dadPhone').value = currentProfile.parents.dadPhone || '';
  document.getElementById('momName').value = currentProfile.parents.momName || '';
  document.getElementById('momPhone').value = currentProfile.parents.momPhone || '';
  document.getElementById('grandpaName').value = currentProfile.parents.grandpaName || '';
  document.getElementById('grandpaPhone').value = currentProfile.parents.grandpaPhone || '';
  document.getElementById('grandmaName').value = currentProfile.parents.grandmaName || '';
  document.getElementById('grandmaPhone').value = currentProfile.parents.grandmaPhone || '';
  document.getElementById('bothPhoneMode').value = currentProfile.settings.bothPhoneMode || 'dad';
  document.getElementById('grandBothPhoneMode').value = currentProfile.settings.grandBothPhoneMode || 'grandma';
  
  districtSelect.value = currentProfile.address.district || '楊梅區';
  handleDistrictChange();
  
  if (districtSelect.value === '楊梅區') {
    villageSelect.value = currentProfile.address.village || '四維里';
  }
  
  // Render children
  childrenContainer.innerHTML = '';
  if (currentProfile.children && currentProfile.children.length > 0) {
    currentProfile.children.forEach(c => addChildRow(c.gender, c.ageRange));
  } else {
    addChildRow();
  }
  
  settingsModal.classList.add('open');
}

function closeSettings() {
  settingsModal.classList.remove('open');
}

// Dynamic children rows
function addChildRow(gender = '男', ageRange = '1歲 - 2歲') {
  const childId = 'child_' + Date.now() + Math.random().toString(36).substr(2, 5);
  
  const div = document.createElement('div');
  div.className = 'child-item-card';
  div.id = childId;
  
  // Child label index
  const idx = childrenContainer.children.length + 1;
  
  div.innerHTML = `
    <div class="child-num-badge">${idx}</div>
    <div class="child-selects">
      <select class="child-gender">
        <option value="男" ${gender === '男' ? 'selected' : ''}>男寶</option>
        <option value="女" ${gender === '女' ? 'selected' : ''}>女寶</option>
      </select>
      <select class="child-age">
        <option value="0歲 - 1歲" ${ageRange === '0歲 - 1歲' ? 'selected' : ''}>0 - 1 歲</option>
        <option value="1歲 - 2歲" ${ageRange === '1歲 - 2歲' ? 'selected' : ''}>1 - 2 歲</option>
        <option value="2歲 - 3歲" ${ageRange === '2歲 - 3歲' ? 'selected' : ''}>2 - 3 歲</option>
        <option value="3歲 - 4歲" ${ageRange === '3歲 - 4歲' ? 'selected' : ''}>3 - 4 歲</option>
        <option value="4歲 - 6歲" ${ageRange === '4歲 - 6歲' ? 'selected' : ''}>4 - 6 歲</option>
        <option value="6歲以上 (未上小學)" ${ageRange === '6歲以上 (未上小學)' ? 'selected' : ''}>6歲以上(未上學)</option>
      </select>
    </div>
    <button type="button" class="btn-remove-child" onclick="removeChildRow('${childId}')">
      ✕
    </button>
  `;
  childrenContainer.appendChild(div);
  reindexChildRows();
}

window.removeChildRow = function(id) {
  const row = document.getElementById(id);
  if (row) {
    row.remove();
    reindexChildRows();
  }
};

function reindexChildRows() {
  const cards = childrenContainer.querySelectorAll('.child-item-card');
  cards.forEach((card, i) => {
    card.querySelector('.child-num-badge').textContent = i + 1;
  });
}

// Form save handler
function handleSettingsSave(e) {
  e.preventDefault();
  
  // Gather children data
  const children = [];
  const cards = childrenContainer.querySelectorAll('.child-item-card');
  cards.forEach(card => {
    const gender = card.querySelector('.child-gender').value;
    const ageRange = card.querySelector('.child-age').value;
    children.push({ gender, ageRange });
  });
  
  currentProfile = {
    firstTime: document.getElementById('firstTime').checked ? '是' : '否',
    parents: {
      dadName: document.getElementById('dadName').value.trim(),
      dadPhone: document.getElementById('dadPhone').value.trim(),
      momName: document.getElementById('momName').value.trim(),
      momPhone: document.getElementById('momPhone').value.trim(),
      grandpaName: document.getElementById('grandpaName').value.trim(),
      grandpaPhone: document.getElementById('grandpaPhone').value.trim(),
      grandmaName: document.getElementById('grandmaName').value.trim(),
      grandmaPhone: document.getElementById('grandmaPhone').value.trim()
    },
    children: children,
    address: {
      district: districtSelect.value,
      village: districtSelect.value === '楊梅區' ? villageSelect.value : ''
    },
    settings: {
      bothPhoneMode: document.getElementById('bothPhoneMode').value,
      grandBothPhoneMode: document.getElementById('grandBothPhoneMode').value
    }
  };
  
  localStorage.setItem('parenting_profile', JSON.stringify(currentProfile));
  
  // Update views
  renderProfileSummary();
  
  closeSettings();
}

// Summary view renderer
function renderProfileSummary() {
  const summaryBox = document.getElementById('profileSummaryContent');
  
  // Build parents info
  let parentsHtml = '';
  if (currentProfile.parents.dadName) {
    parentsHtml += `👨 爸爸：${currentProfile.parents.dadName} (${currentProfile.parents.dadPhone || '無電話'}) `;
  }
  if (currentProfile.parents.momName) {
    parentsHtml += `${parentsHtml ? '<br>' : ''}👩 媽媽：${currentProfile.parents.momName} (${currentProfile.parents.momPhone || '無電話'})`;
  }
  if (currentProfile.parents.grandpaName) {
    parentsHtml += `${parentsHtml ? '<br>' : ''}👴 爺爺：${currentProfile.parents.grandpaName} (${currentProfile.parents.grandpaPhone || '無電話'})`;
  }
  if (currentProfile.parents.grandmaName) {
    parentsHtml += `${parentsHtml ? '<br>' : ''}👵 奶奶：${currentProfile.parents.grandmaName} (${currentProfile.parents.grandmaPhone || '無電話'})`;
  }
  if (!parentsHtml) {
    parentsHtml = '⚠️ 請點選右上角 ⚙️ 設定家庭資料';
  }
  
  // Build children info
  let kidsHtml = '';
  if (currentProfile.children && currentProfile.children.length > 0) {
    kidsHtml = currentProfile.children.map((c, i) => {
      const icon = c.gender === '男' ? '👦' : '👧';
      return `${icon} 寶貝 ${i+1}: ${c.gender}寶 (${c.ageRange})`;
    }).join('<br>');
  } else {
    kidsHtml = '無小孩資料';
  }
  
  // Address info
  let addrHtml = `📍 居住地：桃園市${currentProfile.address.district}`;
  if (currentProfile.address.district === '楊梅區' && currentProfile.address.village) {
    addrHtml += ` ${currentProfile.address.village}`;
  }
  
  // First time visited
  addrHtml += ` | 首次來館：${currentProfile.firstTime}`;
  
  summaryBox.innerHTML = `
    <div class="summary-row">
      <div class="summary-details">
        <strong>親屬設定：</strong><br>${parentsHtml}
      </div>
    </div>
    <div class="summary-row" style="margin-top: 8px;">
      <div class="summary-details">
        <strong>幼兒設定：</strong><br>${kidsHtml}
      </div>
    </div>
    <div class="summary-row" style="margin-top: 8px; border-top: 1px dashed var(--border-light); padding-top: 8px;">
      <div class="summary-details">
        ${addrHtml}
      </div>
    </div>
  `;
}



// URL builder helper
function buildUrl(fields) {
  const urlParts = [];
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== null && val !== '') {
      urlParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  }
  return `${FORM_BASE_URL}?${urlParts.join('&')}`;
}

// Redirect trigger with loading animation
function triggerRedirect(url) {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('active');
  
  // Prefill check console
  console.log("Redirecting to: ", url);
  
  setTimeout(() => {
    window.location.href = url;
  }, 750);
  
  // Auto-dismiss after 3 seconds to prevent being stuck if they navigate back
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 3000);
}

// Reset overlay when returning via history/back button
window.addEventListener('pageshow', (event) => {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
});


// Scenario 1: Dad Only
window.runDadScenario = function() {
  if (!currentProfile.parents.dadName) {
    alert("請先填寫爸爸姓名資料！");
    openSettings();
    return;
  }
  
  const fields = getCommonPrefills();
  fields[ENTRIES.parentName] = currentProfile.parents.dadName;
  fields[ENTRIES.parentPhone] = currentProfile.parents.dadPhone;
  fields[ENTRIES.adultMale] = "1";
  fields[ENTRIES.statusParent] = "1";
  
  addChildPrefills(fields, currentProfile.children);
  triggerRedirect(buildUrl(fields));
};

// Scenario 2: Mom Only
window.runMomScenario = function() {
  if (!currentProfile.parents.momName) {
    alert("請先填寫媽媽姓名資料！");
    openSettings();
    return;
  }
  
  const fields = getCommonPrefills();
  fields[ENTRIES.parentName] = currentProfile.parents.momName;
  fields[ENTRIES.parentPhone] = currentProfile.parents.momPhone;
  fields[ENTRIES.adultFemale] = "1";
  fields[ENTRIES.statusParent] = "1";
  
  addChildPrefills(fields, currentProfile.children);
  triggerRedirect(buildUrl(fields));
};

// Scenario 3: Both Parents
window.runBothScenario = function() {
  if (!currentProfile.parents.dadName || !currentProfile.parents.momName) {
    alert("請先填寫爸爸與媽媽姓名資料！");
    openSettings();
    return;
  }
  
  const fields = getCommonPrefills();
  fields[ENTRIES.parentName] = `${currentProfile.parents.dadName} / ${currentProfile.parents.momName}`;
  
  // Phone selection mode (only Dad's or Mom's phone, no merged slashes)
  let phone = currentProfile.parents.dadPhone;
  const mode = currentProfile.settings.bothPhoneMode;
  if (mode === 'mom') {
    phone = currentProfile.parents.momPhone;
  } else {
    phone = currentProfile.parents.dadPhone || currentProfile.parents.momPhone;
  }
  fields[ENTRIES.parentPhone] = phone;
  
  fields[ENTRIES.adultMale] = "1";
  fields[ENTRIES.adultFemale] = "1";
  fields[ENTRIES.statusParent] = "2";
  
  addChildPrefills(fields, currentProfile.children);
  triggerRedirect(buildUrl(fields));
};

// Scenario 4: Grandma Only
window.runGrandmaScenario = function() {
  if (!currentProfile.parents.grandmaName) {
    alert("請先填寫奶奶姓名資料！");
    openSettings();
    return;
  }
  
  const fields = getCommonPrefills();
  fields[ENTRIES.parentName] = currentProfile.parents.grandmaName;
  fields[ENTRIES.parentPhone] = currentProfile.parents.grandmaPhone;
  fields[ENTRIES.adultFemale] = "1";
  fields[ENTRIES.statusGrand] = "1";
  
  addChildPrefills(fields, currentProfile.children);
  triggerRedirect(buildUrl(fields));
};

// Scenario 5: Grandpa Only
window.runGrandpaScenario = function() {
  if (!currentProfile.parents.grandpaName) {
    alert("請先填寫爺爺姓名資料！");
    openSettings();
    return;
  }
  
  const fields = getCommonPrefills();
  fields[ENTRIES.parentName] = currentProfile.parents.grandpaName;
  fields[ENTRIES.parentPhone] = currentProfile.parents.grandpaPhone;
  fields[ENTRIES.adultMale] = "1";
  fields[ENTRIES.statusGrand] = "1";
  
  addChildPrefills(fields, currentProfile.children);
  triggerRedirect(buildUrl(fields));
};

// Scenario 6: Both Grandparents
window.runGrandBothScenario = function() {
  if (!currentProfile.parents.grandpaName || !currentProfile.parents.grandmaName) {
    alert("請先填寫爺爺與奶奶姓名資料！");
    openSettings();
    return;
  }
  
  const fields = getCommonPrefills();
  fields[ENTRIES.parentName] = `${currentProfile.parents.grandpaName} / ${currentProfile.parents.grandmaName}`;
  
  // Phone selection mode
  let phone = currentProfile.parents.grandmaPhone;
  const mode = currentProfile.settings.grandBothPhoneMode || 'grandma';
  if (mode === 'grandpa') {
    phone = currentProfile.parents.grandpaPhone || currentProfile.parents.grandmaPhone;
  } else {
    phone = currentProfile.parents.grandmaPhone || currentProfile.parents.grandpaPhone;
  }
  fields[ENTRIES.parentPhone] = phone;
  
  fields[ENTRIES.adultMale] = "1";
  fields[ENTRIES.adultFemale] = "1";
  fields[ENTRIES.statusGrand] = "2";
  
  addChildPrefills(fields, currentProfile.children);
  triggerRedirect(buildUrl(fields));
};



// Common fields pre-fill builder
function getCommonPrefills() {
  const fields = {};
  fields[ENTRIES.firstTime] = currentProfile.firstTime;
  fields[ENTRIES.district] = currentProfile.address.district;
  if (currentProfile.address.district === '楊梅區' && currentProfile.address.village) {
    fields[ENTRIES.village] = currentProfile.address.village;
  }
  return fields;
}

// Child fields pre-fill builder
function addChildPrefills(fields, childrenList) {
  if (!childrenList || childrenList.length === 0) return;
  
  let boys = 0;
  let girls = 0;
  const ageCounts = {};
  
  childrenList.forEach(c => {
    if (c.gender === '男') boys++;
    else girls++;
    
    ageCounts[c.ageRange] = (ageCounts[c.ageRange] || 0) + 1;
  });
  
  if (boys > 0) fields[ENTRIES.childMale] = String(boys);
  if (girls > 0) fields[ENTRIES.childFemale] = String(girls);
  
  for (const [ageRange, count] of Object.entries(ageCounts)) {
    const entryId = getAgeEntryId(ageRange);
    if (entryId) {
      fields[entryId] = String(count);
    }
  }
}
