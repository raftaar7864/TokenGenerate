const { spawn } = require("node:child_process");

const port = process.env.PORT || "4173";

const server = spawn(
  process.execPath,
  [
    require.resolve("serve/build/main.js"),
    "-s",
    "dist",
    "-l",
    port,
  ],
  { stdio: "inherit", shell: false }
);

server.on("error", (error) => {
  console.error("Failed to start frontend:", error);
  process.exitCode = 1;
});

server.on("exit", (code) => {
  process.exit(code ?? 1);
});