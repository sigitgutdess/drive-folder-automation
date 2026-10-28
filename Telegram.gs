function getBotToken() {
  return PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || "8852863589:AAHc4-n5Z7uMUpv3OoNLfCRaqgObdmZyxlg";
}

function doPost(e) {
  try {
    if (!e || !e.postData) return;
    
    const data = JSON.parse(e.postData.contents);
    if (!data.message || !data.message.text) return;

    const chatId = data.message.chat.id;
    const username = data.message.from && data.message.from.username 
      ? "@" + data.message.from.username 
      : (data.message.from && data.message.from.first_name ? data.message.from.first_name : "Unknown");

    const text = data.message.text.trim();
    let responseText = "";

    if (text === '/status') {
      let config = { ACCESS_STATUS: "Tertutup", DEADLINE: "-" };
      try {
        config = getConfig(); 
      } catch (err) {}
      responseText = "Status Sistem Drive:\n- Status Akses: " + config.ACCESS_STATUS + "\n- Tenggat: " + config.DEADLINE;
      logActivity(username, "/status", "Mengecek status sistem");
    } 
    else if (text.startsWith('/open')) {
      const payloadText = text.substring(5).trim();
      
      try {
        if (payloadText.includes(' ')) {
          const formattedDateStr = payloadText.replace(/-/g, '/');
          const deadline = new Date(formattedDateStr);
          
          if (isNaN(deadline.getTime())) {
            throw new Error("Format tanggal tidak valid");
          }
          
          const durationMinutes = Math.max(1, Math.round((deadline.getTime() - new Date().getTime()) / 60000));
          openFolderAccessCustom(durationMinutes, deadline);
          responseText = "Akses folder dibuka sampai: " + deadline.toLocaleString();
          logActivity(username, "/open (Custom)", "Dibuka sampai " + deadline.toLocaleString());
          
        } else {
          const durationMinutes = payloadText ? parseInt(payloadText) : 10;
          const deadline = new Date(new Date().getTime() + durationMinutes * 60000);
          
          openFolderAccessCustom(durationMinutes, deadline);
          responseText = "Akses folder berhasil dibuka selama " + durationMinutes + " menit.";
          logActivity(username, "/open (Duration)", "Dibuka selama " + durationMinutes + " menit");
        }
      } catch (err) {
        responseText = "Format salah. Gunakan:\n• /open 15\n• /open 2026-10-27 21:30";
      }
    }
    else if (text === '/close') {
      try {
        closeFolderAccess();
      } catch (err) {}
      responseText = "Akses folder telah ditutup sekarang.";
      logActivity(username, "/close", "Menutup akses folder secara manual");
    } 
    else {
      responseText = "Perintah tidak dikenali. Gunakan /status, /open [menit atau waktu], atau /close.";
      logActivity(username, text, "Perintah tidak dikenal");
    }

    const token = getBotToken();
    const url = "https://api.telegram.org/bot" + token + "/sendMessage";
    const payload = {
      'chat_id': chatId,
      'text': responseText
    };

    UrlFetchApp.fetch(url, {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload)
    });

  } catch (err) {
    console.error('Error in doPost: ' + err.toString());
  }
}

// Fungsi bantu untuk mendaftarkan URL Webhook Telegram
function setTelegramWebhook() {
  const token = getBotToken();
  const webAppUrl = "URL_WEB_APP_ANDA_DISINI"; // Ganti dengan URL Web App Anda yang berakhiran /exec
  
  const url = "https://api.telegram.org/bot" + token + "/setWebhook?url=" + encodeURIComponent(webAppUrl);
  const response = UrlFetchApp.fetch(url);
  
  Logger.log("Hasil Set Webhook: " + response.getContentText());
}
