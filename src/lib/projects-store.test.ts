import { test } from "node:test";
import assert from "node:assert/strict";
import { createdProjects } from "./projects-store";
import { BASE_PROJECTS } from "./mock-projects";

test("legacy saved projects can be read and extended without losing changes", () => {
  const legacy = {
    status: { "proj-1": "In progress" as const },
    owner: { "proj-1": "You" },
    comments: { "proj-1": [{ who: "You", when: "Just now", text: "Keep this" }] },
  };
  assert.deepEqual(createdProjects(legacy), []);
  const project = BASE_PROJECTS[0];
  assert.ok(project);
  const updated = { ...legacy, created: [project, ...createdProjects(legacy)] };
  assert.deepEqual(updated.created, [project]);
  assert.deepEqual(updated.status, legacy.status);
  assert.deepEqual(updated.owner, legacy.owner);
  assert.deepEqual(updated.comments, legacy.comments);
});

test("existing created projects are preserved when another is added", () => {
  const projects = BASE_PROJECTS.slice(0, 2);
  assert.equal(projects.length, 2);
  assert.deepEqual(createdProjects({ created: projects }), projects);
  assert.deepEqual(createdProjects({ created: undefined }), []);
});