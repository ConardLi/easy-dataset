'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@mui/material';

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let mousePosition = { x: 0, y: 0 };
    let hoverRadius = 150; // 增加鼠标影响范围
    let mouseSpeed = { x: 0, y: 0 }; // 跟踪鼠标速度
    let lastMousePosition = { x: 0, y: 0 }; // 上一帧鼠标位置

    // 设置画布大小为窗口大小
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    // 跟踪鼠标位置和速度
    const handleMouseMove = event => {
      // 计算鼠标速度
      mouseSpeed.x = event.clientX - mousePosition.x;
      mouseSpeed.y = event.clientY - mousePosition.y;

      // 更新鼠标位置
      lastMousePosition.x = mousePosition.x;
      lastMousePosition.y = mousePosition.y;
      mousePosition.x = event.clientX;
      mousePosition.y = event.clientY;
    };

    // 触摸设备支持
    const handleTouchMove = event => {
      if (event.touches.length > 0) {
        // 计算触摸速度
        mouseSpeed.x = event.touches[0].clientX - mousePosition.x;
        mouseSpeed.y = event.touches[0].clientY - mousePosition.y;

        // 更新触摸位置
        lastMousePosition.x = mousePosition.x;
        lastMousePosition.y = mousePosition.y;
        mousePosition.x = event.touches[0].clientX;
        mousePosition.y = event.touches[0].clientY;
      }
    };

    // 生成随机颜色
    const getRandomColor = () => {
      // 主题色调
      const colors =
        theme.palette.mode === 'dark'
          ? [
              'rgba(255, 255, 255, 0.5)', // 白色
              'rgba(100, 181, 246, 0.5)', // 蓝色
              'rgba(156, 39, 176, 0.4)', // 紫色
              'rgba(121, 134, 203, 0.5)' // 靛蓝色
            ]
          : [
              'rgba(42, 92, 170, 0.5)', // 主蓝色
              'rgba(66, 165, 245, 0.4)', // 浅蓝色
              'rgba(94, 53, 177, 0.3)', // 深紫色
              'rgba(3, 169, 244, 0.4)' // 天蓝色
            ];

      return colors[Math.floor(Math.random() * colors.length)];
    };

    // 初始化粒子
    const initParticles = () => {
      particles = [];
      // 增加粒子数量，但保持性能平衡
      const particleCount = Math.min(Math.floor(window.innerWidth / 8), 150);

      for (let i = 0; i < particleCount; i++) {
        // 创建不同大小和速度的粒子
        const size = Math.random();
        const speedFactor = Math.max(0.1, size); // 较大的粒子移动较慢

        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          // 粒子大小更加多样化
          radius: size * 3 + 0.5,
          // 使用随机颜色
          color: getRandomColor(),
          // 添加发光效果
          glow: Math.random() * 10 + 5,
          // 调整速度范围，使运动更加自然
          speedX: (Math.random() * 0.6 - 0.3) * speedFactor,
          speedY: (Math.random() * 0.6 - 0.3) * speedFactor,
          originalSpeedX: (Math.random() * 0.6 - 0.3) * speedFactor,
          originalSpeedY: (Math.random() * 0.6 - 0.3) * speedFactor,
          // 添加脉动效果
          pulseSpeed: Math.random() * 0.02 + 0.01,
          pulseDirection: Math.random() > 0.5 ? 1 : -1,
          pulseAmount: 0,
          // 粒子透明度
          opacity: Math.random() * 0.5 + 0.5
        });
      }
    };

    // 绘制粒子
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 计算鼠标速度衰减
      mouseSpeed.x *= 0.95;
      mouseSpeed.y *= 0.95;

      // 绘制粒子之间的连线
      drawLines();

      particles.forEach(particle => {
        // 计算粒子与鼠标的距离
        const dx = mousePosition.x - particle.x;
        const dy = mousePosition.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 脉动效果
        particle.pulseAmount += particle.pulseSpeed * particle.pulseDirection;
        if (Math.abs(particle.pulseAmount) > 0.5) {
          particle.pulseDirection *= -1;
        }

        // 如果粒子在鼠标影响范围内，调整其速度
        if (distance < hoverRadius) {
          const angle = Math.atan2(dy, dx);
          const force = (hoverRadius - distance) / hoverRadius;
          const mouseFactor = 3; // 增强鼠标影响力度

          // 粒子远离鼠标，并受鼠标速度影响
          particle.speedX = -Math.cos(angle) * force * mouseFactor + particle.originalSpeedX + mouseSpeed.x * 0.05;
          particle.speedY = -Math.sin(angle) * force * mouseFactor + particle.originalSpeedY + mouseSpeed.y * 0.05;
        } else {
          // 逐渐恢复原始速度
          particle.speedX = particle.speedX * 0.95 + particle.originalSpeedX * 0.05;
          particle.speedY = particle.speedY * 0.95 + particle.originalSpeedY * 0.05;
        }

        // 更新粒子位置
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // 边界检查
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // 应用脉动效果到粒子大小
        const currentRadius = particle.radius * (1 + particle.pulseAmount * 0.2);

        // 绘制发光效果
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.glow);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // 添加发光效果
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.glow, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.3 * particle.opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    // 绘制粒子之间的连线
    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // 增加连线的最大距离
          const maxDistance = 120;

          if (distance < maxDistance) {
            // 只在粒子距离小于maxDistance时绘制连线
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);

            // 根据距离设置线条透明度
            const opacity = 1 - distance / maxDistance;

            // 根据主题设置线条颜色
            const lineColor =
              theme.palette.mode === 'dark'
                ? `rgba(255, 255, 255, ${opacity * 0.2})`
                : `rgba(42, 92, 170, ${opacity * 0.2})`;

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = opacity * 1.5; // 根据距离调整线宽
            ctx.stroke();
          }
        }
      }
    };

    // 初始化
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // 开始动画
    drawParticles();

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme.palette.mode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // 确保不会干扰下方元素的交互
        zIndex: 0
      }}
    />
  );
}
