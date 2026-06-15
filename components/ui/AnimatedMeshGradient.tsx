// "use client";

// import { useEffect, useRef } from "react";

// export default function AnimatedMeshGradient() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     let animationFrameId: number;
//     let time = 0;

//     const resize = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//     };

//     resize();
//     window.addEventListener("resize", resize);

//     const animate = () => {
//       time += 0.005;

//       const gradient1 = ctx.createRadialGradient(
//         canvas.width * (0.5 + Math.sin(time) * 0.3),
//         canvas.height * (0.5 + Math.cos(time) * 0.3),
//         0,
//         canvas.width * (0.5 + Math.sin(time) * 0.3),
//         canvas.height * (0.5 + Math.cos(time) * 0.3),
//         canvas.width * 0.8
//       );

//       gradient1.addColorStop(0, "rgba(16, 185, 129, 0.15)");
//       gradient1.addColorStop(0.5, "rgba(5, 150, 105, 0.08)");
//       gradient1.addColorStop(1, "rgba(16, 185, 129, 0)");

//       const gradient2 = ctx.createRadialGradient(
//         canvas.width * (0.7 + Math.cos(time * 1.3) * 0.2),
//         canvas.height * (0.3 + Math.sin(time * 1.5) * 0.2),
//         0,
//         canvas.width * (0.7 + Math.cos(time * 1.3) * 0.2),
//         canvas.height * (0.3 + Math.sin(time * 1.5) * 0.2),
//         canvas.width * 0.6
//       );

//       gradient2.addColorStop(0, "rgba(5, 150, 105, 0.12)");
//       gradient2.addColorStop(0.5, "rgba(16, 185, 129, 0.06)");
//       gradient2.addColorStop(1, "rgba(5, 150, 105, 0)");

//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.fillStyle = gradient1;
//       ctx.fillRect(0, 0, canvas.width, canvas.height);
//       ctx.fillStyle = gradient2;
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       animationFrameId = requestAnimationFrame(animate);
//     };

//     animate();

//     return () => {
//       window.removeEventListener("resize", resize);
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, []);

//   return (
//     <canvas
//       ref={canvasRef}
//       className="pointer-events-none absolute inset-0"
//       style={{ opacity: 0.6 }}
//     />
//   );
// }
