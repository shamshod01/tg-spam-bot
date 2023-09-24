import crypto from 'crypto-js'
export function encrypt(plainText: string): string {
    const secret = crypto.SHA256('').toString();

    return crypto.AES.encrypt(plainText, secret).toString();
}

export function decrypt(cipherText: string): string {
    const secret = crypto.SHA256('').toString();

    const bytes = crypto.AES.decrypt(cipherText, secret);
    try {
        const plainText = bytes.toString(crypto.enc.Utf8);

        if (plainText.length == 0) return "";
        return plainText;
    } catch(e) {
        return "";
    }
}