"use strict";

function validatePhone(value) {
  if (typeof value !== 'string') return { valid: false, message: 'Введіть номер телефону.' };
  const pattern = /^\+380[0-9]{9}(?![\s\S])/;
  return pattern.test(value)
    ? { valid: true, message: '' }
    : { valid: false, message: 'Введіть номер у форматі +380XXXXXXXXX.' };
}

function validateEmail(value) {
  if (typeof value !== 'string') return { valid: false, message: 'Введіть коректну електронну адресу.' };
  const candidate = value.trim();
  const atIndex = candidate.indexOf('@');
  // Обмеження довжини застосовуються до обрізаного кандидата до перевірки формату.
  if (candidate.length > 254 || candidate.slice(0, atIndex < 0 ? candidate.length : atIndex).length > 64) {
    return { valid: false, message: 'Електронна адреса перевищує допустиму довжину.' };
  }
  const pattern = /^(?:[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+)*)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}(?![\s\S])/;
  return pattern.test(candidate)
    ? { valid: true, message: '' }
    : { valid: false, message: 'Введіть коректну електронну адресу.' };
}

function validateName(value) {
  if (typeof value !== 'string') return { valid: false, message: 'Введіть коректне ім’я.' };
  const candidate = value.trim();
  // Segmenter рахує графеми, а не UTF-16 кодові одиниці чи окремі кодові точки.
  const graphemeCount = Array.from(new Intl.Segmenter('uk', { granularity: 'grapheme' }).segment(candidate)).length;
  if (graphemeCount < 2 || graphemeCount > 100) {
    return { valid: false, message: 'Ім’я має містити від 2 до 100 символів.' };
  }
  // U+02BC є Unicode-літерою Lm, але тут це лише внутрішній апостроф.
  const pattern = /^(?:(?!ʼ)\p{L}\p{M}*)+(?:[ '\u2018\u2019\u02BC\p{Pd}](?:(?!ʼ)\p{L}\p{M}*)+)*(?![\s\S])/u;
  return pattern.test(candidate)
    ? { valid: true, message: '' }
    : { valid: false, message: 'Ім’я може містити літери, пробіли, апострофи та дефіси.' };
}

function validateMessage(value) {
  if (typeof value !== 'string') return { valid: false, message: 'Введіть повідомлення.' };
  const candidate = value.trim();
  // Segmenter правильно рахує, зокрема, емоджі та комбіновані символи.
  const graphemeCount = Array.from(new Intl.Segmenter('uk', { granularity: 'grapheme' }).segment(candidate)).length;
  if (graphemeCount < 10 || graphemeCount > 2000) {
    return { valid: false, message: 'Повідомлення має містити від 10 до 2000 символів.' };
  }
  return { valid: true, message: '' };
}

function validateAgreement(checked) {
  return checked === true
    ? { valid: true, message: '' }
    : { valid: false, message: 'Потрібно надати згоду.' };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { validatePhone, validateEmail, validateName, validateMessage, validateAgreement };

function initFeedbackForm() {
  if (typeof document === 'undefined') return;

  const form = document.querySelector('form#feedbackForm');
  if (!form || form.dataset.validationBound === 'true') return;

  const dialog = document.querySelector('dialog#feedbackDialog');
  const closeButton = dialog?.querySelector('#feedbackDialogClose');

  if (
    !dialog ||
    !closeButton ||
    typeof dialog.showModal !== 'function' ||
    typeof dialog.close !== 'function'
  ) {
    return;
  }

  const fields = [
    {
      field: form.querySelector('#username'),
      error: form.querySelector('#usernameError'),
      validate: validateName,
      touched: false,
    },
    {
      field: form.querySelector('#email'),
      error: form.querySelector('#emailError'),
      validate: validateEmail,
      touched: false,
    },
    {
      field: form.querySelector('#phone'),
      error: form.querySelector('#phoneError'),
      validate: validatePhone,
      touched: false,
    },
    {
      field: form.querySelector('#message'),
      error: form.querySelector('#messageError'),
      validate: validateMessage,
      touched: false,
    },
    {
      field: form.querySelector('#agreement'),
      error: form.querySelector('#agreementError'),
      validate: validateAgreement,
      touched: false,
    },
  ];
  const sendButton = form.querySelector('#feedbackSend');
  const status = form.querySelector('#feedbackStatus');

  if (
    fields.some(({ field, error, validate }) =>
      !field || !error || typeof validate !== 'function'
    ) ||
    !sendButton ||
    !status
  ) {
    return;
  }

  function showError(field, errorElement, message) {
    field.dataset.state = 'error';
    field.setAttribute('aria-invalid', 'true');
    errorElement.dataset.state = 'error';
    errorElement.hidden = false;
    errorElement.textContent = message;
  }

  function showSuccess(field, errorElement) {
    field.dataset.state = 'success';
    field.setAttribute('aria-invalid', 'false');
    errorElement.dataset.state = 'success';
    errorElement.hidden = false;
    errorElement.textContent =
      field.id === 'agreement' ? 'Згоду позначено.' : 'Поле заповнено коректно.';
  }

  function clearError(field, errorElement) {
    field.setAttribute('aria-invalid', 'false');
    delete field.dataset.state;
    delete errorElement.dataset.state;
    errorElement.textContent = '';
    errorElement.hidden = true;
  }

  let submitted = false;
  let suppressFieldBlur = false;

  fields.forEach(({ field, error }) => clearError(field, error));

  function updateStatus() {
    const errorCount = fields.reduce((count, { field, validate }) => {
      const value = field.id === 'agreement' ? field.checked : field.value;
      return count + (validate(value).valid ? 0 : 1);
    }, 0);

    status.textContent = errorCount > 0
      ? `Виявлено помилок: ${errorCount}. Перевірте позначені поля.`
      : 'Усі поля коректні. Можна перевірити форму.';
  }

  fields.forEach((entry) => {
    const { field, error, validate } = entry;
    let composing = false;

    function checkField() {
      const value = field.id === 'agreement' ? field.checked : field.value;
      const result = validate(value);

      if (result.valid) {
        showSuccess(field, error);
      } else {
        showError(field, error, result.message);
      }

      if (submitted) {
        updateStatus();
      } else {
        const announcement = result.valid ? '' : result.message;
        if (status.textContent !== announcement) status.textContent = announcement;
      }
      return result.valid;
    }

    field.addEventListener('blur', () => {
      if (suppressFieldBlur) return;
      entry.touched = true;
      checkField();
    });

    if (field.id === 'agreement') {
      field.addEventListener('change', () => {
        entry.touched = true;
        checkField();
      });
      return;
    }

    field.addEventListener('compositionstart', () => {
      composing = true;
    });

    field.addEventListener('compositionend', () => {
      composing = false;
      if (entry.touched || submitted) checkField();
    });

    field.addEventListener('input', (event) => {
      if (event.isComposing || composing) return;
      if (entry.touched || submitted) checkField();
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitted = true;

    let errorCount = 0;
    let firstInvalidField = null;

    fields.forEach(({ field, error, validate }) => {
      const value = field.id === 'agreement' ? field.checked : field.value;
      const result = validate(value);

      if (result.valid) {
        showSuccess(field, error);
      } else {
        showError(field, error, result.message);
        errorCount += 1;
        if (!firstInvalidField) firstInvalidField = field;
      }
    });

    if (errorCount > 0) {
      status.textContent =
        `Виявлено помилок: ${errorCount}. Перевірте позначені поля.`;
      firstInvalidField.focus();
      return;
    }

    suppressFieldBlur = true;
    dialog.showModal();
    closeButton.focus();
    form.reset();
    fields.forEach((entry) => {
      entry.touched = false;
      clearError(entry.field, entry.error);
    });
    submitted = false;
    status.textContent = 'Навчальну демонстрацію завершено. Дані не надсилалися.';
    suppressFieldBlur = false;
  });

  closeButton.addEventListener('click', () => {
    suppressFieldBlur = true;
    dialog.close();
  });

  closeButton.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    closeButton.focus();
  });

  dialog.addEventListener('cancel', () => {
    suppressFieldBlur = true;
  });

  dialog.addEventListener('close', () => {
    sendButton.focus();
    suppressFieldBlur = false;
  });

  form.dataset.validationBound = 'true';
  sendButton.disabled = false;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeedbackForm, { once: true });
  } else {
    initFeedbackForm();
  }
}
