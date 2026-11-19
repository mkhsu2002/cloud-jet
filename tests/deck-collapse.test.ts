import { expect, it } from "vitest";
import { collapsePose } from "../src/deck-collapse";

it("tilts and carries the pod beyond the rail before allowing a free fall", () => {
  expect(collapsePose(0, 1)).toMatchObject({
    deckRoll: 0,
    lateral: 1,
    drop: 0,
  });
  const middle = collapsePose(0.62, 1);
  expect(middle.deckRoll).toBeGreaterThan(0);
  expect(middle.podRoll).toBe(middle.deckRoll);
  expect(middle.lateral).toBeLessThan(7);
  expect(middle.drop).toBe(0);
  const edge = collapsePose(1.03, 1);
  expect(edge.lateral).toBeGreaterThan(7);
  expect(edge.drop).toBe(0);
  const airborne = collapsePose(1.4, 1);
  expect(airborne.deckRoll).toBeGreaterThan(airborne.podRoll);
  expect(airborne.podRoll).toBe(edge.podRoll);
  expect(airborne.drop).toBeGreaterThan(0);
  expect(collapsePose(1.4, -1).driftOut).toBeLessThan(0);
});
