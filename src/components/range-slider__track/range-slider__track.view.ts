import { Provider, Store, View } from '@core';
import { makeValueLikeCallback } from 'core/utils';
import { actionNames, IRangeSliderState } from '@store';

import styles from '../../exports.scss';

class Track extends View {
  constructor(scale: TrackScale) {
    super({
      tag: 'div',
      attrs: { class: 'range-slider__track' },
      children: [scale],
    });
  }
}

class TrackScale extends View {
  hidingClassName = 'range-slider__track-scale--hidden';

  constructor() {
    super({
      tag: 'ul',
      attrs: { class: 'range-slider__track-scale' },
      children: [],
    });
  }

  update(values: sliderValue[]): void {
    const items = values.map(({ index, displayValue }) => {
      const percent = (100 / values[values.length - 1].index) * index;

      const max = values[values.length - 1].index;
      const min = 0;
      const ratio = (index - min) / (max - min);

      return this.createItem(displayValue, percent, ratio);
    });

    this.replaceChildren(items);
  }

  createItem(
    value: string,
    percentOffset: number,
    ratio: number,
  ): TrackScaleItem {
    const item = new TrackScaleItem(value);
    const itemWidth = value.length * parseInt(styles.rootFontSize);
    const thumbWidth =
      parseFloat(styles.thumbWidth) * parseInt(styles.rootFontSize) -
      parseInt(styles.thumbBorderWidth);

    item.nativeElement.style.setProperty('width', `${itemWidth}px`);
    item.nativeElement.style.setProperty('left', `${percentOffset}%`);
    item.nativeElement.style.setProperty(
      'margin-left',
      `${-(itemWidth / 2 - thumbWidth / 2 + thumbWidth * ratio)}px`,
    );

    item.handleViewMouseIn(() => (item.hovered = true));
    item.handleViewMouseOut(() => (item.hovered = false));
    item.handleViewFocusIn(() => (item.focused = true));
    item.handleViewFocusOut(() => (item.focused = false));

    return item;
  }

  set activeColor(value: string) {
    this.children.forEach(child => {
      (child as TrackScaleItem).color = value;
    });
  }
}

class TrackScaleItem extends View {
  lastColor: string;

  constructor(value = '') {
    const button = new View({
      tag: 'button',
      attrs: { class: 'range-slider__track-scale__button' },
      children: [value],
    });
    super({
      tag: 'li',
      attrs: {
        class: 'range-slider__track-scale__item',
      },
      children: [button],
    });

    this.hidingClassName = 'range-slider__track-scale__item--hidden';
    this.lastColor = '';
  }

  set color(value: string) {
    this.lastColor = value;
    this.resetColor();
  }

  handleFocusChange(): void {
    this.resetColor();
  }

  handleHoverChange(): void {
    this.resetColor();
  }

  resetColor(): void {
    if (this.isFocused || this.isHovered)
      this.nativeElement.style.setProperty('color', this.lastColor);
  }
}

class RangeSliderTrack extends Provider<
  IRangeSliderState,
  {
    track: Track;
    scale: TrackScale;
  }
> {
  lastSliderValues: sliderValue[] = [];

  init(store: Store<IRangeSliderState>): void {
    this.elements.scale = new TrackScale();
    this.elements.track = new Track(this.elements.scale);

    this.root = this.elements.track;

    this.elements.scale.nativeElement.addEventListener(
      'click',
      this.makeRangeSliderTrackClickHandler(store),
    );
  }

  render(state: IRangeSliderState): void {
    const { min, max, step, fixedValues } = state;

    if (fixedValues.length > 0) {
      this.lastSliderValues = fixedValues.slice().map((value, index) => ({
        index,
        rawValue: index,
        displayValue: value,
      }));
    } else {
      const prefix = makeValueLikeCallback(state.prefix);
      const postfix = makeValueLikeCallback(state.postfix);
      this.lastSliderValues = this.getRange({
        from: min,
        to: max,
        step,
        prefix,
        postfix,
      });
    }

    this.elements.scale.update(this.lastSliderValues);
    this.elements.scale.visible = !state.trackScaleVisibility;
    this.elements.scale.activeColor = state.primaryColor;
  }

  makeRangeSliderTrackClickHandler(
    store: Store<IRangeSliderState>,
  ): (Event: MouseEvent) => void {
    return (event: MouseEvent) => {
      const target = event?.target as HTMLElement;
      const text = target.textContent || '';
      const { value, intervalMode } = store.getState();

      let nextValue = this.lastSliderValues[0].rawValue;
      for (const sliderValue of this.lastSliderValues) {
        if (sliderValue.displayValue === text) {
          nextValue = sliderValue.rawValue;
          break;
        }
      }

      const actionName = intervalMode
        ? Math.abs(value[0] - nextValue) >= Math.abs(value[1] - nextValue)
          ? actionNames.CHANGE_RIGHT_VALUE
          : actionNames.CHANGE_LEFT_VALUE
        : actionNames.CHANGE_RIGHT_VALUE;

      if (target.nodeName === 'BUTTON') {
        store.dispatch({
          name: actionName,
          value: nextValue,
        });
      }
    };
  }

  getRange({
    from,
    to,
    step,
    prefix,
    postfix,
  }: {
    from: number;
    to: number;
    step: number;
    prefix: IRangeSliderState['prefix'];
    postfix: IRangeSliderState['postfix'];
  }): sliderValue[] {
    const accuracy = (step.toString().split('.')[1] || '').length;

    const length = Math.round((to - from) / step + 1);
    const lastIndex = length - 1;

    const primes = [3, 5, 7, 11];

    const delimiter = this.getDelimiter(lastIndex, primes);

    let multiplier = Math.max(Math.floor(lastIndex / delimiter), 1);
    multiplier = multiplier < 15 ? Math.min(multiplier, delimiter) : multiplier;

    const values = new Array(Math.ceil(length / multiplier))
      .fill(null)
      .map((_, index) => [
        index,
        Number((step * index * multiplier + from).toFixed(accuracy)),
      ])
      .map(([index, value]) => ({
        index,
        rawValue: value,
        displayValue: `${prefix(value)}${value}${postfix(value)}`,
      }));

    return values as sliderValue[];
  }

  getDelimiter(dividend: number, delimiters: number[]): number {
    for (const delimiter of delimiters) {
      if (dividend % delimiter === 0) {
        return delimiter;
      }
    }

    return this.getDelimiter(dividend - 1, delimiters);
  }
}

interface sliderValue {
  index: number;
  rawValue: number;
  displayValue: string;
}

export { Track, TrackScale, TrackScaleItem, RangeSliderTrack };
