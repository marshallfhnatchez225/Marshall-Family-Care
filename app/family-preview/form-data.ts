type PreviewForm = {
  id: string;
  title: string;
  status: string;
  fields: [string, string][];
};

export const forms: PreviewForm[] = [
  {
    id: "death-certificate",
    title: "Death Certificate Information",
    status: "Needs review",
    fields: [
      ["Name", "Name of Loved One"],
      ["Age", ""],
      ["Street Address", ""],
      ["City", ""],
      ["County", ""],
      ["State", ""],
      ["Zip", ""],
      ["Within City Limits", "Yes or No"],
      ["Date of Birth", ""],
      ["Place of Birth", ""],
      ["Social Security Number", "Collected securely by staff"],
      ["Veteran", ""],
      ["Father's First Name", ""],
      ["Father's Middle Name", ""],
      ["Father's Last Name", ""],
      ["Mother's First Name", ""],
      ["Mother's Middle Name", ""],
      ["Mother's Maiden Name", ""],
      ["Marital Status", ""],
      ["Surviving Spouse", ""],
      ["Spouse Maiden Name", ""],
      ["Highest Level of Education", ""],
      ["Occupation (Longest Job Held)", ""],
      ["Industry", ""],
      ["Informant", "Next of Kin"],
      ["Informant Relationship", ""],
      ["Informant Mailing Address", ""],
      ["Number of Death Certificates Needed (First copy: $17.00. Additional copies: $8.00.)", ""],
      ["Insurance Copy Note", "If insurance is being processed, Marshall Funeral Home can send one death certificate to the company, so the family may want to order one additional copy."]
    ]
  },
  {
    id: "obituary",
    title: "Obituary Information",
    status: "Draft saved",
    fields: [
      ["Name", "Name of Loved One"],
      ["Age", ""],
      ["Address", ""],
      ["City", ""],
      ["State", ""],
      ["Zip Code", ""],
      ["Date of Death", ""],
      ["Place of Death", ""],
      ["Viewing", ""],
      ["Viewing Time", ""],
      ["Viewing Place", ""],
      ["Wake Service Date", ""],
      ["Wake Service Time", ""],
      ["Wake Service Place", ""],
      ["Viewing At Church", ""],
      ["Funeral Service Date", ""],
      ["Funeral Service Time", ""],
      ["Place of Funeral Service", ""],
      ["Cemetery", ""],
      ["Date of Birth", ""],
      ["Place of Birth", ""],
      ["Name of Parents", ""],
      ["Organizations and Clubs", ""],
      ["Preceded in Death by", ""],
      ["Survivors", ""],
      ["Contact Person Name", "Next of Kin"],
      ["Phone", "601-442-6300"]
    ]
  },
  {
    id: "embalming",
    title: "Permission To Embalm",
    status: "Not submitted",
    fields: [
      ["Authorizing person", "Next of Kin"],
      ["Relationship", ""],
      ["Phone", "601-442-6300"],
      ["Acknowledgment", "Staff will review this authorization before relying on it."]
    ]
  },
  {
    id: "next-of-kin",
    title: "Next Of Kin Information",
    status: "Needs clarification",
    fields: [
      ["Primary next of kin", "Next of Kin"],
      ["Additional next of kin", ""],
      ["Relationship order notes", ""],
      ["Dispute or concern", ""]
    ]
  },
  {
    id: "veteran-church-cemetery",
    title: "Veteran, Church, Cemetery Details",
    status: "Draft saved",
    fields: [
      ["Veteran status", ""],
      ["Church", ""],
      ["Clergy", ""],
      ["Cemetery", ""],
      ["Plot details", ""]
    ]
  }
];

export const deathCertificateCopyOptions = Array.from({ length: 20 }, (_, index) => String(index + 1));

export const deathCertificateDropdownOptions: Record<string, string[]> = {
  "Highest Level of Education": [
    "8th Grade or Less",
    "9th-12th no diploma",
    "High School or GED",
    "Some College, No Degree",
    "Associate Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate Degree",
    "Unknown"
  ],
  "Marital Status": [
    "Married",
    "Married, but separated",
    "Widowed",
    "Divorced",
    "Never Married"
  ],
  Veteran: ["Yes", "No"]
};

export function isLongField(label: string, value: string) {
  const longLabels = [
    "Social Security Number",
    "Informant Mailing Address",
    "Insurance Copy Note",
    "Viewing At Church",
    "Place of Funeral Service",
    "Name of Parents",
    "Organizations and Clubs",
    "Preceded in Death by",
    "Survivors"
  ];

  return value.length > 58 || longLabels.includes(label) || label.toLowerCase().includes("note") || label.includes("Acknowledgment");
}
