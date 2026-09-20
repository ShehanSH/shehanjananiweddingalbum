const { spawnSync } = require("child_process");

function schemaPath() {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("postgres") ? "prisma/schema.production.prisma" : "prisma/schema.prisma";
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status) process.exit(result.status);
}

const schema = schemaPath();
run("npx", ["prisma", "generate", "--schema", schema]);
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres") && process.argv.includes("--push")) {
  run("npx", ["prisma", "db", "push", "--schema", schema, "--skip-generate"]);
}
