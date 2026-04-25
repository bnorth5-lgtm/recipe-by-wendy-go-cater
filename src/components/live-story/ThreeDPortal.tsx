import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const ThreeDPortal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 2.2, 5.2);
    camera.lookAt(0, 0.8, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(3, 6, 4);
    scene.add(key);

    // Placeholder 3D wedding table: tabletop + pedestal + chairs (simple primitives)
    const group = new THREE.Group();
    scene.add(group);

    const tabletop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.12, 48),
      new THREE.MeshStandardMaterial({
        color: 0xefe9df,
        roughness: 0.55,
        metalness: 0.05,
      }),
    );
    tabletop.position.y = 1.0;
    group.add(tabletop);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.42, 1.0, 24),
      new THREE.MeshStandardMaterial({
        color: 0x2b2a2a,
        roughness: 0.8,
        metalness: 0.1,
      }),
    );
    pedestal.position.y = 0.5;
    group.add(pedestal);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.1, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1f1f1f,
        roughness: 0.9,
        metalness: 0.0,
      }),
    );
    base.position.y = 0.05;
    group.add(base);

    const chairMat = new THREE.MeshStandardMaterial({
      color: 0x8d7a66,
      roughness: 0.85,
      metalness: 0.05,
    });
    const chairGeom = new THREE.BoxGeometry(0.3, 0.35, 0.3);
    for (let i = 0; i < 8; i += 1) {
      const chair = new THREE.Mesh(chairGeom, chairMat);
      const a = (i / 8) * Math.PI * 2;
      chair.position.set(Math.cos(a) * 1.9, 0.2, Math.sin(a) * 1.9);
      chair.rotation.y = -a;
      group.add(chair);
    }

    let raf = 0;
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.35;
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(raf);
      renderer.dispose();
      tabletop.geometry.dispose();
      (tabletop.material as THREE.Material).dispose();
      pedestal.geometry.dispose();
      (pedestal.material as THREE.Material).dispose();
      base.geometry.dispose();
      (base.material as THREE.Material).dispose();
      chairGeom.dispose();
      chairMat.dispose();
    };
  }, []);

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl">Event Visualization</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Three.js portal container (placeholder). Rotating wedding-table
              proxy until final venue/scene assets land.
            </p>
          </div>
        </div>

        <div
          ref={containerRef}
          className="mt-8 h-[420px] w-full overflow-hidden rounded-xl border bg-gradient-to-b from-black/5 to-black/10"
        >
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      </div>
    </section>
  );
};

