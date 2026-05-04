/**
 * DELICIOUS_CORP Master Persistence Logic
 * 
 * Note: Since this is a browser-based React application, we cannot silently write 
 * to an absolute path like C:\Users\William\Documents\DELICIOUS_CORP\vault for security reasons.
 * 
 * Instead, we use the File System Access API (or a fallback blob download) which will 
 * prompt the user to save the file. The user can then select the DELICIOUS_CORP\vault folder.
 */

export const saveToVault = async (filename: string, data: any) => {
  const jsonString = JSON.stringify(data, null, 2);
  
  try {
    // Try using the modern File System Access API
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return true;
    } else {
      // Fallback for older browsers
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
  } catch (error) {
    console.error("Failed to save to vault:", error);
    return false;
  }
};
