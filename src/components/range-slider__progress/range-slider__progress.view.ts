import { Provider, View } from '@core';
import { IRangeSliderStoreState } from '@store';

class Progress extends View {
  constructor() {
    super({
      tag: 'div',
      attrs: { class: 'range-slider__progress' },
      children: [],
    });
  }

  set value({
    min,
    max,
    value,
  }: {
    min: number;
    max: number;
    value: [number, number];
  }) {
    const leftOffset = ((value[0] - min) / (max - min)) * 100;
    const rightOffset = ((value[1] - min) / (max - min)) * 100;

    this.nativeElement.style.left = `${leftOffset}%`;
    this.nativeElement.style.right = `${100 - rightOffset}%`;
  }

  set primaryColor(value: string) {
    this.nativeElement.style.setProperty('background-color', value);
  }
}

interface TElements {
  progress: Progress;
}

class RangeSliderProgress extends Provider<IRangeSliderStoreState, TElements> {
  init(): void {
    this.elements.progress = new Progress();
    this.root = this.elements.progress;
  }

  render(state: IRangeSliderStoreState): void {
    const { min, max } = state;
    let { value } = state;

    if (!state.intervalMode) {
      value = [min, value[1]];
    }

    this.elements.progress.value = { min, max, value };
    this.elements.progress.primaryColor = state.primaryColor;
  }
}

export { Progress, RangeSliderProgress };
