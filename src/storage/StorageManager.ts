export interface GameSettings {
  theme: 'light' | 'dark';
  skin: string;
  highScore: number;
  soundEnabled: boolean;
  volume: number;
  achievements: string[];
  totalGamesPlayed: number;
  totalScore: number;
}

export class StorageManager {
  private readonly STORAGE_KEY = 'modern-snake-game-settings';
  private readonly HIGH_SCORE_KEY = 'modern-snake-high-score';
  private readonly ACHIEVEMENTS_KEY = 'modern-snake-achievements';
  
  private defaultSettings: GameSettings = {
    theme: 'light',
    skin: 'classic',
    highScore: 0,
    soundEnabled: true,
    volume: 0.3,
    achievements: [],
    totalGamesPlayed: 0,
    totalScore: 0
  };

  constructor() {
    this.migrateOldData();
  }

  private migrateOldData(): void {
    // Migrate from old storage format if needed
    const oldHighScore = localStorage.getItem('snakeHighScore');
    if (oldHighScore) {
      this.saveHighScore(parseInt(oldHighScore));
      localStorage.removeItem('snakeHighScore');
    }
  }

  public getSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        return { ...this.defaultSettings, ...settings };
      }
    } catch (error) {
      console.warn('Error loading settings:', error);
    }
    
    return { ...this.defaultSettings };
  }

  public saveSettings(settings: Partial<GameSettings>): void {
    try {
      const currentSettings = this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Error saving settings:', error);
    }
  }

  public getHighScore(): number {
    try {
      const highScore = localStorage.getItem(this.HIGH_SCORE_KEY);
      return highScore ? parseInt(highScore) : 0;
    } catch (error) {
      console.warn('Error loading high score:', error);
      return 0;
    }
  }

  public saveHighScore(score: number): void {
    try {
      const currentHighScore = this.getHighScore();
      if (score > currentHighScore) {
        localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
        this.saveSettings({ highScore: score });
        
        // Check for achievements
        this.checkHighScoreAchievements(score);
      }
      
      // Update total score and games played
      const settings = this.getSettings();
      this.saveSettings({
        totalScore: settings.totalScore + score,
        totalGamesPlayed: settings.totalGamesPlayed + 1
      });
    } catch (error) {
      console.warn('Error saving high score:', error);
    }
  }

  public getTheme(): 'light' | 'dark' {
    return this.getSettings().theme;
  }

  public saveTheme(theme: 'light' | 'dark'): void {
    this.saveSettings({ theme });
  }

  public getSkin(): string {
    return this.getSettings().skin;
  }

  public saveSkin(skin: string): void {
    this.saveSettings({ skin });
  }

  public isSoundEnabled(): boolean {
    return this.getSettings().soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.saveSettings({ soundEnabled: enabled });
  }

  public getVolume(): number {
    return this.getSettings().volume;
  }

  public setVolume(volume: number): void {
    this.saveSettings({ volume: Math.max(0, Math.min(1, volume)) });
  }

  public getAchievements(): string[] {
    return this.getSettings().achievements;
  }

  public unlockAchievement(achievementId: string): boolean {
    const settings = this.getSettings();
    if (!settings.achievements.includes(achievementId)) {
      const newAchievements = [...settings.achievements, achievementId];
      this.saveSettings({ achievements: newAchievements });
      return true; // Achievement was unlocked
    }
    return false; // Achievement already unlocked
  }

  public getStats(): {
    totalGamesPlayed: number;
    totalScore: number;
    averageScore: number;
    achievementsUnlocked: number;
    totalAchievements: number;
  } {
    const settings = this.getSettings();
    const averageScore = settings.totalGamesPlayed > 0 
      ? Math.round(settings.totalScore / settings.totalGamesPlayed)
      : 0;
    
    return {
      totalGamesPlayed: settings.totalGamesPlayed,
      totalScore: settings.totalScore,
      averageScore,
      achievementsUnlocked: settings.achievements.length,
      totalAchievements: this.getTotalAchievements()
    };
  }

  private checkHighScoreAchievements(score: number): void {
    const achievements = [
      { id: 'first_10', threshold: 10, name: 'Getting Started' },
      { id: 'score_50', threshold: 50, name: 'Half Century' },
      { id: 'score_100', threshold: 100, name: 'Century Club' },
      { id: 'score_200', threshold: 200, name: 'Double Century' },
      { id: 'score_500', threshold: 500, name: 'Snake Master' },
      { id: 'high_score_legend', threshold: 1000, name: 'Legendary' }
    ];

    achievements.forEach(achievement => {
      if (score >= achievement.threshold) {
        const wasUnlocked = this.unlockAchievement(achievement.id);
        if (wasUnlocked) {
          // Could trigger a notification here
          console.log(`Achievement unlocked: ${achievement.name}!`);
        }
      }
    });
  }

  private getTotalAchievements(): number {
    return 10; // This would be the total number of achievements in the game
  }

  public clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.HIGH_SCORE_KEY);
      localStorage.removeItem(this.ACHIEVEMENTS_KEY);
      console.log('All game data cleared');
    } catch (error) {
      console.warn('Error clearing data:', error);
    }
  }

  public exportData(): string {
    try {
      const data = {
        settings: this.getSettings(),
        highScore: this.getHighScore(),
        timestamp: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.warn('Error exporting data:', error);
      return '{}';
    }
  }

  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      if (data.highScore) {
        this.saveHighScore(data.highScore);
      }
      
      return true;
    } catch (error) {
      console.warn('Error importing data:', error);
      return false;
    }
  }

  public getAchievementName(achievementId: string): string {
    const achievementNames: { [key: string]: string } = {
      'first_10': 'Getting Started',
      'score_50': 'Half Century',
      'score_100': 'Century Club',
      'score_200': 'Double Century',
      'score_500': 'Snake Master',
      'high_score_legend': 'Legendary',
      'speed_demon': 'Speed Demon',
      'survivor': 'Survivor',
      'perfectionist': 'Perfectionist',
      'snake_charmer': 'Snake Charmer'
    };
    
    return achievementNames[achievementId] || 'Unknown Achievement';
  }

  public getAchievementDescription(achievementId: string): string {
    const achievementDescriptions: { [key: string]: string } = {
      'first_10': 'Score your first 10 points',
      'score_50': 'Reach a score of 50',
      'score_100': 'Reach a score of 100',
      'score_200': 'Reach a score of 200',
      'score_500': 'Reach a score of 500',
      'high_score_legend': 'Achieve a high score of 1000+',
      'speed_demon': 'Reach level 10',
      'survivor': 'Play 50 games',
      'perfectionist': 'Get a perfect game (no walls hit)',
      'snake_charmer': 'Play for 30 minutes total'
    };
    
    return achievementDescriptions[achievementId] || 'Complete this achievement';
  }
}