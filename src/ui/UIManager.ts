export class UIManager {
  private scoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private levelElement: HTMLElement;
  private overlayElement: HTMLElement;
  private overlayTitleElement: HTMLElement;
  private overlayMessageElement: HTMLElement;
  private finalScoreElement: HTMLElement;
  private pauseButtonElement: HTMLElement;
  private themeButtonElement: HTMLElement;

  constructor() {
    this.scoreElement = document.getElementById('score')!;
    this.highScoreElement = document.getElementById('high-score')!;
    this.levelElement = document.getElementById('level')!;
    this.overlayElement = document.getElementById('game-overlay')!;
    this.overlayTitleElement = document.getElementById('overlay-title')!;
    this.overlayMessageElement = document.getElementById('overlay-message')!;
    this.finalScoreElement = document.getElementById('final-score')!;
    this.pauseButtonElement = document.getElementById('pause-btn')!;
    this.themeButtonElement = document.getElementById('theme-toggle')!;

    this.initializeParallaxEffect();
  }

  private initializeParallaxEffect(): void {
    const layers = document.querySelectorAll('.parallax-layer');
    
    document.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;
      
      layers.forEach((layer, index) => {
        const speed = (index + 1) * 0.5;
        const x = (mouseX - 0.5) * speed * 50;
        const y = (mouseY - 0.5) * speed * 50;
        (layer as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
      });
    });

    // Add subtle animation on mobile
    if (window.innerWidth <= 768) {
      let time = 0;
      const animate = () => {
        time += 0.01;
        layers.forEach((layer, index) => {
          const speed = (index + 1) * 0.3;
          const x = Math.sin(time * speed) * 20;
          const y = Math.cos(time * speed * 0.7) * 15;
          (layer as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
        });
        requestAnimationFrame(animate);
      };
      animate();
    }
  }

  public updateScore(score: number): void {
    this.animateNumber(this.scoreElement, score);
  }

  public updateHighScore(highScore: number): void {
    this.animateNumber(this.highScoreElement, highScore);
  }

  public updateLevel(level: number): void {
    this.animateNumber(this.levelElement, level);
  }

  public animateScore(): void {
    this.scoreElement.classList.add('score-animation');
    setTimeout(() => {
      this.scoreElement.classList.remove('score-animation');
    }, 300);
  }

  private animateNumber(element: HTMLElement, targetValue: number): void {
    const currentValue = parseInt(element.textContent || '0');
    const difference = targetValue - currentValue;
    
    if (difference === 0) return;
    
    const duration = 500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = Math.round(currentValue + difference * easeOutQuart);
      
      element.textContent = currentValue.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  public showGameOver(score: number, highScore: number): void {
    this.finalScoreElement.textContent = score.toString();
    
    if (score === highScore && score > 0) {
      this.overlayTitleElement.textContent = 'New High Score!';
      this.overlayMessageElement.innerHTML = `Amazing! You scored <strong>${score}</strong> points!`;
      this.addConfettiEffect();
    } else {
      this.overlayTitleElement.textContent = 'Game Over';
      this.overlayMessageElement.innerHTML = `Your score: <strong>${score}</strong>`;
    }
    
    this.overlayElement.classList.remove('hidden');
    this.overlayElement.classList.add('show');
  }

  public hideGameOver(): void {
    this.overlayElement.classList.add('hidden');
    this.overlayElement.classList.remove('show');
  }

  public updatePauseButton(isPaused: boolean): void {
    const pauseIcon = this.pauseButtonElement.querySelector('.pause-icon')!;
    pauseIcon.textContent = isPaused ? '▶️' : '⏸️';
    this.pauseButtonElement.setAttribute('aria-label', isPaused ? 'Resume game' : 'Pause game');
  }

  public updateThemeIcon(theme: string): void {
    const themeIcon = this.themeButtonElement.querySelector('.theme-icon')!;
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  private addConfettiEffect(): void {
    // Simple confetti effect using CSS
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 4000);
      }, i * 50);
    }
  }

  public showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 1rem 1.5rem;
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%))';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
}

// Add confetti animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes confetti-fall {
    0% {
      transform: translateY(-10px) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);