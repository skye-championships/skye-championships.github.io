// ===================================================================
//  إعدادات البطولة — كل شي يخص البطولة الحالية تعدله من هنا فقط
//  لبطولة جديدة: غيّر id وباقي القيم، والبيانات القديمة تبقى محفوظة
// ===================================================================
window.TOURNAMENT = {
  // معرّف البطولة في قاعدة البيانات. غيّره لكل بطولة جديدة (حروف إنجليزية وأرقام و - فقط)
  id: "fortnite-boxfight-01",

  // عنوان تبويب المتصفح
  pageTitle: "Skye Championships",

  // الشعار أعلى الصفحة: main بلون عادي و accent بلون الثيم
  logo: { main: "BOX", accent: "CUP" },

  // اسم اللعبة (يطلع في الشارة الصغيرة)
  game: "FORTNITE",

  // نوع البطولة: main بلون الثيم و tag بجانبه
  mode: { main: "Box Fight", tag: "1v1" },

  // الكلمة الكبيرة الشفافة خلف البطاقة العلوية (اتركها "" لإخفائها)
  watermark: "1V1",

  // الواجهة الترحيبية
  welcome: {
    show: true,                       // false = يدخل الزائر على الجدول مباشرة
    big: ["Fortnite", "Box Fight"],   // سطرين بخط كبير
    sub: "TOURNAMENT",                // سطر صغير متباعد الحروف
    button: "Enter",
    buttonAr: "ادخل البطولة",
  },

  // معلومات تطلع في الواجهة والبطاقة العلوية. عدد اللاعبين ينضاف تلقائيا
  // num: true يخلي القيمة بخط الأرقام العريض
  facts: [
    { label: "الجوائز 👑", value: "250", unit: "ريال", num: true },
    // { label: "التاريخ", value: "١٥ نوفمبر" },
  ],

  // روابط اختيارية (قوانين، تسجيل، بث...). اتركها فاضية إذا ما تبي
  links: [
    // { label: "قوانين البطولة", url: "https://example.com/rules" },
  ],

  // ------------------------------------------------------------------
  //  محتوى صفحات الموقع. أي قسم تخليه فاضي [] تختفي صفحته من القائمة
  // ------------------------------------------------------------------

  // نبذة تطلع في الصفحة الرئيسية
  about: "بطولة Box Fight فردية مفتوحة لكل لاعبين فورتنايت. كل لاعب يواجه خصمه في بوكس فايت، والفايز يتأهل للدور اللي بعده لين يطلع بطل واحد.",

  // موعد بداية البطولة (يطلع عداد تنازلي في الرئيسية). اتركه "" إذا ما تبي عداد
  // الصيغة: سنة-شهر-يومTساعة:دقيقة:ثانية+03:00 (توقيت السعودية)
  startDate: "2026-11-14T20:00:00+03:00",

  // التسجيل: open يفتح أو يقفل، url رابط نموذج التسجيل (Google Form مثلا)
  registration: {
    open: true,
    url: "",
    note: "التسجيل مجاني ومفتوح لين تكتمل المقاعد. تأكد إن اسمك في اللعبة نفس الاسم اللي تسجل فيه.",
  },

  // توزيع الجوائز
  prizes: [
    { place: "المركز الأول", value: "150", unit: "ريال" },
    { place: "المركز الثاني", value: "70", unit: "ريال" },
    { place: "المركز الثالث", value: "30", unit: "ريال" },
  ],

  // مواعيد الأدوار
  schedule: [
    { title: "دور الـ128 ودور الـ64", time: "8:00 م", note: "BO1" },
    { title: "دور الـ32", time: "9:00 م", note: "BO1" },
    { title: "دور الـ16 وربع النهائي", time: "9:45 م", note: "BO3" },
    { title: "نصف النهائي والنهائي", time: "10:30 م", note: "BO3" },
  ],

  // القوانين: كل قسم له عنوان ونقاط
  rules: [
    { title: "طريقة اللعب", items: [
      "البطولة فردية 1v1 بنظام خروج المغلوب.",
      "الأدوار الأولى قيم واحد (BO1)، ومن دور الـ16 تصير أفضل من ثلاث (BO3).",
      "الماب والإعدادات يحددها المشرفين قبل بداية البطولة.",
    ]},
    { title: "الحضور", items: [
      "لازم تكون جاهز قبل موعد دورك بخمس دقايق.",
      "إذا تأخرت عشر دقايق عن موعد مباراتك تنحسب خسارة.",
      "إذا فصل النت عندك في نص القيم، يعاد القيم مرة وحدة فقط.",
    ]},
    { title: "اللعب النظيف", items: [
      "يمنع أي غش أو استغلال أخطاء اللعبة.",
      "يمنع تبديل اللاعب أو اللعب بحساب ثاني.",
      "احترم خصمك والمشرفين، والإساءة تعرضك للاستبعاد.",
      "قرار المشرفين نهائي.",
    ]},
  ],

  // الأسئلة الشائعة
  faq: [
    { q: "كم سعر المشاركة؟", a: "المشاركة مجانية." },
    { q: "على أي منصة؟", a: "كل المنصات مسموحة: PC وبلايستيشن وإكس بوكس." },
    { q: "كيف أعرف مين خصمي؟", a: "ادخل صفحة اللاعبين وابحث عن اسمك، تطلع لك كل مبارياتك وخصمك الجاي." },
    { q: "متى تنصرف الجوائز؟", a: "خلال ثلاثة أيام من نهاية البطولة." },
  ],

  // أبطال البطولات السابقة (الأحدث أول)
  champions: [
    // { edition: "البطولة الأولى", date: "أكتوبر 2026", name: "Shadow" },
  ],

  // أول دور يصير فيه بست أوف ٣ (عدد اللاعبين في الدور): 2 النهائي، 4 نصف النهائي، 8، 16، 32...
  bo3From: 16,

  // أقصى عدد لاعبين
  maxPlayers: 128,

  // الثيمات: تقدر تعدل الألوان أو تضيف ثيم جديد بنفس الشكل. light: true للثيمات الفاتحة
  defaultSkin: "red",
  skins: {
    red: {
      name: "أحمر", swatch: ["#e3122f", "#0a0a0c"],
      colors: {},  // الألوان الافتراضية موجودة في index.html
    },
    sky: {
      name: "سماوي", swatch: ["#1e9dff", "#ffffff"], light: true,
      colors: {
        "bg": "#1e9dff", "glow": "#ffffff70", "on-bg": "#ffffff", "on-bg-mute": "#e4f3ff",
        "panel": "#ffffff", "panel2": "#eef7ff", "line": "#c6e2ff", "fg": "#0a2350", "mute": "#5b7aa8",
        "acc": "#0a3fd6", "acc-fg": "#ffffff", "hi": "#0a3fd6", "hi-bg": "#ffe76a66", "live": "#ff9100",
        "b1": "#1e9dff", "b3": "#0a3fd6", "shadow": "#0a3fd640",
        "logo-acc": "#ffe14d", "chip-bg": "#0a3fd6", "chip-fg": "#ffffff", "live-text": "#e07a00",
        "box-bg": "#ffffff", "box-line": "#c6e2ff", "box-fg": "#0a2350",
        "label-acc": "#ffe14d", "cta-bg": "#ffe14d", "cta-fg": "#0a2350",
      },
    },
    night: {
      name: "الليل", swatch: ["#5a24d4", "#ffd400"],
      colors: {
        "bg": "#0e0b1f", "glow": "#5a24d488", "on-bg": "#f3f1ff", "on-bg-mute": "#9a93c9",
        "panel": "#17123a", "panel2": "#1f1850", "line": "#3a3080", "fg": "#f3f1ff", "mute": "#9a93c9",
        "acc": "#ffd400", "acc-fg": "#1a1300", "hi": "#ffd400", "hi-bg": "#ffd40024", "live": "#2fc5ff",
        "b1": "#2fc5ff", "b3": "#ffd400",
      },
    },
    legendary: {
      name: "أسطوري", swatch: ["#ff8a1f", "#0d0906"],
      colors: {
        "bg": "#0d0906", "glow": "#ff8a1f40", "on-bg": "#fff4e8", "on-bg-mute": "#b9a48f",
        "panel": "#17110c", "panel2": "#211810", "line": "#3a2a1c", "fg": "#fff4e8", "mute": "#a08b75",
        "acc": "#ff8a1f", "acc-fg": "#1a0d00", "hi": "#ffa040", "hi-bg": "#ff8a1f22", "live": "#ffd27a",
        "b1": "#fff4e8", "b3": "#ffa040",
      },
    },
    storm: {
      name: "العاصفة", swatch: ["#c45cff", "#120a24"],
      colors: {
        "bg": "#120a24", "glow": "#a43cff55", "on-bg": "#f4ecff", "on-bg-mute": "#a596c4",
        "panel": "#1b1233", "panel2": "#241843", "line": "#3b2a66", "fg": "#f4ecff", "mute": "#9d8dc0",
        "acc": "#c45cff", "acc-fg": "#ffffff", "hi": "#e08cff", "hi-bg": "#c45cff26", "live": "#5ce1ff",
        "b1": "#5ce1ff", "b3": "#e08cff",
      },
    },
    camo: {
      name: "الغابة", swatch: ["#7bd35a", "#0b120c"],
      colors: {
        "bg": "#0b120c", "glow": "#3fae4f40", "on-bg": "#eef5ea", "on-bg-mute": "#9db09a",
        "panel": "#131c14", "panel2": "#1a261b", "line": "#2c3d2d", "fg": "#eef5ea", "mute": "#8ea58b",
        "acc": "#7bd35a", "acc-fg": "#0b1a06", "hi": "#9be27d", "hi-bg": "#7bd35a22", "live": "#f2d35b",
        "b1": "#eef5ea", "b3": "#9be27d",
      },
    },
    desert: {
      name: "الصحراء", swatch: ["#d9c29b", "#b8561b"], light: true,
      colors: {
        "bg": "#e9dcc4", "glow": "#ffffff80", "on-bg": "#2b2116", "on-bg-mute": "#6e5d47",
        "panel": "#f8f2e7", "panel2": "#efe5d3", "line": "#d6c6a8", "fg": "#2b2116", "mute": "#7d6b52",
        "acc": "#b8561b", "acc-fg": "#ffffff", "hi": "#b8561b", "hi-bg": "#b8561b22", "live": "#d97706",
        "b1": "#6e5d47", "b3": "#b8561b", "shadow": "#7a5a3030",
        "logo-acc": "#b8561b", "chip-bg": "#2b2116", "chip-fg": "#f8f2e7", "live-text": "#b45309",
        "box-bg": "#2b2116", "box-line": "#2b2116", "box-fg": "#f8f2e7",
        "label-acc": "#b8561b", "cta-bg": "#b8561b", "cta-fg": "#ffffff",
      },
    },
    ocean: {
      name: "المحيط", swatch: ["#18d6c3", "#03161c"],
      colors: {
        "bg": "#03161c", "glow": "#00c2b250", "on-bg": "#e8fbff", "on-bg-mute": "#8fb9c2",
        "panel": "#0a2129", "panel2": "#0f2c36", "line": "#1d4552", "fg": "#e8fbff", "mute": "#85aab3",
        "acc": "#18d6c3", "acc-fg": "#002420", "hi": "#4fe8d8", "hi-bg": "#18d6c322", "live": "#ffcf5a",
        "b1": "#9fe8ff", "b3": "#4fe8d8",
      },
    },
    neon: {
      name: "النيون", swatch: ["#ff2bd6", "#2bf0ff"],
      colors: {
        "bg": "#0d0614", "glow": "#ff2bd650", "on-bg": "#fff0fb", "on-bg-mute": "#b996b0",
        "panel": "#170b22", "panel2": "#20102f", "line": "#3d1f52", "fg": "#fff0fb", "mute": "#a98aa6",
        "acc": "#ff2bd6", "acc-fg": "#1a0016", "hi": "#ff6be3", "hi-bg": "#ff2bd626", "live": "#2bf0ff",
        "b1": "#2bf0ff", "b3": "#ff6be3",
      },
    },
    ice: {
      name: "الثلج", swatch: ["#e9f4f8", "#0a74ae"], light: true,
      colors: {
        "bg": "#e9f4f8", "glow": "#ffffff90", "on-bg": "#0b2533", "on-bg-mute": "#4d6b78",
        "panel": "#ffffff", "panel2": "#f1f8fb", "line": "#cfe3ec", "fg": "#0b2533", "mute": "#5d7b88",
        "acc": "#0a74ae", "acc-fg": "#ffffff", "hi": "#0a74ae", "hi-bg": "#0a74ae1f", "live": "#e8590c",
        "b1": "#4d6b78", "b3": "#0a74ae", "shadow": "#0b253326",
        "logo-acc": "#0a74ae", "chip-bg": "#0b2533", "chip-fg": "#e9f4f8", "live-text": "#c2410c",
        "box-bg": "#0b2533", "box-line": "#0b2533", "box-fg": "#e9f4f8",
        "label-acc": "#0a74ae", "cta-bg": "#0a74ae", "cta-fg": "#ffffff",
      },
    },
    // ثيم سري: ما يطلع في القائمة إلا لما الزائر يلقى كل الأسرار المخفية (secrets تحت)
    kid: {
      name: "كايدو", swatch: ["#ffffff", "#0a1029"], secret: true,
      colors: {
        "bg": "#0a1029", "glow": "#9fb8ff50", "on-bg": "#f3f6ff", "on-bg-mute": "#9ea9d4",
        "panel": "#111a3e", "panel2": "#172252", "line": "#2b3a78", "fg": "#f3f6ff", "mute": "#98a3cf",
        "acc": "#ffffff", "acc-fg": "#0a1029", "hi": "#9fbcff", "hi-bg": "#9fbcff22", "live": "#ff4d5e",
        "b1": "#9fbcff", "b3": "#ffffff", "logo-acc": "#9fbcff", "live-text": "#ff6b78",
      },
    },
  },

  // مؤسسين الموقع: يطلعون فوق يسار. photo صورة مربعة (الأفضل 256×256) في مجلد assets
  // اتركها [] لإخفاء الخانة
  founders: [
    { name: "مجاهد", photo: "assets/mujahid.jpg" },
    { name: "رعد", photo: "assets/raad.jpg" },
  ],

  // أسرار مخفية في الموقع (شعار كايدو كيد في ٥ أماكن). اللي يلقاها كلها يفتح الثيم السري
  // false يشيلها كلها
  secrets: true,

  // مجسم السكار ثلاثي الأبعاد في الواجهة الترحيبية. false يخفيه
  backgroundArt: true,

  // ربط قاعدة البيانات (Firebase). اتركها فاضية = وضع تجريبي محلي (التعديل يُحفظ في جهازك فقط)
  // هذي القيم مو سرية، عادي تكون في GitHub. الحماية الحقيقية في ملف firestore.rules
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: "",
  },
};
