# Google Drive Folder Automation & Telegram Bot

Sistem otomatisasi berbasis Google Apps Script untuk mengelola akses folder Google Drive secara dinamis, memantau aktivitas unggah/hapus file, serta mengirimkan notifikasi email otomatis ke banyak penerima dan bot Telegram.
Alasan saya membuat sistem ini karena saya tidak ingin begadang hanya untuk menutup akses folder di Google Drive, dan menghindari besok paginya dimarahi atasan tidak menutup akses foldernya karena ketiduran

## 🚀 Fitur Utama
- **Kontrol Akses via Telegram**: Membuka atau menutup akses folder Google Drive secara instan menggunakan perintah bot Telegram (`/open`, `/close`, `/status`).
- **Durasi Kustom & Otomatis**: Mendukung pembukaan folder berdasarkan durasi menit tertentu atau tanggal/waktu spesifik (*deadline*).
- **Notifikasi Email Otomatis**: Mengirimkan pemberitahuan email ke daftar penerima di Google Spreadsheet saat folder dibuka maupun ditutup.
- **Pemantauan File (Drive Watcher)**: Mencatat log aktivitas unggah (*upload*) dan hapus (*delete*) file di dalam folder target secara otomatis.
- **Audit Log**: Menyimpan seluruh riwayat perintah dan aktivitas sistem ke dalam tab `Activity_Log` di Google Spreadsheet.

## 🛠️ Teknologi yang Digunakan
- **Google Apps Script (GAS)**
- **Google Drive API & Spreadsheet API**
- **Telegram Bot API**
- **MailApp Service**

## 📋 Perintah Bot Telegram
- `/status` - Mengecek status akses folder saat ini dan tenggat waktunya.
- `/open [menit]` - Membuka akses folder selama durasi menit tertentu (contoh: `/open 15`).
- `/open [YYYY-MM-DD HH:MM]` - Membuka akses folder sampai batas waktu kustom (contoh: `/open 2026-10-28 21:30`).
- `/close` - Menutup akses folder secara manual dan menghentikan izin berbagi.
