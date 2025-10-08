// i18n strings
const I18N = {
  ru: {
    leadText: "Для посещения вам необходимо заполнить форму",
    fullNameLabel: "ФИО",
    destinationLabel: "Куда вы желаете пройти?",
    chooseOption: "Выберите вариант",
    destAdmin: "Администрация",
    destSales: "В коммерческий отдел",
    destPrimary: "В начальную школу",
    destSecondary: "В среднюю и старшую школу",
    destOther: "Иное",
    fromWhomLabel: "От кого?",
    fromWhomOptional: "Необязательно",
    purposeLabel: "Для каких целей?",
    purposeRequest: "По заявке",
    purposeInvite: "По приглашению",
    purposeCustom: "Свой вариант",
    submit: "Отправить",
    saveNotice: "Заявка сохранится локально до подключения бэкенда.",
    chooseLanguage: "Выберите язык",
    modalAlways: "Окно показывается при каждом входе",
    placeholders: {
      fullName: "Иванов Иван Иванович",
      destinationOther: "Ваш вариант",
      fromWhom: "Организация/ФИО",
      purposeCustomText: "Укажите цель визита"
    },
    alerts: {
      saved: "Заявка сохранена!",
      formInvalid: "Пожалуйста, заполните обязательные поля"
    }
  },
  kz: {
    leadText: "Мектепке кіру үшін нысанды толтырыңыз",
    fullNameLabel: "ТОЛЫҚ АТЫ-ЖӨНІ",
    destinationLabel: "Қайда өтуді қалайсыз?",
    chooseOption: "Нұсқаны таңдаңыз",
    destAdmin: "Әкімшілік",
    destSales: "Коммерциялық бөлімге",
    destPrimary: "Бастауыш мектепке",
    destSecondary: "Орта және жоғары мектепке",
    destOther: "Басқа",
    fromWhomLabel: "Кімнен?",
    fromWhomOptional: "Міндетті емес",
    purposeLabel: "Қандай мақсатпен?",
    purposeRequest: "Өтінім бойынша",
    purposeInvite: "Шақыру бойынша",
    purposeCustom: "Өз нұсқаңыз",
    submit: "Жіберу",
    saveNotice: "Сервер қосылғанға дейін өтінім жергілікті түрде сақталады.",
    chooseLanguage: "Тілді таңдаңыз",
    modalAlways: "Терезе әр кірген сайын көрсетіледі",
    placeholders: {
      fullName: "Айбаев Айбек Айдарбекұлы",
      destinationOther: "Сіздің нұсқаңыз",
      fromWhom: "Ұйым/Аты-жөні",
      purposeCustomText: "Сапар мақсатын көрсетіңіз"
    },
    alerts: {
      saved: "Өтінім сақталды!",
      formInvalid: "Міндетті өрістерді толтырыңыз"
    }
  },
  en: {
    leadText: "To visit, please fill out the form",
    fullNameLabel: "Full name",
    destinationLabel: "Where would you like to go?",
    chooseOption: "Select an option",
    destAdmin: "Administration",
    destSales: "Commercial department",
    destPrimary: "Primary school",
    destSecondary: "Middle & high school",
    destOther: "Other",
    fromWhomLabel: "From whom?",
    fromWhomOptional: "Optional",
    purposeLabel: "Purpose of visit",
    purposeRequest: "By request",
    purposeInvite: "By invitation",
    purposeCustom: "Custom",
    submit: "Submit",
    saveNotice: "Request will be saved locally until backend is connected.",
    chooseLanguage: "Choose language",
    modalAlways: "This dialog shows on every visit",
    placeholders: {
      fullName: "John Doe",
      destinationOther: "Your option",
      fromWhom: "Organization/Full name",
      purposeCustomText: "Specify the purpose of visit"
    },
    alerts: {
      saved: "Request saved!",
      formInvalid: "Please fill required fields"
    }
  }
};

let currentLang = 'ru';

function applyTranslations(lang){
  const dict = I18N[lang] || I18N.ru;
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.getAttribute('data-i18n');
    if (dict[key]) node.textContent = dict[key];
  });
  // placeholders
  const fullName = document.getElementById('fullName');
  if (fullName) fullName.placeholder = dict.placeholders.fullName;
  const destOther = document.getElementById('destinationOther');
  if (destOther) destOther.placeholder = dict.placeholders.destinationOther;
  const fromWhom = document.getElementById('fromWhom');
  if (fromWhom) fromWhom.placeholder = dict.placeholders.fromWhom;
  const purposeCustomText = document.getElementById('purposeCustomText');
  if (purposeCustomText) purposeCustomText.placeholder = dict.placeholders.purposeCustomText;
}

function setupLanguageModal(){
  const modal = document.getElementById('languageModal');
  modal.classList.add('open');
  modal.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      applyTranslations(currentLang);
      modal.classList.remove('open');
    });
  });
}

function setupDestinationOther(){
  const select = document.getElementById('destination');
  const other = document.getElementById('destinationOther');
  function toggle(){
    const isOther = select.value === 'other';
    other.classList.toggle('hidden', !isOther);
    other.required = isOther;
  }
  select.addEventListener('change', toggle);
  toggle();
}

function setupPurposeCustom(){
  const radios = document.querySelectorAll('input[name="purpose"]');
  const text = document.getElementById('purposeCustomText');
  function update(){
    const chosen = Array.from(radios).find(r => r.checked);
    const isCustom = chosen && chosen.value === 'custom';
    text.classList.toggle('hidden', !isCustom);
    text.required = isCustom;
  }
  radios.forEach(r => r.addEventListener('change', update));
  update();
}

function collectFormData(){
  const form = document.getElementById('visitForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  if (data.destination === 'other') {
    data.destination = data.destinationOther || '';
  }
  if (data.purpose === 'custom') {
    data.purpose = data.purposeCustomText || '';
  }
  delete data.destinationOther;
  delete data.purposeCustomText;
  data.lang = currentLang;
  data.createdAt = new Date().toISOString();
  return data;
}

function saveRequestLocally(request){
  const key = 'riviera_requests';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(request);
  localStorage.setItem(key, JSON.stringify(existing));
}

function setupForm(){
  const form = document.getElementById('visitForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()){
      alert(I18N[currentLang].alerts.formInvalid);
      return;
    }
    const data = collectFormData();
    saveRequestLocally(data);
    alert(I18N[currentLang].alerts.saved);
    form.reset();
    // reapply to ensure dependent fields hide
    setupDestinationOther();
    setupPurposeCustom();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations(currentLang);
  setupLanguageModal();
  setupDestinationOther();
  setupPurposeCustom();
  setupForm();
});


