/**
 * Generate a UPI QR code data URL for embedding in a PDF.
 * @param upiId  UPI ID (e.g. "business@upi")
 * @param name   Payee name (shown in UPI app)
 * @param amount Amount to charge (optional — 0 for fixed merchant QR)
 * @returns      Base64 PNG data URL
 */
export declare function generateUPIQR(upiId: string, name: string, amount?: number): Promise<string>;
//# sourceMappingURL=qr.d.ts.map