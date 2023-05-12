import en from './i18n/en.js'

// export async function loadLocale(lang: string): Promise<any> {
//     try {
//         return  i18n(localeTranslations, formatters)
//     } catch (e) {
//         console.error(`Count not import language: ${lang}`)
//     }
// }

import {i18n} from 'typesafe-i18n'


const localeTranslations = {
    en
}

const initFormatters = (locale: string) => {
    const dateFormatter = new Intl.DateTimeFormat(locale, {weekday: 'long'})

    return {
        weekday: (value: Date | number) => dateFormatter.format(value),
    }
}

const formatters = {
    en: initFormatters('en')
}

export const L = i18n(localeTranslations, formatters)

export function getMsg(msgName: string, args?: object): string {
    return L[window.currentLanguage][msgName](args)
}

export function loadLocale(langCode: string, data, formaters) {
    try {
        return i18n(data, formaters)
    } catch (e) {
        console.error(`Count not import language: ${langCode}`)
    }
}
