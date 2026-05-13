import React, { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { ElementType, MapElementData } from "@/utils/geoMath";
import {
  GRID_MAGNET_FT,
  gridSnapBlueprintPx,
  HARRISON_MASTER_ELEVATION_FT,
} from "@/utils/geoMath";

/** Pixel dimensions aligned with VenueArchitect.tsx ELEMENT_CONFIG */
const ELEMENT_DIMS_PX: Record<ElementType, { w: number; h: number }> = {
  table_round_60: { w: 100, h: 100 },
  table_rect: { w: 160, h: 60 },
  high_top: { w: 60, h: 60 },
  deuce: { w: 60, h: 60 },
  dance_floor: { w: 80, h: 80 },
  bar: { w: 120, h: 40 },
  buffet: { w: 160, h: 60 },
  cake: { w: 60, h: 60 },
  stage: { w: 240, h: 120 },
  pipe_drape: { w: 160, h: 10 },
  floral_arch: { w: 80, h: 20 },
  tent_40x60: { w: 1200, h: 800 },
  string_lights: { w: 400, h: 20 },
  staging_kitchen: { w: 200, h: 100 },
  power_drop: { w: 40, h: 40 },
  audio_hub: { w: 40, h: 40 },
  water_access: { w: 40, h: 40 },
  bathroom: { w: 120, h: 120 },
  exit_sign: { w: 60, h: 30 },
  staff_member: { w: 20, h: 20 },
};

function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const m = child.material;
      if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
      else (m as THREE.Material | undefined)?.dispose?.();
    }
    if (child instanceof THREE.LineSegments || child instanceof THREE.Line) {
      child.geometry.dispose();
      const m = child.material as THREE.Material;
      m.dispose();
    }
  });
}

function pxToFoot(px: number, ppf: number) {
  return px / ppf;
}

function quantizeWorldXZToFootGrid(ft: number, lock: boolean): number {
  if (!lock) return ft;
  return Math.round(ft / GRID_MAGNET_FT) * GRID_MAGNET_FT;
}

/** Blueprint-origin snap → center in feet → optional strict 3′ world grid (manifest lock). */
function blueprintAnchoredCenterFt(
  el: MapElementData,
  dims: { w: number; h: number },
  ppf: number,
  coordinateLockManifest: boolean,
  quantizeFootGrid: boolean,
): { cxFt: number; czFt: number } {
  const oxPx = coordinateLockManifest ? gridSnapBlueprintPx(el.x, ppf) : el.x;
  const oyPx = coordinateLockManifest ? gridSnapBlueprintPx(el.y, ppf) : el.y;
  let cxFt = pxToFoot(oxPx + dims.w / 2, ppf);
  let czFt = pxToFoot(oyPx + dims.h / 2, ppf);
  if (quantizeFootGrid) {
    cxFt = quantizeWorldXZToFootGrid(cxFt, true);
    czFt = quantizeWorldXZToFootGrid(czFt, true);
  }
  return { cxFt, czFt };
}

/** Matches VenueArchitect.tsx diamond runway ghost layer (five parallel diagonals). */
function runwaySegmentsFromDiamond(
  ppf: number,
  coordinateLockManifest: boolean,
  groundPlaneYFt: number,
): [THREE.Vector3, THREE.Vector3][] {
  const segs: [THREE.Vector3, THREE.Vector3][] = [];
  const y = groundPlaneYFt + 0.045;
  for (let i = 0; i < 5; i++) {
    const pxXA = coordinateLockManifest ? gridSnapBlueprintPx(180 + i * 140, ppf) : 180 + i * 140;
    const pxZA = coordinateLockManifest ? gridSnapBlueprintPx(280, ppf) : 280;
    const pxXB = coordinateLockManifest ? gridSnapBlueprintPx(180 + i * 140 + 400, ppf) : 180 + i * 140 + 400;
    const pxZB = coordinateLockManifest ? gridSnapBlueprintPx(280 + 600, ppf) : 280 + 600;
    let x1 = pxToFoot(pxXA, ppf);
    let z1 = pxToFoot(pxZA, ppf);
    let x2 = pxToFoot(pxXB, ppf);
    let z2 = pxToFoot(pxZB, ppf);
    if (coordinateLockManifest) {
      x1 = quantizeWorldXZToFootGrid(x1, true);
      z1 = quantizeWorldXZToFootGrid(z1, true);
      x2 = quantizeWorldXZToFootGrid(x2, true);
      z2 = quantizeWorldXZToFootGrid(z2, true);
    }
    segs.push([new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)]);
  }
  return segs;
}

function bboxFromElements(
  elements: MapElementData[],
  ppf: number,
  coordinateLockManifest: boolean,
): { cx: number; cz: number; span: number } {
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const el of elements) {
    const d = ELEMENT_DIMS_PX[el.type];
    if (!d) continue;
    const oxPx = coordinateLockManifest ? gridSnapBlueprintPx(el.x, ppf) : el.x;
    const oyPx = coordinateLockManifest ? gridSnapBlueprintPx(el.y, ppf) : el.y;
    const x1 = pxToFoot(oxPx, ppf);
    const z1 = pxToFoot(oyPx, ppf);
    const x2 = x1 + pxToFoot(d.w, ppf);
    const z2 = z1 + pxToFoot(d.h, ppf);
    minX = Math.min(minX, x1);
    minZ = Math.min(minZ, z1);
    maxX = Math.max(maxX, x2);
    maxZ = Math.max(maxZ, z2);
  }
  if (!Number.isFinite(minX)) return { cx: 20, cz: 20, span: 40 };
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxZ - minZ, 40);
  return { cx, cz, span };
}

function runwaySegmentsFallback(
  elements: MapElementData[],
  ppf: number,
  coordinateLockManifest: boolean,
  groundPlaneYFt: number,
): [THREE.Vector3, THREE.Vector3][] {
  const kitchen = elements.find((e) => e.type === "staging_kitchen");
  const tent = elements.find((e) => e.type === "tent_40x60");
  const { cx, cz, span } = bboxFromElements(elements, ppf, coordinateLockManifest);
  const yLift = groundPlaneYFt + 0.045;
  let kx = cx;
  let kz = cz + span * 0.35;
  if (kitchen) {
    const d = ELEMENT_DIMS_PX.staging_kitchen;
    const { cxFt: kcx, czFt: kcz } = blueprintAnchoredCenterFt(
      kitchen,
      d,
      ppf,
      coordinateLockManifest,
      coordinateLockManifest,
    );
    kx = kcx;
    kz = kcz;
  }
  let tx = cx;
  let tz = cz - span * 0.2;
  if (tent) {
    const d = ELEMENT_DIMS_PX.tent_40x60;
    const { cxFt: tcx, czFt: tcz } = blueprintAnchoredCenterFt(
      tent,
      d,
      ppf,
      coordinateLockManifest,
      coordinateLockManifest,
    );
    tx = tcx;
    tz = tcz;
  }
  const tip = new THREE.Vector3(tx, yLift, tz);
  const segs: [THREE.Vector3, THREE.Vector3][] = [];
  for (let i = -2; i <= 2; i++) {
    const spread = span * 0.12 * i;
    const start = new THREE.Vector3(kx + spread, yLift, kz + spread * 0.3);
    const end = new THREE.Vector3(tip.x + spread * 0.6, yLift, tip.z - spread * 0.15);
    if (coordinateLockManifest) {
      start.x = quantizeWorldXZToFootGrid(start.x, true);
      start.z = quantizeWorldXZToFootGrid(start.z, true);
      end.x = quantizeWorldXZToFootGrid(end.x, true);
      end.z = quantizeWorldXZToFootGrid(end.z, true);
    }
    segs.push([start, end]);
  }
  return segs;
}

function createLeg(radiusFt: number, heightFt: number, mat: THREE.Material) {
  const g = new THREE.CylinderGeometry(radiusFt * 0.08, radiusFt * 0.1, heightFt, 8);
  const m = new THREE.Mesh(g, mat);
  m.position.y = heightFt / 2;
  return m;
}

function addRoundTableWithLegs(
  parent: THREE.Group,
  cx: number,
  cz: number,
  diameterFt: number,
  rotationY: number,
  floorContactYFt = 0,
) {
  const tabletopH = 0.085 * 3;
  const legH = Math.max(2.45, 2.92 - tabletopH);
  const radial = diameterFt / 2;
  const pedestalR = radial * 0.12;

  const topGeom = new THREE.CylinderGeometry(radial - 0.03, radial - 0.03, tabletopH, 40);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xe8dfd2, roughness: 0.45, metalness: 0.06 });
  const top = new THREE.Mesh(topGeom, topMat);
  top.rotation.y = THREE.MathUtils.degToRad(rotationY);
  top.position.set(cx, floorContactYFt + legH + tabletopH / 2, cz);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2b2f, roughness: 0.82, metalness: 0.08 });
  const pedGeom = new THREE.CylinderGeometry(pedestalR * 1.1, pedestalR * 1.32, legH * 0.92, 20);
  const ped = new THREE.Mesh(pedGeom, legMat);
  ped.rotation.y = THREE.MathUtils.degToRad(rotationY);
  ped.position.set(cx, floorContactYFt + legH * 0.46, cz);

  const legGroup = new THREE.Group();
  legGroup.rotation.y = THREE.MathUtils.degToRad(rotationY);
  legGroup.position.set(cx, floorContactYFt, cz);
  const offset = radial * 0.62;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = createLeg(radial, legH, legMat);
    leg.position.set(Math.cos(angle) * offset, 0, Math.sin(angle) * offset);
    legGroup.add(leg);
  }

  parent.add(legGroup, ped, top);
}

function addRectTableWithLegs(
  parent: THREE.Group,
  cx: number,
  cz: number,
  wFt: number,
  dFt: number,
  rotationY: number,
) {
  const tabletopH = 0.085 * 3;
  const legH = Math.max(2.35, 2.82 - tabletopH);

  const group = new THREE.Group();
  group.position.set(cx, 0, cz);
  group.rotation.y = THREE.MathUtils.degToRad(rotationY);

  const topGeom = new THREE.BoxGeometry(wFt, tabletopH, dFt);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xdccebc, roughness: 0.5, metalness: 0.05 });
  const top = new THREE.Mesh(topGeom, topMat);
  top.position.y = legH + tabletopH / 2;

  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2b2f, roughness: 0.82, metalness: 0.08 });
  const lx = Math.max(wFt / 2 - 0.45, wFt * 0.32);
  const lz = Math.max(dFt / 2 - 0.4, dFt * 0.28);
  for (let sx = -1; sx <= 1; sx += 2) {
    for (let sz = -1; sz <= 1; sz += 2) {
      const lg = createLeg(wFt / 6, legH, legMat);
      lg.position.set(sx * lx, 0, sz * lz);
      group.add(lg);
    }
  }

  group.add(top);
  parent.add(group);
}

function guestFigure(color: number) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.03 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.35, 4, 8), bodyMat);
  torso.rotation.z = Math.PI / 2;
  torso.rotation.y = Math.PI / 2;
  torso.position.y = 0.55;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), bodyMat);
  head.position.y = 0.85;

  g.add(torso, head);
  g.scale.setScalar(2.15);
  return g;
}

export interface VenueArchitect3DProps {
  elements: MapElementData[];
  pixelsPerFoot: number;
  isDiamondSnapActive: boolean;
  guestSimulation: boolean;
  coordinateLockManifest: boolean;
  /** Stage deck datum (feet) — frozen while coordinateLockManifest avoids Y “shimmer”. */
  masterElevationSurfaceFt?: number;
  isOutdoorMode: boolean;
  /** Decimal hours (16 = 4:00 PM). Dramatic evening lighting ramps 6:00–7:00 PM and holds from 7:00 PM. */
  globalTime: number;
}

export const VenueArchitect3D: React.FC<VenueArchitect3DProps> = ({
  elements,
  pixelsPerFoot: ppf,
  isDiamondSnapActive,
  guestSimulation,
  coordinateLockManifest,
  masterElevationSurfaceFt = HARRISON_MASTER_ELEVATION_FT,
  isOutdoorMode,
  globalTime,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const globalTimeRef = useRef(globalTime);
  useLayoutEffect(() => {
    globalTimeRef.current = globalTime;
  }, [globalTime]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const bgDay = new THREE.Color(isOutdoorMode ? 0x0f3d2e : 0x0f172a);
    const bgNight = new THREE.Color(isOutdoorMode ? 0x050a08 : 0x070a12);
    scene.background = bgDay.clone();
    const fogDay = isOutdoorMode ? 0x0a2a22 : 0x0f172a;
    const fogNight = isOutdoorMode ? 0x020806 : 0x05070f;
    const fog = new THREE.FogExp2(fogDay, 0.006);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 5000);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.minPolarAngle = 0.55;

    const ambient = new THREE.AmbientLight(0xfff4e8, isOutdoorMode ? 0.45 : 0.35);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.05);
    sun.position.set(-80, 120, -40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xb8c4ff, isOutdoorMode ? 0.2 : 0.28);
    fill.position.set(60, 40, 40);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x6b8cff, 0);
    rim.position.set(40, 55, -95);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    const groundLockYFt = coordinateLockManifest ? masterElevationSurfaceFt : 0;

    const { cx, cz, span } = bboxFromElements(elements, ppf, coordinateLockManifest);

    const warmAccent = new THREE.PointLight(0xffb366, 0, span * 4.5, 2);
    warmAccent.position.set(cx, groundLockYFt + span * 0.35, cz);
    scene.add(warmAccent);
    const groundSize = span * 1.85;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize + 120, groundSize + 120),
      new THREE.MeshStandardMaterial({
        color: isOutdoorMode ? 0x1a4734 : 0x1e293b,
        roughness: 0.88,
        metalness: 0.02,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cx, groundLockYFt, cz);
    ground.receiveShadow = true;
    root.add(ground);

    const runwayMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });

    const runways = isDiamondSnapActive
      ? runwaySegmentsFromDiamond(ppf, coordinateLockManifest, groundLockYFt)
      : runwaySegmentsFallback(elements, ppf, coordinateLockManifest, groundLockYFt);

    runways.forEach(([a, b]) => {
      const len = a.distanceTo(b);
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      const runway = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.015, len), runwayMat);
      runway.position.copy(mid);
      runway.position.y = mid.y + 0.025;
      const dir = new THREE.Vector3().subVectors(b, a);
      runway.lookAt(mid.clone().add(dir));
      runway.rotateX(Math.PI / 2);
      root.add(runway);
    });

    for (const el of elements) {
      const dims = ELEMENT_DIMS_PX[el.type];
      const wFt = pxToFoot(dims.w, ppf);
      const hFt = pxToFoot(dims.h, ppf);

      /** Harrison lock: blueprint 3′ + strict world 3′ for tent & 60″ rounds only. */
      const rigidGrid =
        coordinateLockManifest && (el.type === "table_round_60" || el.type === "tent_40x60");
      const { cxFt: cxw, czFt: czh } = rigidGrid
        ? blueprintAnchoredCenterFt(el, dims, ppf, true, true)
        : {
            cxFt: pxToFoot(el.x + dims.w / 2, ppf),
            czFt: pxToFoot(el.y + dims.h / 2, ppf),
          };

      /** Leg / pole bases sit on Harrison deck datum when manifest is locked (no hover). */
      const deckContactY = rigidGrid ? masterElevationSurfaceFt : 0;

      if (el.type === "table_round_60") {
        const g = new THREE.Group();
        addRoundTableWithLegs(g, cxw, czh, Math.min(wFt, hFt), el.rotation ?? 0, deckContactY);
        root.add(g);
        continue;
      }

      if (el.type === "table_rect" || el.type === "deuce" || el.type === "bar" || el.type === "buffet") {
        const g = new THREE.Group();
        addRectTableWithLegs(g, cxw, czh, wFt, hFt, el.rotation ?? 0);
        root.add(g);
        continue;
      }

      if (el.type === "high_top") {
        const g = new THREE.Group();
        const legH = 3.2;
        const topR = Math.min(wFt, hFt) / 2 - 0.05;
        const topMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(topR - 0.02, topR - 0.02, 0.085, 32),
          new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4, metalness: 0.15 }),
        );
        topMesh.position.set(cxw, legH + 0.045, czh);

        const ped = new THREE.Mesh(
          new THREE.CylinderGeometry(topR * 0.06, topR * 0.09, legH - 0.1, 12),
          new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8, metalness: 0.1 }),
        );
        ped.position.set(cxw, legH / 2, czh);

        const basePlate = new THREE.Mesh(
          new THREE.CylinderGeometry(topR * 0.42, topR * 0.48, 0.06, 20),
          new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.95, metalness: 0.02 }),
        );
        basePlate.position.set(cxw, 0.03, czh);

        g.add(basePlate, ped, topMesh);
        root.add(g);
        continue;
      }

      if (el.type === "tent_40x60") {
        const polesH = Math.max(Math.min(Math.max(wFt, hFt) * 0.22, 18), 10);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xc4b896, transparent: true, opacity: 0.38, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
        const tentGeomH = polesH * 0.92;
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(wFt, tentGeomH, hFt), frameMat);
        if (coordinateLockManifest) {
          canopy.position.set(cxw, deckContactY + tentGeomH / 2, czh);
        } else {
          canopy.position.set(cxw, polesH * 0.54, czh);
        }

        const frame = new THREE.LineSegments(
          new THREE.WireframeGeometry(new THREE.BoxGeometry(wFt + 0.3, polesH, hFt + 0.3)),
          new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35 }),
        );
        frame.position.copy(canopy.position);
        root.add(canopy);
        root.add(frame);
        continue;
      }

      if (el.type === "dance_floor" || el.type === "stage") {
        const lift = el.type === "stage" ? 1.85 : 0.02;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(wFt, lift + 0.05, hFt),
          new THREE.MeshStandardMaterial({
            color: el.type === "stage" ? 0x8b4514 : 0x312e81,
            roughness: 0.72,
          }),
        );
        const deck = coordinateLockManifest ? masterElevationSurfaceFt : 0;
        mesh.position.set(cxw, deck + lift / 2 + 0.02, czh);
        mesh.receiveShadow = true;
        root.add(mesh);
        continue;
      }

      if (el.type === "staff_member") {
        const capsule = guestFigure(0xfbbf24);
        capsule.position.set(cxw, coordinateLockManifest ? masterElevationSurfaceFt : 0, czh);
        root.add(capsule);
        continue;
      }

      if (el.type === "string_lights") {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(wFt, 0.05, Math.max(0.2, hFt)),
          new THREE.MeshStandardMaterial({
            color: 0xfff3c8,
            emissive: 0xfbbf24,
            emissiveIntensity: 0.35,
          }),
        );
        line.position.set(cxw, polesHGuess(wFt, hFt), czh);
        root.add(line);
        continue;
      }

      const defaultMesh = new THREE.Mesh(
        new THREE.BoxGeometry(wFt, avgHeightFt(el.type, wFt, hFt), hFt),
        new THREE.MeshStandardMaterial({ color: typeColor(el.type), roughness: 0.75 }),
      );
      const mh = avgHeightFt(el.type, wFt, hFt);
      const deck = coordinateLockManifest ? masterElevationSurfaceFt : 0;
      defaultMesh.position.set(cxw, deck + mh / 2, czh);
      root.add(defaultMesh);
    }

    /** Social heatmap anchors — locked layout uses hashed grid/snapped hotspots (no lerp in guest tick when coordinateLockManifest). */
    const socialHotspots: THREE.Vector3[] = [];
    for (const el of elements) {
      if (el.type === "bar" || el.type === "dance_floor" || el.type === "stage" || el.type === "buffet" || el.type === "high_top") {
        const sd = ELEMENT_DIMS_PX[el.type];
        const { cxFt: hx, czFt: hz } = blueprintAnchoredCenterFt(el, sd, ppf, coordinateLockManifest, coordinateLockManifest);
        socialHotspots.push(new THREE.Vector3(hx, groundLockYFt, hz));
      }
    }
    if (socialHotspots.length === 0) {
      socialHotspots.push(new THREE.Vector3(cx, groundLockYFt, cz));
    }

    /* Guest walkers along runways — simple “sprite” figures */
    const guestMeshes: THREE.Group[] = [];
    const guestOffsets: number[] = [];
    const guestSpeeds: number[] = [];
    const runwayIndex: number[] = [];
    const colorsUsed = [
      0x5b9bd5, 0x70ad47, 0xed7d31, 0xa078ff, 0xff6b85, 0x00c9b7,
    ];
    runways.forEach((seg, ri) => {
      const occupants = coordinateLockManifest ? 3 : guestSimulation ? 3 : 0;
      for (let j = 0; j < occupants; j++) {
        const fig = guestFigure(colorsUsed[(guestMeshes.length + j) % colorsUsed.length]);
        fig.position.copy(seg[0]);
        guestMeshes.push(fig);
        guestOffsets.push((j / Math.max(occupants, 1)) * Math.PI * 2);
        guestSpeeds.push(coordinateLockManifest ? 0 : 0.22 + Math.random() * 0.12);
        runwayIndex.push(ri);
        root.add(fig);
      }
    });

    const cameraDist = span * 0.95 + 35;
    const gazeY = coordinateLockManifest ? groundLockYFt + span * 0.05 : span * 0.05;
    camera.position.set(cx - cameraDist * 0.92, span * 0.85 + 20, cz + cameraDist * 0.62);
    camera.lookAt(cx, gazeY, cz);
    controls.target.set(cx, coordinateLockManifest ? groundLockYFt + 0.5 : 0.5, cz);
    controls.update();

    let raf = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const t = clock.getElapsedTime();
      const gt = globalTimeRef.current;
      const eveningT = THREE.MathUtils.clamp((gt - 18) / 1, 0, 1);

      const dayAmb = isOutdoorMode ? 0.45 : 0.35;
      ambient.intensity = THREE.MathUtils.lerp(dayAmb, 0.065, eveningT);
      const ambDay = new THREE.Color(0xfff4e8);
      const ambNight = new THREE.Color(0x2e2638);
      ambient.color.copy(ambDay).lerp(ambNight, eveningT);

      const sunDayC = new THREE.Color(0xffffff);
      const sunWarmC = new THREE.Color(0xffc4a8);
      sun.color.copy(sunDayC).lerp(sunWarmC, eveningT);
      sun.intensity = THREE.MathUtils.lerp(1.05, 0.42, eveningT);

      const fillDay = isOutdoorMode ? 0.2 : 0.28;
      fill.intensity = THREE.MathUtils.lerp(fillDay, 0.06, eveningT);
      rim.intensity = THREE.MathUtils.lerp(0, 0.95, eveningT);

      scene.background.copy(bgDay).lerp(bgNight, eveningT);
      const fogColDay = new THREE.Color(fogDay);
      const fogColNight = new THREE.Color(fogNight);
      fog.color.copy(fogColDay).lerp(fogColNight, eveningT);
      fog.density = THREE.MathUtils.lerp(0.006, 0.014, eveningT);

      warmAccent.intensity = eveningT * 480 * (isOutdoorMode ? 0.85 : 1);

      const lockSurface =
        coordinateLockManifest && masterElevationSurfaceFt !== undefined
          ? masterElevationSurfaceFt + 0.08
          : null;

      guestMeshes.forEach((fig, i) => {
        const ri = runwayIndex[i];
        const seg = runways[ri];
        if (!seg) return;
        const [sa, sb] = seg;
        let phase =
          coordinateLockManifest
            ? THREE.MathUtils.euclideanModulo(guestOffsets[i] * 0.31 + i * 0.079 + ri * 0.11, 1)
            : (Math.sin(guestOffsets[i] + t * guestSpeeds[i]) + 1) / 2;
        const pos = sa.clone().lerp(sb, phase);

        if (guestSimulation && !coordinateLockManifest) {
          let nearest = socialHotspots[0];
          let best = pos.distanceToSquared(nearest);
          for (let k = 1; k < socialHotspots.length; k++) {
            const d = pos.distanceToSquared(socialHotspots[k]);
            if (d < best) {
              best = d;
              nearest = socialHotspots[k];
            }
          }
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.85 + guestOffsets[i] * 1.2);
          const pullAmt = (0.09 + 0.11 * eveningT) * pulse;
          pos.x = THREE.MathUtils.lerp(pos.x, nearest.x, pullAmt);
          pos.z = THREE.MathUtils.lerp(pos.z, nearest.z, pullAmt);
        }

        const baseYaw = THREE.MathUtils.degToRad(rotationFromDirection(sb.x - sa.x, sb.z - sa.z));
        fig.rotation.y = coordinateLockManifest ? baseYaw : baseYaw + Math.sin(t * 4 + i) * 0.08;

        const bob = coordinateLockManifest ? 0 : Math.sin(t * 7 + guestOffsets[i]) * 0.08;
        fig.position.set(pos.x, lockSurface ?? 0.12 + bob, pos.z);
      });

      controls.update();
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      controls.dispose();

      runwayMat.dispose();
      disposeObject3D(root);
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [
    elements,
    ppf,
    isDiamondSnapActive,
    guestSimulation,
    coordinateLockManifest,
    masterElevationSurfaceFt,
    isOutdoorMode,
  ]);

  return <div ref={mountRef} className="absolute inset-0 z-[5]" style={{ cursor: "grab" }} />;
};

function polesHGuess(wFt: number, _hFt: number) {
  return Math.min(14, Math.max(wFt * 0.08, 3));
}

function rotationFromDirection(dx: number, dz: number) {
  return (Math.atan2(dx, dz) * 180) / Math.PI;
}

function typeColor(type: ElementType): number {
  switch (type) {
    case "cake":
      return 0xb85c92;
    case "floral_arch":
      return 0x2d8a54;
    case "power_drop":
      return 0xfacc15;
    case "water_access":
      return 0x22d3ee;
    default:
      return 0x334155;
  }
}

function avgHeightFt(type: ElementType, wFt: number, hFt: number): number {
  switch (type) {
    case "pipe_drape":
    case "string_lights":
      return Math.max(Math.min(Math.max(wFt, hFt) * 0.06, 2.8), 0.7);
    case "floral_arch":
      return 2.8;
    case "staging_kitchen":
      return Math.max(Math.min(Math.max(wFt, hFt) * 0.25, 5.5), 3.2);
    case "cake":
      return 2;
    default:
      return Math.max(Math.min(Math.max(wFt, hFt) * 0.15, 2.9), 0.95);
  }
}
