// Script to write random FlexLM-style logs directly into logs/flexlm-all-scenarios.log

const fs = require("fs");
const path = require("path");

// Target log file path
const logFilePath = path.join(__dirname, "../logs/flexlm-all-scenarios.log");

// Sample data pools
const vendors = ["synopsys", "cadence", "altair"];
const programs = {
  synopsys: ["dc_shell", "vcs", "primetime", "design_compiler"],
  cadence: ["innovus", "genus", "tempus", "virtuoso"],
  altair: ["optistruct", "hypermesh", "flotherm", "flux"],
};
const versions = ["v2023.06", "v23.10", "v2022.1", "v2024.02"];
const users = [
  "john@design01",
  "alice@floorplan01",
  "dave@cae01",
  "arun@eda03",
  "li@chip05",
  "alex@cad02",
];
const types = ["IN", "OUT", "RESERVED"];

// Utility to generate random item
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Live timestamp generator (HH:MM:SS)
function liveTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// Generate one random log line
function generateLogLine() {
  const vendor = getRandom(vendors);
  const program = getRandom(programs[vendor]);
  const version = getRandom(versions);
  const user = getRandom(users);
  const type = getRandom(types);
  const handle = Math.floor(10000 + Math.random() * 90000);
  const count =
    Math.random() > 0.5
      ? `${Math.floor(Math.random() * 10) + 1}/${Math.floor(Math.random() * 30) + 1}`
      : "";
  const reserved = type === "RESERVED" ? "(RESERVED for GROUP CAE)" : "";

  return `${liveTime()} (${vendor}) ${type}: "${program}" ${version}  user ${user} ${reserved} (handle ${handle}) ${count}`.trim();
}

// Write 10 logs
function writeLogs() {
  const logs = Array.from({ length: 10 }, generateLogLine).join("\n") + "\n";
  fs.appendFileSync(logFilePath, logs, "utf8");
  console.log(`✅ 10 random log lines written to ${logFilePath}`);
}

// Run it
writeLogs();
