import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

// ======================================================================
// API KALITLARI — faqat shu yerga tegining
// ----------------------------------------------------------------------
// NASA API   -> sizning shaxsiy kalitingiz allaqachon qo'yilgan.
// SpaceX, ISS (wheretheiss.at), Open-Meteo, USGS, CoinGecko, TheCatAPI,
// ExchangeRate -> BARCHASI KALITSIZ ishlaydigan ochiq (free/public) API'lar,
// hech narsa qo'shish shart emas.
// Aviationstack -> PULLIK/RO'YXATDAN O'TISH talab qiladigan xizmat.
// aviationstack.com saytidan bepul akkaunt oching va olingan kalitni
// pastdagi AVIATIONSTACK_KEY ichiga qo'ying, aks holda "Parvozlar" bo'limi
// kalit kutish holatida ko'rinadi.
// ======================================================================
const NASA_KEY = 'WYSptV2XVTxSQ8WRishSLY0zrGqRw8PqxMXLboUV';
const AVIATIONSTACK_KEY = ''; // <-- BU YERGA o'z Aviationstack kalitingizni qo'ying

const TASHKENT = { lat: 41.2995, lon: 69.2401 };
const UZ_CITIES = [
  { name: 'Toshkent', lat: 41.2995, lon: 69.2401 },
  { name: 'Samarqand', lat: 39.6270, lon: 66.9750 },
  { name: 'Buxoro', lat: 39.7680, lon: 64.4210 },
  { name: "Andijon", lat: 40.7821, lon: 72.3442 },
  { name: "Farg'ona", lat: 40.3894, lon: 71.7864 },
  { name: 'Namangan', lat: 40.9983, lon: 71.6726 },
  { name: 'Nukus', lat: 42.4600, lon: 59.6100 },
  { name: 'Urganch', lat: 41.5500, lon: 60.6333 }
];

// ---------- Dynamic word-level translator for API content ----------
const autoTranslateText = (text, targetLang) => {
  if (!text) return '';
  if (targetLang === 'en') return text;
  const uzDictionary = {
    "Space Station": "Xalqaro Kosmik Stansiya", "astronaut": "astronavt", "cosmonaut": "kosmonavt",
    "Johnson Space Center": "Jonson Kosmik Markazi", "Houston, Texas": "Xyuston, Texas",
    "Mars": "Mars", "Earth": "Yer", "Moon": "Oy", "rocket": "raketa", "launch": "uchirish", "mission": "missiya"
  };
  const ruDictionary = {
    "Space Station": "Международная Космическая Станция", "astronaut": "астронавт", "cosmonaut": "космонавт",
    "Mars": "Марс", "Earth": "Земля", "Moon": "Луна", "rocket": "ракета", "launch": "запуск", "mission": "миссия"
  };
  const dict = targetLang === 'uz' ? uzDictionary : ruDictionary;
  let translated = text;
  Object.keys(dict).forEach(key => { translated = translated.replace(new RegExp(key, 'gi'), dict[key]); });
  return translated;
};

const clampStyle = (lines) => ({ display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' });

// ---------- Site dictionary ----------
const translations = {
  uz: {
    nav: { home: "Asosiy", nasa: "NASA", spacex: "SpaceX", iss: "ISS Tracker", weather: "Ob-havo", crypto: "Kripto", flights: "Parvozlar", transport: "Transport", admin: "Admin" },
    hero: {
      badge: "2026-yil Avgust • Ochiq Data Portali", title: "KOINOT VA GLOBAL DATA INTEGRATSIYASI",
      desc: "Ushbu portal NASA, SpaceX, ISS, USGS, ob-havo, kripto va boshqa ochiq API'lardan real vaqt rejimida foydalanadigan mustaqil loyihadir.",
      stats1: "1,200+ NASA Tasvirlari", stats2: "100% Jonli ISS Telemetriya", stats3: "10 Ta Ochiq API Integratsiyasi", cta: "NASA Arxivini Ochish"
    },
    ticker: { weather: "Toshkent Ob-havosi", earthquake: "So'nggi Zilzila (USGS)", exchange: "USD → UZS Kursi", loading: "Yuklanmoqda...", magnitude: "Kuchi", wind: "Shamol" },
    nasa: {
      title: "NASA Kengaytirilgan Ma'lumotlar Bazasi", apodTitle: "Kunning Astronomik Surati (APOD)",
      galleryTab: "📸 Galereya", marsTab: "🔴 Mars Rover", asteroidsTab: "☄️ Asteroidlar", videoTab: "🎥 Jonli Video",
      searchPlaceholder: "NASA arxivlaridan qidirish...", searchBtn: "Qidirish", prev: "Oldingi", next: "Keyingi",
      detailsTitle: "Batafsil Texnik Ma'lumotlar", date: "Olingan sana:", center: "Tadqiqot Markazi:", nasaId: "NASA ID:",
      marsSubtitle: "Curiosity Rover'ning eng so'nggi suratlari (NASA Mars Photos API)",
      camera: "Kamera:", sol: "Marsdagi kun (Sol):", roverStatus: "Rover holati:",
      astSubtitle: "Bugun Yerga yaqinlashayotgan obyektlar (NASA NeoWs API)",
      astDiameter: "Diametri (taxminan):", astDistance: "Masofa (Oygacha nisbatan):", astHazard: "Xavfli darajasi:", hazardYes: "Ehtiyot bo'lish kerak", hazardNo: "Xavfsiz",
      videoSubtitle: "NASA rasmiy YouTube kanalidan Xalqaro Kosmik Stansiyaning jonli translyatsiyasi"
    },
    spacex: {
      title: "SpaceX — Ilon Mask Raketalari Bazasi", subtitle: "SpaceX ochiq API'si orqali barcha raketalar, xususiyatlari va uchirishlar",
      rocketsTab: "🚀 Raketalar Parki", launchesTab: "📅 Uchirishlar",
      latestLaunch: "So'nggi Uchirish", upcoming: "Kelayotgan Uchirishlar", rocket: "Raketa:", date: "Sana:",
      success: "Natija:", successYes: "Muvaffaqiyatli", successNo: "Muvaffaqiyatsiz", successPending: "Kutilmoqda",
      details: "Tavsif:", flights: "Jami parvozlar:", firstFlight: "Birinchi uchirish:", height: "Balandligi:", mass: "Massasi:",
      diameter: "Diametri:", stages: "Bosqichlar soni:", active: "Faol:", yes: "Ha", no: "Yo'q", costPerLaunch: "Bir uchirish narxi:"
    },
    iss: {
      title: "Xalqaro Kosmik Stansiya — Jonli Kuzatuv", subtitle: "wheretheiss.at ochiq API'si orqali ISS'ning aynan hozirgi holati",
      lat: "Kenglik (Latitude)", lon: "Uzunlik (Longitude)", altitude: "Balandlik", velocity: "Tezlik",
      live: "JONLI", updated: "Yangilandi:", note: "Har 5 soniyada avtomatik yangilanadi. Vizual sxema — badiiy taqdimot, aniq xarita emas."
    },
    weather: {
      title: "O'zbekiston Bo'ylab Ob-havo", subtitle: "Open-Meteo ochiq API'si orqali real vaqtdagi ma'lumotlar",
      wind: "Shamol", loading: "Yuklanmoqda..."
    },
    crypto: {
      title: "Kripto Valyutalar Bozori", subtitle: "CoinGecko ochiq API'si orqali real vaqtdagi narxlar",
      change: "24 soatlik o'zgarish", chartTitle: "Bitcoin — so'nggi 7 kun (USD)"
    },
    flights: {
      title: "Toshkent Aeroporti — Parvozlar Jadvali", subtitle: "Aviationstack API orqali qo'nayotgan/uchayotgan reyslar",
      needKeyTitle: "API kalit kutilmoqda", needKeyDesc: "Bu bo'lim ishlashi uchun aviationstack.com saytidan bepul kalit oling va kodning yuqorisidagi AVIATIONSTACK_KEY ichiga joylashtiring.",
      flight: "Reys:", airline: "Aviakompaniya:", status: "Holati:", departure: "Jo'nash:", arrival: "Qo'nish:"
    },
    catWidget: { title: "Dam Oling! 🐾", subtitle: "Ota-onalar uchun kichik stress-buster", newCat: "Yana bitta mushuk", close: "Yopish" },
    admin: {
      title: "Xavfsizlik va Admin Paneli", passPlaceholder: "Parolni kiriting (20122013)...", loginBtn: "Tizimga Kirish",
      logsTitle: "Foydalanuvchilar Kirish Jurnali", colUser: "Foydalanuvchi IP / ID", colTime: "Kirgan Vaqti", colAction: "Bajarilgan Harakat", colLang: "Til",
      clearLogs: "Loglarni Tozalash", statsTitle: "Statistik Ko'rsatkichlar", totalActions: "Jami Harakatlar",
      mostActiveLang: "Eng Faol Til", langChart: "Til Bo'yicha Faollik Diagrammasi", apiStatus: "Ulangan API'lar Holati"
    },
    footer: { copy: "© 2026 DataStream Live. Barcha ma'lumotlar ochiq API orqali sinxronlangan.", author: "Dasturchi: IT-Kurs O'quvchisi" }
  },
  ru: {
    nav: { home: "Главная", nasa: "НАСА", spacex: "SpaceX", iss: "МКС Трекер", weather: "Погода", crypto: "Крипто", flights: "Рейсы", transport: "Транспорт", admin: "Админ" },
    hero: {
      badge: "Август 2026 • Портал Открытых Данных", title: "ИНТЕГРАЦИЯ КОСМОСА И ГЛОБАЛЬНЫХ ДАННЫХ",
      desc: "Самостоятельный проект, использующий открытые API NASA, SpaceX, МКС, USGS, погоды, крипты и других сервисов в реальном времени.",
      stats1: "1,200+ Изображений НАСА", stats2: "100% Телеметрия МКС", stats3: "10 Открытых API", cta: "Открыть архив NASA"
    },
    ticker: { weather: "Погода в Ташкенте", earthquake: "Последнее землетрясение (USGS)", exchange: "Курс USD → UZS", loading: "Загрузка...", magnitude: "Магнитуда", wind: "Ветер" },
    nasa: {
      title: "Расширенная База Данных НАСА", apodTitle: "Астрономическое фото дня (APOD)",
      galleryTab: "📸 Галерея", marsTab: "🔴 Марсоход", asteroidsTab: "☄️ Астероиды", videoTab: "🎥 Прямой эфир",
      searchPlaceholder: "Поиск по архивам НАСА...", searchBtn: "Искать", prev: "Назад", next: "Вперед",
      detailsTitle: "Подробные Технические Данные", date: "Дата съемки:", center: "Исследовательский Центр:", nasaId: "НАСА ID:",
      marsSubtitle: "Последние снимки марсохода Curiosity (NASA Mars Photos API)",
      camera: "Камера:", sol: "Марсианский день (Sol):", roverStatus: "Статус ровера:",
      astSubtitle: "Объекты, сближающиеся с Землёй сегодня (NASA NeoWs API)",
      astDiameter: "Диаметр (прибл.):", astDistance: "Расстояние (в лунных дистанциях):", astHazard: "Уровень опасности:", hazardYes: "Потенциально опасен", hazardNo: "Безопасен",
      videoSubtitle: "Прямая трансляция МКС с официального YouTube-канала NASA"
    },
    spacex: {
      title: "SpaceX — База Ракет Илона Маска", subtitle: "Все ракеты, характеристики и запуски через открытый API SpaceX",
      rocketsTab: "🚀 Парк Ракет", launchesTab: "📅 Запуски",
      latestLaunch: "Последний запуск", upcoming: "Предстоящие запуски", rocket: "Ракета:", date: "Дата:",
      success: "Результат:", successYes: "Успешно", successNo: "Неудача", successPending: "Ожидается",
      details: "Описание:", flights: "Всего полётов:", firstFlight: "Первый запуск:", height: "Высота:", mass: "Масса:",
      diameter: "Диаметр:", stages: "Кол-во ступеней:", active: "Активна:", yes: "Да", no: "Нет", costPerLaunch: "Цена запуска:"
    },
    iss: {
      title: "МКС — Отслеживание в реальном времени", subtitle: "Текущее положение МКС через открытый API wheretheiss.at",
      lat: "Широта", lon: "Долгота", altitude: "Высота", velocity: "Скорость",
      live: "ЖИВОЕ", updated: "Обновлено:", note: "Автообновление каждые 5 секунд. Визуальная схема условна, не точная карта."
    },
    weather: { title: "Погода по Узбекистану", subtitle: "Данные в реальном времени через Open-Meteo", wind: "Ветер", loading: "Загрузка..." },
    crypto: { title: "Рынок Криптовалют", subtitle: "Цены в реальном времени через CoinGecko", change: "Изменение за 24ч", chartTitle: "Bitcoin — последние 7 дней (USD)" },
    flights: {
      title: "Аэропорт Ташкента — Расписание рейсов", subtitle: "Прилёты/вылеты через Aviationstack API",
      needKeyTitle: "Ожидается API ключ", needKeyDesc: "Получите бесплатный ключ на aviationstack.com и вставьте его в AVIATIONSTACK_KEY в начале кода.",
      flight: "Рейс:", airline: "Авиакомпания:", status: "Статус:", departure: "Вылет:", arrival: "Прилёт:"
    },
    catWidget: { title: "Отдохните! 🐾", subtitle: "Небольшой антистресс для родителей", newCat: "Ещё котик", close: "Закрыть" },
    admin: {
      title: "Панель Безопасности и Администрирования", passPlaceholder: "Введите пароль (20122013)...", loginBtn: "Войти в Систему",
      logsTitle: "Журнал Активности Пользователей", colUser: "Пользователь IP / ID", colTime: "Время Входа", colAction: "Действие", colLang: "Язык",
      clearLogs: "Очистить Логи", statsTitle: "Статистика", totalActions: "Всего действий",
      mostActiveLang: "Самый активный язык", langChart: "Диаграмма активности по языкам", apiStatus: "Статус подключённых API"
    },
    footer: { copy: "© 2026 DataStream Live. Все данные синхронизированы через открытые API.", author: "Разработчик: Студент IT-Курса" }
  },
  en: {
    nav: { home: "Home", nasa: "NASA", spacex: "SpaceX", iss: "ISS Tracker", weather: "Weather", crypto: "Crypto", flights: "Flights", transport: "Transport", admin: "Admin" },
    hero: {
      badge: "August 2026 • Open Data Portal", title: "COSMIC & GLOBAL DATA INTEGRATION",
      desc: "An independent project pulling real-time open data from NASA, SpaceX, ISS, USGS, weather, crypto, and other public APIs.",
      stats1: "1,200+ NASA Images", stats2: "100% Live ISS Telemetry", stats3: "10 Open API Integrations", cta: "Open NASA Archive"
    },
    ticker: { weather: "Tashkent Weather", earthquake: "Latest Earthquake (USGS)", exchange: "USD → UZS Rate", loading: "Loading...", magnitude: "Magnitude", wind: "Wind" },
    nasa: {
      title: "NASA Extended Database", apodTitle: "Astronomy Picture of the Day (APOD)",
      galleryTab: "📸 Gallery", marsTab: "🔴 Mars Rover", asteroidsTab: "☄️ Asteroids", videoTab: "🎥 Live Video",
      searchPlaceholder: "Search NASA archives...", searchBtn: "Search", prev: "Previous", next: "Next",
      detailsTitle: "Detailed Technical Metadata", date: "Date Created:", center: "Research Center:", nasaId: "NASA ID:",
      marsSubtitle: "Curiosity Rover's most recent photos (NASA Mars Photos API)",
      camera: "Camera:", sol: "Martian day (Sol):", roverStatus: "Rover status:",
      astSubtitle: "Objects approaching Earth today (NASA NeoWs API)",
      astDiameter: "Est. diameter:", astDistance: "Distance (lunar distances):", astHazard: "Hazard level:", hazardYes: "Potentially hazardous", hazardNo: "Safe",
      videoSubtitle: "Live ISS stream from NASA's official YouTube channel"
    },
    spacex: {
      title: "SpaceX — Elon Musk's Rocket Fleet", subtitle: "All rockets, specs, and launches via the open SpaceX API",
      rocketsTab: "🚀 Rocket Fleet", launchesTab: "📅 Launches",
      latestLaunch: "Latest Launch", upcoming: "Upcoming Launches", rocket: "Rocket:", date: "Date:",
      success: "Result:", successYes: "Success", successNo: "Failure", successPending: "Pending",
      details: "Details:", flights: "Total flights:", firstFlight: "First flight:", height: "Height:", mass: "Mass:",
      diameter: "Diameter:", stages: "Stages:", active: "Active:", yes: "Yes", no: "No", costPerLaunch: "Cost per launch:"
    },
    iss: {
      title: "International Space Station — Live Tracker", subtitle: "ISS's current position via the open wheretheiss.at API",
      lat: "Latitude", lon: "Longitude", altitude: "Altitude", velocity: "Velocity",
      live: "LIVE", updated: "Updated:", note: "Auto-refreshes every 5 seconds. Visual diagram is stylized, not an accurate map."
    },
    weather: { title: "Weather Across Uzbekistan", subtitle: "Real-time data via the Open-Meteo API", wind: "Wind", loading: "Loading..." },
    crypto: { title: "Crypto Market", subtitle: "Real-time prices via the CoinGecko API", change: "24h change", chartTitle: "Bitcoin — last 7 days (USD)" },
    flights: {
      title: "Tashkent Airport — Flight Schedule", subtitle: "Arrivals/departures via the Aviationstack API",
      needKeyTitle: "API key needed", needKeyDesc: "Get a free key from aviationstack.com and place it in AVIATIONSTACK_KEY at the top of the code.",
      flight: "Flight:", airline: "Airline:", status: "Status:", departure: "Departure:", arrival: "Arrival:"
    },
    catWidget: { title: "Take a Break! 🐾", subtitle: "A tiny stress-buster for parents", newCat: "Another cat", close: "Close" },
    admin: {
      title: "Security & Admin Control Panel", passPlaceholder: "Enter password (20122013)...", loginBtn: "Access System",
      logsTitle: "User Activity Logs", colUser: "User IP / Session ID", colTime: "Timestamp", colAction: "Performed Action", colLang: "Language",
      clearLogs: "Clear Logs", statsTitle: "Statistics", totalActions: "Total Actions",
      mostActiveLang: "Most Active Language", langChart: "Language Activity Chart", apiStatus: "Connected API Status"
    },
    footer: { copy: "© 2026 DataStream Live. Synchronized via open public APIs.", author: "Developer: IT Student" }
  }
};

const themes = {
  dark: { bg: "bg-slate-950 text-slate-100 border-slate-800", accent: "#6366f1" },
  light: { bg: "bg-slate-100 text-slate-900 border-slate-300", accent: "#4f46e5" },
  ultraviolet: { bg: "bg-purple-950 text-purple-100 border-purple-800", accent: "#a855f7" },
  cyber: { bg: "bg-cyan-950 text-cyan-100 border-cyan-800", accent: "#06b6d4" }
};

const WMO_UZ = { 0: "Ochiq havo", 1: "Deyarli ochiq", 2: "Qisman bulutli", 3: "Bulutli", 45: "Tuman", 51: "Mayda yomg'ir", 61: "Yomg'ir", 71: "Qor", 80: "Jala", 95: "Momaqaldiroq" };

export default function DataStreamLiveApp() {
  const [lang, setLang] = useState('uz');
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('home');
  const t = translations[lang];

  // ---- NASA gallery ----
  const [nasaSubTab, setNasaSubTab] = useState('gallery');
  const [searchQuery, setSearchQuery] = useState('space station');
  const [nasaItems, setNasaItems] = useState([]);
  const [nasaIndex, setNasaIndex] = useState(0);
  const [nasaLoading, setNasaLoading] = useState(false);

  // ---- Mars rover ----
  const [marsPhotos, setMarsPhotos] = useState([]);
  const [marsIndex, setMarsIndex] = useState(0);
  const [marsLoading, setMarsLoading] = useState(false);

  // ---- Asteroids ----
  const [asteroids, setAsteroids] = useState([]);
  const [astLoading, setAstLoading] = useState(false);

  // ---- SpaceX ----
  const [spacexSubTab, setSpacexSubTab] = useState('rockets');
  const [spacexRockets, setSpacexRockets] = useState([]);
  const [spacexLatest, setSpacexLatest] = useState(null);
  const [spacexUpcoming, setSpacexUpcoming] = useState([]);
  const [spacexLoading, setSpacexLoading] = useState(false);

  // ---- ISS live tracker ----
  const [issData, setIssData] = useState(null);
  const [issUpdated, setIssUpdated] = useState(null);

  // ---- Weather (multi-city) ----
  const [uzWeather, setUzWeather] = useState([]);

  // ---- Earthquakes (24h list) ----
  const [quakes24h, setQuakes24h] = useState([]);

  // ---- Crypto ----
  const [cryptoPrices, setCryptoPrices] = useState(null);
  const [btcChart, setBtcChart] = useState([]);

  // ---- Flights ----
  const [flights, setFlights] = useState([]);
  const [flightsLoading, setFlightsLoading] = useState(false);

  // ---- Header ticker widgets ----
  const [weather, setWeather] = useState(null);
  const [earthquake, setEarthquake] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [eurRate, setEurRate] = useState(null);

  // ---- APOD hero background ----
  const [apod, setApod] = useState(null);

  // ---- Home page NASA thumbnail gallery ----
  const [homeGallery, setHomeGallery] = useState([]);

  // ---- Cat relief widget ----
  const [catOpen, setCatOpen] = useState(false);
  const [catUrl, setCatUrl] = useState(null);

  // ---- Admin ----
  const [adminPass, setAdminPass] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, user: "192.168.1.45 (User_Uzbekistan)", time: "2026-08-18 12:48:10", action: "NASA Galereyasini ko'rdi", lang: "uz" },
    { id: 2, user: "172.16.0.12 (User_Tashkent)", time: "2026-08-18 12:49:30", action: "Mavzuni Ultraviolet ga o'zgartirdi", lang: "ru" },
    { id: 3, user: "10.0.0.8 (Admin_Session)", time: "2026-08-18 12:51:00", action: "Admin panelga ulanish so'rovi", lang: "en" }
  ]);

  const addLog = (action) => {
    setLogs(prev => [{
      id: Date.now(),
      user: `192.168.1.${Math.floor(Math.random() * 100)} (Guest)`,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action, lang
    }, ...prev]);
  };

  // ---------------- Starfield particle canvas ----------------
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    let particles = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4
    }));
    let mouse = { x: -1000, y: -1000 };
    const handleMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', handleMouse);
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)';
      particles.forEach(p => {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { p.x -= dx * 0.02; p.y -= dy * 0.02; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };
    render();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('mousemove', handleMouse); window.removeEventListener('resize', resize); };
  }, [theme]);

  // ---------------- Data fetchers ----------------
  const fetchNasaMedia = (query) => {
    setNasaLoading(true);
    fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`)
      .then(res => res.json())
      .then(data => {
        const items = (data.collection?.items || []).slice(0, 15).map(item => ({
          title: item.data[0].title,
          desc: item.data[0].description || "Tavsif mavjud emas.",
          date: item.data[0].date_created ? item.data[0].date_created.split('T')[0] : '2026',
          center: item.data[0].center || 'NASA Headquarters',
          nasaId: item.data[0].nasa_id || 'N/A',
          img: item.links?.[0]?.href || ''
        }));
        setNasaItems(items); setNasaIndex(0);
      }).catch(() => {}).finally(() => setNasaLoading(false));
  };

  const fetchMarsPhotos = () => {
    setMarsLoading(true);
    fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_KEY}`)
      .then(res => res.json())
      .then(data => { setMarsPhotos((data.latest_photos || []).slice(0, 12)); setMarsIndex(0); })
      .catch(() => {}).finally(() => setMarsLoading(false));
  };

  const fetchAsteroids = () => {
    setAstLoading(true);
    const today = new Date().toISOString().split('T')[0];
    fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`)
      .then(res => res.json())
      .then(data => setAsteroids(Object.values(data.near_earth_objects || {}).flat().slice(0, 10)))
      .catch(() => {}).finally(() => setAstLoading(false));
  };

  const fetchSpaceX = () => {
    setSpacexLoading(true);
    Promise.all([
      fetch('https://api.spacexdata.com/v4/launches/latest').then(r => r.json()),
      fetch('https://api.spacexdata.com/v4/launches/upcoming').then(r => r.json()),
      fetch('https://api.spacexdata.com/v4/rockets').then(r => r.json())
    ]).then(([latest, upcoming, rockets]) => {
      const rocketName = (id) => rockets.find(r => r.id === id)?.name || 'SpaceX Rocket';
      setSpacexLatest(latest ? { ...latest, rocketName: rocketName(latest.rocket) } : null);
      setSpacexUpcoming((upcoming || []).slice(0, 6).map(l => ({ ...l, rocketName: rocketName(l.rocket) })));
      setSpacexRockets(rockets || []);
    }).catch(() => {}).finally(() => setSpacexLoading(false));
  };

  const fetchIss = () => {
    fetch('https://api.wheretheiss.at/v1/satellites/25544')
      .then(r => r.json())
      .then(d => { setIssData(d); setIssUpdated(new Date()); })
      .catch(() => {});
  };

  const fetchUzWeather = () => {
    Promise.all(UZ_CITIES.map(c =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`)
        .then(r => r.json()).then(d => ({ ...c, ...d.current_weather })).catch(() => ({ ...c }))
    )).then(setUzWeather);
  };

  const fetchQuakes24h = () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${yesterday}&minmagnitude=4&orderby=time&limit=15`)
      .then(r => r.json()).then(d => setQuakes24h(d.features || [])).catch(() => {});
  };

  const fetchCrypto = () => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple&vs_currencies=usd&include_24hr_change=true')
      .then(r => r.json()).then(setCryptoPrices).catch(() => {});
    fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7')
      .then(r => r.json())
      .then(d => setBtcChart((d.prices || []).filter((_, i) => i % 6 === 0).map(([ts, price]) => ({
        day: new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), price: Math.round(price)
      })))).catch(() => {});
  };

  const fetchFlights = () => {
    if (!AVIATIONSTACK_KEY) return;
    setFlightsLoading(true);
    fetch(`https://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_KEY}&arr_iata=TAS`)
      .then(r => r.json()).then(d => setFlights(d.data || []))
      .catch(() => {}).finally(() => setFlightsLoading(false));
  };

  const fetchCat = () => {
    fetch('https://api.thecatapi.com/v1/images/search')
      .then(r => r.json()).then(d => setCatUrl(d?.[0]?.url || null)).catch(() => {});
  };

  const fetchTickerWidgets = () => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${TASHKENT.lat}&longitude=${TASHKENT.lon}&current_weather=true`)
      .then(r => r.json()).then(d => setWeather(d.current_weather)).catch(() => {});
    fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1&orderby=time')
      .then(r => r.json()).then(d => setEarthquake(d.features?.[0] || null)).catch(() => {});
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json()).then(d => { setExchangeRate(d.rates?.UZS || null); if (d.rates?.UZS && d.rates?.EUR) setEurRate(d.rates.UZS / d.rates.EUR); })
      .catch(() => {});
  };

  const fetchApod = () => {
    fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`)
      .then(r => r.json()).then(setApod).catch(() => {});
  };

  const fetchHomeGallery = () => {
    const topics = ['Mars rover', 'SpaceX Falcon', 'Earth from space', 'Astronaut spacewalk', 'Hubble galaxy', 'Moon landing'];
    Promise.all(topics.map(q =>
      fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image`)
        .then(r => r.json())
        .then(d => { const item = d.collection?.items?.[0]; return item ? { title: item.data[0].title, img: item.links?.[0]?.href, query: q } : null; })
        .catch(() => null)
    )).then(results => setHomeGallery(results.filter(Boolean)));
  };

  useEffect(() => {
    fetchNasaMedia(searchQuery);
    fetchTickerWidgets();
    fetchApod();
    fetchSpaceX();
    fetchHomeGallery();
    fetchIss();
    fetchQuakes24h();
    fetchCrypto();
    fetchCat();
  }, []);

  // ISS auto-refresh every 5s while tab is open
  useEffect(() => {
    if (activeTab !== 'iss') return;
    const interval = setInterval(fetchIss, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'nasa' && nasaSubTab === 'mars' && marsPhotos.length === 0) fetchMarsPhotos();
    if (activeTab === 'nasa' && nasaSubTab === 'asteroids' && asteroids.length === 0) fetchAsteroids();
  }, [activeTab, nasaSubTab]);

  useEffect(() => {
    if (activeTab === 'weather' && uzWeather.length === 0) fetchUzWeather();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'flights' && flights.length === 0) fetchFlights();
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNasaMedia(searchQuery);
    addLog(`NASA'da "${searchQuery}" bo'yicha qidiruv bajardi`);
  };

  const langChartData = useMemo(() => {
    const counts = { uz: 0, ru: 0, en: 0 };
    logs.forEach(l => { if (counts[l.lang] !== undefined) counts[l.lang]++; });
    return [{ name: 'UZ', count: counts.uz }, { name: 'RU', count: counts.ru }, { name: 'EN', count: counts.en }];
  }, [logs]);

  const mostActiveLang = useMemo(() => {
    const best = [...langChartData].sort((a, b) => b.count - a.count)[0];
    return best?.count ? best.name : '—';
  }, [langChartData]);

  // ISS marker position for the stylized orbit diagram (artistic, not literal projection)
  const issMarker = useMemo(() => {
    if (!issData) return null;
    const angle = ((issData.longitude + 180) / 360) * 360;
    const rad = (angle * Math.PI) / 180;
    const cx = 150, cy = 150, r = 110;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }, [issData]);

  return (
    <div className={`relative min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${themes[theme].bg}`}>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-50" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-opacity-80 border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div onClick={() => { setActiveTab('home'); addLog("Asosiy sahifaga o'tdi"); }} className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">🌌</div>
          <div>
            <h1 className="font-black text-lg tracking-wider">DATASTREAM LIVE</h1>
            <p className="text-[10px] opacity-60">REAL-TIME COSMIC & GLOBAL DATA NETWORK</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {Object.keys(t.nav).map(key => (
            <button key={key} onClick={() => { setActiveTab(key); addLog(`Bo'limga o'tdi: ${key}`); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
              {t.nav[key]}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
            {['dark', 'light', 'ultraviolet', 'cyber'].map(th => (
              <button key={th} onClick={() => { setTheme(th); addLog(`Mavzu o'zgardi: ${th}`); }}
                className={`w-6 h-6 rounded-lg text-[10px] uppercase font-bold flex items-center justify-center transition ${theme === th ? 'bg-white text-black font-black' : 'opacity-50 hover:opacity-100'}`} title={`Mavzu: ${th}`}>
                {th[0]}
              </button>
            ))}
          </div>
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
            {['uz', 'ru', 'en'].map(l => (
              <button key={l} onClick={() => { setLang(l); addLog(`Til o'zgardi: ${l}`); }}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase transition ${lang === l ? 'bg-indigo-600 text-white' : 'opacity-50 hover:opacity-100'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* LIVE DATA TICKER BAR */}
      <div className="relative z-40 border-b border-white/10 bg-black/30 backdrop-blur-md px-6 py-2 flex flex-wrap items-center gap-6 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="opacity-50">🌤️ {t.ticker.weather}:</span>
          {weather ? <span className="font-bold text-cyan-300">{Math.round(weather.temperature)}°C · {t.ticker.wind} {Math.round(weather.windspeed)} km/h · {WMO_UZ[weather.weathercode] || ''}</span> : <span className="opacity-40">{t.ticker.loading}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-50">🌍 {t.ticker.earthquake}:</span>
          {earthquake ? <span className="font-bold text-amber-300">{earthquake.properties.place} · {t.ticker.magnitude} {earthquake.properties.mag}</span> : <span className="opacity-40">{t.ticker.loading}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-50">💵 USD/EUR → UZS:</span>
          {exchangeRate ? <span className="font-bold text-emerald-300">$1={Math.round(exchangeRate).toLocaleString()} · €1={eurRate ? Math.round(eurRate).toLocaleString() : '—'}</span> : <span className="opacity-40">{t.ticker.loading}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-50">₿ BTC:</span>
          {cryptoPrices?.bitcoin ? <span className="font-bold text-orange-300">${cryptoPrices.bitcoin.usd.toLocaleString()}</span> : <span className="opacity-40">{t.ticker.loading}</span>}
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* HOME */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 md:p-12 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/60 backdrop-blur-2xl">
              {apod?.media_type === 'image' && <img src={apod.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
              <div className="relative max-w-3xl space-y-4">
                <span className="text-xs font-mono px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">{t.hero.badge}</span>
                <h2 className="text-3xl md:text-5xl font-black leading-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">{t.hero.title}</h2>
                <p className="text-sm opacity-70 leading-relaxed">{t.hero.desc}</p>
                <div className="pt-4 flex flex-wrap gap-4 text-xs font-mono">
                  <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/10">{t.hero.stats1}</div>
                  <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/10">{t.hero.stats2}</div>
                  <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/10">{t.hero.stats3}</div>
                </div>
                <button onClick={() => { setActiveTab('nasa'); addLog("Heroдан NASA bo'limiga o'tdi"); }} className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-xs font-bold">{t.hero.cta} →</button>
              </div>
            </div>

            {apod?.title && (
              <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden grid md:grid-cols-2">
                {apod.media_type === 'image' ? <img src={apod.url} alt={apod.title} className="w-full h-72 md:h-full object-cover" /> : <div className="h-72 md:h-full flex items-center justify-center bg-black text-4xl">🎬</div>}
                <div className="p-6 space-y-3">
                  <span className="text-[10px] font-mono px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">{t.nasa.apodTitle} · {apod.date}</span>
                  <h3 className="text-xl font-bold text-indigo-300">{apod.title}</h3>
                  <p className="text-xs opacity-70 leading-relaxed" style={clampStyle(6)}>{autoTranslateText(apod.explanation, lang)}</p>
                </div>
              </div>
            )}

            {homeGallery.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-4">NASA Rasmiy Arxividan Tanlangan Suratlar</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {homeGallery.map((g, i) => (
                    <div key={i} onClick={() => { setActiveTab('nasa'); setNasaSubTab('gallery'); setSearchQuery(g.query); fetchNasaMedia(g.query); addLog(`Galereyadan "${g.query}" tanladi`); }}
                      className="cursor-pointer group relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                      <img src={g.img} alt={g.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 flex items-end p-2">
                        <span className="text-[9px] font-bold leading-tight" style={clampStyle(2)}>{g.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setActiveTab('spacex')} className="cursor-pointer relative h-48 rounded-3xl overflow-hidden border border-white/10 bg-slate-900/80 flex items-center justify-center p-6 text-center hover:border-indigo-500/50 transition">
                <div className="space-y-2"><div className="text-4xl">🚀</div><h3 className="text-lg font-bold">SpaceX Raketalar</h3><p className="text-xs opacity-60">{spacexLatest ? spacexLatest.name : 'Yuklanmoqda...'}</p></div>
              </div>
              <div onClick={() => setActiveTab('iss')} className="cursor-pointer relative h-48 rounded-3xl overflow-hidden border border-white/10 bg-slate-900/80 flex items-center justify-center p-6 text-center hover:border-indigo-500/50 transition">
                <div className="space-y-2"><div className="text-4xl">🛰️</div><h3 className="text-lg font-bold">ISS Jonli Kuzatuv</h3><p className="text-xs opacity-60">{issData ? `${issData.velocity.toFixed(0)} km/soat` : 'Yuklanmoqda...'}</p></div>
              </div>
              <div onClick={() => setActiveTab('transport')} className="cursor-pointer relative h-48 rounded-3xl overflow-hidden border border-white/10 bg-slate-900/80 flex items-center justify-center p-6 text-center hover:border-indigo-500/50 transition">
                <div className="space-y-2"><div className="text-4xl">🚌</div><h3 className="text-lg font-bold">Toshkent Transport</h3><p className="text-xs opacity-60">Avtobus yo'nalishlari</p></div>
              </div>
            </div>
          </div>
        )}

        {/* NASA */}
        {activeTab === 'nasa' && (
          <div className="space-y-8">
            <div><h2 className="text-2xl font-black">{t.nasa.title}</h2><p className="text-xs opacity-60">Real-time NASA Open API & Media Database</p></div>
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
              {['gallery', 'mars', 'asteroids', 'video'].map(sub => (
                <button key={sub} onClick={() => { setNasaSubTab(sub); addLog(`NASA sub-bo'lim: ${sub}`); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${nasaSubTab === sub ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 opacity-70'}`}>
                  {sub === 'gallery' ? t.nasa.galleryTab : sub === 'mars' ? t.nasa.marsTab : sub === 'asteroids' ? t.nasa.asteroidsTab : t.nasa.videoTab}
                </button>
              ))}
            </div>

            {nasaSubTab === 'gallery' && (
              <div className="space-y-6">
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.nasa.searchPlaceholder}
                    className="px-4 py-2 rounded-xl bg-black/40 border border-white/20 text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-64" />
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 font-bold text-xs hover:bg-indigo-500 transition">{t.nasa.searchBtn}</button>
                </form>
                {nasaLoading ? <div className="text-center py-12 text-xs opacity-50 animate-pulse">Yuklanmoqda...</div> : nasaItems.length > 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6 md:p-8 space-y-6">
                    <div className="relative h-96 md:h-[480px] rounded-2xl overflow-hidden group border border-white/10">
                      <img src={nasaItems[nasaIndex].img} alt={nasaItems[nasaIndex].title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <button onClick={() => setNasaIndex(prev => (prev === 0 ? nasaItems.length - 1 : prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 border border-white/20 text-white font-bold flex items-center justify-center hover:bg-indigo-600 transition">❮</button>
                      <button onClick={() => setNasaIndex(prev => (prev === nasaItems.length - 1 ? 0 : prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 border border-white/20 text-white font-bold flex items-center justify-center hover:bg-indigo-600 transition">❯</button>
                      <span className="absolute bottom-4 right-4 bg-black/80 px-4 py-1.5 rounded-full text-xs font-mono border border-white/20">{nasaIndex + 1} / {nasaItems.length}</span>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-indigo-300">{autoTranslateText(nasaItems[nasaIndex].title, lang)}</h3>
                      <p className="text-xs opacity-80 leading-relaxed max-h-40 overflow-y-auto pr-2">{autoTranslateText(nasaItems[nasaIndex].desc, lang)}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs font-mono">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10"><span className="opacity-50 block">{t.nasa.date}</span><span className="font-bold">{nasaItems[nasaIndex].date}</span></div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10"><span className="opacity-50 block">{t.nasa.center}</span><span className="font-bold">{nasaItems[nasaIndex].center}</span></div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10"><span className="opacity-50 block">{t.nasa.nasaId}</span><span className="font-bold text-cyan-400">{nasaItems[nasaIndex].nasaId}</span></div>
                      </div>
                    </div>
                  </div>
                ) : <div className="text-center py-12 text-xs opacity-50">Natija topilmadi.</div>}
              </div>
            )}

            {nasaSubTab === 'mars' && (
              <div className="space-y-6">
                <p className="text-xs opacity-60">{t.nasa.marsSubtitle}</p>
                {marsLoading ? <div className="text-center py-12 text-xs opacity-50 animate-pulse">Yuklanmoqda...</div> : marsPhotos.length > 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6 md:p-8 space-y-6">
                    <div className="relative h-96 rounded-2xl overflow-hidden border border-white/10">
                      <img src={marsPhotos[marsIndex].img_src} alt="Mars" className="w-full h-full object-cover" />
                      <button onClick={() => setMarsIndex(p => (p === 0 ? marsPhotos.length - 1 : p - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 border border-white/20 flex items-center justify-center hover:bg-indigo-600">❮</button>
                      <button onClick={() => setMarsIndex(p => (p === marsPhotos.length - 1 ? 0 : p + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 border border-white/20 flex items-center justify-center hover:bg-indigo-600">❯</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10"><span className="opacity-50 block">{t.nasa.camera}</span><span className="font-bold">{marsPhotos[marsIndex].camera?.full_name}</span></div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10"><span className="opacity-50 block">{t.nasa.sol}</span><span className="font-bold">{marsPhotos[marsIndex].sol}</span></div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10"><span className="opacity-50 block">{t.nasa.roverStatus}</span><span className="font-bold text-emerald-400">{marsPhotos[marsIndex].rover?.status}</span></div>
                    </div>
                  </div>
                ) : <div className="text-center py-12 text-xs opacity-50">Ma'lumot topilmadi.</div>}
              </div>
            )}

            {nasaSubTab === 'asteroids' && (
              <div className="space-y-4">
                <p className="text-xs opacity-60">{t.nasa.astSubtitle}</p>
                {astLoading ? <div className="text-center py-12 text-xs opacity-50 animate-pulse">Yuklanmoqda...</div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {asteroids.map(a => (
                      <div key={a.id} className={`p-4 rounded-2xl border backdrop-blur-xl ${a.is_potentially_hazardous_asteroid ? 'border-rose-500/40 bg-rose-500/5' : 'border-white/10 bg-white/5'}`}>
                        <h4 className="font-bold text-sm text-indigo-300">{a.name}</h4>
                        <div className="mt-2 space-y-1 text-[11px] font-mono opacity-80">
                          <p>{t.nasa.astDiameter} {Math.round(a.estimated_diameter.meters.estimated_diameter_min)}–{Math.round(a.estimated_diameter.meters.estimated_diameter_max)} m</p>
                          <p>{t.nasa.astDistance} {parseFloat(a.close_approach_data[0]?.miss_distance.lunar || 0).toFixed(1)}</p>
                          <p className={a.is_potentially_hazardous_asteroid ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{t.nasa.astHazard} {a.is_potentially_hazardous_asteroid ? t.nasa.hazardYes : t.nasa.hazardNo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {nasaSubTab === 'video' && (
              <div className="space-y-4">
                <p className="text-xs opacity-60">{t.nasa.videoSubtitle}</p>
                <div className="rounded-3xl overflow-hidden border border-white/10 aspect-video">
                  <iframe className="w-full h-full" src="https://www.youtube.com/embed/P9C25Un7xaM" title="NASA ISS Live" allow="autoplay; encrypted-media" allowFullScreen />
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPACEX */}
        {activeTab === 'spacex' && (
          <div className="space-y-8">
            <div><h2 className="text-2xl font-black">{t.spacex.title}</h2><p className="text-xs opacity-60">{t.spacex.subtitle}</p></div>

            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
              {['rockets', 'launches'].map(sub => (
                <button key={sub} onClick={() => { setSpacexSubTab(sub); addLog(`SpaceX sub-bo'lim: ${sub}`); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${spacexSubTab === sub ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10 opacity-70'}`}>
                  {sub === 'rockets' ? t.spacex.rocketsTab : t.spacex.launchesTab}
                </button>
              ))}
            </div>

            {spacexLoading ? <div className="text-center py-12 text-xs opacity-50 animate-pulse">Yuklanmoqda...</div> : (
              <>
                {spacexSubTab === 'rockets' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {spacexRockets.map(r => (
                      <div key={r.id} className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden">
                        {r.flickr_images?.[0] ? <img src={r.flickr_images[0]} alt={r.name} className="w-full h-56 object-cover" /> : <div className="h-56 flex items-center justify-center text-5xl bg-slate-900/60">🚀</div>}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-indigo-300">{r.name}</h3>
                            <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${r.active ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/40 text-rose-400 bg-rose-500/10'}`}>{t.spacex.active} {r.active ? t.spacex.yes : t.spacex.no}</span>
                          </div>
                          <p className="text-xs opacity-70 leading-relaxed" style={clampStyle(3)}>{autoTranslateText(r.description || '—', lang)}</p>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-white/10">
                            <div><span className="opacity-50 block">{t.spacex.height}</span><span className="font-bold">{r.height?.meters} m</span></div>
                            <div><span className="opacity-50 block">{t.spacex.mass}</span><span className="font-bold">{r.mass?.kg?.toLocaleString()} kg</span></div>
                            <div><span className="opacity-50 block">{t.spacex.diameter}</span><span className="font-bold">{r.diameter?.meters} m</span></div>
                            <div><span className="opacity-50 block">{t.spacex.stages}</span><span className="font-bold">{r.stages}</span></div>
                            <div><span className="opacity-50 block">{t.spacex.firstFlight}</span><span className="font-bold">{r.first_flight}</span></div>
                            <div><span className="opacity-50 block">{t.spacex.costPerLaunch}</span><span className="font-bold">${(r.cost_per_launch / 1e6).toFixed(0)}M</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {spacexSubTab === 'launches' && (
                  <div className="space-y-8">
                    {spacexLatest && (
                      <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden grid md:grid-cols-2">
                        {spacexLatest.links?.patch?.large ? <div className="flex items-center justify-center bg-slate-900/60 p-10"><img src={spacexLatest.links.patch.large} alt="" className="w-56 h-56 object-contain" /></div> : <div className="h-56 flex items-center justify-center text-5xl bg-slate-900/60">🚀</div>}
                        <div className="p-6 space-y-3">
                          <span className="text-[10px] font-mono px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">{t.spacex.latestLaunch}</span>
                          <h3 className="text-xl font-bold">{spacexLatest.name}</h3>
                          <p className="text-xs opacity-70 leading-relaxed" style={clampStyle(5)}>{autoTranslateText(spacexLatest.details || '—', lang)}</p>
                          <div className="grid grid-cols-2 gap-3 pt-3 text-[11px] font-mono">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10"><span className="opacity-50 block">{t.spacex.rocket}</span><span className="font-bold">{spacexLatest.rocketName}</span></div>
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10"><span className="opacity-50 block">{t.spacex.date}</span><span className="font-bold">{spacexLatest.date_utc?.split('T')[0]}</span></div>
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10 col-span-2">
                              <span className="opacity-50 block">{t.spacex.success}</span>
                              <span className={`font-bold ${spacexLatest.success === true ? 'text-emerald-400' : spacexLatest.success === false ? 'text-rose-400' : 'text-amber-400'}`}>{spacexLatest.success === true ? t.spacex.successYes : spacexLatest.success === false ? t.spacex.successNo : t.spacex.successPending}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-4">{t.spacex.upcoming}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {spacexUpcoming.map(l => (
                          <div key={l.id} className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-2">
                            <h4 className="font-bold text-sm text-indigo-300">{l.name}</h4>
                            <p className="text-[11px] font-mono opacity-70">{t.spacex.rocket} {l.rocketName}</p>
                            <p className="text-[11px] font-mono opacity-70">{t.spacex.date} {l.date_utc?.split('T')[0]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ISS TRACKER */}
        {activeTab === 'iss' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black">{t.iss.title}</h2>
              <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">● {t.iss.live}</span>
            </div>
            <p className="text-xs opacity-60">{t.iss.subtitle}</p>

            {issData ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6 flex items-center justify-center">
                  <svg viewBox="0 0 300 300" className="w-full max-w-xs">
                    <circle cx="150" cy="150" r="110" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="150" cy="150" r="70" fill="rgba(6,182,212,0.15)" stroke="rgba(6,182,212,0.5)" strokeWidth="2" />
                    <text x="150" y="155" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.5)" fontFamily="monospace">EARTH</text>
                    {issMarker && (
                      <g>
                        <circle cx={issMarker.x} cy={issMarker.y} r="6" fill="#f59e0b" />
                        <circle cx={issMarker.x} cy={issMarker.y} r="10" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6">
                          <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <text x={issMarker.x} y={issMarker.y - 14} textAnchor="middle" fontSize="9" fill="#f59e0b" fontFamily="monospace">ISS</text>
                      </g>
                    )}
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-4 content-start">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><span className="text-[10px] opacity-50 block uppercase">{t.iss.lat}</span><span className="text-xl font-bold font-mono text-indigo-300">{issData.latitude.toFixed(4)}°</span></div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><span className="text-[10px] opacity-50 block uppercase">{t.iss.lon}</span><span className="text-xl font-bold font-mono text-indigo-300">{issData.longitude.toFixed(4)}°</span></div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><span className="text-[10px] opacity-50 block uppercase">{t.iss.altitude}</span><span className="text-xl font-bold font-mono text-cyan-300">{issData.altitude.toFixed(1)} km</span></div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><span className="text-[10px] opacity-50 block uppercase">{t.iss.velocity}</span><span className="text-xl font-bold font-mono text-emerald-300">{issData.velocity.toFixed(0)} km/soat</span></div>
                  <div className="col-span-2 text-[10px] font-mono opacity-50">{t.iss.updated} {issUpdated?.toLocaleTimeString()}</div>
                </div>
              </div>
            ) : <div className="text-center py-12 text-xs opacity-50 animate-pulse">Yuklanmoqda...</div>}
            <p className="text-[10px] opacity-40 italic">{t.iss.note}</p>
          </div>
        )}

        {/* WEATHER */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-black">{t.weather.title}</h2><p className="text-xs opacity-60">{t.weather.subtitle}</p></div>
            {uzWeather.length === 0 ? <div className="text-center py-12 text-xs opacity-50 animate-pulse">{t.weather.loading}</div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {uzWeather.map(c => (
                  <div key={c.name} className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-2">
                    <h4 className="font-bold text-sm text-indigo-300">{c.name}</h4>
                    {c.temperature !== undefined ? (
                      <>
                        <p className="text-3xl font-black">{Math.round(c.temperature)}°C</p>
                        <p className="text-[11px] font-mono opacity-60">{WMO_UZ[c.weathercode] || ''}</p>
                        <p className="text-[11px] font-mono opacity-60">{t.weather.wind}: {Math.round(c.windspeed)} km/h</p>
                      </>
                    ) : <p className="text-xs opacity-40">—</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CRYPTO */}
        {activeTab === 'crypto' && (
          <div className="space-y-8">
            <div><h2 className="text-2xl font-black">{t.crypto.title}</h2><p className="text-xs opacity-60">{t.crypto.subtitle}</p></div>
            {cryptoPrices ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[['bitcoin', 'BTC', '₿'], ['ethereum', 'ETH', 'Ξ'], ['binancecoin', 'BNB', '🔶'], ['solana', 'SOL', '◎'], ['ripple', 'XRP', '✕']].map(([id, sym, icon]) => (
                  <div key={id} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-1">
                    <p className="text-xs opacity-60">{icon} {sym}</p>
                    <p className="text-lg font-black">${cryptoPrices[id]?.usd?.toLocaleString()}</p>
                    <p className={`text-[11px] font-mono font-bold ${cryptoPrices[id]?.usd_24h_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {cryptoPrices[id]?.usd_24h_change >= 0 ? '▲' : '▼'} {Math.abs(cryptoPrices[id]?.usd_24h_change || 0).toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-12 text-xs opacity-50 animate-pulse">Yuklanmoqda...</div>}

            {btcChart.length > 0 && (
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-4">{t.crypto.chartTitle}</h3>
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={btcChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                      <Line type="monotone" dataKey="price" stroke={themes[theme].accent} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FLIGHTS */}
        {activeTab === 'flights' && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-black">{t.flights.title}</h2><p className="text-xs opacity-60">{t.flights.subtitle}</p></div>
            {!AVIATIONSTACK_KEY ? (
              <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/30 backdrop-blur-xl text-center max-w-xl mx-auto space-y-3">
                <div className="text-3xl">🔑</div>
                <h3 className="text-lg font-bold text-amber-300">{t.flights.needKeyTitle}</h3>
                <p className="text-xs opacity-70 leading-relaxed">{t.flights.needKeyDesc}</p>
              </div>
            ) : flightsLoading ? (
              <div className="text-center py-12 text-xs opacity-50 animate-pulse">Yuklanmoqda...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flights.map((f, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-1 text-xs font-mono">
                    <p><span className="opacity-50">{t.flights.flight}</span> <span className="font-bold">{f.flight?.iata}</span></p>
                    <p><span className="opacity-50">{t.flights.airline}</span> <span className="font-bold">{f.airline?.name}</span></p>
                    <p><span className="opacity-50">{t.flights.status}</span> <span className="font-bold">{f.flight_status}</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRANSPORT */}
        {activeTab === 'transport' && (
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-center max-w-2xl mx-auto space-y-4">
            <div className="text-4xl">🚌</div>
            <h2 className="text-2xl font-bold">Toshkent Shahri Transport Tizimi</h2>
            <p className="text-xs opacity-70 leading-relaxed">
              Bu bo'limga Toshkent shahri avtobus marshrutlari va jadvali API orqali ulash uchun tayyorlangan. Rasmiy ochiq ma'lumotlar taqdim etilishi bilan avtomatik tarzda jonli xaritalar va marshrutlar integratsiya qilinadi.
            </p>
          </div>
        )}

        {/* ADMIN */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {!isAdmin ? (
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-md mx-auto space-y-4">
                <h2 className="text-xl font-bold text-center">{t.admin.title}</h2>
                <form onSubmit={(e) => { e.preventDefault(); if (adminPass === '20122013') { setIsAdmin(true); addLog("Admin panelga muvaffaqiyatli kirdi"); } else alert("Parol noto'g'ri!"); }} className="space-y-4">
                  <input type="password" placeholder={t.admin.passPlaceholder} value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-xs focus:outline-none focus:border-indigo-500" />
                  <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 font-bold text-xs hover:bg-indigo-500 transition">{t.admin.loginBtn}</button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"><p className="text-[10px] uppercase tracking-wider opacity-50">{t.admin.totalActions}</p><p className="text-3xl font-black text-indigo-300">{logs.length}</p></div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"><p className="text-[10px] uppercase tracking-wider opacity-50">{t.admin.mostActiveLang}</p><p className="text-3xl font-black text-emerald-300">{mostActiveLang}</p></div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-wider opacity-50">{t.admin.apiStatus}</p>
                    <p className="text-xs font-mono mt-1">
                      {['NASA', 'SpaceX', 'ISS', 'USGS', 'Open-Meteo', 'CoinGecko', 'ExchangeRate', 'TheCatAPI'].map(api => (
                        <span key={api} className="inline-block px-2 py-1 mb-1 mr-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">● {api}</span>
                      ))}
                      <span className={`inline-block px-2 py-1 mb-1 mr-1 rounded-lg border ${AVIATIONSTACK_KEY ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>● Aviationstack {AVIATIONSTACK_KEY ? '' : '(kalit kerak)'}</span>
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-4">{t.admin.langChart}</h3>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={langChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                        <Bar dataKey="count" fill={themes[theme].accent} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-indigo-300">{t.admin.logsTitle}</h2>
                    <button onClick={() => setLogs([])} className="px-3 py-1.5 bg-rose-600/30 border border-rose-500 text-rose-300 rounded-xl text-xs">{t.admin.clearLogs}</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-black/40 border-b border-white/10"><tr><th className="p-3">{t.admin.colUser}</th><th className="p-3">{t.admin.colTime}</th><th className="p-3">{t.admin.colAction}</th><th className="p-3">{t.admin.colLang}</th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {logs.map(log => (
                          <tr key={log.id} className="hover:bg-white/5">
                            <td className="p-3 text-cyan-400">{log.user}</td><td className="p-3 opacity-60">{log.time}</td><td className="p-3">{log.action}</td><td className="p-3 uppercase font-bold text-indigo-400">{log.lang}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* CAT RELIEF FLOATING WIDGET */}
      <button onClick={() => { setCatOpen(true); if (!catUrl) fetchCat(); addLog("Mushuk vidjetini ochdi"); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 shadow-xl shadow-pink-500/30 flex items-center justify-center text-2xl hover:scale-110 transition">
        🐾
      </button>
      {catOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6" onClick={() => setCatOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-sm w-full rounded-3xl border border-white/10 bg-slate-900 p-6 space-y-4 text-center">
            <h3 className="text-lg font-bold text-pink-300">{t.catWidget.title}</h3>
            <p className="text-xs opacity-60">{t.catWidget.subtitle}</p>
            <div className="rounded-2xl overflow-hidden border border-white/10 aspect-square bg-black/40 flex items-center justify-center">
              {catUrl ? <img src={catUrl} alt="cat" className="w-full h-full object-cover" /> : <span className="text-xs opacity-40 animate-pulse">Yuklanmoqda...</span>}
            </div>
            <div className="flex gap-3">
              <button onClick={fetchCat} className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 transition text-xs font-bold">{t.catWidget.newCat}</button>
              <button onClick={() => setCatOpen(false)} className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-xs font-bold">{t.catWidget.close}</button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 border-t border-white/10 bg-black/40 py-6 px-6 mt-16 backdrop-blur-md text-xs opacity-70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>{t.footer.copy}</p>
          <p className="font-mono">{t.footer.author}</p>
        </div>
      </footer>
    </div>
  );
}