const wordMime = 'application/msword';
const compoundFileHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

// El navegador puede enviar un .doc como octet-stream o sin MIME.
// Por eso comprobamos su extensión y su contenedor, no solo el tipo declarado.
export function getDocumentFormat(filename: string, mime: string, data: Buffer) {
  if (/\.doc$/i.test(filename)) {
    const isWordDocument = data.length >= 512
      && data.subarray(0, 8).equals(compoundFileHeader)
      && data.includes(Buffer.from('WordDocument\0', 'utf16le'));
    return isWordDocument ? { extension: 'doc', mime: wordMime } : null;
  }

  if (mime === 'application/pdf' && data.subarray(0, 5).toString() === '%PDF-') {
    return { extension: 'pdf', mime };
  }
  if (mime === 'image/jpeg' && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return { extension: 'jpg', mime };
  }
  if (mime === 'image/png' && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { extension: 'png', mime };
  }
  return null;
}
