const FOLDER_ID = "ISI ID FOLDER KAMU";

// 1. Ambil Folder Target
function getTargetFolder() {
  const folderName = "ISI NAMA FOLDER"; 
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.getFolderById(FOLDER_ID);
  }
}

// 2. Ambil Daftar Email dari Tab 'Penerima' (Secara Fleksibel)
function getNotificationEmails() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    let sheet = null;
    
    for (let i = 0; i < sheets.length; i++) {
      const sheetName = sheets[i].getName().trim().toLowerCase();
      if (sheetName === 'ISI SHEET LIST PENERIMA EMAIL') {
        sheet = sheets[i];
        break;
      }
    }
    
    if (!sheet) {
      Logger.log("Error: Tab sheet 'Penerima' tidak ditemukan!");
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    let emailList = [];
    
    for (let i = 0; i < values.length; i++) {
      const email = values[i][0] ? String(values[i][0]).trim() : "";
      if (email && email.includes('@') && !emailList.includes(email)) {
        emailList.push(email);
      }
    }
    
    return emailList;
  } catch (err) {
    console.error("Gagal membaca email penerima: " + err.toString());
    return [];
  }
}

// 3. Kirim Email Notifikasi Pembukaan Akses Folder
function sendOpenNotification(folderName, deadlineStr) {
  try {
    const emailList = getNotificationEmails();
    if (emailList.length === 0) return;
    
    const subject = "🔓 Pemberitahuan: Akses Folder Google Drive Dibuka";
    const body = `Halo Tim,\n\nAkses ke folder Google Drive "${folderName}" telah DIBUKA.\n\n⏳ Tenggat Waktu (Deadline): ${deadlineStr}\n\nSilakan gunakan akses ini dengan bijak. Terima kasih.`;
    
    for (let i = 0; i < emailList.length; i++) {
      const recipient = emailList[i];
      if (recipient) {
        MailApp.sendEmail(recipient, subject, body);
        Logger.log("Email notifikasi buka berhasil dikirim ke: " + recipient);
      }
    }
  } catch (err) {
    console.error("Gagal mengirim email pembukaan: " + err.toString());
  }
}

// 4. Kirim Email Notifikasi Penutupan Akses Folder
function sendCloseNotification(folderName) {
  try {
    const emailList = getNotificationEmails();
    if (emailList.length === 0) return;
    
    const subject = "⚠️ Pemberitahuan: Akses Folder Google Drive Ditutup";
    const body = `Halo Tim,\n\nAkses ke folder Google Drive "${folderName}" telah ditutup (baik secara otomatis karena tenggat waktu tercapai maupun ditutup manual via bot Telegram).\n\nTerima kasih.`;
    
    for (let i = 0; i < emailList.length; i++) {
      const recipient = emailList[i];
      if (recipient) {
        MailApp.sendEmail(recipient, subject, body);
        Logger.log("Email berhasil dikirim ke: " + recipient);
      }
    }
  } catch (err) {
    console.error("Gagal mengirim email: " + err.toString());
  }
}

// 5. Fungsi Membuka Akses (Durasi Menit)
function openFolderAccess(durationMinutes) {
  const folder = getTargetFolder();
  const folderName = folder.getName();
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  
  const deadline = new Date(new Date().getTime() + durationMinutes * 60000);
  updateConfigInSheet("OPEN", deadline);
  
  sendOpenNotification(folderName, deadline.toLocaleString());
}

// 6. Fungsi Membuka Akses (Waktu Kustom)
function openFolderAccessCustom(durationMinutes, customDeadline) {
  const folder = getTargetFolder();
  const folderName = folder.getName();
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  
  updateConfigInSheet("OPEN", customDeadline);
  
  sendOpenNotification(folderName, new Date(customDeadline).toLocaleString());
}

// 7. Fungsi Menutup Akses & Kirim Email Notifikasi
function closeFolderAccess() {
  const folder = getTargetFolder();
  const folderName = folder.getName();
  
  folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  updateConfigInSheet("CLOSED", "-");
  
  sendCloseNotification(folderName);
}

// 8. Update Config di Spreadsheet
function updateConfigInSheet(status, deadline) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'ACCESS_STATUS') {
      sheet.getRange(i + 1, 2).setValue(status);
    }
    if (data[i][0] === 'DEADLINE') {
      sheet.getRange(i + 1, 2).setValue(deadline);
    }
  }
}

// 9. Ambil Konfigurasi Sistem
function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  const data = sheet.getDataRange().getValues();
  let config = { ACCESS_STATUS: "CLOSED", DEADLINE: "-" };
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'ACCESS_STATUS') {
      config.ACCESS_STATUS = data[i][1];
    }
    if (data[i][0] === 'DEADLINE') {
      config.DEADLINE = data[i][1];
    }
  }
  return config;
}

// 10. Pengecekan Deadline Otomatis
function checkAndCloseFolder() {
  try {
    const config = getConfig();
    if (config.ACCESS_STATUS === "OPEN" && config.DEADLINE && config.DEADLINE !== "-") {
      const currentTime = new Date().getTime();
      const deadlineTime = new Date(config.DEADLINE).getTime();
      if (!isNaN(deadlineTime) && currentTime >= deadlineTime) {
        closeFolderAccess();
      }
    }
  } catch (err) {
    console.error("Error in checkAndCloseFolder: " + err.toString());
  }
}

// 11. Pencatatan Log Aktivitas Bot
function logActivity(username, command, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Activity_Log');
    if (!sheet) {
      sheet = ss.insertSheet('Activity_Log');
      sheet.appendRow(['Timestamp', 'Username', 'Command', 'Details']);
    }
    sheet.appendRow([new Date(), username || "Unknown", command || "-", details || "-"]);
  } catch (err) {
    console.error("Gagal mencatat log: " + err.toString());
  }
}

// 12. Pemantau File Drive (Upload, Delete, & Edit) dengan Keterangan Nama Folder
function checkDriveChanges() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Activity_Log');
    
    if (!sheet) {
      sheet = ss.insertSheet('Activity_Log');
      // Header log dengan kolom Action yang mencakup EDIT
      sheet.appendRow(['Timestamp', 'Folder Name', 'Action', 'File Name', 'Uploader/Editor Name', 'Uploader/Editor Email']);
    }
    
    const targetFolders = getTargetFolders();
    const scriptProperties = PropertiesService.getScriptProperties();
    const storedFilesJson = scriptProperties.getProperty('TRACKED_FILES_MULTI_EDIT');
    let oldFilesMap = storedFilesJson ? JSON.parse(storedFilesJson) : {};
    let currentFilesMap = {};

    targetFolders.forEach(item => {
      const folderName = item.name;
      const files = item.folder.getFiles();
      
      while (files.hasNext()) {
        const file = files.next();
        const fileId = file.getId();
        const fileName = file.getName();
        const lastUpdated = file.getLastUpdated().getTime(); // Waktu modifikasi terakhir file
        
        let editorName = "Unknown";
        let editorEmail = "-";
        try {
          const owner = file.getOwner();
          editorName = owner.getName() || owner.getEmail();
          editorEmail = owner.getEmail();
        } catch (e) {}
        
        currentFilesMap[fileId] = {
          folderName: folderName,
          name: fileName,
          lastUpdated: lastUpdated,
          nameUploader: editorName,
          emailUploader: editorEmail
        };
        
        // 1. Deteksi File Baru (UPLOAD)
        if (!oldFilesMap[fileId]) {
          sheet.appendRow([new Date(), folderName, 'UPLOAD', fileName, editorName, editorEmail]);
        } 
        // 2. Deteksi File yang Diedit (EDIT) berdasarkan perubahan waktu modifikasi
        else if (oldFilesMap[fileId].lastUpdated !== lastUpdated) {
          sheet.appendRow([new Date(), folderName, 'EDIT', fileName, editorName, editorEmail]);
        }
      }
    });
    
    // 3. Deteksi File yang Dihapus (DELETE)
    for (let oldId in oldFilesMap) {
      if (!currentFilesMap[oldId]) {
        const deletedFile = oldFilesMap[oldId];
        sheet.appendRow([new Date(), deletedFile.folderName, 'DELETE', deletedFile.name, deletedFile.nameUploader, deletedFile.emailUploader]);
      }
    }
    
    scriptProperties.setProperty('TRACKED_FILES_MULTI_EDIT', JSON.stringify(currentFilesMap));
  } catch (err) {
    console.error("Error in checkDriveChanges: " + err.toString());
  }
}
    
    scriptProperties.setProperty('TRACKED_FILES', JSON.stringify(currentFilesMap));
  } catch (err) {
    console.error("Error in checkDriveChanges: " + err.toString());
  }
}
