// Pre-filled GitHub issue URLs. This is the only "send us data" channel in
// v0.1: nothing is transmitted by the extension itself; the user's browser
// opens github.com with the fields below in the query string, and the user
// posts the issue (or not) from their own GitHub account.

export const ISSUE_REPO = "https://github.com/BlockZero-Studio/canada-first/issues/new";

function join(lines) {
  return lines.join("\n");
}

function url(title, body, labels) {
  const q = new URLSearchParams({ title, body, labels });
  return `${ISSUE_REPO}?${q.toString()}`;
}

/** "Wrong? Suggest a fix" — free-form report about the current verdict. */
export function fixIssueUrl(result) {
  const title = `Fix: ${result.domain ?? "unknown domain"}`;
  const body = join([
    `Domain: ${result.domain ?? ""}`,
    `Current verdict: ${result.verdict?.verdict ?? ""} (${result.source ?? ""})`,
    `Current entry: ${result.entry ? `${result.entry.name} [${result.entry.id}]` : "none"}`,
    "",
    "What is wrong / what should it be?",
    "",
    "Sources (links):",
    "",
  ]);
  return url(title, body, "data");
}

/**
 * The exact fields a "submit for review" issue will contain, as label/value
 * pairs, so the popup can show them to the user before opening GitHub.
 * @param {{domain:string, entry:object, previous?:object|null, version?:string}} p
 *   entry: the override entry (from entryFromOverride); previous: the result
 *   the extension showed before the user corrected it.
 */
export function reviewFields({ domain, entry, previous, version }) {
  const fields = [
    ["domain", domain],
    ["country", entry.country],
  ];
  if (entry.country === "CA") fields.push(["province", entry.province ?? "?"]);
  if (entry.name && entry.name !== domain) fields.push(["companyName", entry.name]);
  fields.push([
    "previousVerdict",
    previous?.verdict ? `${previous.verdict.verdict}${previous.verdict.province ? "/" + previous.verdict.province : ""} (${previous.source ?? "none"})` : "none",
  ]);
  if (version) fields.push(["version", version]);
  return fields;
}

/** "Save & submit for review" — structured proposal built from the override form. */
export function reviewIssueUrl(p) {
  const fields = reviewFields(p);
  const get = (k) => fields.find(([key]) => key === k)?.[1];
  const target = get("country") === "CA" ? `CA/${get("province")}` : get("country");
  const title = `Review: ${p.domain} → ${target}`;
  const body = join([
    "Proposed by a user from the extension's manual-setting form.",
    "",
    ...fields.map(([k, v]) => `${k}: ${v}`),
    "",
    "Source or reason (optional):",
    "",
  ]);
  return url(title, body, "data,user-submitted");
}
