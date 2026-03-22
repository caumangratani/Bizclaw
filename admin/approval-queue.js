/**
 * BizClaw Approval Queue
 * In-memory queue with JSON file persistence
 */

const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const EXPIRE_MINUTES = 10;
const DATA_FILE = path.join(__dirname, "data", "approvals.json");

class ApprovalQueue {
  constructor() {
    this.pending = new Map();
    this.history = [];
    this.expireTimers = new Map();
    this._init();
  }

  async _init() {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      const data = JSON.parse(raw);

      // Restore pending items and reschedule expiry
      if (Array.isArray(data.pending)) {
        for (const item of data.pending) {
          if (item.status === "pending") {
            item.status = this._shouldExire(item) ? "expired" : "pending";
            if (item.status === "pending") {
              this.pending.set(item.id, item);
              this._scheduleExpire(item);
            } else {
              this.history.push(item);
            }
          }
        }
      }

      if (Array.isArray(data.history)) {
        // Keep last 500 history items
        this.history = data.history.slice(-500);
      }
    } catch {
      // Fresh start - file will be written on first change
    }
  }

  _shouldExire(item) {
    const ageMs = Date.now() - new Date(item.requestedAt).getTime();
    return ageMs > EXPIRE_MINUTES * 60 * 1000;
  }

  _scheduleExpire(item) {
    const ageMs = Date.now() - new Date(item.requestedAt).getTime();
    const remainingMs = EXPIRE_MINUTES * 60 * 1000 - ageMs;
    const delay = Math.max(remainingMs, 0);

    const timer = setTimeout(async () => {
      this.expire(item.id);
    }, delay);

    this.expireTimers.set(item.id, timer);
  }

  _persist() {
    // Debounced persist - write to disk
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(async () => {
      try {
        const data = {
          pending: Array.from(this.pending.values()),
          history: this.history.slice(-500)
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
      } catch (err) {
        console.error("[ApprovalQueue] persist error:", err.message);
      }
    }, 500);
  }

  _log(action, item, extra = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      approvalId: item.id,
      clientId: item.clientId,
      actionType: item.action,
      requestedBy: item.requestedBy,
      approver: item.approver || null,
      reason: item.reason || null,
      status: item.status,
      ...extra
    };
    console.log("[ApprovalQueue]", JSON.stringify(logEntry));
  }

  enqueue({ clientId, action, details, requestedBy, risk = "medium", policyRule = null }) {
    const id = crypto.randomBytes(12).toString("hex");
    const item = {
      id,
      clientId: clientId || "unknown",
      action: action || "unknown",
      details: details || {},
      requestedAt: new Date().toISOString(),
      status: "pending",
      requestedBy: requestedBy || "system",
      risk: ["low", "medium", "high"].includes(risk) ? risk : "medium",
      policyRule
    };

    this.pending.set(id, item);
    this._scheduleExpire(item);
    this._persist();
    this._log("ENQUEUE", item);

    return item;
  }

  getPending(clientId = null) {
    const items = Array.from(this.pending.values());

    // Auto-expire stale items
    const toExpire = items.filter((item) => this._shouldExire(item));
    for (const item of toExpire) {
      this.expire(item.id);
    }

    const filtered = clientId ? items.filter((item) => item.clientId === clientId) : items;
    return filtered.sort((a, b) => new Date(a.requestedAt) - new Date(b.requestedAt));
  }

  approve(id, approver) {
    const item = this.pending.get(id);
    if (!item) return null;

    clearTimeout(this.expireTimers.get(id));
    this.expireTimers.delete(id);

    item.status = "approved";
    item.approver = approver || "operator";
    item.resolvedAt = new Date().toISOString();

    this.pending.delete(id);
    this.history.push(item);
    this._persist();
    this._log("APPROVE", item);

    return item;
  }

  deny(id, approver, reason = null) {
    const item = this.pending.get(id);
    if (!item) return null;

    clearTimeout(this.expireTimers.get(id));
    this.expireTimers.delete(id);

    item.status = "denied";
    item.approver = approver || "operator";
    item.reason = reason || "No reason provided";
    item.resolvedAt = new Date().toISOString();

    this.pending.delete(id);
    this.history.push(item);
    this._persist();
    this._log("DENY", item, { reason });

    return item;
  }

  expire(id) {
    const item = this.pending.get(id);
    if (!item) return null;

    clearTimeout(this.expireTimers.get(id));
    this.expireTimers.delete(id);

    item.status = "expired";
    item.resolvedAt = new Date().toISOString();

    this.pending.delete(id);
    this.history.push(item);
    this._persist();
    this._log("EXPIRE", item);

    return item;
  }

  getHistory(clientId = null, limit = 50) {
    const items = clientId
      ? this.history.filter((item) => item.clientId === clientId)
      : this.history;

    return items
      .sort((a, b) => new Date(b.resolvedAt || b.requestedAt) - new Date(a.resolvedAt || a.requestedAt))
      .slice(0, limit);
  }

  getUnreadCount() {
    return this.pending.size;
  }

  getById(id) {
    return this.pending.get(id) || this.history.find((item) => item.id === id) || null;
  }
}

// Singleton instance
const queue = new ApprovalQueue();

module.exports = queue;
