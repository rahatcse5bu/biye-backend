import { IExtraField, FieldType } from "./unverified_biodata.interface";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - accepts various formats
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

/**
 * Validates an extra field based on its type
 * @param field - The field to validate
 * @returns Object with isValid and error message
 */
export const validateExtraField = (
  field: IExtraField
): { isValid: boolean; message?: string } => {
  // Check required fields
  if (!field.label || field.label.trim() === "") {
    return { isValid: false, message: "Field label is required" };
  }

  if (field.value === null || field.value === undefined || field.value === "") {
    return { isValid: false, message: `Value for "${field.label}" is required` };
  }

  if (!field.fieldType) {
    return { isValid: false, message: `Field type for "${field.label}" is required` };
  }

  // Validate based on field type
  switch (field.fieldType) {
    case "text":
      return validateTextField(field);

    case "numeric":
      return validateNumericField(field);

    case "email":
      return validateEmailField(field);

    case "phone":
      return validatePhoneField(field);

    case "select":
      return validateSelectField(field);

    case "boolean":
      return validateBooleanField(field);

    default:
      return {
        isValid: false,
        message: `Invalid field type: ${field.fieldType}`,
      };
  }
};

/**
 * Validates a text field
 */
const validateTextField = (field: IExtraField) => {
  const value = String(field.value).trim();

  if (value.length > 1000) {
    return {
      isValid: false,
      message: `"${field.label}" must not exceed 1000 characters`,
    };
  }

  return { isValid: true };
};

/**
 * Validates a numeric field
 */
const validateNumericField = (field: IExtraField) => {
  const numValue = Number(field.value);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      message: `"${field.label}" must be a valid number`,
    };
  }

  return { isValid: true };
};

/**
 * Validates an email field
 */
const validateEmailField = (field: IExtraField) => {
  const emailValue = String(field.value).trim().toLowerCase();

  if (!EMAIL_REGEX.test(emailValue)) {
    return {
      isValid: false,
      message: `"${field.label}" must be a valid email address`,
    };
  }

  return { isValid: true };
};

/**
 * Validates a phone field
 */
const validatePhoneField = (field: IExtraField) => {
  const phoneValue = String(field.value).trim();

  if (!PHONE_REGEX.test(phoneValue)) {
    return {
      isValid: false,
      message: `"${field.label}" must be a valid phone number`,
    };
  }

  return { isValid: true };
};

/**
 * Validates a select field
 */
const validateSelectField = (field: IExtraField) => {
  if (!field.options || field.options.length === 0) {
    return {
      isValid: false,
      message: `"${field.label}" must have at least one option`,
    };
  }

  const value = String(field.value).trim();
  if (!field.options.includes(value)) {
    return {
      isValid: false,
      message: `"${field.label}" value must be one of: ${field.options.join(", ")}`,
    };
  }

  return { isValid: true };
};

/**
 * Validates a boolean field
 */
const validateBooleanField = (field: IExtraField) => {
  if (typeof field.value !== "boolean") {
    return {
      isValid: false,
      message: `"${field.label}" must be true or false`,
    };
  }

  return { isValid: true };
};

/**
 * Validates all extra fields
 * @param fields - Array of fields to validate
 * @returns Object with isValid and array of errors
 */
export const validateExtraFields = (
  fields: IExtraField[] | undefined
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!fields || !Array.isArray(fields)) {
    return { isValid: true, errors: [] };
  }

  // Max 20 fields per biodata
  if (fields.length > 20) {
    errors.push("Maximum 20 extra fields allowed per biodata");
  }

  // Validate each field
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const validation = validateExtraField(field);

    if (!validation.isValid) {
      errors.push(`Field ${i + 1}: ${validation.message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
