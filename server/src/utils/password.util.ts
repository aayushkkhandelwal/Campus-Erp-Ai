import crypto from 'crypto';

/**
 * Generates a default temporary password for first-time user registration.
 * Format: {firstname_lowercase}#{random_4_digit_number}
 * Example: "Ayush" -> ayush#7391, "Rahul" -> rahul#2048
 *
 * Uses Node's cryptographically secure crypto.randomInt.
 * Special characters/spaces are stripped from the first name.
 */
export const generateDefaultPassword = (firstName: string): string => {
  const cleanFirstName = (firstName || 'user')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '') || 'user';

  const randomNumber = crypto.randomInt(1000, 10000);
  return `${cleanFirstName}#${randomNumber}`;
};
