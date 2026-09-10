// Tiny i18n: English + Québec French. Language is picked from navigator.language.

export const STRINGS = {
  en: {
    appName: "CanadaFirst",
    verdict_CA: "Canadian",
    verdict_US: "American company",
    verdict_OTHER: "Company from {country}",
    verdict_UNKNOWN: "Unknown",
    verdict_CA_foreign: "Canadian brand, {country}-owned",
    unknownHint: "We don't have information about {domain} yet.",
    notWebPage: "Open a website to check its owner.",
    ownedBy: "Owned by {name} ({country})",
    source: "Source",
    sources: "Sources",
    suggestFix: "Something wrong? Suggestion",
    setManually: "Set manually",
    save: "Save",
    cancel: "Cancel",
    remove: "Remove",
    country: "Country",
    province: "Province / territory",
    companyName: "Company name (optional)",
    overrideActive: "Manual setting active",
    clearOverride: "Clear manual setting",
    loading: "Checking…",
    userOverride: "Set manually by you",
    dataSourceLocal: "CanadaFirst data",
    dataSourceWikidata: "Wikidata (automatic)",
    dataSourceCache: "cached",
    options: "Options",
    submitReview: "Save & submit for review",
    reviewTitle: "Submit for review",
    reviewIntro: "This opens a new GitHub issue containing only the fields below. Nothing is sent until you post it there, from your own GitHub account.",
    reviewContinue: "Continue to GitHub",
    reviewError: "Could not open GitHub: {error}",
    fieldDomain: "Website",
    fieldCountry: "Country",
    fieldProvince: "Province / territory",
    fieldCompanyName: "Company name",
    fieldPreviousVerdict: "What the extension showed",
    fieldVersion: "Extension version",
    // options page
    optionsTitle: "CanadaFirst options",
    optUseWikidata: "Use Wikidata for unknown sites",
    optUseWikidataHelp: "When a site is not in the local list, ask Wikidata (query.wikidata.org). Results are cached for 30 days.",
    optShowBanner: "Show US warning banner on page",
    optShowBannerHelp: "Not implemented yet.",
    optClearCache: "Clear cache",
    optCacheCleared: "Cache cleared ({n} entries).",
    optOverrides: "Manual settings",
    optNoOverrides: "No manual settings.",
    optData: "Data",
    optDataCount: "{n} companies loaded",
    optDataVersion: "Data version: {v}",
    optSaved: "Saved.",
    countries: {
      CA: "Canada",
      US: "United States",
      OTHER: "Other country",
    },
    provinces: {
      AB: "Alberta",
      BC: "British Columbia",
      MB: "Manitoba",
      NB: "New Brunswick",
      NL: "Newfoundland and Labrador",
      NS: "Nova Scotia",
      NT: "Northwest Territories",
      NU: "Nunavut",
      ON: "Ontario",
      PE: "Prince Edward Island",
      QC: "Quebec",
      SK: "Saskatchewan",
      YT: "Yukon",
    },
  },
  fr: {
    appName: "CanadaFirst",
    verdict_CA: "Canadienne",
    verdict_US: "Entreprise américaine",
    verdict_OTHER: "Entreprise de {country}",
    verdict_UNKNOWN: "Inconnue",
    verdict_CA_foreign: "Marque canadienne, propriété {country}",
    unknownHint: "Nous n'avons pas encore d'information sur {domain}.",
    notWebPage: "Ouvrez un site Web pour vérifier son propriétaire.",
    ownedBy: "Propriété de {name} ({country})",
    source: "Source",
    sources: "Sources",
    suggestFix: "Une erreur? Suggestion",
    setManually: "Définir manuellement",
    save: "Enregistrer",
    cancel: "Annuler",
    remove: "Retirer",
    country: "Pays",
    province: "Province ou territoire",
    companyName: "Nom de l'entreprise (facultatif)",
    overrideActive: "Réglage manuel actif",
    clearOverride: "Effacer le réglage manuel",
    loading: "Vérification…",
    userOverride: "Défini manuellement par vous",
    dataSourceLocal: "Données CanadaFirst",
    dataSourceWikidata: "Wikidata (automatique)",
    dataSourceCache: "en cache",
    options: "Options",
    submitReview: "Enregistrer et soumettre pour révision",
    reviewTitle: "Soumettre pour révision",
    reviewIntro: "Ceci ouvre un nouveau rapport GitHub contenant uniquement les champs ci-dessous. Rien n'est envoyé tant que vous ne le publiez pas là-bas, depuis votre propre compte GitHub.",
    reviewContinue: "Continuer vers GitHub",
    reviewError: "Impossible d'ouvrir GitHub : {error}",
    fieldDomain: "Site Web",
    fieldCountry: "Pays",
    fieldProvince: "Province ou territoire",
    fieldCompanyName: "Nom de l'entreprise",
    fieldPreviousVerdict: "Ce que l'extension affichait",
    fieldVersion: "Version de l'extension",
    optionsTitle: "Options de CanadaFirst",
    optUseWikidata: "Utiliser Wikidata pour les sites inconnus",
    optUseWikidataHelp: "Quand un site n'est pas dans la liste locale, interroger Wikidata (query.wikidata.org). Les résultats sont conservés en cache 30 jours.",
    optShowBanner: "Afficher une bannière d'avertissement sur les sites américains",
    optShowBannerHelp: "Pas encore implémenté.",
    optClearCache: "Vider le cache",
    optCacheCleared: "Cache vidé ({n} entrées).",
    optOverrides: "Réglages manuels",
    optNoOverrides: "Aucun réglage manuel.",
    optData: "Données",
    optDataCount: "{n} entreprises chargées",
    optDataVersion: "Version des données : {v}",
    optSaved: "Enregistré.",
    countries: {
      CA: "Canada",
      US: "États-Unis",
      OTHER: "Autre pays",
    },
    provinces: {
      AB: "Alberta",
      BC: "Colombie-Britannique",
      MB: "Manitoba",
      NB: "Nouveau-Brunswick",
      NL: "Terre-Neuve-et-Labrador",
      NS: "Nouvelle-Écosse",
      NT: "Territoires du Nord-Ouest",
      NU: "Nunavut",
      ON: "Ontario",
      PE: "Île-du-Prince-Édouard",
      QC: "Québec",
      SK: "Saskatchewan",
      YT: "Yukon",
    },
  },
};

/**
 * Pick "fr" or "en" from a BCP-47 tag (defaults to navigator.language).
 */
export function detectLanguage(tag) {
  const t = (tag ?? globalThis.navigator?.language ?? "en").toLowerCase();
  return t.startsWith("fr") ? "fr" : "en";
}

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/**
 * Returns a translator `t(key, params)` plus helpers for the chosen language.
 */
export function createI18n(lang = detectLanguage()) {
  const table = STRINGS[lang] ?? STRINGS.en;
  const t = (key, params) => {
    const s = table[key] ?? STRINGS.en[key] ?? key;
    return typeof s === "string" ? interpolate(s, params) : s;
  };
  return {
    lang,
    t,
    provinceName: (code) => table.provinces[code] ?? STRINGS.en.provinces[code] ?? code,
    countryName: (code) => table.countries[code] ?? STRINGS.en.countries[code] ?? code,
    provinces: table.provinces,
    countries: table.countries,
  };
}
