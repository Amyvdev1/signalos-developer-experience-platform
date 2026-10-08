import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { Run } from "../shared/types.ts";
import { payloadHash } from "../reliability-lab/index.ts";
export class Conflict extends Error {}
export class Ledger {
  db: DatabaseSync;
  constructor(file = ":memory:") {
    if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
    this.db.exec(
      readFileSync(new URL("./migration.sql", import.meta.url), "utf8"),
    );
  }
  save(run: Run, expected?: number) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      if (expected === undefined)
        this.db
          .prepare("INSERT INTO runs VALUES(?,?,?,?)")
          .run(run.id, run.revision, run.createdAt, JSON.stringify(run));
      else {
        const result = this.db
          .prepare(
            "UPDATE runs SET revision=?,document=? WHERE id=? AND revision=?",
          )
          .run(run.revision, JSON.stringify(run), run.id, expected);
        if (!result.changes) throw new Conflict("stale_run_revision");
      }
      this.db.prepare("DELETE FROM evidence WHERE run_id=?").run(run.id);
      run.evidence.forEach((e, i) =>
        this.db
          .prepare("INSERT INTO evidence VALUES(?,?,?)")
          .run(run.id, i, JSON.stringify(e)),
      );
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  get(id: string): Run | undefined {
    const r = this.db.prepare("SELECT document FROM runs WHERE id=?").get(id);
    return r ? JSON.parse(String(r.document)) : undefined;
  }
  list(): Run[] {
    return this.db
      .prepare(
        "SELECT document FROM runs ORDER BY created_at DESC,id DESC LIMIT 100",
      )
      .all()
      .map((r) => JSON.parse(String(r.document)));
  }
  payment(key: string, amount: number) {
    const hash = payloadHash({ amount });
    const prior = this.db
      .prepare("SELECT * FROM payments WHERE key=?")
      .get(key);
    if (prior) {
      if (prior.payload_hash !== hash)
        throw new Conflict("idempotency_key_conflict");
      return {
        id: String(prior.id),
        amount: Number(prior.amount),
        duplicate: true,
      };
    }
    const id = `fixture_${randomUUID()}`;
    this.db
      .prepare("INSERT INTO payments VALUES(?,?,?,?)")
      .run(key, hash, id, amount);
    return { id, amount, duplicate: false };
  }
  countPayments(key: string) {
    return Number(
      this.db.prepare("SELECT count(*) n FROM payments WHERE key=?").get(key)
        ?.n ?? 0,
    );
  }
  attempt(key: string) {
    this.db
      .prepare(
        "INSERT INTO scenario_attempts VALUES(?,1) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1",
      )
      .run(key);
    return Number(
      this.db
        .prepare("SELECT attempts FROM scenario_attempts WHERE key=?")
        .get(key)?.attempts,
    );
  }
  close() {
    this.db.close();
  }
}
