export type Language = 'uz' | 'ru'

export interface LanguageLabel {
  uz: string
  ru: string
}

export interface Translations {
  common: {
    loading: LanguageLabel
    error: LanguageLabel
    success: LanguageLabel
    cancel: LanguageLabel
    save: LanguageLabel
    delete: LanguageLabel
    back: LanguageLabel
  }
  auth: {
    telegramLogin: LanguageLabel
    checkingProfile: LanguageLabel
    failedToLoadProfile: LanguageLabel
    openInTelegram: LanguageLabel
    needTelegramApp: LanguageLabel
    retry: LanguageLabel
    connectionError: LanguageLabel
  }
  home: {
    route: LanguageLabel
    date: LanguageLabel
    time: LanguageLabel
    phone: LanguageLabel
    phoneRequired: LanguageLabel
    phoneFormat: LanguageLabel
    phoneHelper: LanguageLabel
    passengerCount: LanguageLabel
    passengerSingle: LanguageLabel
    passengerPlural: LanguageLabel
    fullCar: LanguageLabel
    fullCarLabel: LanguageLabel
    hasBag: LanguageLabel
    hasBagLabel: LanguageLabel
    bagHelper: LanguageLabel
    gender: LanguageLabel
    genderHelp: LanguageLabel
    noPreference: LanguageLabel
    male: LanguageLabel
    female: LanguageLabel
    comment: LanguageLabel
    commentPlaceholder: LanguageLabel
    submit: LanguageLabel
    submitting: LanguageLabel
    bookingSuccess: LanguageLabel
    bookingSuccessDesc: LanguageLabel
    newBooking: LanguageLabel
  }
  orders: {
    title: LanguageLabel
    search: LanguageLabel
    notFound: LanguageLabel
    loading: LanguageLabel
    bookingId: LanguageLabel
    status: LanguageLabel
    phone: LanguageLabel
    fullCar: LanguageLabel
    hasBag: LanguageLabel
  }
  profile: {
    language: LanguageLabel
    support: LanguageLabel
    sendQuestion: LanguageLabel
    logout: LanguageLabel
    logoutConfirm: LanguageLabel
  }
  status: {
    submitted: LanguageLabel
    matched: LanguageLabel
    cancelled: LanguageLabel
  }
  routes: {
    kokandTashkent: LanguageLabel
    tashkentKokand: LanguageLabel
  }
}
