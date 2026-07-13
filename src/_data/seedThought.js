const fs = require("fs");
const path = require("path");

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

module.exports = function () {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const monthFile = path.join(__dirname, "../assets/data/seed-thoughts", `${mm}.json`);
  const monthData = JSON.parse(fs.readFileSync(monthFile, "utf8"));
  const html = monthData[dd] || "<p>Seed Thoughts unavailable at this time.</p>";

  return {
    dateKey: `${mm}-${dd}`,
    label: `${monthNames[now.getMonth()]} ${now.getDate()}`,
    html
  };
};
