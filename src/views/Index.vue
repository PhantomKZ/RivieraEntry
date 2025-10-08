<template>
  <div class="app">
    <header class="app-header">
      <img src="/img/logo.png" alt="Riviera Entry Logo" class="logo" />
    </header>
    <main class="app-main">
      <p class="lead">{{ dict().leadText }}</p>
      <div class="card">
        <div class="form-group">
          <label>{{ dict().fullNameLabel }}</label>
          <input v-model.trim="fullName" type="text" :placeholder="dict().placeholders.fullName" required />
        </div>
        <div class="form-group">
          <label>{{ dict().destinationLabel }}</label>
          <div class="select-with-other">
            <select v-model="destination" required>
              <option value="" disabled>{{ dict().chooseOption }}</option>
              <option value="admin">{{ dict().destAdmin }}</option>
              <option value="sales">{{ dict().destSales }}</option>
              <option value="primary">{{ dict().destPrimary }}</option>
              <option value="secondary">{{ dict().destSecondary }}</option>
              <option value="other">{{ dict().destOther }}</option>
            </select>
            <input v-if="isOther()" v-model.trim="destinationOther" type="text" :placeholder="dict().placeholders.destinationOther" />
          </div>
        </div>
        <div class="form-group">
          <div class="label-row">
            <label>{{ dict().fromWhomLabel }}</label>
            <span class="small muted">{{ dict().fromWhomOptional }}</span>
          </div>
          <input v-model.trim="fromWhom" type="text" :placeholder="dict().placeholders.fromWhom" />
        </div>
        <div class="form-group">
          <span class="label">{{ dict().purposeLabel }}</span>
          <div class="checks">
            <label class="check">
              <input type="radio" value="by_request" v-model="purpose" />
              <span>{{ dict().purposeRequest }}</span>
            </label>
            <label class="check">
              <input type="radio" value="by_invite" v-model="purpose" />
              <span>{{ dict().purposeInvite }}</span>
            </label>
            <label class="check">
              <input type="radio" value="custom" v-model="purpose" />
              <span>{{ dict().purposeCustom }}</span>
            </label>
          </div>
          <input v-if="isCustomPurpose()" v-model.trim="purposeCustomText" type="text" :placeholder="dict().placeholders.purposeCustomText" />
        </div>
        <button class="btn btn-primary" @click="submitForm">{{ dict().submit }}</button>
      </div>
    </main>

    <div v-if="showLangModal" class="modal open" role="dialog" aria-modal="true">
      <div class="modal-content">
        <h2>{{ dict().chooseLanguage }}</h2>
        <div class="lang-grid">
          <button class="lang-btn" @click="chooseLanguage('kz')">KZ</button>
          <button class="lang-btn" @click="chooseLanguage('ru')">RU</button>
          <button class="lang-btn" @click="chooseLanguage('en')">EN</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const I18N = {
  ru: { leadText: 'Для посещения вам необходимо заполнить форму', fullNameLabel: 'ФИО', destinationLabel: 'Куда вы желаете пройти?', chooseOption: 'Выберите вариант', destAdmin: 'Администрация', destSales: 'В коммерческий отдел', destPrimary: 'В начальную школу', destSecondary: 'В среднюю и старшую школу', destOther: 'Иное', fromWhomLabel: 'От кого?', fromWhomOptional: 'Необязательно', purposeLabel: 'Для каких целей?', purposeRequest: 'По заявке', purposeInvite: 'По приглашению', purposeCustom: 'Свой вариант', submit: 'Отправить', chooseLanguage: 'Выберите язык', placeholders: { fullName: 'Иванов Иван Иванович', destinationOther: 'Ваш вариант', fromWhom: 'Организация/ФИО', purposeCustomText: 'Укажите цель визита' } },
  kz: { leadText: 'Мектепке кіру үшін нысанды толтырыңыз', fullNameLabel: 'ТОЛЫҚ АТЫ-ЖӨНІ', destinationLabel: 'Қайда өтуді қалайсыз?', chooseOption: 'Нұсқаны таңдаңыз', destAdmin: 'Әкімшілік', destSales: 'Коммерциялық бөлімге', destPrimary: 'Бастауыш мектепке', destSecondary: 'Орта және жоғары мектепке', destOther: 'Басқа', fromWhomLabel: 'Кімнен?', fromWhomOptional: 'Міндетті емес', purposeLabel: 'Қандай мақсатпен?', purposeRequest: 'Өтінім бойынша', purposeInvite: 'Шақыру бойынша', purposeCustom: 'Өз нұсқаңыз', submit: 'Жіберу', chooseLanguage: 'Тілді таңдаңыз', placeholders: { fullName: 'Айбаев Айбек Айдарбекұлы', destinationOther: 'Сіздің нұсқаңыз', fromWhom: 'Ұйым/Аты-жөні', purposeCustomText: 'Сапар мақсатын көрсетіңіз' } },
  en: { leadText: 'To visit, please fill out the form', fullNameLabel: 'Full name', destinationLabel: 'Where would you like to go?', chooseOption: 'Select an option', destAdmin: 'Administration', destSales: 'Commercial department', destPrimary: 'Primary school', destSecondary: 'Middle & high school', destOther: 'Other', fromWhomLabel: 'From whom?', fromWhomOptional: 'Optional', purposeLabel: 'Purpose of visit', purposeRequest: 'By request', purposeInvite: 'By invitation', purposeCustom: 'Custom', submit: 'Submit', chooseLanguage: 'Choose language', placeholders: { fullName: 'John Doe', destinationOther: 'Your option', fromWhom: 'Organization/Full name', purposeCustomText: 'Specify the purpose of visit' } },
};

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
</script>

<style scoped>
/* использует глобальный styles.css; локальных правил не требуется */
</style>


