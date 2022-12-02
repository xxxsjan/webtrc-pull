import Stats from './Stats';
class getStats {
  numInferences = 0;
  inferenceTimeSum = 0;
  lastPanelUpdate = 0;
  stats;
  sTime: any;
  constructor(id: string) {
    const stats = (this.stats = new Stats());

    stats.customFpsPanel = stats.addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
    stats.showPanel(stats.domElement.children.length - 1);

    const parent = document.getElementById(id)!;
    parent.appendChild(stats.domElement);

    const statsPanes = parent.querySelectorAll('canvas');

    for (let i = 0; i < statsPanes.length; ++i) {
      statsPanes[i].style.width = '140px';
      statsPanes[i].style.height = '80px';
    }
  }

  begin() {
    this.sTime = (performance || Date).now();
  }

  end() {
    const endTime = (performance || Date).now();
    this.inferenceTimeSum += endTime - this.sTime;

    ++this.numInferences;

    const panelUpdateMilliseconds = 1000;
    if (endTime - this.lastPanelUpdate >= panelUpdateMilliseconds) {
      const averageInferenceTime = this.inferenceTimeSum / this.numInferences;
      this.inferenceTimeSum = 0;
      this.numInferences = 0;
      this.stats.customFpsPanel.update(1000.0 / averageInferenceTime, 120 /* maxValue */);
      this.lastPanelUpdate = endTime;
    }
  }
}
export default getStats;
