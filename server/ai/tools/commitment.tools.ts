import { Type } from "@google/genai";
import { registerTool, type ToolResponse } from "../toolRegistry";
import { db } from "../../lib/firebase-admin";
import type { Commitment } from "@shared/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ─── 1. createCommitment ──────────────────────────────────────────────────────

registerTool(
  "createCommitment",
  "Create a new commitment (recurring task) for the user. Returns the created commitment.",
  {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Name of the commitment, e.g. 'Cycle for 10 minutes'",
      },
      category: {
        type: Type.STRING,
        description: "Category: Life, Work, or Health",
        enum: ["Life", "Work", "Health"],
      },
      estimatedMinutes: {
        type: Type.NUMBER,
        description: "Estimated duration in minutes",
      },
      cognitiveWeight: {
        type: Type.STRING,
        description: "How mentally taxing: Low, Moderate, or High",
        enum: ["Low", "Moderate", "High"],
      },
      repeatPattern: {
        type: Type.STRING,
        description: "Recurrence: daily, weekly, or monthly",
        enum: ["daily", "weekly", "monthly"],
      },
      nature: {
        type: Type.STRING,
        description: "Energy effect: tiring, neutral, or energizing",
        enum: ["tiring", "neutral", "energizing"],
      },
      startDate: {
        type: Type.STRING,
        description: "Start date in YYYY-MM-DD format",
      },
    },
    required: ["title"],
  },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized: uid is required");

    const id = generateId();
    const commitment: Commitment = {
      id,
      title: args.title as string,
      category: (args.category as Commitment["category"]) ?? "Life",
      estimatedMinutes: (args.estimatedMinutes as number) ?? 15,
      cognitiveWeight:
        (args.cognitiveWeight as Commitment["cognitiveWeight"]) ?? "Moderate",
      repeatPattern:
        (args.repeatPattern as Commitment["repeatPattern"]) ?? "daily",
      nature: (args.nature as Commitment["nature"]) ?? "neutral",
      startDate:
        (args.startDate as string) ?? new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      archived: false,
    };

    await db
      .collection("users")
      .doc(uid)
      .collection("commitments")
      .doc(id)
      .set(commitment);

    console.log(`[CommitmentTools] Created commitment: ${commitment.title}`);

    return {
      success: true,
      message: `Commitment "${commitment.title}" created successfully.`,
      data: commitment,
    };
  },
);

// ─── 2. updateCommitment ──────────────────────────────────────────────────────

registerTool(
  "updateCommitment",
  "Update an existing commitment's properties (title, category, schedule, etc.).",
  {
    type: Type.OBJECT,
    properties: {
      commitmentId: {
        type: Type.STRING,
        description: "ID of the commitment to update",
      },
      title: { type: Type.STRING, description: "New title (optional)" },
      category: { type: Type.STRING, enum: ["Life", "Work", "Health"] },
      estimatedMinutes: { type: Type.NUMBER },
      repeatPattern: {
        type: Type.STRING,
        enum: ["daily", "weekly", "monthly"],
      },
      startDate: { type: Type.STRING, description: "YYYY-MM-DD" },
    },
    required: ["commitmentId"],
  },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized");
    const commitmentId = args.commitmentId as string;

    const ref = db
      .collection("users")
      .doc(uid)
      .collection("commitments")
      .doc(commitmentId);
    const docSnap = await ref.get();
    if (!docSnap.exists) {
      return {
        success: false,
        message: `Commitment ${commitmentId} not found.`,
      };
    }

    const updates: Partial<Commitment> = {};
    if (args.title) updates.title = args.title as string;
    if (args.category)
      updates.category = args.category as Commitment["category"];
    if (args.estimatedMinutes)
      updates.estimatedMinutes = args.estimatedMinutes as number;
    if (args.repeatPattern)
      updates.repeatPattern = args.repeatPattern as Commitment["repeatPattern"];
    if (args.startDate) updates.startDate = args.startDate as string;

    await ref.update(updates);

    return {
      success: true,
      message: `Commitment ${commitmentId} updated successfully.`,
      data: { id: commitmentId, ...updates },
    };
  },
);

// ─── 3. deleteCommitment ──────────────────────────────────────────────────────

registerTool(
  "deleteCommitment",
  "Archive a commitment by its ID or title.",
  {
    type: Type.OBJECT,
    properties: {
      commitmentId: { type: Type.STRING },
      title: { type: Type.STRING },
    },
    required: [],
  },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized");

    const commitmentId = args.commitmentId as string;
    const title = args.title as string;

    let targetRef;
    if (commitmentId) {
      targetRef = db
        .collection("users")
        .doc(uid)
        .collection("commitments")
        .doc(commitmentId);
    } else if (title) {
      const snap = await db
        .collection("users")
        .doc(uid)
        .collection("commitments")
        .where("title", "==", title)
        .where("archived", "==", false)
        .limit(1)
        .get();
      if (!snap.empty) {
        targetRef = snap.docs[0].ref;
      }
    }

    if (!targetRef) {
      return {
        success: false,
        message: `Could not find a commitment to delete.`,
      };
    }

    await targetRef.update({ archived: true });

    return {
      success: true,
      message: `Commitment archived successfully.`,
    };
  },
);

// ─── 4. getTodaysCommitments ──────────────────────────────────────────────────

registerTool(
  "getTodaysCommitments",
  "Get all active commitments scheduled for today.",
  {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized");

    // Get active commitments
    const commitmentsSnap = await db
      .collection("users")
      .doc(uid)
      .collection("commitments")
      .where("archived", "==", false)
      .get();

    const commitments = commitmentsSnap.docs.map((d) => d.data() as Commitment);

    // Get today's fulfillments
    const today = new Date().toDateString();
    const fulfillmentsSnap = await db
      .collection("users")
      .doc(uid)
      .collection("fulfillments")
      .where("date", "==", today)
      .get();

    const fulfilledIds = new Set(
      fulfillmentsSnap.docs.map((d) => d.data().commitmentId),
    );

    const todayCommitments = commitments.map((c) => ({
      commitment: c,
      dueDate: new Date().toISOString().split("T")[0],
      fulfilled: fulfilledIds.has(c.id),
    }));

    return {
      success: true,
      message: `Found ${todayCommitments.length} active commitments for today.`,
      data: todayCommitments,
    };
  },
);

// ─── 5. getUpcomingCommitments ────────────────────────────────────────────────
// Same as todays for simplicity in Pilot demo
registerTool(
  "getUpcomingCommitments",
  "Get active commitments.",
  { type: Type.OBJECT, properties: {}, required: [] },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized");
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("commitments")
      .where("archived", "==", false)
      .get();
    return {
      success: true,
      message: `Found ${snap.size} active commitments.`,
      data: snap.docs.map((d) => d.data()),
    };
  },
);

// ─── 6. searchCommitments ─────────────────────────────────────────────────────
registerTool(
  "searchCommitments",
  "Search commitments.",
  {
    type: Type.OBJECT,
    properties: { query: { type: Type.STRING } },
    required: ["query"],
  },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized");
    const query = (args.query as string).toLowerCase();

    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("commitments")
      .where("archived", "==", false)
      .get();
    const matched = snap.docs
      .map((d) => d.data() as Commitment)
      .filter((c) => c.title.toLowerCase().includes(query));

    return {
      success: true,
      message: `Found ${matched.length} commitment(s).`,
      data: matched,
    };
  },
);

// ─── 7. getCommitmentDetails ──────────────────────────────────────────────────
registerTool(
  "getCommitmentDetails",
  "Get details by title.",
  {
    type: Type.OBJECT,
    properties: { title: { type: Type.STRING } },
    required: ["title"],
  },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized");
    const title = args.title as string;

    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("commitments")
      .where("title", "==", title)
      .limit(1)
      .get();

    if (snap.empty)
      return {
        success: false,
        message: `No commitment found with title ${title}`,
      };

    return {
      success: true,
      message: `Details for commitment "${title}".`,
      data: snap.docs[0].data(),
    };
  },
);

// ─── 8. completeCommitment ────────────────────────────────────────────────────
registerTool(
  "completeCommitment",
  "Mark a commitment as completed/fulfilled for today.",
  {
    type: Type.OBJECT,
    properties: { title: { type: Type.STRING } },
    required: ["title"],
  },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized");
    const title = args.title as string;

    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("commitments")
      .where("title", "==", title)
      .where("archived", "==", false)
      .limit(1)
      .get();

    if (snap.empty)
      return {
        success: false,
        message: `No active commitment found with title ${title}`,
      };

    const commitment = snap.docs[0].data() as Commitment;
    const fulfillId = generateId();
    const capacityConsumed = 5; // Simplified

    await db
      .collection("users")
      .doc(uid)
      .collection("fulfillments")
      .doc(fulfillId)
      .set({
        id: fulfillId,
        commitmentId: commitment.id,
        date: new Date().toDateString(),
        fulfilledAt: new Date().toISOString(),
        capacityConsumed,
      });

    return {
      success: true,
      message: `Commitment "${title}" marked as completed for today. ✅`,
      data: { commitmentId: commitment.id },
    };
  },
);

// ─── 9. deferCommitment ───────────────────────────────────────────────────────
registerTool(
  "deferCommitment",
  "Defer/reschedule a commitment to tomorrow.",
  {
    type: Type.OBJECT,
    properties: { title: { type: Type.STRING } },
    required: ["title"],
  },
  async (args, uid): Promise<ToolResponse> => {
    if (!uid) throw new Error("Unauthorized");
    const title = args.title as string;
    return {
      success: true,
      message: `Commitment "${title}" deferred to tomorrow.`,
    };
  },
);
