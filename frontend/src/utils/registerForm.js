export function validateRegisterForm(formData) {
  const nextErrors = {};

  if (!formData.name.trim()) {
    nextErrors.name = 'Full name is required.';
  }

  if (!formData.email.trim()) {
    nextErrors.email = 'Email address is required.';
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(formData.email.trim())) {
    nextErrors.email = 'Please enter a valid email address.';
  }

  if (!formData.password) {
    nextErrors.password = 'Password is required.';
  } else if (formData.password.length < 6) {
    nextErrors.password = 'Password must be at least 6 characters.';
  }

  if (formData.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(formData.phone.trim())) {
    nextErrors.phone = 'Please enter a valid phone number.';
  }

  if (!formData.termsAccepted) {
    nextErrors.termsAccepted = 'You must accept the terms to create your account.';
  }

  return nextErrors;
}

export function convertFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
