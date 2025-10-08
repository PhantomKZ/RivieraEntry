import { createApp, ref, onMounted, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const I18N = {
  ru: { leadText: 'Для посещения вам необходимо заполнить форму', fullNameLabel: 'ФИО', destinationLabel: 'Куда вы желаете пройти?', chooseOption: 'Выберите вариант', destAdmin: 'Администрация', destSales: 'В коммерческий отдел', destPrimary: 'В начальную школу', destSecondary: 'В среднюю и старшую школу', destOther: 'Иное', fromWhomLabel: 'От кого?', fromWhomOptional: 'Необязательно', purposeLabel: 'Для каких целей?', purposeRequest: 'По заявке', purposeInvite: 'По приглашению', purposeCustom: 'Свой вариант', submit: 'Отправить', chooseLanguage: 'Выберите язык', placeholders: { fullName: 'Иванов Иван Иванович', destinationOther: 'Ваш вариант', fromWhom: 'Организация/ФИО', purposeCustomText: 'Укажите цель визита' } },
  kz: { leadText: 'Мектепке кіру үшін нысанды толтырыңыз', fullNameLabel: 'ТОЛЫҚ АТЫ-ЖӨНІ', destinationLabel: 'Қайда өтуді қалайсыз?', chooseOption: 'Нұсқаны таңдаңыз', destAdmin: 'Әкімшілік', destSales: 'Коммерциялық бөлімге', destPrimary: 'Бастауыш мектепке', destSecondary: 'Орта және жоғары мектепке', destOther: 'Басқа', fromWhomLabel: 'Кімнен?', fromWhomOptional: 'Міндетті емес', purposeLabel: 'Қандай мақсатпен?', purposeRequest: 'Өтінім бойынша', purposeInvite: 'Шақыру бойынша', purposeCustom: 'Өз нұсқаңыз', submit: 'Жіберу', chooseLanguage: 'Тілді таңдаңыз', placeholders: { fullName: 'Айбаев Айбек Айдарбекұлы', destinationOther: 'Сіздің нұсқаңыз', fromWhom: 'Ұйым/Аты-жөні', purposeCustomText: 'Сапар мақсатын көрсетіңіз' } },
  en: { leadText: 'To visit, please fill out the form', fullNameLabel: 'Full name', destinationLabel: 'Where would you like to go?', chooseOption: 'Select an option', destAdmin: 'Administration', destSales: 'Commercial department', destPrimary: 'Primary school', destSecondary: 'Middle & high school', destOther: 'Other', fromWhomLabel: 'From whom?', fromWhomOptional: 'Optional', purposeLabel: 'Purpose of visit', purposeRequest: 'By request', purposeInvite: 'By invitation', purposeCustom: 'Custom', submit: 'Submit', chooseLanguage: 'Choose language', placeholders: { fullName: 'John Doe', destinationOther: 'Your option', fromWhom: 'Organization/Full name', purposeCustomText: 'Specify the purpose of visit' } },
};

createApp({
  setup(){
    const lang = ref('ru');
    const showLangModal = ref(true);
    const fullName = ref('');
    const destination = ref('');
    const destinationOther = ref('');
    const fromWhom = ref('');
    const purpose = ref('');
    const purposeCustomText = ref('');

    const dict = () => I18N[lang.value] || I18N.ru;
    const isOther = () => destination.value === 'other';
    const isCustomPurpose = () => purpose.value === 'custom';

    function submitForm(){
      if (!fullName.value || !destination.value || !purpose.value) {
        alert('Пожалуйста, заполните обязательные поля');
        return;
      }
      const data = {
        fullName: fullName.value,
        destination: isOther() ? destinationOther.value : destination.value,
        fromWhom: fromWhom.value,
        purpose: isCustomPurpose() ? purposeCustomText.value : purpose.value,
        lang: lang.value,
        createdAt: new Date().toISOString(),
      };
      fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
        .then(() => {
          alert('Заявка сохранена!');
          fullName.value = '';
          destination.value = '';
          destinationOther.value = '';
          fromWhom.value = '';
          purpose.value = '';
          purposeCustomText.value = '';
        })
        .catch(() => alert('Ошибка сохранения'));
    }

    function chooseLanguage(code){ lang.value = code; showLangModal.value = false; }

    onMounted(() => {});

    return { lang, showLangModal, fullName, destination, destinationOther, fromWhom, purpose, purposeCustomText, dict, isOther, isCustomPurpose, submitForm, chooseLanguage };
  }
}).mount('#app');


