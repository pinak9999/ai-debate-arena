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
  z: number; // 3D Depth / Parallax के लिए
}

const PARTICLE_COLORS = ['#00d4ff', '#bf5af2', '#30d158', '#ffd60a'];
const PARTICLE_COUNT = 80; // पार्टिकल्स की संख्या
const CONNECTION_DISTANCE = 130; // पार्टिकल्स के जुड़ने की दूरी
const MOUSE_RADIUS = 160; // माउस के साथ जुड़ने की दूरी

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // माउस की पोजीशन ट्रैक करने के लिए
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
      // कैनवास को हाई-रिज़ॉल्यूशन बनाने के लिए
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
        const z = Math.random() * 2 + 0.5; // Z-axis डेप्थ मल्टीप्लायर (0.5 से 2.5)
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: (Math.random() * 1.5 + 0.5) * z, // 3D साइज़: जो पास है वो बड़ा दिखेगा
          speedX: (Math.random() - 0.5) * 0.6 * z, // 3D स्पीड: जो पास है वो तेज़ चलेगा
          speedY: (Math.random() - 0.5) * 0.6 * z,
          opacity: Math.random() * 0.6 + 0.2,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          z: z
        });
      }
    };

    window.addEventListener('resize', resize);
    resize(); // पहली बार स्क्रीन सेट करना

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // पार्टिकल्स को अपडेट और ड्रा करना
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // ─── माउस इंटरेक्शन (लेज़र कनेक्शन) ───
        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distanceMouse < MOUSE_RADIUS) {
           ctx.beginPath();
           ctx.strokeStyle = p.color;
           ctx.globalAlpha = (1 - distanceMouse / MOUSE_RADIUS) * 0.5;
           ctx.lineWidth = 1.2;
           ctx.moveTo(p.x, p.y);
           ctx.lineTo(mouse.x, mouse.y);
           ctx.stroke();
        }

        // स्पीड अपडेट
        p.x += p.speedX;
        p.y += p.speedY;

        // स्क्रीन से बाहर जाने पर दूसरी तरफ से वापस लाना
        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;

        // ─── पार्टिकल्स का ग्लो इफ़ेक्ट (Orbs) ───
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 15 * p.z; // 3D ग्लो
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // लाइन्स के लिए ग्लो रीसेट करना
      }

      // ─── पार्टिकल्स के बीच में कनेक्शन लाइन्स (Network) ───
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
            
            // ग्रेडिएंट कलर की लाइन बनाना
            const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
            gradient.addColorStop(0, particles[i].color);
            gradient.addColorStop(1, particles[j].color);
            
            ctx.strokeStyle = gradient;
            ctx.globalAlpha = (1 - dist / CONNECTION_DISTANCE) * 0.3; // पास होने पर डार्क लाइन
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
      // mix-blend-screen से ये डार्क बैकग्राउंड पर और ज्यादा चमकेगा
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen" 
      style={{ opacity: 0.65 }}
      aria-hidden="true"
    />
  );
}