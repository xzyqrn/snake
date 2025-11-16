import { SnakeGame } from './game/SnakeGame';
import { UIManager } from './ui/UIManager';
import { AudioManager } from './audio/AudioManager';
import { ParticleSystem } from './effects/ParticleSystem';
import { StorageManager } from './storage/StorageManager';

class ModernSnakeGame {
  private game: SnakeGame;
  private ui: UIManager;
  private audio: AudioManager;
  private particles: ParticleSystem;
  private storage: StorageManager;
  private isGameRunning: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    this.storage = new StorageManager();
    this.audio = new AudioManager();
    this.particles = new ParticleSystem();
    this.game = new SnakeGame('game-canvas', this.storage);
    this.ui = new UIManager();
    
    this.initializeEventListeners();
    this.loadHighScore();
    this.applyTheme();
  }

  private initializeEventListeners(): void {
    // Game controls
    document.getElementById('restart-btn')?.addEventListener('click', () => this.restartGame());
    document.getElementById('menu-btn')?.addEventListener('click', () => this.showMenu());
    document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Skin selection
    document.querySelectorAll('.skin-option').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectSkin(e.target as HTMLElement));
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));

    // Touch controls
    this.setupTouchControls();

    // Game events
    this.game.onScoreUpdate = (score) => this.ui.updateScore(score);
    this.game.onLevelUpdate = (level) => this.ui.updateLevel(level);
    this.game.onGameOver = (score) => this.handleGameOver(score);
    this.game.onFoodEaten = (x, y) => this.handleFoodEaten(x, y);
  }

  private setupTouchControls(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const minSwipeDistance = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          this.game.changeDirection(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          this.game.changeDirection(deltaY > 0 ? 'down' : 'up');
        }
      }
    });
  }

  private handleKeyPress(e: KeyboardEvent): void {
    if (!this.isGameRunning || this.isPaused) return;

    const keyMap: { [key: string]: string } = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'w': 'up',
      's': 'down',
      'a': 'left',
      'd': 'right'
    };

    const direction = keyMap[e.key.toLowerCase()];
    if (direction) {
      e.preventDefault();
      this.game.changeDirection(direction);
    }

    if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      this.togglePause();
    }
  }

  private handleFoodEaten(x: number, y: number): void {
    this.audio.playSound('eat');
    this.particles.createFoodParticles(x, y);
    this.ui.animateScore();
  }

  private handleGameOver(score: number): void {
    this.isGameRunning = false;
    this.audio.playSound('gameOver');
    this.storage.saveHighScore(score);
    this.ui.showGameOver(score, this.storage.getHighScore());
  }

  private restartGame(): void {
    this.isGameRunning = true;
    this.isPaused = false;
    this.game.restart();
    this.ui.hideGameOver();
    this.audio.playSound('start');
  }

  private togglePause(): void {
    if (!this.isGameRunning) return;
    
    this.isPaused = !this.isPaused;
    this.game.setPaused(this.isPaused);
    this.ui.updatePauseButton(this.isPaused);
    
    if (this.isPaused) {
      this.audio.playSound('pause');
    } else {
      this.audio.playSound('resume');
    }
  }

  private toggleTheme(): void {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    this.storage.saveTheme(newTheme);
    this.ui.updateThemeIcon(newTheme);
  }

  private selectSkin(skinButton: HTMLElement): void {
    document.querySelectorAll('.skin-option').forEach(btn => btn.classList.remove('active'));
    skinButton.classList.add('active');
    
    const skin = skinButton.getAttribute('data-skin') || 'classic';
    this.game.setSnakeSkin(skin);
    this.storage.saveSkin(skin);
  }

  private loadHighScore(): void {
    const highScore = this.storage.getHighScore();
    this.ui.updateHighScore(highScore);
  }

  private applyTheme(): void {
    const savedTheme = this.storage.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.ui.updateThemeIcon(savedTheme);
    
    const savedSkin = this.storage.getSkin();
    document.querySelector(`[data-skin="${savedSkin}"]`)?.classList.add('active');
    this.game.setSnakeSkin(savedSkin);
  }

  private showMenu(): void {
    // Implement menu functionality if needed
    this.restartGame();
  }

  public start(): void {
    this.restartGame();
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new ModernSnakeGame();
  game.start();
});

export default ModernSnakeGame;