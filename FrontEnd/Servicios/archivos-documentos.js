export function openDocumentFile(blob, originalName) {
  const url = URL.createObjectURL(blob);
  // Word se descarga con nombre y extensión; el navegador no lo puede mostrar como un PDF.
  if (blob.type === 'application/msword' || blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || /\.docx?$/i.test(originalName || '')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName || 'documento.doc';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } else {
    window.open(url, '_blank', 'noopener');
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
