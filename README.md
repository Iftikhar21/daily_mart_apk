Oke, berikut versi **README.md** yang sudah saya ubah supaya sesuai dengan proyek kamu — yaitu **React Native (mobile)** yang terhubung ke **backend Laravel (daily_mart_be)**, khusus untuk role **kurir, petugas, dan user**.

---

# 📱 Daily Mart Mobile App

A **React Native** mobile application connected to the **Laravel Backend (daily_mart_be)**.
This app is designed for **couriers (kurir)**, **officers (petugas)**, and **users** who register and interact with the system.

---

## ⚙️ Requirements

Before you start, make sure you have installed:

* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
* [Android Studio](https://developer.android.com/studio) or physical Android device
* [PHP](https://www.php.net/)
* [Composer](https://getcomposer.org/)
* [Laravel](https://laravel.com/docs)
* MySQL database

---

## 🚀 Backend Setup (Laravel API)

Clone the backend repository:

```bash
git clone https://github.com/yourusername/daily_mart_be.git
cd daily_mart_be
```

### 1. Install dependencies

```bash
composer install
```

### 2. Configure `.env`

Update your `.env` file and set up your database connection:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=daily_mart
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Run migrations

```bash
php artisan migrate
```

### 4. Run the Laravel server

> ⚠️ Make sure to replace `192.168.xxx.xxx` with your **local IP address** (found via `ipconfig`).

```bash
php artisan serve --host=192.168.xxx.xxx --port=8000
```

Example:

```bash
php artisan serve --host=192.168.112.171 --port=8000
```

---

## 📲 Frontend Setup (React Native App)

Clone the frontend (mobile) repository:

```bash
git clone https://github.com/yourusername/daily_mart_mobile.git
cd daily_mart_mobile
```

### 1. Install dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure API connection

Go to:

```
src/config/api.ts
```

Then edit the `BASE_URL` to match your backend server IP:

```ts
export const BASE_URL = 'http://192.168.xxx.xxx:8000/api';
```

Example:

```ts
export const BASE_URL = 'http://192.168.112.171:8000/api';
```

---

## ▶️ Run the App

### Step 1: Start Metro

```bash
npm start
# or
yarn start
```

### Step 2: Run on Android

Make sure your device/emulator is connected:

```bash
adb devices
```

Then run:

```bash
npm run android
# or
yarn android
```

> ⚠️ Ensure your **mobile device** and **backend server** are on the same Wi-Fi network!

---

## 🧩 Role Information

| Role        | Access                                                  |
| ----------- | ------------------------------------------------------- |
| **User**    | Register via app, login, and manage profile (pelanggan) |
| **Kurir**   | Login to manage delivery tasks                          |
| **Petugas** | Login to manage operational duties                      |

---

## 💡 Notes

* Registration (`/register`) is only for **new users**.
* Kurir and Petugas accounts are created by the admin from the backend panel.
* After login, a **user** will fill the **Pelanggan** (customer) table data.

---

## 🛠 Troubleshooting

If you face issues:

* Run `adb kill-server && adb start-server`
* Check IP with `ipconfig`
* Ensure `php artisan serve` and `npm start` are running together

---

## 🏁 Summary

| Component       | Command                                                |
| --------------- | ------------------------------------------------------ |
| Start Backend   | `php artisan serve --host=192.168.xxx.xxx --port=8000` |
| Start Metro     | `npm start`                                            |
| Run Android App | `npm run android`                                      |
| API URL         | `http://192.168.xxx.xxx:8000/api`                      |

---