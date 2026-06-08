# Personal Forecast Dashboard

Minimalist offline-first dashboard for personal forecasting.

## What it does

- Forecasts savings by vacation date
- Forecasts savings by end of year
- Counts paydays left before vacation
- Shows days, weeks and fortnights until vacation
- Forecasts annual leave balance by vacation
- Shows paid leave surplus or shortfall
- Tracks one-off expenses and income
- Tracks trip savings target progress

## Privacy

Your personal numbers are saved only in your browser using local storage.

Do not put your real savings, pay, leave balance or expenses directly into the GitHub code. Enter them inside the dashboard instead.

## How to use

1. Open `index.html`.
2. Select **Edit settings**.
3. Enter your current savings, planned saving per pay, next payday, vacation dates and annual leave details.
4. Add any one-off expense or income items.
5. Use **Export backup** to save a copy of your dashboard data.
6. Use **Import backup** to restore the data later.

## Default dates

The default vacation dates are:

- Start: 14 Aug 2026
- End: 31 Oct 2026

These are editable in the dashboard and can be changed for any future vacation or target date.

## Files

- `index.html` - app page
- `style.css` - minimalist interface styling
- `app.js` - calculations and browser storage
- `manifest.webmanifest` - installable web app metadata
- `sw.js` - offline caching after the first successful load

## Notes

- Annual leave required can be entered manually.
- If annual leave required is left blank, the app estimates leave using Monday to Friday only.
- For shift work, manually entering planned leave hours will be more accurate.
- Offline mode works after the app has loaded once in the browser.
