export type CardRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

type LocalRect = CardRect;

type RoutingBounds = {
  width: number;
  height: number;
};

type PortSide = "left" | "right" | "top" | "bottom";

type Port = {
  side: PortSide;
  anchor: Point;
  gate: Point;
};

type HeapEntry = {
  cost: number;
  state: number;
};

const connectorClearance = 4;
const targetMarkerGap = 3;
const bendPenalty = 24;

function rounded(value: number) {
  return Math.round(value * 2) / 2;
}

function normalizeRect(rect: CardRect, origin: Pick<CardRect, "top" | "left">): LocalRect {
  const top = rounded(rect.top - origin.top);
  const left = rounded(rect.left - origin.left);
  const width = rounded(rect.width);
  const height = rounded(rect.height);
  return {
    top,
    right: rounded(left + width),
    bottom: rounded(top + height),
    left,
    width,
    height,
  };
}

function inflateRect(rect: LocalRect): LocalRect {
  return {
    top: rounded(rect.top - connectorClearance),
    right: rounded(rect.right + connectorClearance),
    bottom: rounded(rect.bottom + connectorClearance),
    left: rounded(rect.left - connectorClearance),
    width: rounded(rect.width + connectorClearance * 2),
    height: rounded(rect.height + connectorClearance * 2),
  };
}

function rectCenter(rect: LocalRect) {
  return {
    x: rounded(rect.left + rect.width / 2),
    y: rounded(rect.top + rect.height / 2),
  };
}

function portsFor(rect: LocalRect, target = false): Port[] {
  const center = rectCenter(rect);
  const anchorGap = target ? targetMarkerGap : 0;
  return [
    {
      side: "left",
      anchor: { x: rounded(rect.left - anchorGap), y: center.y },
      gate: { x: rounded(rect.left - connectorClearance), y: center.y },
    },
    {
      side: "right",
      anchor: { x: rounded(rect.right + anchorGap), y: center.y },
      gate: { x: rounded(rect.right + connectorClearance), y: center.y },
    },
    {
      side: "top",
      anchor: { x: center.x, y: rounded(rect.top - anchorGap) },
      gate: { x: center.x, y: rounded(rect.top - connectorClearance) },
    },
    {
      side: "bottom",
      anchor: { x: center.x, y: rounded(rect.bottom + anchorGap) },
      gate: { x: center.x, y: rounded(rect.bottom + connectorClearance) },
    },
  ];
}

function isStrictlyInside(point: Point, rect: LocalRect) {
  return point.x > rect.left && point.x < rect.right
    && point.y > rect.top && point.y < rect.bottom;
}

function segmentCrossesRect(from: Point, to: Point, rect: LocalRect) {
  if (from.y === to.y) {
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    return from.y > rect.top && from.y < rect.bottom
      && minX < rect.right && maxX > rect.left;
  }
  if (from.x === to.x) {
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);
    return from.x > rect.left && from.x < rect.right
      && minY < rect.bottom && maxY > rect.top;
  }
  return true;
}

function pathIsClear(points: Point[], obstacles: LocalRect[]) {
  return points.slice(1).every((point, index) =>
    obstacles.every((obstacle) =>
      !segmentCrossesRect(points[index], point, obstacle),
    ),
  );
}

function simplifyPoints(points: Point[]) {
  const compact = points.filter((point, index) =>
    index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y,
  );
  if (compact.length < 3) return compact;

  const simplified: Point[] = [compact[0]];
  for (let index = 1; index < compact.length - 1; index += 1) {
    const previous = simplified[simplified.length - 1];
    const current = compact[index];
    const next = compact[index + 1];
    const isHorizontal = previous.y === current.y && current.y === next.y;
    const isVertical = previous.x === current.x && current.x === next.x;
    if (!isHorizontal && !isVertical) simplified.push(current);
  }
  simplified.push(compact[compact.length - 1]);
  return simplified;
}

function formatCoordinate(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function pathFromPoints(points: Point[]) {
  const simplified = simplifyPoints(points);
  if (simplified.length < 2) return null;
  let path = `M ${formatCoordinate(simplified[0].x)} ${formatCoordinate(simplified[0].y)}`;
  for (const [index, point] of simplified.slice(1).entries()) {
    const previous = simplified[index];
    if (point.y === previous.y) path += ` H ${formatCoordinate(point.x)}`;
    else if (point.x === previous.x) path += ` V ${formatCoordinate(point.y)}`;
    else return null;
  }
  return path;
}

function preferredSides(source: LocalRect, target: LocalRect): [PortSide, PortSide] {
  const sourceCenter = rectCenter(source);
  const targetCenter = rectCenter(target);
  if (target.left >= source.right) return ["right", "left"];
  if (source.left >= target.right) return ["left", "right"];
  if (targetCenter.y >= sourceCenter.y) return ["bottom", "top"];
  return ["top", "bottom"];
}

function portPenalty(side: PortSide, preferred: PortSide) {
  if (side === preferred) return 0;
  const opposites: Record<PortSide, PortSide> = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
  };
  return side === opposites[preferred] ? 150 : 70;
}

class MinHeap {
  private entries: HeapEntry[] = [];

  get size() {
    return this.entries.length;
  }

  push(entry: HeapEntry) {
    this.entries.push(entry);
    let index = this.entries.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.entries[parent].cost <= entry.cost) break;
      this.entries[index] = this.entries[parent];
      index = parent;
    }
    this.entries[index] = entry;
  }

  pop() {
    const first = this.entries[0];
    const last = this.entries.pop();
    if (!first || !last || this.entries.length === 0) return first;

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.entries.length) break;
      const smaller = right < this.entries.length
        && this.entries[right].cost < this.entries[left].cost
        ? right
        : left;
      if (this.entries[smaller].cost >= last.cost) break;
      this.entries[index] = this.entries[smaller];
      index = smaller;
    }
    this.entries[index] = last;
    return first;
  }
}

function legacyPath(source: LocalRect, target: LocalRect) {
  const sourceY = source.top + source.height / 2;
  const targetY = target.top + target.height / 2;
  if (target.left > source.right + 16) {
    const bendX = source.right + (target.left - source.right) / 2;
    return {
      path: `M ${formatCoordinate(source.right)} ${formatCoordinate(sourceY)} H ${formatCoordinate(bendX)} V ${formatCoordinate(targetY)} H ${formatCoordinate(target.left - 5)}`,
      points: [
        { x: source.right, y: sourceY },
        { x: bendX, y: sourceY },
        { x: bendX, y: targetY },
        { x: target.left - 5, y: targetY },
      ],
    };
  }
  const sideX = Math.max(source.right, target.right) + 10;
  return {
    path: `M ${formatCoordinate(source.right)} ${formatCoordinate(sourceY)} H ${formatCoordinate(sideX)} V ${formatCoordinate(targetY)} H ${formatCoordinate(target.right + 5)}`,
    points: [
      { x: source.right, y: sourceY },
      { x: sideX, y: sourceY },
      { x: sideX, y: targetY },
      { x: target.right + 5, y: targetY },
    ],
  };
}

/**
 * Creates a reusable orthogonal router for the current card layout. Card
 * surfaces are inflated beyond the connector halo, then a coordinate-compressed
 * Manhattan graph finds the shortest visible channel between endpoint ports.
 */
export function createObstacleAvoidingConnectorRouter(
  cards: Map<string, CardRect>,
  origin: Pick<CardRect, "top" | "left"> = { top: 0, left: 0 },
  bounds?: RoutingBounds,
) {
  const localCards = new Map(
    [...cards.entries()]
      .filter(([, rect]) => rect.width > 0 && rect.height > 0)
      .map(([id, rect]) => [id, normalizeRect(rect, origin)]),
  );
  const inflatedCards = new Map(
    [...localCards.entries()].map(([id, rect]) => [id, inflateRect(rect)]),
  );
  const inflated = [...inflatedCards.values()];
  const width = rounded(bounds?.width ?? Math.max(0, ...inflated.map((rect) => rect.right)));
  const height = rounded(bounds?.height ?? Math.max(0, ...inflated.map((rect) => rect.bottom)));
  const routingLeft = rounded(Math.max(0, Math.min(...inflated.map((rect) => rect.left))));
  const routingRight = rounded(Math.min(width, Math.max(...inflated.map((rect) => rect.right))));
  const routingTop = rounded(Math.max(0, Math.min(...inflated.map((rect) => rect.top))));
  const routingBottom = rounded(Math.min(height, Math.max(...inflated.map((rect) => rect.bottom))));

  const xCoordinates = [...new Set([
    routingLeft,
    routingRight,
    ...inflated.flatMap((rect) => [rect.left, rect.right, rectCenter(rect).x]),
  ].filter((value) => value >= routingLeft && value <= routingRight))].sort((a, b) => a - b);
  const yCoordinates = [...new Set([
    routingTop,
    routingBottom,
    ...inflated.flatMap((rect) => [rect.top, rect.bottom, rectCenter(rect).y]),
  ].filter((value) => value >= routingTop && value <= routingBottom))].sort((a, b) => a - b);
  const xIndex = new Map(xCoordinates.map((value, index) => [value, index]));
  const yIndex = new Map(yCoordinates.map((value, index) => [value, index]));
  const columnCount = xCoordinates.length;
  const nodeCount = columnCount * yCoordinates.length;
  const blocked = new Uint8Array(nodeCount);

  for (let y = 0; y < yCoordinates.length; y += 1) {
    for (let x = 0; x < xCoordinates.length; x += 1) {
      const point = { x: xCoordinates[x], y: yCoordinates[y] };
      if (inflated.some((rect) => isStrictlyInside(point, rect))) {
        blocked[y * columnCount + x] = 1;
      }
    }
  }

  function nodeFor(point: Point) {
    const x = xIndex.get(rounded(point.x));
    const y = yIndex.get(rounded(point.y));
    return x === undefined || y === undefined ? null : y * columnCount + x;
  }

  function pointFor(node: number): Point {
    return {
      x: xCoordinates[node % columnCount],
      y: yCoordinates[Math.floor(node / columnCount)],
    };
  }

  function segmentIsClear(from: Point, to: Point) {
    return inflated.every((rect) => !segmentCrossesRect(from, to, rect));
  }

  return (sourceId: string, targetId: string) => {
    const source = localCards.get(sourceId);
    const target = localCards.get(targetId);
    if (!source || !target) return null;

    const otherObstacles = [...inflatedCards.entries()]
      .filter(([id]) => id !== sourceId && id !== targetId)
      .map(([, rect]) => rect);
    const direct = legacyPath(source, target);
    if (
      target.left > source.right + 16
      && pathIsClear(direct.points, otherObstacles)
    ) return direct.path;

    const sourcePorts = portsFor(source);
    const targetPorts = portsFor(target, true);
    const [preferredSource, preferredTarget] = preferredSides(source, target);
    const stateCount = nodeCount * 3;
    const distances = new Float64Array(stateCount);
    distances.fill(Number.POSITIVE_INFINITY);
    const parents = new Int32Array(stateCount);
    parents.fill(-2);
    const sourcePortByState = new Int16Array(stateCount);
    sourcePortByState.fill(-1);
    const heap = new MinHeap();

    sourcePorts.forEach((port, portIndex) => {
      const node = nodeFor(port.gate);
      if (node === null || blocked[node]) return;
      const state = node * 3;
      const cost = portPenalty(port.side, preferredSource)
        + Math.abs(port.anchor.x - port.gate.x)
        + Math.abs(port.anchor.y - port.gate.y);
      if (cost >= distances[state]) return;
      distances[state] = cost;
      parents[state] = -1;
      sourcePortByState[state] = portIndex;
      heap.push({ cost, state });
    });

    const targetNodes = targetPorts.map((port) => nodeFor(port.gate));
    let bestCost = Number.POSITIVE_INFINITY;
    let bestState = -1;
    let bestTargetPort = -1;

    while (heap.size) {
      const entry = heap.pop();
      if (!entry || entry.cost !== distances[entry.state]) continue;
      if (entry.cost >= bestCost) break;
      const node = Math.floor(entry.state / 3);
      const direction = entry.state % 3;
      const point = pointFor(node);

      targetNodes.forEach((targetNode, portIndex) => {
        if (targetNode !== node) return;
        const port = targetPorts[portIndex];
        const total = entry.cost
          + portPenalty(port.side, preferredTarget)
          + Math.abs(port.anchor.x - port.gate.x)
          + Math.abs(port.anchor.y - port.gate.y);
        if (total < bestCost) {
          bestCost = total;
          bestState = entry.state;
          bestTargetPort = portIndex;
        }
      });

      const x = node % columnCount;
      const y = Math.floor(node / columnCount);
      const neighbors = [
        x > 0 ? node - 1 : -1,
        x + 1 < columnCount ? node + 1 : -1,
        y > 0 ? node - columnCount : -1,
        y + 1 < yCoordinates.length ? node + columnCount : -1,
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || blocked[neighbor]) continue;
        const nextPoint = pointFor(neighbor);
        if (!segmentIsClear(point, nextPoint)) continue;
        const nextDirection = point.y === nextPoint.y ? 1 : 2;
        const distance = Math.abs(point.x - nextPoint.x) + Math.abs(point.y - nextPoint.y);
        const nextCost = entry.cost + distance
          + (direction !== 0 && direction !== nextDirection ? bendPenalty : 0);
        const nextState = neighbor * 3 + nextDirection;
        if (nextCost >= distances[nextState]) continue;
        distances[nextState] = nextCost;
        parents[nextState] = entry.state;
        sourcePortByState[nextState] = sourcePortByState[entry.state];
        heap.push({ cost: nextCost, state: nextState });
      }
    }

    if (bestState < 0 || bestTargetPort < 0) return null;
    const route: Point[] = [];
    let state = bestState;
    while (state >= 0) {
      route.push(pointFor(Math.floor(state / 3)));
      state = parents[state];
    }
    route.reverse();
    const sourcePort = sourcePorts[sourcePortByState[bestState]];
    const targetPort = targetPorts[bestTargetPort];
    if (!sourcePort || !targetPort) return null;
    return pathFromPoints([
      sourcePort.anchor,
      sourcePort.gate,
      ...route,
      targetPort.gate,
      targetPort.anchor,
    ]);
  };
}

export function orthogonalConnectorPath(
  source: CardRect,
  target: CardRect,
  origin: Pick<CardRect, "top" | "left"> = { top: 0, left: 0 },
  obstacles: CardRect[] = [],
  bounds?: RoutingBounds,
) {
  if (!source.width || !source.height || !target.width || !target.height) return null;
  const cards = new Map<string, CardRect>([
    ["source", source],
    ["target", target],
    ...obstacles
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect, index) => [`obstacle-${index}`, rect] as const),
  ]);
  return createObstacleAvoidingConnectorRouter(cards, origin, bounds)("source", "target");
}
