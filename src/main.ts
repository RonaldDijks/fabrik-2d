import { background } from "./render";
import { Chain, Position } from "./joint";

import "./style.css";

const size = 1000;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
 <canvas id="canvas" width="${size}" height="${size}"></canvas>
`;

setupCanvas(document.querySelector<HTMLCanvasElement>("#canvas")!);

export function setupCanvas(element: HTMLCanvasElement) {
  const canvas = element;
  const ctx = canvas.getContext("2d");

  window.devicePixelRatio = 4;

  let target: Position = new Position(1000, 1000);
  const chain = new Chain();

  function draw(ctx: CanvasRenderingContext2D) {
    background(ctx);
    chain.update(target);
    chain.joints.forEach((joint, index) => {
      const nextJoint = chain.joints[index + 1];
      if (nextJoint) {
        joint.drawConnection(ctx, nextJoint);
      }
      joint.draw(ctx);
    });
  }

  function step() {
    if (!ctx) return;
    draw(ctx);
    requestAnimationFrame(step);
  }

  document.body.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target = new Position(x, y);
  });

  step();
}
