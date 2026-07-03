// Fires on every Netlify Forms submission. Deletes submissions from
// addresses on the BLOCKED_EMAILS env var (comma-separated) so unwanted
// senders don't clutter the dashboard or trigger notification emails.
exports.handler = async (event) => {
  const { payload } = JSON.parse(event.body);
  const email = String((payload.data && payload.data.email) || payload.email || "")
    .trim()
    .toLowerCase();

  const blockedEmails = (process.env.BLOCKED_EMAILS || "")
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);

  if (email && blockedEmails.includes(email)) {
    const token = process.env.NETLIFY_API_TOKEN;
    if (token) {
      await fetch(`https://api.netlify.com/api/v1/submissions/${payload.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return { statusCode: 200 };
};
