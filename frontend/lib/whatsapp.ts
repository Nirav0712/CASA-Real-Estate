/**
 * Safe WhatsApp Click-to-Chat URL Helper for myproperty
 * Adheres to WhatsApp web and mobile standard schema (wa.me)
 */

export interface WhatsAppEnquiryParams {
  phone?: string | null;
  propertyTitle: string;
  priceText?: string;
  propertySlug?: string;
  propertyId?: string;
  category?: string;
  location?: string;
}

export function buildWhatsAppEnquiryUrl({
  phone,
  propertyTitle,
  priceText,
  propertySlug,
  propertyId,
  category,
  location,
}: WhatsAppEnquiryParams): string {
  const targetPhone = phone && phone.trim() ? phone : (process.env.NEXT_PUBLIC_WHATSAPP_LEAD_DESTINATION_NUMBER || '917069754589');

  // Remove any non-numeric characters except leading plus if any
  const cleanedDigits = targetPhone.replace(/[^0-9]/g, '');

  // Must have a valid phone number length (at least 10 digits)
  if (cleanedDigits.length < 10) {
    return 'https://wa.me/917069754589';
  }

  // Ensure international format (if 10 digits in Indian context, prepend 91)
  const normalizedPhone =
    cleanedDigits.length === 10 ? `91${cleanedDigits}` : cleanedDigits;

  // Build clean and courteous inquiry text
  let message = `Hello! I am inquiring about the listing on myproperty:\n`;
  message += `• Property: "${propertyTitle}"\n`;
  if (category) message += `• Category: ${category}\n`;
  if (priceText) message += `• Price: ${priceText}\n`;
  if (location) message += `• Location: ${location}\n`;
  if (propertySlug) {
    message += `• Listing Reference: ${propertySlug}\n`;
  } else if (propertyId) {
    message += `• Ref ID: ${propertyId}\n`;
  }
  message += `\nPlease let me know if this property is still available for inspection. Thank you!`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function sanitizeDisplayPhone(phone?: string | null): string {
  if (!phone) return 'Contact upon enquiry';
  // If formatted, return or basic mask for privacy if needed
  return phone;
}
