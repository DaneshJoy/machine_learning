# یادگیری ماشین

دورهٔ «یادگیری ماشین» برای مرکز جهاد دانشگاهی صنعتی شریف است.

- `contents/` صفحه‌های درس است.
- `codes/` نوت‌بوک‌هایی است که از گیت‌هاب پیوند می‌شوند.

```sh
npm ci
npm run check
# پیش‌نمایش لوکال (ساخت + سرور روی http://localhost:3000):
npm run dev
```

نشانی سایت: https://daneshjoy.github.io/machine_learning/

## بستهٔ آفلاین دانشجویی

برای ساخت بستهٔ تک‌فایلی برای هر کلاس (بدون اینترنت، Node.js یا نصب چیزی):

```sh
npm ci
npm run package:offline
```

خروجی در `offline/machine-learning-offline.zip` ساخته می‌شود: `index.html` در ریشهٔ بسته است و فونت‌ها، Chart.js و نوت‌بوک‌ها داخل خود بسته کپی می‌شوند.

**راهنمای ویندوز برای دانشجو:** فایل ZIP را با راست‌کلیک و «Extract All…» کامل استخراج کنید، سپس `index.html` را در Microsoft Edge، Chrome یا Firefox باز کنید. به اینترنت، Node.js یا سرور محلی نیاز نیست؛ نوت‌بوک‌ها با نرم‌افزار مناسب خودشان باز می‌شوند.

ساخت بسته به میزبان POSIX با `npm` و `python3` نیاز دارد؛ روی ویندوز از WSL استفاده کنید.

برای انتشار، در تنظیمات GitHub Pages گزینهٔ **Source: GitHub Actions** را فعال کنید.
