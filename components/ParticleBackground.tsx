'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  z: number;
}

const PARTICLE_COLORS = ['#00d4ff', '#bf5af2', '#30d158', '#ffd60a'];
const PARTICLE_COUNT = 80; 
const CONNECTION_DISTANCE = 130; 
const MOUSE_RADIUS = 160; 

// 🔥 NEW: isTensionMode Prop added
export default function ParticleBackground({ isTensionMode = false }: { isTensionMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Ref to track tension mode inside the animation loop without recreating the loop
  const tensionRef = useRef(isTensionMode);
  
  useEffect(() => {
    tensionRef.current = isTensionMode;
  }, [isTensionMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    let mouse = { x: -1000, y: -1000 };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const z = Math.random() * 2 + 0.5;
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: (Math.random() * 1.5 + 0.5) * z,
          speedX: (Math.random() - 0.5) * 0.6 * z,
          speedY: (Math.random() - 0.5) * 0.6 * z,
          opacity: Math.random() * 0.6 + 0.2,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          z: z
        });
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // 🔥 TENSION MODE BACKGROUND PULSE (Heartbeat Effect)
      if (tensionRef.current) {
         const pulse = (Math.sin(Date.now() / 150) * 0.05) + 0.02; // Pulse opacity between 0.02 and 0.07
         ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
         ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      }

      // 🔥 SPEED MULTIPLIER (Tension mode me particles 3x fast bhagenge)
      const speedMult = tensionRef.current ? 3.5 : 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distanceMouse < MOUSE_RADIUS) {
           ctx.beginPath();
           // Tension mode me connection line bhi red ho jayegi!
           ctx.strokeStyle = tensionRef.current ? '#ff2d55' : p.color;
           ctx.globalAlpha = (1 - distanceMouse / MOUSE_RADIUS) * 0.5;
           ctx.lineWidth = 1.2;
           ctx.moveTo(p.x, p.y);
           ctx.lineTo(mouse.x, mouse.y);
           ctx.stroke();
        }

        p.x += p.speedX * speedMult;
        p.y += p.speedY * speedMult;

        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Tension mode me orbs bhi thode redish mix marenge
        ctx.fillStyle = tensionRef.current && Math.random() > 0.5 ? '#ff2d55' : p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 15 * p.z;
        ctx.shadowColor = tensionRef.current ? '#ff2d55' : p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
            gradient.addColorStop(0, tensionRef.current ? '#ff2d55' : particles[i].color);
            gradient.addColorStop(1, tensionRef.current ? '#ff2d55' : particles[j].color);
            
            ctx.strokeStyle = gradient;
            ctx.globalAlpha = (1 - dist / CONNECTION_DISTANCE) * (tensionRef.current ? 0.6 : 0.3); 
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen transition-opacity duration-1000" 
      style={{ opacity: isTensionMode ? 0.8 : 0.65 }}
      aria-hidden="true"
    />
  );
}