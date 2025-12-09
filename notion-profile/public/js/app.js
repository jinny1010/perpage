// =====================
// 전역 상태
// =====================
let profiles = [];
let posts = [];
let memory = [];
let bgm = [];
let currentProfileIndex = 0;
let isCharacterPanelOpen = false;
let isBgmPlaying = false;

// =====================
// DOM 요소 캐싱
// =====================
const DOM = {
    // 로딩
    loadingScreen: () => document.getElementById('loadingScreen'),
    
    // 이미지
    bigImg: () => document.getElementById('bigImg'),
    topCircleImg: () => document.getElementById('topCircleImg'),
    smallImg: () => document.getElementById('smallImg'),
    
    // 레이어
    bgLayer: () => document.getElementById('bgLayer'),
    normalShape: () => document.getElementById('normalShape'),
    expandedShape: () => document.getElementById('expandedShape'),
    shapePath: () => document.getElementById('shapePath'),
    expandedShapePath: () => document.getElementById('expandedShapePath'),
    
    // UI 요소
    topTag: () => document.getElementById('topTag'),
    gothicTitle: () => document.getElementById('gothicTitle'),
    swipeText: () => document.getElementById('swipeText'),
    topCircle: () => document.getElementById('topCircle'),
    otherFaces: () => document.getElementById('otherFaces'),
    bgmControl: () => document.getElementById('bgmControl'),
    pillText: () => document.getElementById('pillText'),
    
    // 캐릭터 패널
    characterContent: () => document.getElementById('characterContent'),
    charPanelTitle: () => document.getElementById('charPanelTitle'),
    charPanelSubtitle: () => document.getElementById('charPanelSubtitle'),
    charPanelDesc: () => document.getElementById('charPanelDesc'),
    charType: () => document.getElementById('charType'),
    charElement: () => document.getElementById('charElement'),
    charOrigin: () => document.getElementById('charOrigin'),
    
    // 패널
    postPanel: () => document.getElementById('postPanel'),
    memoryPanel: () => document.getElementById('memoryPanel'),
    postsContainer: () => document.getElementById('postsContainer'),
    memoryGrid: () => document.getElementById('memoryGrid'),
    
    // 포스트 상세
    postDetail: () => document.getElementById('postDetail'),
    postDetailTitle: () => document.getElementById('postDetailTitle'),
    postDetailDate: () => document.getElementById('postDetailDate'),
    postDetailImg: () => document.getElementById('postDetailImg'),
    postDetailBody: () => document.getElementById('postDetailBody'),
    postDetailAuthor: () => document.getElementById('postDetailAuthor'),
    postDetailTags: () => document.getElementById('postDetailTags'),
    postDetailActions: () => document.getElementById('postDetailActions'),
    
    // BGM
    bgmAudio: () => document.getElementById('bgmAudio'),
    bgmBtn: () => document.getElementById('bgmBtn'),
    bgmInfo: () => document.getElementById('bgmInfo'),
};

// =====================
// API 통신
// =====================
async function fetchData() {
    try {
        const response = await fetch('/api/notion?type=all');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        profiles = data.profiles || [];
        posts = data.posts || [];
        memory = data.memory || [];
        bgm = data.bgm || [];
        
        if (profiles.length === 0) {
            throw new Error('No profiles found');
        }
        
        initializeUI();
        hideLoading();
    } catch (error) {
        console.error('Error fetching data:', error);
        showError(error.message);
    }
}

// =====================
// 초기화
// =====================
function initializeUI() {
    loadProfile(0);
    renderPosts();
    renderMemory();
    setupBgm();
}

// =====================
// 프로필 관리
// =====================
function loadProfile(index) {
    const profile = profiles[index];
    if (!profile) return;

    // 이미지 설정
    DOM.bigImg().src = profile.bigImg;
    DOM.topCircleImg().src = profile.topCircle;
    
    const nextProfile = profiles[(index + 1) % profiles.length];
    DOM.smallImg().src = nextProfile?.smallImg || profile.smallImg;
    
    // 텍스트 설정
    DOM.gothicTitle().innerHTML = profile.gothicTitle + 
        '<span class="gothic-sub" id="gothicSub">' + profile.gothicSub + '</span>';
    DOM.pillText().innerHTML = profile.pillText;
    
    // 캐릭터 패널 설정
    DOM.charPanelTitle().textContent = profile.gothicTitle;
    DOM.charPanelSubtitle().textContent = profile.gothicSub;
    DOM.charPanelDesc().textContent = profile.charDesc;
    DOM.charType().textContent = profile.charType;
    DOM.charElement().textContent = profile.charElement;
    DOM.charOrigin().textContent = profile.charOrigin;
    
    // Shape 색상 설정
    DOM.shapePath().setAttribute('fill', profile.shapeColor);
    DOM.expandedShapePath().setAttribute('fill', profile.shapeColor);

    // 플립 상태 적용
    applyFlipState(profile.isFlipped);
}

function applyFlipState(isFlipped) {
    const elementsToFlip = [
        'bgLayer', 'normalShape', 'expandedShape', 'topTag', 
        'gothicTitle', 'swipeText', 'topCircle', 'otherFaces', 
        'characterContent', 'bgmControl'
    ];
    
    elementsToFlip.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('flipped', isFlipped);
        }
    });
}

function swapAll() {
    currentProfileIndex = (currentProfileIndex + 1) % profiles.length;
    
    const bigImg = DOM.bigImg();
    const topCircle = DOM.topCircleImg();
    const smallImg = DOM.smallImg();

    // 페이드 아웃
    bigImg.style.opacity = 0;
    topCircle.style.opacity = 0;
    smallImg.style.opacity = 0;

    setTimeout(() => {
        loadProfile(currentProfileIndex);
        setupBgm();

        // 페이드 인
        setTimeout(() => {
            bigImg.style.opacity = 1;
            topCircle.style.opacity = 1;
            smallImg.style.opacity = 1;
        }, 100);
    }, 200);
}

// =====================
// 캐릭터 패널
// =====================
function toggleCharacterPanel() {
    isCharacterPanelOpen = !isCharacterPanelOpen;
    
    const normalShape = DOM.normalShape();
    const expandedShape = DOM.expandedShape();
    const characterContent = DOM.characterContent();
    const topCircle = DOM.topCircle();
    
    const hideElements = [
        DOM.topTag(), 
        DOM.gothicTitle(), 
        DOM.swipeText(), 
        DOM.otherFaces(), 
        DOM.bgmControl()
    ];
    
    if (isCharacterPanelOpen) {
        normalShape.style.opacity = '0';
        expandedShape.classList.add('show');
        characterContent.classList.add('show');
        topCircle.classList.add('moved');
        hideElements.forEach(el => el?.classList.add('hide'));
    } else {
        normalShape.style.opacity = '1';
        expandedShape.classList.remove('show');
        characterContent.classList.remove('show');
        topCircle.classList.remove('moved');
        hideElements.forEach(el => el?.classList.remove('hide'));
    }
}

// =====================
// 게시글 관리
// =====================
function renderPosts() {
    const container = DOM.postsContainer();
    container.innerHTML = posts.map((post, index) => `
        <div class="post-item" onclick="openPost(${index})">
            <div class="post-thumb">
                <img src="${post.image}" alt="${post.title}">
            </div>
            <div class="post-info">
                <h4>${post.title}</h4>
                <p>${post.preview}</p>
                <div class="post-date">${formatDate(post.date)}</div>
            </div>
        </div>
    `).join('');
}

function openPost(index) {
    const post = posts[index];
    const profile = profiles[currentProfileIndex];
    
    DOM.postDetailTitle().textContent = post.title;
    DOM.postDetailDate().textContent = formatDate(post.date);
    DOM.postDetailImg().src = post.image;
    DOM.postDetailBody().textContent = post.body;
    DOM.postDetailAuthor().textContent = profile.gothicTitle;
    
    DOM.postDetailTags().innerHTML = 
        post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('');
    
    DOM.postDetailActions().innerHTML = `
        <div class="post-action">♡ ${post.likes}</div>
        <div class="post-action">💬 ${post.comments}</div>
        <div class="post-action">↗ Share</div>
    `;
    
    DOM.postDetail().classList.add('open');
}

function closePostDetail() {
    DOM.postDetail().classList.remove('open');
}

// =====================
// 메모리(갤러리) 관리
// =====================
function renderMemory() {
    const container = DOM.memoryGrid();
    container.innerHTML = memory.map(item => `
        <div class="gallery-item">
            <img src="${item.image}" alt="${item.caption || ''}">
        </div>
    `).join('');
}

// =====================
// BGM 관리
// =====================
function setupBgm() {
    const currentBgm = bgm.find(b => b.profileId === profiles[currentProfileIndex]?.id) || bgm[0];
    if (currentBgm) {
        DOM.bgmAudio().src = currentBgm.url;
        DOM.bgmInfo().textContent = `${currentBgm.title} - ${currentBgm.artist}`;
    }
}

function toggleBgm() {
    const audio = DOM.bgmAudio();
    const btn = DOM.bgmBtn();
    
    if (isBgmPlaying) {
        audio.pause();
        btn.classList.remove('playing');
        btn.textContent = '♪';
    } else {
        audio.play();
        btn.classList.add('playing');
        btn.textContent = '▶';
    }
    isBgmPlaying = !isBgmPlaying;
}

// =====================
// 패널 관리
// =====================
function togglePanel(panelName, clickedItem) {
    const postPanel = DOM.postPanel();
    const memoryPanel = DOM.memoryPanel();
    
    // 네비게이션 활성화 상태 업데이트
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    clickedItem.classList.add('active');

    // 캐릭터 패널이 열려있으면 닫기
    if (isCharacterPanelOpen) {
        toggleCharacterPanel();
    }

    // 패널 토글
    if (panelName === 'profile') {
        postPanel.classList.remove('open');
        memoryPanel.classList.remove('open');
    } else if (panelName === 'post') {
        memoryPanel.classList.remove('open');
        postPanel.classList.toggle('open');
    } else if (panelName === 'memory') {
        postPanel.classList.remove('open');
        memoryPanel.classList.toggle('open');
    }
}

function closePanel(panelName) {
    const panel = document.getElementById(panelName + 'Panel');
    panel.classList.remove('open');
    
    // Profile 탭 활성화
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.panel === 'profile') {
            item.classList.add('active');
        }
    });
}

// =====================
// 유틸리티
// =====================
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).replace(/\./g, '.').replace(/ /g, '');
}

function hideLoading() {
    DOM.loadingScreen().classList.add('hide');
}

function showError(message) {
    DOM.loadingScreen().innerHTML = `
        <div class="error-message">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
            <p style="margin-top: 10px; font-size: 0.75rem; color: #999;">
                Check Notion DB settings
            </p>
        </div>
    `;
}

// =====================
// 앱 시작
// =====================
document.addEventListener('DOMContentLoaded', fetchData);
