/**
 * Kinshuk Smart Idea Loop — HTML Email Edition
 * Generates vlog + Shorts ideas from YouTube analytics using Gemini
 * Sends formatted HTML email for readability + plain fail alert if errors occur.
 */

const GEMINI_API_KEY = "AIzaSyCxy5__hsRu2L62TXPCY_gWid6dZeEND-g";
const EMAIL_TO_NOTIFY = "kinshukprasad1@gmail.com";
const CHANNEL_ID = "UCNTu9O-KbIfENoXaImXmiJA";

function sendAnalyticsToGemini() {
  try {
    const now = new Date();
    const last14 = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

    // ✅ Fetch last 50 uploads
    const uploadsPlaylist = YouTube.Channels.list("contentDetails", { id: CHANNEL_ID })
      .items[0]
      .contentDetails
      .relatedPlaylists
      .uploads;

    const videos = YouTube.PlaylistItems.list("contentDetails", {
      playlistId: uploadsPlaylist,
      maxResults: 50
    }).items.map(i => i.contentDetails.videoId);

    // ✅ Fetch metadata and stats
    const stats = YouTube.Videos.list("snippet,contentDetails,statistics", {
      id: videos.join(","),
      maxResults: 50
    }).items;

    // Separate into Shorts vs Long-form
    const shorts = [];
    const longform = [];

    stats.forEach(v => {
      const dur = parseISO8601Duration(v.contentDetails.duration);
      const title = v.snippet.title.toLowerCase();
      const isShort = dur <= 60 || title.includes("#shorts");

      const info = {
        title: v.snippet.title,
        views: v.statistics.viewCount,
        likes: v.statistics.likeCount,
        comments: v.statistics.commentCount,
        duration: dur
      };

      if (isShort) shorts.push(info);
      else longform.push(info);
    });

    // ✅ Summarize Long-form
    let summary = "";
    longform.slice(0, 5).forEach(v => {
      summary += `<li><b>${escapeHtml(v.title)}</b> — ${v.views} views, ${v.likes} likes, ${v.comments} comments</li>`;
    });

    // ✅ Summarize Shorts
    let shortsSummary = "";
    if (shorts.length) {
      shorts.slice(0, 5).forEach(v => {
        shortsSummary += `<li><b>${escapeHtml(v.title)}</b> — ${v.views} views, ${v.likes} likes, ${v.duration}s</li>`;
      });
    } else {
      shortsSummary = "<li>No Shorts found.</li>";
    }

    // --- Gemini prompts ---
    const vlogPrompt = `
You are Kinshuk Prasad’s YouTube strategist.

Here is the latest long-form analytics summary:
${summary}

Generate 3 new vlog ideas.
For each idea include:
• Catchy title
• 1-sentence description
• 3–5 keyword tags
• Recommended upload time (IST)
`;

    const vlogResult = queryGeminiWithFallback(vlogPrompt);
    const vlogIdeasText = vlogResult.text;
    const vlogModelUsed = vlogResult.model;

    const shortsPrompt = `
You are a YouTube Shorts strategist for Kinshuk Prasad.

Here is the latest Shorts performance summary:
${shortsSummary}

Generate 3 new YouTube Shorts ideas (<60s).
Each idea should have:
• Hook line
• Concept summary
• 3–5 hashtags
• Suggested duration (sec)
• Upload time (IST)
`;

    const shortsResult = queryGeminiWithFallback(shortsPrompt);
    const shortsIdeasText = shortsResult.text;
    const shortsModelUsed = shortsResult.model;

    // ✅ Build HTML Email
    const htmlBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; color: #202124;">
        <h2 style="color: #1a73e8;">🎬 Smart Idea Loop — Daily Report</h2>
        <p>Hi Kinshuk 👋,</p>

        <h3>📊 Long-form Analytics (Last 50 uploads)</h3>
        <ul>${summary}</ul>

        <h3>🎬 Shorts Analytics</h3>
        <ul>${shortsSummary}</ul>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

        <h3>🎥 <span style="color:#34a853;">Long-form Ideas (${vlogModelUsed})</span></h3>
        <pre style="background:#f7f9fc; padding:10px; border-radius:8px;">${escapeHtml(vlogIdeasText)}</pre>

        <h3>📱 <span style="color:#fbbc05;">Shorts Ideas (${shortsModelUsed})</span></h3>
        <pre style="background:#f7f9fc; padding:10px; border-radius:8px;">${escapeHtml(shortsIdeasText)}</pre>

        <p style="margin-top: 20px;">Data sourced from your latest 50 uploads.<br>
        <b>– Smart Idea Loop 🚀</b></p>
      </div>
    `;

    const successSubject = `✅ Smart Idea Loop Success — 3 Vlog + 3 Shorts Ideas (${Utilities.formatDate(new Date(), "Asia/Kolkata", "MMM d, h:mm a")})`;

    MailApp.sendEmail({
      to: EMAIL_TO_NOTIFY,
      subject: successSubject,
      htmlBody: htmlBody,
    });

  } catch (err) {
    const errorDetails = `
❌ Smart Idea Loop Error

Time: ${Utilities.formatDate(new Date(), "Asia/Kolkata", "MMM d, yyyy h:mm a")}
Error: ${err.message}

Stack Trace:
${err.stack || "(no stack trace)"}
    `;
    Logger.log(errorDetails);

    // 🚨 FailSafe Email Notification
    MailApp.sendEmail({
      to: EMAIL_TO_NOTIFY,
      subject: "⚠️ Smart Idea Loop Failed",
      body: errorDetails,
    });
  }
}

/** Helper: Convert ISO8601 duration (e.g. PT45S, PT1M12S) to seconds */
function parseISO8601Duration(dur) {
  const match = dur.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const minutes = parseInt(match?.[1] || 0);
  const seconds = parseInt(match?.[2] || 0);
  return minutes * 60 + seconds;
}

/** Helper: HTML escape for Gemini text */
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function queryGeminiWithFallback(prompt) {
  const models = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
  ];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      const res = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });
      if (res.getResponseCode() === 200) {
        const data = JSON.parse(res.getContentText());
        const ideas = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return { text: ideas, model };
      }
    } catch (e) {
      Logger.log(`Error with ${model}: ${e.message}`);
    }

    Utilities.sleep(2000);
  }
  throw new Error("All Gemini models failed");
}
