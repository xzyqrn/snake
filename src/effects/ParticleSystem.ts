export class ParticleSystem {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;

  constructor() {
    // Create an overlay canvas for particles
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9998';
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  public createFoodParticles(x: number, y: number): void {
    const canvasRect = document.getElementById('game-canvas')!.getBoundingClientRect();
    const particleCount = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 2 + Math.random() * 3;
      
      this.particles.push(new Particle(
        canvasRect.left + x * (canvasRect.width / 20) + canvasRect.width / 40,
        canvasRect.top + y * (canvasRect.height / 20) + canvasRect.height / 40,
        Math.cos(angle) * velocity,
        Math.sin(angle) * velocity,
        this.getRandomColor(),
        1 + Math.random() * 2
      ));
    }
    
    this.startAnimation();
  }

  public createScoreParticles(x: number, y: number): void {
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 1 + Math.random() * 2;
      
      this.particles.push(new Particle(
        x,
        y,
        Math.cos(angle) * velocity,
        Math.sin(angle) * velocity - 2,
        '#fbbf24',
        0.8 + Math.random() * 1.2,
        60 + Math.random() * 30
      ));
    }
    
    this.startAnimation();
  }

  private getRandomColor(): string {
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private startAnimation(): void {
    if (this.animationId !== null) return;
    
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.particles = this.particles.filter(particle => {
        particle.update();
        particle.draw(this.ctx);
        return particle.life > 0;
      });
      
      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
      }
    };
    
    animate();
  }

  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.canvas.remove();
  }
}

class Particle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public color: string;
  public size: number;
  public life: number;
  public maxLife: number;
  public gravity: number = 0.1;
  public friction: number = 0.98;

  constructor(x: number, y: number, vx: number, vy: number, color: string, size: number, life: number = 45) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
  }

  public update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.life--;
    this.size *= 0.99;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Create gradient for more appealing particles
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, this.color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.size * 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

// Add sparkle effect for special occasions
export class SparkleEffect {
  private sparkles: Sparkle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(targetElement: HTMLElement) {
    const rect = targetElement.getBoundingClientRect();
    
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = rect.top + 'px';
    this.canvas.style.left = rect.left + 'px';
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    
    targetElement.style.position = 'relative';
    targetElement.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d')!;
  }

  public createSparkles(count: number = 10): void {
    for (let i = 0; i < count; i++) {
      this.sparkles.push(new Sparkle(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        this.canvas.width,
        this.canvas.height
      ));
    }
    
    this.animate();
  }

  private animate(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.sparkles = this.sparkles.filter(sparkle => {
      sparkle.update();
      sparkle.draw(this.ctx);
      return sparkle.life > 0;
    });
    
    if (this.sparkles.length > 0) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.canvas.remove();
    }
  }
}

class Sparkle {
  public x: number;
  public y: number;
  public targetX: number;
  public targetY: number;
  public life: number;
  public maxLife: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number) {
    this.x = x;
    this.y = y;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.targetX = x + (Math.random() - 0.5) * 100;
    this.targetY = y + (Math.random() - 0.5) * 100;
    this.life = 30 + Math.random() * 30;
    this.maxLife = this.life;
  }

  public update(): void {
    this.x += (this.targetX - this.x) * 0.05;
    this.y += (this.targetY - this.y) * 0.05;
    this.life--;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    const size = 2 + (1 - alpha) * 3;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    
    // Draw star shape
    ctx.translate(this.x, this.y);
    ctx.rotate(this.life * 0.1);
    
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(Math.cos(i * Math.PI / 2) * size, Math.sin(i * Math.PI / 2) * size);
      ctx.lineTo(Math.cos((i + 0.5) * Math.PI / 2) * size * 0.5, Math.sin((i + 0.5) * Math.PI / 2) * size * 0.5);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}