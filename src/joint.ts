import { drawCircle, drawLine } from "./render";

export class Position {
  public x: number;
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public distance(joint: Position) {
    return Math.sqrt((this.x - joint.x) ** 2 + (this.y - joint.y) ** 2);
  }
}

export class Joint extends Position {
  public draw(ctx: CanvasRenderingContext2D) {
    drawCircle(ctx, this.x, this.y, 20);
  }

  public drawConnection(ctx: CanvasRenderingContext2D, joint: Joint) {
    drawLine(ctx, this.x, this.y, joint.x, joint.y);
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public lerp(to: Position, t: number) {
    return new Position(lerp1(this.x, to.x, t), lerp1(this.y, to.y, t));
  }
}

function lerp1(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export class Chain {
  public joints: Joint[] = [];
  private distances: number[] = [];
  private chainLength: number = 0;

  public constructor() {
    const root = new Joint(500, 500);

    this.joints.push(root);

    const numJoints = 56;
    const factor = 0.98;
    let offset = 4;
    for (let i = 0; i < numJoints; i++) {
      this.joints.push(
        new Joint(
          this.joints.at(-1)!.x - offset,
          this.joints.at(-1)!.y + offset
        )
      );
      offset /= factor;
    }

    this.distances = this.joints
      .slice(1)
      .map((joint, idx) => joint.distance(this.joints[idx]));

    this.chainLength = this.distances.reduce((acc, dist) => acc + dist, 0);
  }

  public update(target: Position) {
    const rootDistance = this.joints[0].distance(target);

    // Check whether the target is within reach.
    if (rootDistance > this.chainLength) {
      for (let i = 0; i <= this.joints.length - 2; i++) {
        const jointToTargetDist = this.joints[i].distance(target);
        const scale = this.distances[i] / jointToTargetDist;

        // Find the new joint position.
        this.joints[i + 1].setPosition(
          lerp1(this.joints[i].x, target.x, scale),
          lerp1(this.joints[i].y, target.y, scale)
        );
      }
    }

    let baseX = this.joints[0].x;
    let baseY = this.joints[0].y;

    let maxIterations = 30;
    while (maxIterations--) {
      // STAGE 1: Forward Reaching
      // Set end effector (last joint) to the target's position.
      this.joints[this.joints.length - 1].x = target.x;
      this.joints[this.joints.length - 1].y = target.y;

      for (let i = this.joints.length - 2; i >= 0; i--) {
        // Find the dist between the recently updated (i + 1)-th joint and the i-th joint.
        let jointDistance = this.joints[i + 1].distance(this.joints[i]);
        const t = this.distances[i] / jointDistance;

        // Find the new joint position.
        this.joints[i].setPosition(
          lerp1(this.joints[i + 1].x, this.joints[i].x, t),
          lerp1(this.joints[i + 1].y, this.joints[i].y, t)
        );
      }

      // STAGE 2: Backward Reaching
      // Set the first joint back to it's inital position (baseX, baseY)
      this.joints[0].x = baseX;
      this.joints[0].y = baseY;

      for (let i = 0; i <= this.joints.length - 2; i++) {
        // Find the dist between the new i-th joint and the (i+1)-th joint.
        const jointDistance = this.joints[i + 1].distance(this.joints[i]);
        const t = this.distances[i] / jointDistance;

        // Find the new joint position.
        this.joints[i + 1].setPosition(
          lerp1(this.joints[i].x, this.joints[i + 1].x, t),
          lerp1(this.joints[i].y, this.joints[i + 1].y, t)
        );
      }
    }
  }
}
