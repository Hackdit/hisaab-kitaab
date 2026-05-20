"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUPIQR = generateUPIQR;
const qrcode_1 = __importDefault(require("qrcode"));
/**
 * Generate a UPI QR code data URL for embedding in a PDF.
 * @param upiId  UPI ID (e.g. "business@upi")
 * @param name   Payee name (shown in UPI app)
 * @param amount Amount to charge (optional — 0 for fixed merchant QR)
 * @returns      Base64 PNG data URL
 */
async function generateUPIQR(upiId, name, amount) {
    const upiStr = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}` +
        (amount !== undefined ? `&am=${amount}` : '') +
        `&cu=INR`;
    return qrcode_1.default.toDataURL(upiStr, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
    });
}
//# sourceMappingURL=qr.js.map