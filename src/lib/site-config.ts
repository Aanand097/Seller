// Change this to your business WhatsApp number in international format (digits only, no + or spaces).
// Example: "9779812345678" for Nepal, "14155552671" for US.
export const WHATSAPP_NUMBER = "9779800000000";

export const ESEWA_ACCOUNT_NAME = "Aanand Kumar Mandal";
export const ESEWA_ACCOUNT_ID = "9707642386";

export const buildWhatsAppUrl = (text: string, phone: string = WHATSAPP_NUMBER) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
