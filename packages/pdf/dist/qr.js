import QRCode from 'qrcode';
/**
 * Generate a UPI QR code data URL for embedding in a PDF.
 * @param upiId  UPI ID (e.g. "business@upi")
 * @param name   Payee name (shown in UPI app)
 * @param amount Amount to charge (optional — 0 for fixed merchant QR)
 * @returns      Base64 PNG data URL
 */
export async function generateUPIQR(upiId, name, amount) {
    const upiStr = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}` +
        (amount !== undefined ? `&am=${amount}` : '') +
        `&cu=INR`;
    return QRCode.toDataURL(upiStr, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
    });
}
//# sourceMappingURL=qr.js.map