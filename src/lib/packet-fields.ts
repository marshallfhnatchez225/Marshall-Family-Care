export type SectionKey = "general" | "obituary" | "deathCertificate" | "embalming";
type Field = { name: string; label: string; type?: "text" | "date" | "time" | "email" | "tel" | "number" | "textarea" | "select"; options?: string[]; required?: boolean };
type Group = { title: string; fields: Field[] };
const educationOptions = ["8th Grade or Less", "9th-12th, no diploma", "High School or GED", "Some College, No Degree", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctorate Degree", "Unknown"];
export const fields: Record<SectionKey, Group[]> = {
  general: [
    { title: "Decedent information", fields: [
      { name: "fullName", label: "Full name", required: true }, { name: "usualResidence", label: "Usual residence" }, { name: "city", label: "City" }, { name: "county", label: "County" }, { name: "state", label: "State" }, { name: "zip", label: "ZIP code" }, { name: "placeOfDeath", label: "Place of death" }, { name: "hospitalOrResidence", label: "Hospital or residence" }, { name: "otherPlace", label: "Other" }, { name: "dateOfDeath", label: "Date of death", type: "date" }, { name: "timeOfDeath", label: "Time", type: "time" }, { name: "dateOfBirth", label: "Date of birth", type: "date" }, { name: "age", label: "Age", type: "number" }, { name: "placeOfBirth", label: "Place of birth" }, { name: "maritalStatus", label: "Marital status", type: "select", options: ["Married", "Married, but separated", "Widowed", "Divorced", "Never Married"] }, { name: "education", label: "Highest level of education", type: "select", options: educationOptions }, { name: "spouse", label: "Husband or wife (maiden name)" }, { name: "father", label: "Father's name" }, { name: "mother", label: "Mother's name" }, { name: "occupation", label: "Deceased occupation" }, { name: "business", label: "Kind of business or industry" }, { name: "veteran", label: "Veteran", type: "select", options: ["Yes", "No"] }, { name: "decorations", label: "Any decorations" },
    ]},
    { title: "Informant and insurance", fields: [{ name: "informantName", label: "Informant name" }, { name: "informantAddress", label: "Address" }, { name: "informantTelephone", label: "Telephone", type: "tel" }, { name: "insuranceInformation", label: "Insurance information", type: "textarea" }, { name: "policyNumber", label: "Policy number" }] },
    { title: "Service information", fields: [{ name: "funeralDate", label: "Date of funeral", type: "date" }, { name: "funeralTime", label: "Time", type: "time" }, { name: "funeralPlace", label: "Place of funeral service" }, { name: "officiant", label: "Pastor or minister officiating" }, { name: "ministerNotified", label: "Has pastor or minister been notified?", type: "select", options: ["Yes", "No"] }, { name: "cemeteryName", label: "Cemetery name" }, { name: "cemeteryLocation", label: "Location" }] },
  ],
  obituary: [
    { title: "Viewing/Wake", fields: [{ name: "viewingWakeDate", label: "Date", type: "date" }, { name: "viewingWakeTime", label: "Time", type: "time" }, { name: "viewingWakePlace", label: "Place" }, { name: "viewingAtChurch", label: "Viewing at church time", type: "time" }] },
    { title: "Life and family information", fields: [{ name: "organizations", label: "Organizations and clubs", type: "textarea" }, { name: "lifeDetails", label: "Life details to include", type: "textarea" }, { name: "precededInDeath", label: "Preceded in death by", type: "textarea" }, { name: "survivors", label: "Survivors", type: "textarea" }, { name: "photo", label: "Optional photo (JPG, PNG, or WebP; 5 MB maximum)" }, { name: "familyApproval", label: "Final family approval", type: "select", options: ["Not ready for approval", "I approve this obituary information for staff review"] }] },
  ],
  deathCertificate: [
    { title: "Residence details", fields: [{ name: "withinCityLimits", label: "Within city limits?", type: "select", options: ["Yes", "No"] }] },
    { title: "Parents", fields: [{ name: "fatherPlaceOfBirth", label: "Father's place of birth" }, { name: "motherFirst", label: "Mother's first name" }, { name: "motherMiddle", label: "Mother's middle name" }, { name: "motherMaiden", label: "Mother's maiden name (name she was born with)" }, { name: "motherPlaceOfBirth", label: "Mother's place of birth" }] },
    { title: "Informant details", fields: [{ name: "relationship", label: "Relationship to decedent" }, { name: "email", label: "Email address", type: "email" }] },
    { title: "Death certificate order", fields: [{ name: "quantity", label: "Number of death certificates needed", type: "number", required: true }] },
  ],
  embalming: [
    { title: "Decedent", fields: [{ name: "decedentName", label: "Name of decedent", required: true }] },
    { title: "Authorization", fields: [{ name: "permission", label: "Permission to embalm", type: "select", options: ["YES - Permission Granted", "NO - Permission Refused"], required: true }] },
    { title: "Authorized representative", fields: [{ name: "representativeName", label: "Printed name of authorized representative", required: true }, { name: "relationship", label: "Relationship to decedent", required: true }, { name: "date", label: "Date", type: "date", required: true }, { name: "attestation", label: "Attestation", type: "select", options: ["I confirm and attest to the statements above"], required: true }, { name: "signatureIntent", label: "Intent to sign", type: "select", options: ["I intend for this electronic signature to authorize this form"], required: true }] },
  ],
};
export const labels: Record<SectionKey, string> = { general: "General Information", obituary: "Obituary", deathCertificate: "Death Certificate Worksheet", embalming: "Permission to Embalm" };

export const legacyFieldLabels: Partial<Record<SectionKey, Record<string, string>>> = {
  obituary: { name: "Name", age: "Age", address: "Address", city: "City", state: "State", zip: "ZIP code", dateOfDeath: "Date of death", placeOfDeath: "Place of death", viewingDate: "Viewing date", viewingTime: "Viewing time", viewingPlace: "Viewing place", wakeDate: "Wake service date", wakeTime: "Wake time", wakePlace: "Wake place", serviceDate: "Funeral service date", serviceTime: "Service time", servicePlace: "Place of funeral service", cemetery: "Cemetery", dateOfBirth: "Date of birth", placeOfBirth: "Place of birth", parents: "Name of parents", contactName: "Contact person name", contactPhone: "Phone" },
  deathCertificate: { fullName: "Full name", age: "Age", dateOfBirth: "Date of birth", streetAddress: "Street address", city: "City", county: "County", state: "State", zip: "ZIP code", placeOfBirth: "Place of birth", veteran: "Veteran?", fatherName: "Father's name", maritalStatus: "Marital status", survivingSpouse: "Surviving spouse", spouseMaiden: "Maiden name", education: "Highest level of education", occupation: "Occupation (longest job held)", industry: "Industry", informantName: "Informant's full name", mailingAddress: "Mailing address" },
};

