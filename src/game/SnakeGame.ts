import { StorageManager } from '../storage/StorageManager';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeSkin {
  headColor: string;
  bodyColor: string;
  foodColor: string;
}

export class SnakeGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridSize: number = 20;
  private tileCount: number;
  private snake: Position[] = [];
  private food: Position = { x: 0, y: 0 };
  private dx: number = 0;
  private dy: number = 0;
  private score: number = 0;
  private level: number = 1;
  private gameSpeed: number = 150;
  private lastRender: number = 0;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private currentSkin: string = 'classic';
  
  // Event handlers
  public onScoreUpdate?: (score: number) => void;
  public onLevelUpdate?: (level: number) => void;
  public onGameOver?: (score: number) => void;
  public onFoodEaten?: (x: number, y: number) => void;

  private skins: { [key: string]: SnakeSkin } = {
    classic: {
      headColor: '#10b981',
      bodyColor: '#059669',
      foodColor: '#ef4444'
    },
    neon: {
      headColor: '#00ffff',
      bodyColor: '#0099cc',
      foodColor: '#ff00ff'
    },
    gradient: {
      headColor: '#f59e0b',
      bodyColor: '#d97706',
      foodColor: '#8b5cf6'
    },
    rainbow: {
      headColor: '#ff0000',
      bodyColor: '#ff8000',
      foodColor: '#00ff00'
    }
  };

  constructor(canvasId: string, private storage: StorageManager) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.tileCount = canvas.width / this.gridSize;
    
    this.initializeGame();
    this.gameLoop();
  }

  private initializeGame(): void {
    // Initialize snake in the center
    const center = Math.floor(this.tileCount / 2);
    this.snake = [
      { x: center, y: center },
      { x: center - 1, y: center },
      { x: center - 2, y: center }
    ];
    
    this.dx = 1;
    this.dy = 0;
    this.score = 0;
    this.level = 1;
    this.gameSpeed = 150;
    this.isGameOver = false;
    this.isPaused = false;
    
    this.generateFood();
    this.updateScore(0);
    this.updateLevel(1);
  }

  private gameLoop = (timestamp: number = 0): void => {
    if (this.isGameOver) return;
    
    const deltaTime = timestamp - this.lastRender;
    
    if (deltaTime > this.gameSpeed && !this.isPaused) {
      this.update();
      this.draw();
      this.lastRender = timestamp;
    }
    
    requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
    
    // Check wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }
    
    // Check self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver();
      return;
    }
    
    this.snake.unshift(head);
    
    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.updateScore(this.score);
      this.generateFood();
      this.onFoodEaten?.(this.food.x, this.food.y);
      
      // Level up every 50 points
      if (this.score % 50 === 0) {
        this.level++;
        this.updateLevel(this.level);
        this.gameSpeed = Math.max(50, this.gameSpeed - 10);
      }
    } else {
      this.snake.pop();
    }
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw subtle grid
    this.drawGrid();
    
    // Draw snake
    this.drawSnake();
    
    // Draw food with glow effect
    this.drawFood();
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.3;
    
    for (let i = 0; i <= this.tileCount; i++) {
      const pos = i * this.gridSize;
      
      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvas.height);
      this.ctx.stroke();
      
      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvas.width, pos);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }

  private drawSnake(): void {
    const skin = this.skins[this.currentSkin];
    
    this.snake.forEach((segment, index) => {
      const x = segment.x * this.gridSize;
      const y = segment.y * this.gridSize;
      
      if (index === 0) {
        // Draw head with gradient
        const gradient = this.ctx.createLinearGradient(x, y, x + this.gridSize, y + this.gridSize);
        gradient.addColorStop(0, skin.headColor);
        gradient.addColorStop(1, this.adjustBrightness(skin.headColor, -20));
        
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, 4);
        
        // Draw eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x + 6, y + 6, 3, 3);
        this.ctx.fillRect(x + 11, y + 6, 3, 3);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + 7, y + 7, 1, 1);
        this.ctx.fillRect(x + 12, y + 7, 1, 1);
      } else {
        // Draw body with gradient
        const gradient = this.ctx.createLinearGradient(x, y, x + this.gridSize, y + this.gridSize);
        gradient.addColorStop(0, skin.bodyColor);
        gradient.addColorStop(1, this.adjustBrightness(skin.bodyColor, -20));
        
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4, 3);
      }
    });
  }

  private drawFood(): void {
    const skin = this.skins[this.currentSkin];
    const x = this.food.x * this.gridSize;
    const y = this.food.y * this.gridSize;
    
    // Draw glow effect
    this.ctx.shadowColor = skin.foodColor;
    this.ctx.shadowBlur = 15;
    
    // Draw food with gradient
    const gradient = this.ctx.createRadialGradient(
      x + this.gridSize / 2, y + this.gridSize / 2, 0,
      x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.7, skin.foodColor);
    gradient.addColorStop(1, this.adjustBrightness(skin.foodColor, -30));
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2 - 2, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private adjustBrightness(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  private generateFood(): void {
    do {
      this.food = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
    } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
  }

  private updateScore(score: number): void {
    this.score = score;
    this.onScoreUpdate?.(score);
  }

  private updateLevel(level: number): void {
    this.level = level;
    this.onLevelUpdate?.(level);
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.onGameOver?.(this.score);
  }

  // Public methods
  public changeDirection(direction: string): void {
    if (this.isPaused || this.isGameOver) return;
    
    switch (direction) {
      case 'up':
        if (this.dy !== 1) { this.dx = 0; this.dy = -1; }
        break;
      case 'down':
        if (this.dy !== -1) { this.dx = 0; this.dy = 1; }
        break;
      case 'left':
        if (this.dx !== 1) { this.dx = -1; this.dy = 0; }
        break;
      case 'right':
        if (this.dx !== -1) { this.dx = 1; this.dy = 0; }
        break;
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public setSnakeSkin(skin: string): void {
    if (this.skins[skin]) {
      this.currentSkin = skin;
    }
  }

  public restart(): void {
    this.initializeGame();
    this.gameLoop();
  }
}