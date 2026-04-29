/**
 * =========================================
 * ANIME MUSIC PLAYER - MAIN SCRIPT
 * =========================================
 * Features:
 * - IndexedDB for permanent browser storage
 * - Full music player with all controls
 * - Upload system with drag & drop
 * - Search, filter, and sort
 * - Responsive design
 * - Keyboard shortcuts
 */

// =========================================
// APP STATE
// =========================================
const state = {
  songs: [],
  currentSongIndex: -1,
  isPlaying: false,
  isShuffled: false,
  repeatMode: 'off', // 'off', 'all', 'one'
  currentPage: 'home',
  searchQuery: '',
  filterType: 'all',
  sortBy: 'newest',
  sidebarCollapsed: false,
  settings: {
    animatedBg: true,
    discRotate: true,
    autoplay: true,
    volume: 70
  },
  songToDelete: null,
  audioContext: null,
  analyser: null
};

// =========================================
// DOM ELEMENTS
// =========================================
const elements = {
  // Loading
  loadingScreen: document.getElementById('loading-screen'),
  app: document.getElementById('app'),

  // Sidebar
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  navItems: document.querySelectorAll('.nav-item'),
  sidebarNowPlaying: document.getElementById('sidebar-now-playing'),
  miniCover: document.getElementById('mini-cover'),
  miniTitle: document.getElementById('mini-title'),
  miniArtist: document.getElementById('mini-artist'),

  // Mobile
  mobileHeader: document.getElementById('mobile-header'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  mobileOverlay: document.getElementById('mobile-overlay'),

  // Main content
  mainContent: document.getElementById('main-content'),
  pages: document.querySelectorAll('.page'),

  // Search & filter
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  filterChips: document.querySelectorAll('.chip'),

  // Home
  statTotalSongs: document.getElementById('stat-total-songs'),
  statTotalArtists: document.getElementById('stat-total-artists'),
  statTotalFavorites: document.getElementById('stat-total-favorites'),
  recentGrid: document.getElementById('recent-grid'),
  favoritesGrid: document.getElementById('favorites-grid'),
  heroUploadBtn: document.getElementById('hero-upload-btn'),

  // Library
  libraryList: document.getElementById('library-list'),
  libraryEmpty: document.getElementById('library-empty'),
  sortBtn: document.getElementById('sort-btn'),
  sortMenu: document.getElementById('sort-menu'),
  sortOptions: document.querySelectorAll('.sort-option'),
  libraryUploadBtn: document.getElementById('library-upload-btn'),

  // Upload
  uploadDropZone: document.getElementById('upload-drop-zone'),
  musicFileInput: document.getElementById('music-file-input'),
  uploadForm: document.getElementById('upload-form'),
  uploadTitle: document.getElementById('upload-title'),
  uploadArtist: document.getElementById('upload-artist'),
  uploadGenre: document.getElementById('upload-genre'),
  coverUpload: document.getElementById('cover-upload'),
  coverFileInput: document.getElementById('cover-file-input'),
  coverPreview: document.getElementById('cover-preview'),
  uploadSubmit: document.getElementById('upload-submit'),
  uploadCancel: document.getElementById('upload-cancel'),

  // Favorites
  favoritesList: document.getElementById('favorites-list'),
  favoritesEmpty: document.getElementById('favorites-empty'),

  // Recently
  recentlyList: document.getElementById('recently-list'),
  recentlyEmpty: document.getElementById('recently-empty'),

  // Settings
  settingAnimatedBg: document.getElementById('setting-animated-bg'),
  settingDiscRotate: document.getElementById('setting-disc-rotate'),
  settingAutoplay: document.getElementById('setting-autoplay'),
  settingVolume: document.getElementById('setting-volume'),
  settingTotalSongs: document.getElementById('setting-total-songs'),
  settingStorageUsed: document.getElementById('setting-storage-used'),
  clearAllBtn: document.getElementById('clear-all-btn'),

  // Full player
  fullPlayer: document.getElementById('full-player'),
  fullPlayerBg: document.getElementById('full-player-bg'),
  fullPlayerClose: document.getElementById('full-player-close'),
  fullDisc: document.getElementById('full-disc'),
  fullDiscImg: document.getElementById('full-disc-img'),
  fullSongTitle: document.getElementById('full-song-title'),
  fullSongArtist: document.getElementById('full-song-artist'),
  fullSongGenre: document.getElementById('full-song-genre'),
  fullProgressBar: document.getElementById('full-progress-bar'),
  fullProgressFill: document.getElementById('full-progress-fill'),
  fullProgressHandle: document.getElementById('full-progress-handle'),
  fullCurrentTime: document.getElementById('full-current-time'),
  fullTotalTime: document.getElementById('full-total-time'),
  fullShuffleBtn: document.getElementById('full-shuffle-btn'),
  fullPrevBtn: document.getElementById('full-prev-btn'),
  fullPlayBtn: document.getElementById('full-play-btn'),
  fullNextBtn: document.getElementById('full-next-btn'),
  fullRepeatBtn: document.getElementById('full-repeat-btn'),
  fullVolBtn: document.getElementById('full-vol-btn'),
  fullVolSlider: document.getElementById('full-vol-slider'),

  // Mini player
  miniPlayer: document.getElementById('mini-player'),
  miniProgress: document.getElementById('mini-progress'),
  miniProgressFill: document.getElementById('mini-progress-fill'),
  miniPlayerCover: document.getElementById('mini-player-cover'),
  miniCoverImg: document.getElementById('mini-cover-img'),
  miniSongInfo: document.getElementById('mini-song-info'),
  miniSongTitle: document.getElementById('mini-song-title'),
  miniSongArtist: document.getElementById('mini-song-artist'),
  miniShuffle: document.getElementById('mini-shuffle'),
  miniPrev: document.getElementById('mini-prev'),
  miniPlay: document.getElementById('mini-play'),
  miniNext: document.getElementById('mini-next'),
  miniRepeat: document.getElementById('mini-repeat'),
  miniExpand: document.getElementById('mini-expand'),
  miniEqualizer: document.getElementById('mini-equalizer'),

  // Modals
  deleteModal: document.getElementById('delete-modal'),
  deleteConfirm: document.getElementById('delete-confirm'),
  deleteCancel: document.getElementById('delete-cancel'),
  clearModal: document.getElementById('clear-modal'),
  clearConfirm: document.getElementById('clear-confirm'),
  clearCancel: document.getElementById('clear-cancel'),

  // Toast
  toastContainer: document.getElementById('toast-container'),

  // Audio
  audio: document.getElementById('audio-element')
};

// =========================================
// INDEXEDDB SETUP
// =========================================
const DB_NAME = 'AnimeMusicDB';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('artist', 'artist', { unique: false });
        store.createIndex('genre', 'genre', { unique: false });
        store.createIndex('favorite', 'favorite', { unique: false });
        store.createIndex('uploadDate', 'uploadDate', { unique: false });
        store.createIndex('lastPlayed', 'lastPlayed', { unique: false });
      }
    };
  });
}

function dbOperation(mode, callback) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllSongs() {
  return dbOperation('readonly', (store) => store.getAll());
}

async function addSong(song) {
  return dbOperation('readwrite', (store) => store.add(song));
}

async function updateSong(song) {
  return dbOperation('readwrite', (store) => store.put(song));
}

async function deleteSongFromDB(id) {
  return dbOperation('readwrite', (store) => store.delete(id));
}

async function clearAllSongsFromDB() {
  return dbOperation('readwrite', (store) => store.clear());
}

// =========================================
// INITIALIZATION
// =========================================
async function init() {
  try {
    await initDB();
    await loadSettings();
    await loadSongs();
    setupEventListeners();
    setupKeyboardShortcuts();
    updateUI();
    hideLoading();
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to initialize app', 'error');
  }
}

function hideLoading() {
  setTimeout(() => {
    elements.loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      elements.loadingScreen.classList.add('hidden');
      elements.app.classList.remove('hidden');
    }, 500);
  }, 2000);
}

async function loadSongs() {
  state.songs = await getAllSongs();
}

// =========================================
// SETTINGS
// =========================================
function loadSettings() {
  const saved = localStorage.getItem('animeMusicSettings');
  if (saved) {
    state.settings = { ...state.settings, ...JSON.parse(saved) };
  }
  applySettings();
}

function saveSettings() {
  localStorage.setItem('animeMusicSettings', JSON.stringify(state.settings));
}

function applySettings() {
  elements.settingAnimatedBg.checked = state.settings.animatedBg;
  elements.settingDiscRotate.checked = state.settings.discRotate;
  elements.settingAutoplay.checked = state.settings.autoplay;
  elements.settingVolume.value = state.settings.volume;
  elements.audio.volume = state.settings.volume / 100;
  elements.fullVolSlider.value = state.settings.volume;

  // Update volume display
  const volDisplay = elements.settingVolume.parentElement.querySelector('.volume-value');
  if (volDisplay) volDisplay.textContent = state.settings.volume + '%';
}

// =========================================
// EVENT LISTENERS
// =========================================
function setupEventListeners() {
  // Sidebar navigation
  elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigate(page);
      // Close mobile sidebar
      elements.sidebar.classList.remove('open');
      elements.mobileOverlay.classList.remove('active');
    });
  });

  // Sidebar toggle
  elements.sidebarToggle.addEventListener('click', () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    elements.sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
  });

  // Mobile menu
  elements.mobileMenuBtn.addEventListener('click', () => {
    elements.sidebar.classList.toggle('open');
    elements.mobileOverlay.classList.toggle('active');
  });

  elements.mobileOverlay.addEventListener('click', () => {
    elements.sidebar.classList.remove('open');
    elements.mobileOverlay.classList.remove('active');
  });

  // View all buttons
  document.querySelectorAll('.view-all').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Hero upload button
  elements.heroUploadBtn.addEventListener('click', () => navigate('upload'));

  // Library upload button
  elements.libraryUploadBtn.addEventListener('click', () => navigate('upload'));

  // Search
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    elements.searchClear.classList.toggle('hidden', !state.searchQuery);
    updateCurrentPage();
  });

  elements.searchClear.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.searchClear.classList.add('hidden');
    updateCurrentPage();
  });

  // Filter chips
  elements.filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      elements.filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filterType = chip.dataset.filter;
      updateCurrentPage();
    });
  });

  // Sort
  elements.sortBtn.addEventListener('click', () => {
    elements.sortMenu.classList.toggle('hidden');
  });

  elements.sortOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      elements.sortOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      state.sortBy = opt.dataset.sort;
      elements.sortMenu.classList.add('hidden');
      renderLibrary();
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sort-dropdown')) {
      elements.sortMenu.classList.add('hidden');
    }
  });

  // Upload - Drag & Drop
  elements.uploadDropZone.addEventListener('click', () => {
    elements.musicFileInput.click();
  });

  elements.uploadDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadDropZone.classList.add('drag-over');
  });

  elements.uploadDropZone.addEventListener('dragleave', () => {
    elements.uploadDropZone.classList.remove('drag-over');
  });

  elements.uploadDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadDropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMusicFile(files[0]);
    }
  });

  elements.musicFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleMusicFile(e.target.files[0]);
    }
  });

  // Cover upload
  elements.coverUpload.addEventListener('click', () => {
    elements.coverFileInput.click();
  });

  elements.coverFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleCoverFile(e.target.files[0]);
    }
  });

  // Upload form
  elements.uploadSubmit.addEventListener('click', submitUpload);
  elements.uploadCancel.addEventListener('click', resetUploadForm);

  // Audio events
  elements.audio.addEventListener('timeupdate', updateProgress);
  elements.audio.addEventListener('loadedmetadata', () => {
    updateTimeDisplay();
  });
  elements.audio.addEventListener('ended', handleSongEnd);
  elements.audio.addEventListener('play', () => {
    state.isPlaying = true;
    updatePlayerUI();
  });
  elements.audio.addEventListener('pause', () => {
    state.isPlaying = false;
    updatePlayerUI();
  });
  elements.audio.addEventListener('error', () => {
    showToast('Error playing audio file', 'error');
    state.isPlaying = false;
    updatePlayerUI();
  });

  // Player controls
  elements.miniPlay.addEventListener('click', togglePlay);
  elements.fullPlayBtn.addEventListener('click', togglePlay);
  elements.miniPrev.addEventListener('click', playPrevious);
  elements.fullPrevBtn.addEventListener('click', playPrevious);
  elements.miniNext.addEventListener('click', playNext);
  elements.fullNextBtn.addEventListener('click', playNext);
  elements.miniShuffle.addEventListener('click', toggleShuffle);
  elements.fullShuffleBtn.addEventListener('click', toggleShuffle);
  elements.miniRepeat.addEventListener('click', toggleRepeat);
  elements.fullRepeatBtn.addEventListener('click', toggleRepeat);

  // Progress bars
  elements.miniProgress.addEventListener('click', seek);
  elements.fullProgressBar.addEventListener('click', seek);

  // Volume
  elements.fullVolSlider.addEventListener('input', (e) => {
    const vol = e.target.value / 100;
    elements.audio.volume = vol;
    state.settings.volume = parseInt(e.target.value);
    saveSettings();
    updateVolumeIcon();
  });

  elements.fullVolBtn.addEventListener('click', toggleMute);

  // Full player
  elements.miniSongInfo.addEventListener('click', openFullPlayer);
  elements.miniPlayerCover.addEventListener('click', openFullPlayer);
  elements.miniExpand.addEventListener('click', openFullPlayer);
  elements.fullPlayerClose.addEventListener('click', closeFullPlayer);

  // Delete modal
  elements.deleteCancel.addEventListener('click', () => {
    elements.deleteModal.classList.add('hidden');
    state.songToDelete = null;
  });

  elements.deleteConfirm.addEventListener('click', async () => {
    if (state.songToDelete !== null) {
      await confirmDeleteSong(state.songToDelete);
    }
    elements.deleteModal.classList.add('hidden');
  });

  // Clear all modal
  elements.clearAllBtn.addEventListener('click', () => {
    elements.clearModal.classList.remove('hidden');
  });

  elements.clearCancel.addEventListener('click', () => {
    elements.clearModal.classList.add('hidden');
  });

  elements.clearConfirm.addEventListener('click', async () => {
    await confirmClearAll();
    elements.clearModal.classList.add('hidden');
  });

  // Settings toggles
  elements.settingAnimatedBg.addEventListener('change', (e) => {
    state.settings.animatedBg = e.target.checked;
    saveSettings();
  });

  elements.settingDiscRotate.addEventListener('change', (e) => {
    state.settings.discRotate = e.target.checked;
    saveSettings();
    updatePlayerUI();
  });

  elements.settingAutoplay.addEventListener('change', (e) => {
    state.settings.autoplay = e.target.checked;
    saveSettings();
  });

  elements.settingVolume.addEventListener('input', (e) => {
    state.settings.volume = parseInt(e.target.value);
    elements.audio.volume = state.settings.volume / 100;
    const volDisplay = e.target.parentElement.querySelector('.volume-value');
    if (volDisplay) volDisplay.textContent = state.settings.volume + '%';
    saveSettings();
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });
  });
}

// =========================================
// KEYBOARD SHORTCUTS
// =========================================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger when typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          playPrevious();
        }
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          playNext();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        changeVolume(5);
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeVolume(-5);
        break;
      case 'KeyM':
        toggleMute();
        break;
      case 'KeyS':
        toggleShuffle();
        break;
      case 'KeyR':
        toggleRepeat();
        break;
      case 'KeyF':
        if (state.currentSongIndex >= 0) {
          const song = state.songs[state.currentSongIndex];
          if (song) toggleFavorite(song.id);
        }
        break;
      case 'Escape':
        if (!elements.fullPlayer.classList.contains('active')) {
          closeFullPlayer();
        }
        break;
    }
  });
}

function changeVolume(delta) {
  let newVol = Math.max(0, Math.min(100, state.settings.volume + delta));
  state.settings.volume = newVol;
  elements.audio.volume = newVol / 100;
  elements.fullVolSlider.value = newVol;
  saveSettings();
  updateVolumeIcon();
}

// =========================================
// NAVIGATION
// =========================================
function navigate(page) {
  state.currentPage = page;

  // Update nav items
  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Update pages
  elements.pages.forEach(p => {
    const pageName = p.id.replace('page-', '');
    p.classList.toggle('active', pageName === page);
  });

  // Update search bar visibility
  const searchPages = ['home', 'library', 'favorites', 'recently'];
  document.getElementById('top-bar').classList.toggle('hidden', !searchPages.includes(page));

  // Update page content
  updateCurrentPage();

  // Scroll to top
  elements.mainContent.scrollTop = 0;
}

function updateCurrentPage() {
  switch (state.currentPage) {
    case 'home':
      renderHome();
      break;
    case 'library':
      renderLibrary();
      break;
    case 'favorites':
      renderFavorites();
      break;
    case 'recently':
      renderRecently();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

// =========================================
// FILTER & SORT
// =========================================
function getFilteredSongs() {
  let songs = [...state.songs];

  // Search
  if (state.searchQuery) {
    songs = songs.filter(s =>
      s.title.toLowerCase().includes(state.searchQuery) ||
      s.artist.toLowerCase().includes(state.searchQuery) ||
      s.genre.toLowerCase().includes(state.searchQuery)
    );
  }

  // Filter
  switch (state.filterType) {
    case 'recent':
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      songs = songs.filter(s => s.uploadDate > weekAgo);
      break;
    case 'favorite':
      songs = songs.filter(s => s.favorite);
      break;
  }

  // Sort
  switch (state.sortBy) {
    case 'newest':
      songs.sort((a, b) => b.uploadDate - a.uploadDate);
      break;
    case 'oldest':
      songs.sort((a, b) => a.uploadDate - b.uploadDate);
      break;
    case 'name':
      songs.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'artist':
      songs.sort((a, b) => a.artist.localeCompare(b.artist));
      break;
  }

  return songs;
}

// =========================================
// RENDER HOME
// =========================================
function renderHome() {
  const totalSongs = state.songs.length;
  const totalArtists = new Set(state.songs.map(s => s.artist)).size;
  const totalFavorites = state.songs.filter(s => s.favorite).length;

  elements.statTotalSongs.textContent = totalSongs;
  elements.statTotalArtists.textContent = totalArtists;
  elements.statTotalFavorites.textContent = totalFavorites;

  // Recently added (last 6)
  const recent = [...state.songs].sort((a, b) => b.uploadDate - a.uploadDate).slice(0, 6);
  elements.recentGrid.innerHTML = recent.length ? recent.map(song => createSongCard(song)).join('') : createEmptyGrid();

  // Favorites (up to 6)
  const favs = state.songs.filter(s => s.favorite).slice(0, 6);
  elements.favoritesGrid.innerHTML = favs.length ? favs.map(song => createSongCard(song)).join('') : createEmptyGrid();
}

function createEmptyGrid() {
  return '<div class="empty-state" style="grid-column: 1/-1; padding: 40px;"><p style="color: var(--text-muted);">No songs yet</p></div>';
}

// =========================================
// RENDER LIBRARY
// =========================================
function renderLibrary() {
  const songs = getFilteredSongs();

  if (songs.length === 0) {
    elements.libraryList.classList.add('hidden');
    elements.libraryEmpty.classList.remove('hidden');
  } else {
    elements.libraryList.classList.remove('hidden');
    elements.libraryEmpty.classList.add('hidden');
    elements.libraryList.innerHTML = songs.map((song, index) => createSongListItem(song, index + 1)).join('');
  }
}

// =========================================
// RENDER FAVORITES
// =========================================
function renderFavorites() {
  let songs = state.songs.filter(s => s.favorite);

  if (state.searchQuery) {
    songs = songs.filter(s =>
      s.title.toLowerCase().includes(state.searchQuery) ||
      s.artist.toLowerCase().includes(state.searchQuery)
    );
  }

  if (songs.length === 0) {
    elements.favoritesList.classList.add('hidden');
    elements.favoritesEmpty.classList.remove('hidden');
  } else {
    elements.favoritesList.classList.remove('hidden');
    elements.favoritesEmpty.classList.add('hidden');
    elements.favoritesList.innerHTML = songs.map(song => createSongCard(song)).join('');
  }
}

// =========================================
// RENDER RECENTLY PLAYED
// =========================================
function renderRecently() {
  let songs = state.songs
    .filter(s => s.lastPlayed)
    .sort((a, b) => b.lastPlayed - a.lastPlayed);

  if (state.searchQuery) {
    songs = songs.filter(s =>
      s.title.toLowerCase().includes(state.searchQuery) ||
      s.artist.toLowerCase().includes(state.searchQuery)
    );
  }

  if (songs.length === 0) {
    elements.recentlyList.classList.add('hidden');
    elements.recentlyEmpty.classList.remove('hidden');
  } else {
    elements.recentlyList.classList.remove('hidden');
    elements.recentlyEmpty.classList.add('hidden');
    elements.recentlyList.innerHTML = songs.map((song, index) => createSongListItem(song, index + 1)).join('');
  }
}

// =========================================
// RENDER SETTINGS
// =========================================
function renderSettings() {
  elements.settingTotalSongs.textContent = state.songs.length + ' songs stored';

  // Calculate storage
  calculateStorage();
}

async function calculateStorage() {
  try {
    let totalBytes = 0;
    state.songs.forEach(song => {
      if (song.musicFile) {
        // Approximate size from base64
        const base64 = song.musicFile.split(',')[1] || song.musicFile;
        totalBytes += (base64.length * 3) / 4;
      }
      if (song.coverFile) {
        const base64 = song.coverFile.split(',')[1] || song.coverFile;
        totalBytes += (base64.length * 3) / 4;
      }
    });

    const mb = (totalBytes / (1024 * 1024)).toFixed(1);
    elements.settingStorageUsed.textContent = mb + ' MB';
  } catch {
    elements.settingStorageUsed.textContent = 'Unknown';
  }
}

// =========================================
// UI COMPONENTS
// =========================================
function createSongCard(song) {
  const isPlaying = state.songs[state.currentSongIndex]?.id === song.id && state.isPlaying;
  return `
    <div class="song-card" data-id="${song.id}">
      <div class="card-cover">
        <div class="card-cover-img" style="background-image: url('${song.coverFile || 'assets/images/default-cover.jpg'}')"></div>
        <div class="card-play-overlay" onclick="app.playSongById(${song.id})">
          <button class="card-play-btn">
            <i class="ph-fill ${isPlaying ? 'ph-pause' : 'ph-play'}"></i>
          </button>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${escapeHtml(song.title)}</div>
        <div class="card-artist">${escapeHtml(song.artist)}</div>
      </div>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="card-action-btn ${song.favorite ? 'favorite' : ''}" onclick="app.toggleFavorite(${song.id})" title="Favorite">
          <i class="ph-fill ${song.favorite ? 'ph-heart' : 'ph-heart'}"></i>
        </button>
        <button class="card-action-btn" onclick="app.confirmDelete(${song.id})" title="Delete">
          <i class="ph-fill ph-trash"></i>
        </button>
      </div>
    </div>
  `;
}

function createSongListItem(song, index) {
  const isPlaying = state.songs[state.currentSongIndex]?.id === song.id;
  return `
    <div class="song-list-item ${isPlaying ? 'playing' : ''}" data-id="${song.id}" onclick="app.playSongById(${song.id})">
      <span class="list-number">${index}</span>
      <div class="list-cover" style="background-image: url('${song.coverFile || 'assets/images/default-cover.jpg'}')"></div>
      <div class="list-info">
        <div class="list-title">${escapeHtml(song.title)}</div>
        <div class="list-artist">${escapeHtml(song.artist)}</div>
      </div>
      <span class="list-genre">${escapeHtml(song.genre)}</span>
      <span class="list-duration">${formatDuration(song.duration)}</span>
      <div class="list-actions" onclick="event.stopPropagation()">
        <button class="list-action-btn ${song.favorite ? 'favorite' : ''}" onclick="app.toggleFavorite(${song.id})" title="Favorite">
          <i class="ph-fill ${song.favorite ? 'ph-heart' : 'ph-heart'}"></i>
        </button>
        <button class="list-action-btn" onclick="app.confirmDelete(${song.id})" title="Delete">
          <i class="ph-fill ph-trash"></i>
        </button>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =========================================
// MUSIC PLAYER
// =========================================
function playSongById(id) {
  const index = state.songs.findIndex(s => s.id === id);
  if (index !== -1) {
    playSong(index);
  }
}

function playSong(index) {
  if (index < 0 || index >= state.songs.length) return;

  const song = state.songs[index];
  if (!song || !song.musicFile) {
    showToast('Audio file not available', 'error');
    return;
  }

  state.currentSongIndex = index;

  // Set audio source
  elements.audio.src = song.musicFile;
  elements.audio.load();

  // Play
  const playPromise = elements.audio.play();
  if (playPromise) {
    playPromise.catch(err => {
      console.error('Play error:', err);
      showToast('Failed to play audio', 'error');
    });
  }

  state.isPlaying = true;

  // Update last played
  song.lastPlayed = Date.now();
  updateSong(song);

  updatePlayerUI();
  updateSidebarNowPlaying();
}

function togglePlay() {
  if (state.currentSongIndex === -1) {
    if (state.songs.length > 0) {
      playSong(0);
    } else {
      showToast('No songs in library', 'info');
    }
    return;
  }

  if (state.isPlaying) {
    elements.audio.pause();
  } else {
    elements.audio.play().catch(err => {
      console.error('Play error:', err);
    });
  }
}

function playNext() {
  if (state.songs.length === 0) return;

  let nextIndex;
  if (state.isShuffled) {
    nextIndex = Math.floor(Math.random() * state.songs.length);
  } else {
    nextIndex = state.currentSongIndex + 1;
    if (nextIndex >= state.songs.length) nextIndex = 0;
  }

  playSong(nextIndex);
}

function playPrevious() {
  if (state.songs.length === 0) return;

  let prevIndex = state.currentSongIndex - 1;
  if (prevIndex < 0) prevIndex = state.songs.length - 1;

  playSong(prevIndex);
}

function handleSongEnd() {
  if (state.repeatMode === 'one') {
    elements.audio.currentTime = 0;
    elements.audio.play();
  } else if (state.repeatMode === 'all' || state.currentSongIndex < state.songs.length - 1) {
    playNext();
  } else {
    state.isPlaying = false;
    updatePlayerUI();
  }
}

function toggleShuffle() {
  state.isShuffled = !state.isShuffled;
  updatePlayerUI();
  showToast(state.isShuffled ? 'Shuffle enabled' : 'Shuffle disabled', 'info');
}

function toggleRepeat() {
  const modes = ['off', 'all', 'one'];
  const currentIndex = modes.indexOf(state.repeatMode);
  state.repeatMode = modes[(currentIndex + 1) % modes.length];
  updatePlayerUI();

  const labels = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' };
  showToast(labels[state.repeatMode], 'info');
}

function seek(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  const time = percent * elements.audio.duration;
  if (!isNaN(time)) {
    elements.audio.currentTime = time;
  }
}

function updateProgress() {
  const { currentTime, duration } = elements.audio;
  if (!duration) return;

  const percent = (currentTime / duration) * 100;

  elements.miniProgressFill.style.width = percent + '%';
  elements.fullProgressFill.style.width = percent + '%';
  elements.fullProgressHandle.style.left = percent + '%';

  elements.fullCurrentTime.textContent = formatTime(currentTime);
  elements.fullTotalTime.textContent = formatTime(duration);
}

function updateTimeDisplay() {
  const duration = elements.audio.duration;
  if (duration) {
    elements.fullTotalTime.textContent = formatTime(duration);
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function toggleMute() {
  elements.audio.muted = !elements.audio.muted;
  updateVolumeIcon();
}

function updateVolumeIcon() {
  const vol = elements.audio.muted ? 0 : elements.audio.volume;
  let icon = 'ph-speaker-high';
  if (vol === 0) icon = 'ph-speaker-x';
  else if (vol < 0.3) icon = 'ph-speaker-low';
  else if (vol < 0.7) icon = 'ph-speaker-none';

  elements.fullVolBtn.innerHTML = `<i class="ph-fill ${icon}"></i>`;
}

// =========================================
// PLAYER UI UPDATE
// =========================================
function updatePlayerUI() {
  const song = state.songs[state.currentSongIndex];
  const playIcon = state.isPlaying ? 'ph-pause' : 'ph-play';

  // Mini player
  elements.miniPlay.innerHTML = `<i class="ph-fill ${playIcon}"></i>`;
  elements.fullPlayBtn.innerHTML = `<i class="ph-fill ${playIcon}"></i>`;

  // Shuffle
  elements.miniShuffle.classList.toggle('active', state.isShuffled);
  elements.fullShuffleBtn.classList.toggle('active', state.isShuffled);

  // Repeat
  elements.miniRepeat.classList.toggle('active', state.repeatMode !== 'off');
  elements.fullRepeatBtn.classList.toggle('active', state.repeatMode !== 'off');

  // Repeat icon
  const repeatIcon = state.repeatMode === 'one' ? 'ph-repeat-once' : 'ph-repeat';
  elements.miniRepeat.innerHTML = `<i class="ph ${repeatIcon}"></i>`;
  elements.fullRepeatBtn.innerHTML = `<i class="ph ${repeatIcon}"></i>`;

  // Equalizer
  elements.miniEqualizer.classList.toggle('playing', state.isPlaying);

  // Song info
  if (song) {
    elements.miniSongTitle.textContent = song.title;
    elements.miniSongArtist.textContent = song.artist;
    elements.miniCoverImg.style.backgroundImage = `url('${song.coverFile || 'assets/images/default-cover.jpg'}')`;

    // Full player
    elements.fullSongTitle.textContent = song.title;
    elements.fullSongArtist.textContent = song.artist;
    elements.fullSongGenre.textContent = song.genre;
    elements.fullDiscImg.style.backgroundImage = `url('${song.coverFile || 'assets/images/default-cover.jpg'}')`;
    elements.fullPlayerBg.style.backgroundImage = `url('${song.coverFile || 'assets/images/default-cover.jpg'}')`;

    // Disc rotation
    if (state.settings.discRotate && state.isPlaying) {
      elements.fullDisc.classList.add('playing');
    } else {
      elements.fullDisc.classList.remove('playing');
    }
  }

  // Update current page to reflect playing state
  updateCurrentPage();
}

function updateSidebarNowPlaying() {
  const song = state.songs[state.currentSongIndex];
  if (song) {
    elements.miniTitle.textContent = song.title;
    elements.miniArtist.textContent = song.artist;
    elements.miniCover.style.backgroundImage = `url('${song.coverFile || 'assets/images/default-cover.jpg'}')`;
  }
}

function openFullPlayer() {
  if (state.currentSongIndex === -1) {
    showToast('Play a song first', 'info');
    return;
  }
  elements.fullPlayer.classList.add('active');
}

function closeFullPlayer() {
  elements.fullPlayer.classList.remove('active');
}

// =========================================
// UPLOAD SYSTEM
// =========================================
let pendingMusicFile = null;
let pendingCoverFile = null;

function handleMusicFile(file) {
  if (!file.type.startsWith('audio/')) {
    showToast('Please upload an audio file', 'error');
    return;
  }

  pendingMusicFile = file;

  // Auto-fill title from filename
  const fileName = file.name.replace(/\.[^/.]+$/, '');
  elements.uploadTitle.value = fileName;

  // Get duration
  const tempAudio = new Audio();
  tempAudio.preload = 'metadata';
  tempAudio.onloadedmetadata = () => {
    URL.revokeObjectURL(tempAudio.src);
  };
  tempAudio.src = URL.createObjectURL(file);

  // Show form
  elements.uploadForm.style.display = 'block';
  elements.uploadForm.scrollIntoView({ behavior: 'smooth' });
  showToast('Audio file loaded. Fill in the details!', 'success');
}

function handleCoverFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please upload an image file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    pendingCoverFile = e.target.result;
    elements.coverPreview.style.backgroundImage = `url('${pendingCoverFile}')`;
    elements.coverPreview.classList.add('has-image');
    elements.coverPreview.innerHTML = '';
  };
  reader.readAsDataURL(file);
}

async function submitUpload() {
  const title = elements.uploadTitle.value.trim();
  const artist = elements.uploadArtist.value.trim();
  const genre = elements.uploadGenre.value;

  if (!title || !artist) {
    showToast('Please fill in title and artist', 'error');
    return;
  }

  if (!pendingMusicFile) {
    showToast('Please select an audio file', 'error');
    return;
  }

  try {
    // Convert files to base64
    const musicFile = await readFileAsDataURL(pendingMusicFile);
    let coverFile = pendingCoverFile;

    // Generate cover if not provided
    if (!coverFile) {
      coverFile = await generateCoverImage(title, artist);
    }

    // Get duration
    const duration = await getAudioDuration(pendingMusicFile);

    const song = {
      title,
      artist,
      genre: genre || 'Other',
      musicFile,
      coverFile,
      duration,
      uploadDate: Date.now(),
      lastPlayed: null,
      favorite: false
    };

    const id = await addSong(song);
    song.id = id;
    state.songs.push(song);

    showToast('Song uploaded successfully!', 'success');
    resetUploadForm();
    updateUI();
    navigate('library');
  } catch (error) {
    console.error('Upload error:', error);
    showToast('Failed to upload song', 'error');
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAudioDuration(file) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    audio.onerror = () => resolve(0);
    audio.src = URL.createObjectURL(file);
  });
}

async function generateCoverImage(title, artist) {
  // Create a canvas-based cover with gradient
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  // Random gradient based on title
  const gradients = [
    ['#b44dff', '#ff6bcb'],
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a9e', '#fecfef'],
  ];
  const gradientIndex = title.length % gradients.length;
  const [color1, color2] = gradients[gradientIndex];

  const grad = ctx.createLinearGradient(0, 0, 500, 500);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 500, 500);

  // Add pattern
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * 500,
      Math.random() * 500,
      Math.random() * 100 + 50,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Add text
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = 'bold 36px Outfit, sans-serif';
  const words = title.split(' ');
  let y = 220;
  if (words.length > 3) {
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
    ctx.fillText(line1, 250, y - 15);
    ctx.fillText(line2, 250, y + 25);
    y = 280;
  } else {
    ctx.fillText(title, 250, y);
    y = 270;
  }

  // Artist
  ctx.font = '24px Outfit, sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText(artist, 250, y + 30);

  return canvas.toDataURL('image/jpeg', 0.9);
}

function resetUploadForm() {
  pendingMusicFile = null;
  pendingCoverFile = null;
  elements.musicFileInput.value = '';
  elements.coverFileInput.value = '';
  elements.uploadTitle.value = '';
  elements.uploadArtist.value = '';
  elements.uploadGenre.value = 'Anime';
  elements.coverPreview.style.backgroundImage = '';
  elements.coverPreview.classList.remove('has-image');
  elements.coverPreview.innerHTML = '<i class="ph ph-image"></i><span>Click to add cover</span>';
  elements.uploadForm.style.display = 'none';
}

// =========================================
// FAVORITES
// =========================================
async function toggleFavorite(id) {
  const song = state.songs.find(s => s.id === id);
  if (!song) return;

  song.favorite = !song.favorite;
  await updateSong(song);

  showToast(song.favorite ? 'Added to favorites' : 'Removed from favorites', 'success');
  updateUI();
}

// =========================================
// DELETE
// =========================================
function confirmDelete(id) {
  state.songToDelete = id;
  elements.deleteModal.classList.remove('hidden');
}

async function confirmDeleteSong(id) {
  try {
    await deleteSongFromDB(id);
    state.songs = state.songs.filter(s => s.id !== id);

    // Update current song index
    if (state.currentSongIndex >= state.songs.length) {
      state.currentSongIndex = state.songs.length - 1;
    }

    showToast('Song deleted', 'success');
    updateUI();
  } catch (error) {
    console.error('Delete error:', error);
    showToast('Failed to delete song', 'error');
  }
}

async function confirmClearAll() {
  try {
    await clearAllSongsFromDB();
    state.songs = [];
    state.currentSongIndex = -1;
    state.isPlaying = false;
    elements.audio.pause();
    elements.audio.src = '';

    showToast('All songs deleted', 'success');
    updateUI();
    navigate('home');
  } catch (error) {
    console.error('Clear all error:', error);
    showToast('Failed to delete all songs', 'error');
  }
}

// =========================================
// UPDATE UI
// =========================================
function updateUI() {
  updateCurrentPage();
  updatePlayerUI();
  updateSidebarNowPlaying();
  updateStats();
}

function updateStats() {
  elements.statTotalSongs.textContent = state.songs.length;
  elements.statTotalArtists.textContent = new Set(state.songs.map(s => s.artist)).size;
  elements.statTotalFavorites.textContent = state.songs.filter(s => s.favorite).length;
}

// =========================================
// TOAST NOTIFICATIONS
// =========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';

  const icons = {
    success: 'ph-check-circle',
    error: 'ph-x-circle',
    info: 'ph-info'
  };

  const titles = {
    success: 'Success',
    error: 'Error',
    info: 'Info'
  };

  toast.innerHTML = `
    <div class="toast-icon ${type}">
      <i class="ph-fill ${icons[type]}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  elements.toastContainer.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =========================================
// GLOBAL APP OBJECT (for inline handlers)
// =========================================
window.app = {
  navigate,
  playSongById,
  toggleFavorite,
  confirmDelete,
  openFullPlayer,
  closeFullPlayer
};

// =========================================
// START APP
// =========================================
document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    elements.sidebar.classList.remove('open');
    elements.mobileOverlay.classList.remove('active');
  }
});


