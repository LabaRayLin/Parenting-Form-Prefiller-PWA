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
    otherName: "",
    otherPhone: "",
    otherRelation: "祖父母",
    otherGender: "女"
  },
  children: [
    { gender: "男", ageRange: "1歲 - 2歲" }
  ],
  address: {
    district: "楊梅區",
    village: "四維里"
  },
  settings: {
    bothPhoneMode: "dad" // dad, mom, both
  }
};

let currentProfile = JSON.parse(localStorage.getItem('parenting_profile')) || DEFAULT_PROFILE;



// Initialize PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered successfully'))
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
  
  // Render views
  populateDistrictDropdown();
  renderProfileSummary();
  
  // If the profile is fresh (names are empty), open settings automatically
  if (!currentProfile.parents.dadName && !currentProfile.parents.momName && !currentProfile.parents.otherName) {
    setTimeout(openSettings, 300);
  }
});

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
  document.getElementById('otherName').value = currentProfile.parents.otherName || '';
  document.getElementById('otherPhone').value = currentProfile.parents.otherPhone || '';
  document.getElementById('otherRelation').value = currentProfile.parents.otherRelation || '祖父母';
  document.getElementById('otherGender').value = currentProfile.parents.otherGender || '女';
  document.getElementById('bothPhoneMode').value = currentProfile.settings.bothPhoneMode || 'dad';
  
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
      otherName: document.getElementById('otherName').value.trim(),
      otherPhone: document.getElementById('otherPhone').value.trim(),
      otherRelation: document.getElementById('otherRelation').value,
      otherGender: document.getElementById('otherGender').value
    },
    children: children,
    address: {
      district: districtSelect.value,
      village: districtSelect.value === '楊梅區' ? villageSelect.value : ''
    },
    settings: {
      bothPhoneMode: document.getElementById('bothPhoneMode').value
    }
  };
  
  localStorage.setItem('parenting_profile', JSON.stringify(currentProfile));
  
  // Update views
  renderProfileSummary();
  initializeTweakCounters();
  
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
  if (currentProfile.parents.otherName) {
    parentsHtml += `${parentsHtml ? '<br>' : ''}👵 其他：${currentProfile.parents.otherName} (${currentProfile.parents.otherPhone || '無電話'}) - ${currentProfile.parents.otherRelation}`;
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

// Scenario 4: Grandparents / Relatives
window.runGrandScenario = function() {
  if (!currentProfile.parents.otherName) {
    alert("請先填寫祖父母/親屬姓名資料！");
    openSettings();
    return;
  }
  
  const fields = getCommonPrefills();
  fields[ENTRIES.parentName] = currentProfile.parents.otherName;
  fields[ENTRIES.parentPhone] = currentProfile.parents.otherPhone;
  
  // Set count based on gender
  if (currentProfile.parents.otherGender === '男') {
    fields[ENTRIES.adultMale] = "1";
  } else {
    fields[ENTRIES.adultFemale] = "1";
  }
  
  // Set status
  const rel = currentProfile.parents.otherRelation;
  if (rel === '祖父母') {
    fields[ENTRIES.statusGrand] = "1";
  } else if (rel === '親屬') {
    fields[ENTRIES.statusRelative] = "1";
  } else if (rel === '保母') {
    fields[ENTRIES.statusNanny] = "1";
  } else {
    fields[ENTRIES.statusOther] = "1";
  }
  
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
