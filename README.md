# Personal Predictor

A minimalist offline-first personal prediction tool.

## What it does

The app starts with a question list. Each question opens its own calculator screen:

1. **Money by date** - predicts how much money may be available by a selected date.
2. **Annual leave** - estimates leave balance and leave surplus/shortfall by a selected date.
3. **Time left** - counts days, weeks, fortnights, months and paydays until a selected date.
4. **Savings goal** - uses target amount, target date, current savings, pay amount, spending per payday and extra expenses to show whether the goal is realistic.
5. **Can I buy this?** - checks whether a purchase still leaves enough money by a selected date.

## Design rules

- Each screen answers one specific question.
- Inputs are optional wherever possible.
- Blank number fields are treated as zero.
- Blank payday fields mean payday-based counts are ignored.
- The result is shown immediately under the inputs.
- A breakdown is shown underneath the result.

## Savings goal logic

The savings goal screen estimates realistic saving capacity using:

`pay each payday - spending each payday = can save each payday`

It then compares this with:

`amount still needed ÷ paydays available = need each payday`

The result shows projected savings by the target date, plus whether there is a surplus or shortfall.

## Privacy

Your personal numbers are saved only in your browser using local storage.

Do not put your real savings, pay, leave balance or expenses directly into the GitHub code. Enter them inside the app instead.

## Data

Use **Data** on the start screen to:

- Export a JSON backup.
- Import a JSON backup.
- Reset saved browser data.

## Files

- `index.html` - app screens
- `style.css` - interface styling
- `app.js` - calculations and local browser storage
- `manifest.webmanifest` - installable web app metadata
- `sw.js` - offline caching after the first successful load

## Notes

- The app uses the Apple system font stack on iPhone and Mac.
- Offline mode works after the app has loaded once in the browser.
- GitHub stores only the app files, not your private entered values.
