import { writeFileSync } from "node:fs";
import {
  throwingTechniques,
  normalizeTechnique,
} from "../src/throw-content.js";

const channelId = "UCtF6tu7GuZYkZzht5MIv8UQ";
const videos = {};
const pending = [...throwingTechniques];

function videoEntries(value, entries = []) {
  if (!value || typeof value !== "object") return entries;
  if (value.videoRenderer) entries.push(value.videoRenderer);
  for (const child of Object.values(value)) videoEntries(child, entries);
  return entries;
}

async function findVideo(technique, query = technique.name.toLowerCase()) {
  const url = new URL("https://www.youtube.com/@KODOKANJUDO/search");
  url.searchParams.set("query", query);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok)
    throw new Error(`${technique.name}: HTTP ${response.status}`);
  const html = await response.text();
  const match = /var ytInitialData = (.*?);<\/script>/s.exec(html);
  if (!match) throw new Error(`${technique.name}: channel data unavailable`);
  const data = JSON.parse(match[1]);
  if (data.metadata?.channelMetadataRenderer?.externalId !== channelId)
    throw new Error("Unexpected video channel");
  const candidates = videoEntries(data).filter((entry) => {
    const owner =
      entry.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
    const title = entry.title?.runs?.map((run) => run.text).join("") ?? "";
    const english = title.split("/").at(-1).trim();
    return owner === channelId && normalizeTechnique(english) === technique.id;
  });
  if (!candidates.length) {
    const parts = technique.name.toLowerCase().split("-");
    const fallback =
      parts[0].length >= 3 ? parts[0] : parts.slice(0, 2).join("-");
    if (query !== fallback) return findVideo(technique, fallback);
    throw new Error(`${technique.name}: no exact official video match`);
  }
  const video = candidates[0];
  const title = video.title.runs.map((run) => run.text).join("");
  return {
    id: video.videoId,
    title,
    channelId,
    duration: video.lengthText?.simpleText ?? "",
  };
}

async function processNext() {
  const technique = pending.shift();
  if (!technique) return;
  videos[technique.id] = await findVideo(technique);
  console.log(`Verified ${technique.name}: ${videos[technique.id].id}`);
  await processNext();
}

await Promise.all(Array.from({ length: 4 }, () => processNext()));
const ordered = Object.fromEntries(
  throwingTechniques.map((technique) => [technique.id, videos[technique.id]]),
);
writeFileSync(
  new URL("../src/throw-videos.json", import.meta.url),
  `${JSON.stringify({ channel: "https://www.youtube.com/@KODOKANJUDO", channelId, verifiedAt: new Date().toISOString().slice(0, 10), videos: ordered }, null, 2)}\n`,
);
console.log(
  `Saved ${Object.keys(ordered).length} verified official demonstrations.`,
);
