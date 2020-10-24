import { actions, IRangeSliderStore } from '../reducer';
import { Provider, Store, View } from '../../core';

import styles from '../../exports.scss';

class Track extends View {
  constructor(scale: TrackScale) {
    super({tag: 'div', attrs: {class: 'range-slider__track'}, children: [
      scale
    ]});
  }
}

class TrackScale extends View {
  constructor() {
    super({tag: 'ul', attrs: { class: 'range-slider__track-scale' }, children: []});
  }

  update(values: number[]): void {
    const overflowRate = Math.ceil(values.reduce((sum, value) => {
      return sum + (value.toString().length * (parseInt(styles.rootFontSize) * 1.4));
    }, 0) / <number>this.element.clientWidth);

    const nextValues = [];
    for (let index = 0; index <= values.length; index += overflowRate) {
      nextValues.push(values[index]);
    }

    if (nextValues[nextValues.length-1] !== values[values.length-1]) {
      nextValues.push(values[values.length-1]);
    }

    this.replaceChildren(nextValues.map(value => new TrackScaleItem(value.toString())));
  }
}

class TrackScaleItem extends View {
  constructor(value = '') {
    const button = new View({tag: 'button', attrs: {class: 'range-slider__track-scale__button'}, children: [value]});
    super({tag: 'li', attrs: {
      class: 'range-slider__track-scale__item'}, children: [button],
    });
  }
}

class RangeSliderTrack extends Provider<IRangeSliderStore, {
  track: Track,
  scale: TrackScale,
}> {
  private getSliderValues(state: IRangeSliderStore): number[] {
    const {min, max, step} = state;

    const length = (max - min) / step + 1;

    const values = Array(length)
      .fill(null)
      .map((_, index) => min + step * index);

    return values;
  }

  private makeOnWindowResizeHandler(state: IRangeSliderStore): () => void {
    return () => this.render(state);
  }

  private makeOnClickHandler(store: Store<IRangeSliderStore>): (Event: MouseEvent) => void {
    return (event: MouseEvent) => {
      const target = event?.target as HTMLElement;

      if (target.nodeName === 'BUTTON') {
        store.dispatch({
          type: actions.CHANGE_RIGHT_VALUE,
          value: parseInt(target.textContent || ''),
        });
      }
    }
  }

  init(store: Store<IRangeSliderStore>): void {
    this.elements.scale = new TrackScale();
    this.elements.track = new Track(this.elements.scale);

    this.root = this.elements.track;

    window.addEventListener('resize', this.makeOnWindowResizeHandler(store.getState()));

    this.elements.scale.element.addEventListener('click', this.makeOnClickHandler(store));
  }

  render(state: IRangeSliderStore): void {
    this.elements.scale.update(this.getSliderValues(state));
  }
}


export {
  Track,
  TrackScale,
  TrackScaleItem,
  RangeSliderTrack,
}
