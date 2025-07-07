function xorEncryptDecrypt(text, secret) {
  // Validate inputs
  if (typeof text !== "string" || typeof secret !== "string") {
    console.error("Invalid input: both text and secret must be strings.");
    return null;
  }

  if (text.length === 0 || secret.length === 0) {
    console.error("Text and secret must not be empty.");
    return null;
  }

  const textChars = text.split("");
  const secretChars = secret.split("");
  let result = "";

  for (let i = 0; i < textChars.length; i++) {
    // XOR operation between the text character and the secret character
    const encryptedCharCode =
      textChars[i].charCodeAt(0) ^
      secretChars[i % secretChars.length].charCodeAt(0);
    result += String.fromCharCode(encryptedCharCode);
  }

  return result;
}

// Base64 encode the result after XOR encryption
function encrypt(text, secret) {
  const encrypted = xorEncryptDecrypt(text, secret);
  return btoa(encrypted); // Convert to Base64 string
}

function decrypt(encryptedText, secret) {
  let _encryptedText = encryptedText?.split(".txt")[0];
  console.log("🚀  decrypt encryptedText:", encryptedText);
  // if (typeof window !== "undefined") {
  try {
    // Decode URL-encoded strings first
    const decodedBase64 = decodeURIComponent(_encryptedText);

    // Validate Base64 string format using regex
    const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Pattern.test(decodedBase64)) {
      throw new Error("Invalid Base64 format");
    }

    // Decode the Base64 string
    const decoded = atob(decodedBase64);
    return xorEncryptDecrypt(decoded, secret);
  } catch (error) {
    console.error("Error decoding Base64 string:", error);
    return null; // Return null or handle error accordingly
  }
  // }

  // return null; // Return null in non-browser environments
}

export { encrypt, decrypt };
